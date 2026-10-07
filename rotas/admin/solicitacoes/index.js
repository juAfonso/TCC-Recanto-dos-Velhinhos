// GET /api/admin/solicitacoes?status= — filas da triagem de solicitações externas (FR-021, FR-022).

import { sql } from '../../_lib/db.js';
import { exigirAdmin } from '../../_lib/acesso.js';
import { json, falhar, rota } from '../../_lib/http.js';

const STATUS = new Set(['em_analise', 'aguardando_contato', 'confirmada', 'rejeitada', 'encerrada_titular', 'todas']);

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const status = new URL(request.url).searchParams.get('status') || 'em_analise';
  if (!STATUS.has(status)) falhar(400, 'STATUS_INVALIDO', 'Filtro de status inválido.');

  const linhas = await sql`
    SELECT id, protocolo, tipo, nome_contato, nome_iniciativa, status, criado_em, anonimizado_em,
           to_char(COALESCE(data_pretendida, periodo_inicio), 'YYYY-MM-DD') AS data_inicio,
           to_char(periodo_fim, 'YYYY-MM-DD') AS data_fim
    FROM solicitacao_externa
    WHERE ${status} = 'todas' OR status = ${status}
    ORDER BY CASE WHEN status IN ('em_analise', 'aguardando_contato') THEN criado_em END ASC, criado_em DESC
    LIMIT 300`;
  const [contagem] = await sql`
    SELECT count(*) FILTER (WHERE status = 'em_analise')::int AS em_analise,
           count(*) FILTER (WHERE status = 'aguardando_contato')::int AS aguardando_contato
    FROM solicitacao_externa`;

  return json({
    contagem,
    solicitacoes: linhas.map((l) => ({
      id: l.id, protocolo: l.protocolo, tipo: l.tipo, nomeContato: l.nome_contato, nomeIniciativa: l.nome_iniciativa,
      dataInicio: l.data_inicio, dataFim: l.data_fim, status: l.status, criadoEm: l.criado_em,
      anonimizado: Boolean(l.anonimizado_em),
    })),
  });
});
