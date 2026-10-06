// POST /api/admin/eventos-campanhas/:id/encerrar — a qualquer momento (FR-029a).
// Sai do Portal e fica no histórico. Já encerrado → 200 sem alterar nada.

import { transacao } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { registrarAuditoria } from '../../../_lib/auditoria.js';
import { carregar } from '../../../_lib/eventos-campanhas.js';
import { json, idDaRota, rota } from '../../../_lib/http.js';

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);

  const resultado = await transacao(async (tx) => {
    const { tabela, registro } = await carregar(tx, id, { travar: true });
    if (registro.status !== 'ativo') return { jaEncerrado: true };
    await tx.query(
      `UPDATE ${tabela} SET status = 'encerrado', encerrado_por = $2, encerrado_em = now() WHERE id = $1`,
      [id, conta.identificador]);
    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id,
      acao: `${tabela}.encerrar`, entidadeTipo: tabela, entidadeId: id,
    }, tx);
    return { jaEncerrado: false };
  });
  return json({ ok: true, ...resultado });
});
