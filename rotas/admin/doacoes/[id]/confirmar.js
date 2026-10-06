// POST /api/admin/doacoes/:id/confirmar — o funcionário achou a entrada Pix no extrato (FR-008).
// Só sai de `pendente`: a guarda está no próprio UPDATE, então duas chamadas ao mesmo tempo
// não confirmam duas vezes (FR-050). A segunda responde 409 e nada muda.

import { sql } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { registrarAuditoria } from '../../../_lib/auditoria.js';
import { json, falhar, idDaRota, rota } from '../../../_lib/http.js';

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);

  const [doacao] = await sql`
    UPDATE doacao
    SET status = 'confirmada', conferido_por = ${conta.identificador}, conferido_em = now()
    WHERE id = ${id} AND status = 'pendente'
    RETURNING id, status, conferido_em`;

  if (!doacao) {
    const [existe] = await sql`SELECT status FROM doacao WHERE id = ${id}`;
    if (!existe) falhar(404, 'NAO_ENCONTRADO', 'Doação não encontrada.');
    falhar(409, 'DOACAO_JA_CONFERIDA', 'Esta doação já foi conferida antes. Recarregue a página para ver a situação atual.');
  }

  await registrarAuditoria({
    autorTipo: 'conta_institucional', autorId: conta.id,
    acao: 'doacao.confirmar', entidadeTipo: 'doacao', entidadeId: id,
  });
  return json({ id: doacao.id, status: doacao.status, conferidoEm: doacao.conferido_em });
});
