// GET /api/public/aviso-privacidade → { versao, texto, publicadoEm, contato } da versão vigente
// (FR-053). O contato é por onde o titular faz os pedidos (FR-054).

import { sql } from '../_lib/db.js';
import { avisoVigente } from '../_lib/consentimento.js';
import { json, falhar, rota } from '../_lib/http.js';

export const GET = rota(async () => {
  const aviso = await avisoVigente();
  if (!aviso) falhar(503, 'AVISO_INDISPONIVEL', 'O aviso de privacidade ainda não foi publicado. Tente de novo mais tarde.');
  const [contato] = await sql`SELECT valor FROM configuracao WHERE chave = 'contato_instituicao'`;
  return json({ versao: aviso.versao, texto: aviso.texto, publicadoEm: aviso.publicado_em, contato: contato?.valor ?? '' });
});
