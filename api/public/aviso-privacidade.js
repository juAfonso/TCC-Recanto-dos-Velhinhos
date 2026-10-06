// GET /api/public/aviso-privacidade → { versao, texto, publicadoEm } da versão vigente (FR-053).

import { avisoVigente } from '../_lib/consentimento.js';
import { json, falhar, rota } from '../_lib/http.js';

export const GET = rota(async () => {
  const aviso = await avisoVigente();
  if (!aviso) falhar(503, 'AVISO_INDISPONIVEL', 'O aviso de privacidade ainda não foi publicado. Tente de novo mais tarde.');
  return json({ versao: aviso.versao, texto: aviso.texto, publicadoEm: aviso.publicado_em });
});
