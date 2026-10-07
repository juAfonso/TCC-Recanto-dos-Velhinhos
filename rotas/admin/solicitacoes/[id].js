// GET /api/admin/solicitacoes/:id — todos os campos coletados (FR-037a), mais o evento ou a
// campanha criados na confirmação e, para evento, outros eventos ativos na data pretendida.
// PUT — corrige os dados sem mudar o status (FR-037); histórico; anonimizada → 409. Depois da
// confirmação, o que vale é o evento/campanha publicado: a correção não o altera.

import { sql, transacao } from '../../_lib/db.js';
import { exigirAdmin } from '../../_lib/acesso.js';
import { registrarAuditoria } from '../../_lib/auditoria.js';
import { registrarAlteracao } from '../../_lib/historico.js';
import { validarSolicitacao, CAMPOS } from '../../_lib/solicitacoes.js';
import { dataTexto } from '../../_lib/datas.js';
import { json, lerJson, falhar, idDaRota, rota } from '../../_lib/http.js';

const dia = (d) => (d ? dataTexto(d) : null);

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const id = idDaRota(request);
  const [s] = await sql`SELECT * FROM solicitacao_externa WHERE id = ${id}`;
  if (!s) falhar(404, 'NAO_ENCONTRADO', 'Solicitação não encontrada.');
  const [consentimento] = await sql`SELECT aviso_versao, aceito_em, revogado_em FROM consentimento WHERE solicitacao_externa_id = ${id}`;
  const conflitos = s.tipo === 'evento' && s.data_pretendida && ['em_analise', 'aguardando_contato'].includes(s.status)
    ? await sql`SELECT nome FROM evento WHERE status = 'ativo' AND data = ${dia(s.data_pretendida)} ORDER BY nome`
    : [];
  const [criado] = s.evento_id
    ? await sql`SELECT id, nome, status FROM evento WHERE id = ${s.evento_id}`
    : s.campanha_id ? await sql`SELECT id, nome, status FROM campanha WHERE id = ${s.campanha_id}` : [];

  return json({
    id: s.id, protocolo: s.protocolo, tipo: s.tipo, status: s.status,
    nomeContato: s.nome_contato, email: s.email, telefone: s.telefone,
    nomeIniciativa: s.nome_iniciativa, objetivo: s.objetivo,
    dataPretendida: dia(s.data_pretendida), periodoInicio: dia(s.periodo_inicio), periodoFim: dia(s.periodo_fim),
    recursosEsperados: s.recursos_esperados,
    motivoRejeicao: s.motivo_rejeicao, triadoPor: s.triado_por, triadoEm: s.triado_em,
    criadoEm: s.criado_em, anonimizado: Boolean(s.anonimizado_em),
    conflitos: conflitos.map((c) => c.nome),
    criado: criado ? { id: criado.id, nome: criado.nome, status: criado.status } : null,
    consentimento: consentimento ? { avisoVersao: consentimento.aviso_versao, aceitoEm: consentimento.aceito_em, revogadoEm: consentimento.revogado_em } : null,
  });
});

export const PUT = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const corpo = await lerJson(request);

  await transacao(async (tx) => {
    const [atual] = await tx.query('SELECT * FROM solicitacao_externa WHERE id = $1 FOR UPDATE', [id]);
    if (!atual) falhar(404, 'NAO_ENCONTRADO', 'Solicitação não encontrada.');
    if (atual.anonimizado_em) falhar(409, 'REGISTRO_ANONIMIZADO', 'Esta solicitação foi anonimizada e não pode ser corrigida.');
    const dados = validarSolicitacao(corpo, {
      data_pretendida: dia(atual.data_pretendida), periodo_inicio: dia(atual.periodo_inicio),
    });
    if (atual.status === 'confirmada' && dados.tipo !== atual.tipo) {
      falhar(422, 'TIPO_NAO_ALTERAVEL', 'A solicitação já virou evento ou campanha; o tipo não pode mais mudar.', ['tipo']);
    }
    await registrarAlteracao({ entidadeTipo: 'solicitacao_externa', entidadeId: id, estadoAnterior: atual, autor: conta.identificador }, tx);
    await tx.query(
      `UPDATE solicitacao_externa SET ${CAMPOS.map((c, i) => `${c} = $${i + 2}`).join(', ')} WHERE id = $1`,
      [id, ...CAMPOS.map((c) => dados[c])]);
    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id,
      acao: 'solicitacao.corrigir', entidadeTipo: 'solicitacao_externa', entidadeId: id,
    }, tx);
  });
  return json({ ok: true });
});
