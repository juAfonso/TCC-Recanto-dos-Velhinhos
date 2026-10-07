// GET /api/me — dados cadastrais do doador da sessão (FR-041). Só consulta (decisão de
// 2026-10-07): para corrigir, o doador fala com a secretaria, que corrige no Painel (FR-037).
// O id vem SEMPRE da sessão (exigirDoador), nunca da URL: não há como pedir dados de outra
// pessoa (FR-042).
// `avisoPendente`: versão vigente do aviso de privacidade que ele ainda não aceitou; a próxima
// doação pede o aceite dela (decisão de 2026-10-07).

import { sql } from '../_lib/db.js';
import { exigirDoador } from '../_lib/acesso.js';
import { avisoPendenteDo } from '../_lib/consentimento.js';
import { json, rota } from '../_lib/http.js';

export const GET = rota(async (request) => {
  const { pessoa } = await exigirDoador(request);
  const [p] = await sql`
    SELECT p.nome, p.cpf, p.email, p.telefone,
           (SELECT min(inicio_em) FROM papel WHERE pessoa_id = p.id AND tipo = 'doador_associado') AS associado_desde
    FROM pessoa p WHERE p.id = ${pessoa.id}`;
  return json({
    nome: p.nome,
    cpf: p.cpf,
    email: p.email,
    telefone: p.telefone,
    associadoDesde: p.associado_desde,
    avisoPendente: await avisoPendenteDo(pessoa.id),
  });
});
