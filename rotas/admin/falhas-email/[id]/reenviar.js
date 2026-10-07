// POST /api/admin/falhas-email/:id/reenviar — tenta de novo um e-mail que falhou (FR-049a).
// O texto é refeito com os dados ATUAIS da submissão: se a equipe corrigiu o e-mail errado,
// o reenvio já vai para o endereço certo. A falha original é dada como tratada; se o reenvio
// falhar também, enviarEmail() registra uma falha nova, que aparece na lista.
// Links de senha não são reenviados daqui: o token não é guardado em claro (research D11), e o
// doador pede outro em "Esqueci minha senha".

import { sql } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { registrarAuditoria } from '../../../_lib/auditoria.js';
import { enviarEmail } from '../../../_lib/email.js';
import { json, falhar, idDaRota, rota } from '../../../_lib/http.js';

const NOME = { cadastro_voluntario: 'nome', candidatura: 'nome', solicitacao_externa: 'nome_contato' };

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);

  const [f] = await sql`SELECT * FROM falha_email WHERE id = ${id} AND anonimizado_em IS NULL`;
  if (!f) falhar(404, 'NAO_ENCONTRADO', 'Falha de e-mail não encontrada.');
  if (f.tratada_em) falhar(409, 'JA_TRATADA', 'Esta falha já foi tratada. Recarregue a página.');
  if (!['confirmacao', 'triagem'].includes(f.motivo) || !NOME[f.entidade_tipo]) {
    falhar(422, 'REENVIO_INDISPONIVEL',
      'Link de senha não pode ser reenviado pelo Painel. Avise o doador para pedir um novo em "Esqueci minha senha", na tela de login.');
  }

  const [s] = await sql.query(
    `SELECT ${NOME[f.entidade_tipo]} AS nome, email, protocolo, motivo_rejeicao, anonimizado_em
     FROM ${f.entidade_tipo} WHERE id = $1`, [f.entidade_id]);
  if (!s || s.anonimizado_em) falhar(409, 'REGISTRO_ANONIMIZADO', 'O registro deste e-mail foi anonimizado. Não há para quem reenviar.');

  const enviado = await enviarEmail({
    para: s.email,
    modelo: f.modelo,
    dados: { tipo: f.entidade_tipo, nome: s.nome, protocolo: s.protocolo, motivo: s.motivo_rejeicao },
    motivo: f.motivo,
    entidadeTipo: f.entidade_tipo,
    entidadeId: f.entidade_id,
  });

  await sql`UPDATE falha_email SET tratada_por = ${conta.identificador}, tratada_em = now() WHERE id = ${id}`;
  await registrarAuditoria({
    autorTipo: 'conta_institucional', autorId: conta.id, acao: 'falha_email.reenviar',
    entidadeTipo: f.entidade_tipo, entidadeId: f.entidade_id, detalhe: { falha: id, enviado },
  });
  return json({ enviado });
});
