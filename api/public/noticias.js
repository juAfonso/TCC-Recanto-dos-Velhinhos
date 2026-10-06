// GET /api/public/noticias → só notícias publicadas, mais recentes primeiro (FR-032, FR-032a).
// Opcional: ?limite=3 (a página inicial mostra só as últimas).

import { sql } from '../_lib/db.js';
import { json, rota } from '../_lib/http.js';

export const GET = rota(async (request) => {
  const pedido = Number(new URL(request.url).searchParams.get('limite'));
  const limite = Number.isInteger(pedido) && pedido > 0 && pedido <= 50 ? pedido : 50;

  const noticias = await sql`
    SELECT n.id, n.titulo, n.corpo, n.criado_em, n.atualizado_em, n.imagem_alt, a.blob_url AS imagem_url
    FROM noticia n
    LEFT JOIN arquivo a ON a.id = n.imagem_arquivo_id AND a.acesso = 'publico' AND a.removido_em IS NULL
    WHERE n.status = 'publicada'
    ORDER BY n.criado_em DESC
    LIMIT ${limite}`;

  return json({
    noticias: noticias.map((n) => ({
      id: n.id,
      titulo: n.titulo,
      corpo: n.corpo,
      publicadaEm: n.criado_em,
      atualizadaEm: n.atualizado_em,
      imagem: n.imagem_url ? { url: n.imagem_url, alt: n.imagem_alt } : null,
    })),
  });
});
