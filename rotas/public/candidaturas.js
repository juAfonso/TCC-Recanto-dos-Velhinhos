// POST /api/public/candidaturas (multipart) — candidatura a vaga (FR-016 a FR-018, FR-049, FR-051).
// Ordem: valida todos os campos → confere o arquivo → só então envia o currículo ao Blob privado
// → grava candidatura e consentimento → envia o e-mail. O currículo nunca é público (D3).

import { transacao } from '../_lib/db.js';
import { validarCandidatura, CAMPOS } from '../_lib/candidaturas.js';
import { validarAceite, registrarConsentimento } from '../_lib/consentimento.js';
import { validarArquivo, salvarArquivo, removerArquivo } from '../_lib/blob.js';
import { gerarProtocolo } from '../_lib/protocolo.js';
import { registrarAuditoria } from '../_lib/auditoria.js';
import { enviarEmail } from '../_lib/email.js';
import { json, lerFormulario, falhar, rota } from '../_lib/http.js';

export const POST = rota(async (request) => {
  const form = await lerFormulario(request);
  const campo = (nome) => {
    const valor = form.get(nome);
    return typeof valor === 'string' ? valor : '';
  };
  const dados = validarCandidatura({
    cargo: campo('cargo'), nome: campo('nome'), cpf: campo('cpf'), dataNascimento: campo('dataNascimento'),
    telefone: campo('telefone'), email: campo('email'), curriculoTexto: campo('curriculoTexto'),
  });

  const arquivo = form.get('curriculo');
  const temArquivo = arquivo && typeof arquivo === 'object' && arquivo.size > 0;
  if (!temArquivo && !dados.curriculo_texto) {
    falhar(422, 'CURRICULO_OBRIGATORIO', 'Envie o currículo em arquivo ou descreva sua experiência no campo de texto.', ['curriculo', 'curriculoTexto']);
  }
  if (temArquivo) validarArquivo(arquivo, { categoria: 'curriculo', campo: 'curriculo' });
  const avisoVersao = await validarAceite({ avisoVersao: campo('avisoVersao'), aceito: campo('aceito') });

  // O arquivo sobe antes da transação; se a gravação da candidatura falhar, ele é apagado do Blob.
  const curriculo = temArquivo
    ? await salvarArquivo(arquivo, { categoria: 'curriculo', enviadoPor: 'publico', campo: 'curriculo' })
    : null;

  const candidatura = await transacao(async (tx) => {
    const colunas = [...CAMPOS, 'curriculo_arquivo_id', 'curriculo_texto', 'protocolo', 'criado_por'];
    const valores = [...CAMPOS.map((c) => dados[c]), curriculo?.id ?? null, dados.curriculo_texto, gerarProtocolo('CAN'), 'publico'];
    const [nova] = await tx.query(
      `INSERT INTO candidatura (${colunas.join(', ')}) VALUES (${colunas.map((_, i) => `$${i + 1}`).join(', ')})
       RETURNING id, protocolo, status`, valores);
    await registrarConsentimento({ alvo: 'candidatura', alvoId: nova.id, avisoVersao, finalidade: 'candidatura_vaga' }, tx);
    await registrarAuditoria({
      autorTipo: 'anonimo', acao: 'candidatura.enviar', entidadeTipo: 'candidatura', entidadeId: nova.id,
      detalhe: { cargo: dados.cargo, comArquivo: Boolean(curriculo) },
    }, tx);
    return nova;
  }).catch(async (erro) => {
    if (curriculo) await removerArquivo(curriculo.id).catch(() => {});
    throw erro;
  });

  const emailEnviado = await enviarEmail({
    para: dados.email,
    modelo: 'confirmacao_submissao',
    dados: { tipo: 'candidatura', nome: dados.nome, protocolo: candidatura.protocolo },
    motivo: 'confirmacao',
    entidadeTipo: 'candidatura',
    entidadeId: candidatura.id,
  });

  return json({ protocolo: candidatura.protocolo, status: candidatura.status, emailEnviado }, 201);
});
