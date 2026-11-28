// GET /api/public/ambiente → { demonstracao: true } quando o banco foi semeado como
// demonstração (configuracao.ambiente = 'demo'), para o site mostrar a faixa
// "Site de demonstração — dados fictícios" (decidido em 2026-11-27, site da banca).
//
// A marca vem do próprio banco, não de variável da Vercel: o banco da produção é marcado
// 'producao' na criação das tabelas (migrate --producao), então a faixa não tem como
// aparecer no site do Recanto, e sempre aparece onde os dados são inventados (dev,
// demonstração). Erro de banco responde false: na dúvida, o site real não ganha faixa.

import { sql } from '../_lib/db.js';
import { json, rota } from '../_lib/http.js';

export const GET = rota(async () => {
  const [marca] = await sql`SELECT valor FROM configuracao WHERE chave = 'ambiente'`.catch(() => []);
  return json({ demonstracao: marca?.valor === 'demo' });
});
