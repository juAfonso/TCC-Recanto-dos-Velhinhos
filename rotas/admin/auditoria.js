// GET /api/admin/auditoria?pagina=1&acao= — histórico de auditoria, mais recentes primeiro (FR-035,
// cenário 12 da US7). Somente leitura: a tabela é só inclusão (Princípio III).
// A autoria é a conta institucional, o doador, o sistema ou "anônimo" — nunca o funcionário.
// `acao` filtra pelo começo do nome (ex.: "pessoa" pega pessoa.inativar, pessoa.corrigir...).

import { sql } from '../_lib/db.js';
import { exigirAdmin } from '../_lib/acesso.js';
import { json, rota } from '../_lib/http.js';

const POR_PAGINA = 50;

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const params = new URL(request.url).searchParams;
  const pagina = Math.max(1, parseInt(params.get('pagina') ?? '1', 10) || 1);
  const acao = String(params.get('acao') ?? '').trim().replace(/[^a-z_.]/g, '').slice(0, 60);

  const linhas = await sql`
    SELECT a.id, a.autor_tipo, a.acao, a.entidade_tipo, a.entidade_id, a.detalhe, a.ocorrido_em,
           c.identificador AS conta
    FROM registro_auditoria a
    LEFT JOIN conta_institucional c ON a.autor_tipo = 'conta_institucional' AND c.id = a.autor_id
    WHERE ${acao} = '' OR a.acao LIKE ${acao} || '%'
    ORDER BY a.ocorrido_em DESC, a.id DESC
    LIMIT ${POR_PAGINA + 1} OFFSET ${(pagina - 1) * POR_PAGINA}`;

  return json({
    pagina,
    temMais: linhas.length > POR_PAGINA,
    registros: linhas.slice(0, POR_PAGINA).map((a) => ({
      id: Number(a.id),
      acao: a.acao,
      autorTipo: a.autor_tipo,
      autor: a.conta ?? null,
      entidadeTipo: a.entidade_tipo,
      entidadeId: a.entidade_id,
      detalhe: a.detalhe,
      ocorridoEm: a.ocorrido_em,
    })),
  });
});
