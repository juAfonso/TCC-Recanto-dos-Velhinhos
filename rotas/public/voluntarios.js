// POST /api/public/voluntarios — cadastro de voluntário pelo Portal (FR-011 a FR-013, FR-049, FR-051).
// Nasce `pendente`; menor de idade nasce com autorização `pendente` (FR-012). O registro e o
// consentimento são gravados ANTES do e-mail: falha de envio nunca desfaz o cadastro (FR-049a).

import { transacao } from '../_lib/db.js';
import { validarCadastro, CAMPOS } from '../_lib/voluntarios.js';
import { validarAceite, registrarConsentimento } from '../_lib/consentimento.js';
import { gerarProtocolo } from '../_lib/protocolo.js';
import { registrarAuditoria } from '../_lib/auditoria.js';
import { enviarEmail } from '../_lib/email.js';
import { json, lerJson, rota } from '../_lib/http.js';

export const POST = rota(async (request) => {
  const corpo = await lerJson(request);
  const dados = validarCadastro(corpo);
  const avisoVersao = await validarAceite(corpo.consentimento);
  const autorizacaoStatus = dados.menor_de_idade ? 'pendente' : 'nao_se_aplica';

  const cadastro = await transacao(async (tx) => {
    const protocolo = gerarProtocolo('VOL');
    const colunas = [...CAMPOS, 'protocolo', 'origem', 'menor_de_idade', 'autorizacao_status', 'criado_por'];
    const valores = [...CAMPOS.map((c) => dados[c]), protocolo, 'portal', dados.menor_de_idade, autorizacaoStatus, 'publico'];
    const [novo] = await tx.query(
      `INSERT INTO cadastro_voluntario (${colunas.join(', ')})
       VALUES (${colunas.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING id, protocolo, status`,
      valores);
    await registrarConsentimento({ alvo: 'cadastro_voluntario', alvoId: novo.id, avisoVersao, finalidade: 'cadastro_voluntario' }, tx);
    await registrarAuditoria({
      autorTipo: 'anonimo', acao: 'voluntario.cadastrar', entidadeTipo: 'cadastro_voluntario', entidadeId: novo.id,
      detalhe: { menorDeIdade: dados.menor_de_idade },
    }, tx);
    return novo;
  });

  const emailEnviado = await enviarEmail({
    para: dados.email,
    modelo: 'confirmacao_submissao',
    dados: { tipo: 'cadastro_voluntario', nome: dados.nome, protocolo: cadastro.protocolo },
    motivo: 'confirmacao',
    entidadeTipo: 'cadastro_voluntario',
    entidadeId: cadastro.id,
  });

  return json({
    protocolo: cadastro.protocolo,
    status: cadastro.status,
    autorizacaoStatus,
    emailEnviado,
  }, 201);
});
