// GET /api/me/doacoes — histórico do doador da sessão: SÓ doações confirmadas, com valor e data
// (FR-041, decisão de 2026-10-04). Pendentes e não localizadas não aparecem; não há recibo.
// A data é a da declaração ("Já fiz o Pix"), que é quando o doador pagou.

import { sql } from '../_lib/db.js';
import { exigirDoador } from '../_lib/acesso.js';
import { json, rota } from '../_lib/http.js';

export const GET = rota(async (request) => {
  const { pessoa } = await exigirDoador(request);
  const doacoes = await sql`
    SELECT valor, declarada_em FROM doacao
    WHERE pessoa_id = ${pessoa.id} AND status = 'confirmada'
    ORDER BY declarada_em DESC`;
  const lista = doacoes.map((d) => ({ valor: Number(d.valor), data: d.declarada_em }));
  return json({
    doacoes: lista,
    total: Math.round(lista.reduce((s, d) => s + d.valor * 100, 0)) / 100,
  });
});
