// POST /api/admin/voluntarios/:id/entrevista — pendente → entrevista (FR-015, 2026-10-03).
// O voluntário recebe o e-mail avisando que a equipe vai entrar em contato (FR-049b).

import { exigirAdmin } from '../../../_lib/acesso.js';
import { decidir } from '../../../_lib/triagem.js';
import { json, idDaRota, rota } from '../../../_lib/http.js';

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const resultado = await decidir({ tabela: 'cadastro_voluntario', id: idDaRota(request), para: 'entrevista', conta });
  return json(resultado);
});
