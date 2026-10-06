// GET /api/admin/candidaturas?status= — filas da triagem de candidaturas (FR-018, FR-019).

import { sql } from '../../_lib/db.js';
import { exigirAdmin } from '../../_lib/acesso.js';
import { idadeEm, dataTexto } from '../../_lib/datas.js';
import { json, falhar, rota } from '../../_lib/http.js';

const STATUS = new Set(['em_analise', 'entrevista', 'aprovada', 'rejeitada', 'encerrada_titular', 'todas']);

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const status = new URL(request.url).searchParams.get('status') || 'em_analise';
  if (!STATUS.has(status)) falhar(400, 'STATUS_INVALIDO', 'Filtro de status inválido.');

  const linhas = await sql`
    SELECT id, protocolo, cargo, nome, data_nascimento, status, criado_em, triado_em,
           curriculo_arquivo_id IS NOT NULL AS tem_arquivo, anonimizado_em
    FROM candidatura
    WHERE ${status} = 'todas' OR status = ${status}
    ORDER BY CASE WHEN status IN ('em_analise', 'entrevista') THEN criado_em END ASC, criado_em DESC
    LIMIT 300`;
  const [contagem] = await sql`
    SELECT count(*) FILTER (WHERE status = 'em_analise')::int AS em_analise,
           count(*) FILTER (WHERE status = 'entrevista')::int AS entrevista
    FROM candidatura`;

  return json({
    contagem,
    candidaturas: linhas.map((l) => ({
      id: l.id, protocolo: l.protocolo, cargo: l.cargo, nome: l.nome,
      idade: l.data_nascimento ? idadeEm(dataTexto(l.data_nascimento)) : null,
      status: l.status, criadoEm: l.criado_em, triadoEm: l.triado_em,
      temArquivo: l.tem_arquivo, anonimizado: Boolean(l.anonimizado_em),
    })),
  });
});
