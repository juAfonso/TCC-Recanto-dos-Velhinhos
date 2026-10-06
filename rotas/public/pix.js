// GET /api/public/pix → chave ativa para o navegador montar o QR (FR-007), ou
// { disponivel: false, contato } quando não há chave: o Portal não oferece a declaração (FR-007a).

import { sql } from '../_lib/db.js';
import { json, rota } from '../_lib/http.js';

export const GET = rota(async () => {
  const [chave] = await sql`
    SELECT chave, tipo_chave, nome_recebedor, cidade FROM chave_pix_institucional WHERE ativa LIMIT 1`;
  if (chave) {
    return json({
      disponivel: true,
      chave: chave.chave,
      tipoChave: chave.tipo_chave,
      nomeRecebedor: chave.nome_recebedor,
      cidade: chave.cidade,
    });
  }
  const [contato] = await sql`SELECT valor FROM configuracao WHERE chave = 'contato_instituicao'`;
  return json({ disponivel: false, contato: contato?.valor ?? '' });
});
