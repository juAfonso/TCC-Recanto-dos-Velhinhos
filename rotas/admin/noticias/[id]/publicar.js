// POST /api/admin/noticias/:id/publicar — volta a mostrar no Portal a notícia despublicada (FR-032a).

import { exigirAdmin } from '../../../_lib/acesso.js';
import { mudarStatusNoticia } from '../../../_lib/noticia-status.js';
import { json, idDaRota, rota } from '../../../_lib/http.js';

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  return json(await mudarStatusNoticia({ id: idDaRota(request), para: 'publicada', conta }));
});
