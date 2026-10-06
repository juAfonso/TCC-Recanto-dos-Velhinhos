// POST /api/admin/itens/:id/baixa — item suprido sai do Portal e fica no histórico (FR-004, FR-027).
// Dar baixa duas vezes não muda nada.

import { sql } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { registrarAuditoria } from '../../../_lib/auditoria.js';
import { json, falhar, idDaRota, rota } from '../../../_lib/http.js';

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const [item] = await sql`
    UPDATE item_necessario SET status = 'suprido', baixa_por = ${conta.identificador}, baixa_em = now()
    WHERE id = ${id} AND status = 'ativo' RETURNING id`;
  if (!item) {
    const [existe] = await sql`SELECT status FROM item_necessario WHERE id = ${id}`;
    if (!existe) falhar(404, 'NAO_ENCONTRADO', 'Item não encontrado.');
    return json({ ok: true, jaSuprido: true });
  }
  await registrarAuditoria({
    autorTipo: 'conta_institucional', autorId: conta.id,
    acao: 'item.baixa', entidadeTipo: 'item_necessario', entidadeId: id,
  });
  return json({ ok: true });
});
