// POST /api/admin/candidaturas/:id/entrevista — em análise → entrevista (FR-019, FR-049b).

import { exigirAdmin } from '../../../_lib/acesso.js';
import { decidir } from '../../../_lib/triagem.js';
import { json, idDaRota, rota } from '../../../_lib/http.js';

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  return json(await decidir({ tabela: 'candidatura', id: idDaRota(request), para: 'entrevista', conta }));
});
