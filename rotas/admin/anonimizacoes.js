// POST /api/admin/anonimizacoes { alvo, id, reter?, justificativaRetencao? } (FR-055, FR-056).
// alvo: pessoa | cadastro_voluntario | candidatura | curriculo | solicitacao. Irreversível.

import { exigirAdmin } from '../_lib/acesso.js';
import { anonimizar } from '../_lib/anonimizacao.js';
import { json, lerJson, falhar, rota } from '../_lib/http.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const corpo = await lerJson(request);
  if (typeof corpo.id !== 'string' || !UUID.test(corpo.id)) falhar(404, 'NAO_ENCONTRADO', 'Registro não encontrado.');
  return json(await anonimizar({
    alvo: corpo.alvo, id: corpo.id, reter: corpo.reter, justificativaRetencao: corpo.justificativaRetencao, conta,
  }));
});
