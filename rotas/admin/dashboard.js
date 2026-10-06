// GET /api/admin/dashboard — STUB da fase 2 (T036): já exige a sessão do Painel, mas o conteúdo
// só é implementado na história US1 a US7 (FR-036). Até lá responde 501.

import { exigirAdmin } from '../_lib/acesso.js';
import { falhar, rota } from '../_lib/http.js';

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  falhar(501, 'NAO_IMPLEMENTADO', 'Esta parte do Painel ainda está em construção.');
});
