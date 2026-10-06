// POST /api/admin/voluntarios/:id/autorizacao-recebida — a autorização do responsável, em papel,
// foi entregue na sede (FR-012, 2026-10-03). Registra conta e data. Só então o menor pode ser
// aprovado. Marcar de novo não muda nada.

import { sql } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { registrarAuditoria } from '../../../_lib/auditoria.js';
import { json, falhar, idDaRota, rota } from '../../../_lib/http.js';

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const [linha] = await sql`
    UPDATE cadastro_voluntario
    SET autorizacao_status = 'recebida', autorizacao_recebida_por = ${conta.identificador}, autorizacao_recebida_em = now()
    WHERE id = ${id} AND autorizacao_status = 'pendente' AND anonimizado_em IS NULL
      AND status IN ('pendente', 'entrevista')
    RETURNING id`;
  if (!linha) {
    const [c] = await sql`SELECT autorizacao_status, status FROM cadastro_voluntario WHERE id = ${id}`;
    if (!c) falhar(404, 'NAO_ENCONTRADO', 'Cadastro não encontrado.');
    if (c.autorizacao_status === 'recebida') return json({ ok: true, jaRecebida: true });
    falhar(409, 'SEM_AUTORIZACAO_PENDENTE', 'Este cadastro não tem autorização pendente.');
  }
  await registrarAuditoria({
    autorTipo: 'conta_institucional', autorId: conta.id,
    acao: 'voluntario.autorizacao_recebida', entidadeTipo: 'cadastro_voluntario', entidadeId: id,
  });
  return json({ ok: true });
});
