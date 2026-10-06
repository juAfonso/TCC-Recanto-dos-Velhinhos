// GET /api/admin/sessao → { identificador } ou 401.
// Usado pelas telas do Painel só para saber se mostram a página ou vão ao login.
// Responde 401 (e não 403 com auditoria, como exigirAdmin): abrir o Painel sem estar
// logado é o caminho normal até o login, não uma tentativa de acesso indevido.

import { sql } from '../_lib/db.js';
import { lerSessao } from '../_lib/sessao.js';
import { json, falhar, rota } from '../_lib/http.js';

export const GET = rota(async (request) => {
  const sessao = lerSessao(request);
  if (sessao?.ctx === 'admin') {
    const [conta] = await sql`SELECT identificador FROM conta_institucional WHERE id = ${sessao.id} AND ativo`;
    if (conta) return json({ identificador: conta.identificador });
  }
  falhar(401, 'SEM_SESSAO', 'Faça login para acessar o Painel.');
});
