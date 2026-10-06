// POST /api/admin/candidaturas/:id/rejeitar { motivo? } — motivo OPCIONAL (2026-10-03, FR-019).

import { exigirAdmin } from '../../../_lib/acesso.js';
import { decidir } from '../../../_lib/triagem.js';
import { json, lerJson, idDaRota, rota } from '../../../_lib/http.js';

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const { motivo } = await lerJson(request);
  return json(await decidir({
    tabela: 'candidatura', id: idDaRota(request), para: 'rejeitada',
    motivo: typeof motivo === 'string' ? motivo.slice(0, 1000) : null, conta,
  }));
});
