// POST /api/admin/falhas-email/:id/tratada — a equipe resolveu por fora (telefone, conversa na
// sede) e tira a falha da lista de pendências (FR-049a). O registro continua consultável.

import { sql } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { registrarAuditoria } from '../../../_lib/auditoria.js';
import { json, falhar, idDaRota, rota } from '../../../_lib/http.js';

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const [f] = await sql`
    UPDATE falha_email SET tratada_por = ${conta.identificador}, tratada_em = now()
    WHERE id = ${id} AND tratada_em IS NULL AND anonimizado_em IS NULL
    RETURNING entidade_tipo, entidade_id`;
  if (!f) falhar(409, 'JA_TRATADA', 'Esta falha já foi tratada ou não existe. Recarregue a página.');
  await registrarAuditoria({
    autorTipo: 'conta_institucional', autorId: conta.id, acao: 'falha_email.tratada',
    entidadeTipo: f.entidade_tipo, entidadeId: f.entidade_id, detalhe: { falha: id },
  });
  return json({ ok: true });
});
