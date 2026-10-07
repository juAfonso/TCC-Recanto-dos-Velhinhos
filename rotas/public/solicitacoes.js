// POST /api/public/solicitacoes — solicitação externa de evento ou campanha (FR-020, FR-021,
// FR-049, FR-051). Nasce em análise com protocolo SOL-; nada é publicado por aqui.

import { transacao } from '../_lib/db.js';
import { validarSolicitacao, CAMPOS } from '../_lib/solicitacoes.js';
import { validarAceite, registrarConsentimento } from '../_lib/consentimento.js';
import { gerarProtocolo } from '../_lib/protocolo.js';
import { registrarAuditoria } from '../_lib/auditoria.js';
import { enviarEmail } from '../_lib/email.js';
import { json, lerJson, rota } from '../_lib/http.js';

export const POST = rota(async (request) => {
  const corpo = await lerJson(request);
  const dados = validarSolicitacao(corpo);
  const avisoVersao = await validarAceite(corpo.consentimento);

  const solicitacao = await transacao(async (tx) => {
    const colunas = [...CAMPOS, 'protocolo', 'criado_por'];
    const valores = [...CAMPOS.map((c) => dados[c]), gerarProtocolo('SOL'), 'publico'];
    const [nova] = await tx.query(
      `INSERT INTO solicitacao_externa (${colunas.join(', ')}) VALUES (${colunas.map((_, i) => `$${i + 1}`).join(', ')})
       RETURNING id, protocolo, status`, valores);
    await registrarConsentimento({ alvo: 'solicitacao_externa', alvoId: nova.id, avisoVersao, finalidade: 'solicitacao_externa' }, tx);
    await registrarAuditoria({
      autorTipo: 'anonimo', acao: 'solicitacao.enviar', entidadeTipo: 'solicitacao_externa', entidadeId: nova.id,
      detalhe: { tipo: dados.tipo, comRecursos: Boolean(dados.recursos_esperados) },
    }, tx);
    return nova;
  });

  const emailEnviado = await enviarEmail({
    para: dados.email,
    modelo: 'confirmacao_submissao',
    dados: { tipo: 'solicitacao_externa', nome: dados.nome_contato, protocolo: solicitacao.protocolo },
    motivo: 'confirmacao',
    entidadeTipo: 'solicitacao_externa',
    entidadeId: solicitacao.id,
  });

  return json({ protocolo: solicitacao.protocolo, status: solicitacao.status, emailEnviado }, 201);
});
