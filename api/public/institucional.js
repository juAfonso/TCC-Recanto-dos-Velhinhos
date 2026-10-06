// GET /api/public/institucional → história, missão, equipe, acolhimento, bazar e imagens
// ativas (FR-001; acolhimento e bazar desde 2026-10-06).

import { sql } from '../_lib/db.js';
import { json, rota } from '../_lib/http.js';

export const GET = rota(async () => {
  const [conteudo] = await sql`
    SELECT historia, missao, equipe, acolhimento, bazar, atualizado_em FROM conteudo_institucional WHERE id = 1`;
  const imagens = await sql`
    SELECT a.blob_url AS url, i.texto_alternativo AS alt
    FROM conteudo_institucional_imagem i
    JOIN arquivo a ON a.id = i.arquivo_id
    WHERE i.ativo AND a.acesso = 'publico' AND a.removido_em IS NULL
    ORDER BY i.ordem, i.criado_em`;
  return json({
    historia: conteudo?.historia ?? '',
    missao: conteudo?.missao ?? '',
    equipe: conteudo?.equipe ?? '',
    acolhimento: conteudo?.acolhimento ?? '',
    bazar: conteudo?.bazar ?? '',
    atualizadoEm: conteudo?.atualizado_em ?? null,
    imagens,
  });
});
