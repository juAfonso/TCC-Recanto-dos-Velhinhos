// GET /api/auth/sessao → { logado: false } ou { logado: true, nome, avisoPendente }.
// Para páginas públicas saberem se há doador logado (doação sem redigitar dados, menu "Minha
// área"). Não nega nem audita: visitante sem login é o caso normal aqui. Os dados do doador
// continuam só em /api/me, que exige a sessão (FR-042, FR-047).

import { sql } from '../_lib/db.js';
import { doadorDaSessao } from '../_lib/acesso.js';
import { avisoPendenteDo } from '../_lib/consentimento.js';
import { json, rota } from '../_lib/http.js';

export const GET = rota(async (request) => {
  const logado = await doadorDaSessao(request);
  if (!logado) return json({ logado: false });
  const [p] = await sql`SELECT nome FROM pessoa WHERE id = ${logado.id}`;
  return json({ logado: true, nome: p.nome, avisoPendente: await avisoPendenteDo(logado.id) });
});
