// GET /api/public/itens-necessarios → itens ativos, da prioridade alta para a baixa
// (FR-003, FR-004, FR-026). Item com baixa (suprido) não aparece.

import { sql } from '../_lib/db.js';
import { json, rota } from '../_lib/http.js';

export const GET = rota(async () => {
  const itens = await sql`
    SELECT id, nome, quantidade, unidade, prioridade, quantidade_atualizada_em
    FROM item_necessario
    WHERE status = 'ativo'
    ORDER BY CASE prioridade WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END,
             quantidade_atualizada_em DESC, nome`;
  return json({
    itens: itens.map((i) => ({
      id: i.id,
      nome: i.nome,
      quantidade: Number(i.quantidade),
      unidade: i.unidade,
      prioridade: i.prioridade,
      atualizadoEm: i.quantidade_atualizada_em,
    })),
  });
});
