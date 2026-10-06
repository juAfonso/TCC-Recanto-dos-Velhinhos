// GET /api/admin/voluntarios?status= — filas da triagem de voluntários (FR-013 a FR-015).

import { sql } from '../../_lib/db.js';
import { exigirAdmin } from '../../_lib/acesso.js';
import { idadeEm, dataTexto } from '../../_lib/datas.js';
import { json, falhar, rota } from '../../_lib/http.js';

const STATUS = new Set(['pendente', 'entrevista', 'aprovado', 'rejeitado', 'encerrado_titular', 'todos']);

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const status = new URL(request.url).searchParams.get('status') || 'pendente';
  if (!STATUS.has(status)) falhar(400, 'STATUS_INVALIDO', 'Filtro de status inválido.');

  const linhas = await sql`
    SELECT id, protocolo, nome, data_nascimento, tipo_servico, status, origem, menor_de_idade,
           autorizacao_status, criado_em, triado_em, anonimizado_em
    FROM cadastro_voluntario
    WHERE ${status} = 'todos' OR status = ${status}
    ORDER BY CASE WHEN status IN ('pendente', 'entrevista') THEN criado_em END ASC, criado_em DESC
    LIMIT 300`;

  const [contagem] = await sql`
    SELECT count(*) FILTER (WHERE status = 'pendente')::int AS pendente,
           count(*) FILTER (WHERE status = 'entrevista')::int AS entrevista
    FROM cadastro_voluntario`;

  return json({
    contagem,
    voluntarios: linhas.map((l) => ({
      id: l.id,
      protocolo: l.protocolo,
      nome: l.nome,
      idade: l.data_nascimento ? idadeEm(dataTexto(l.data_nascimento)) : null,
      tipoServico: l.tipo_servico,
      status: l.status,
      origem: l.origem,
      menorDeIdade: l.menor_de_idade,
      autorizacaoStatus: l.autorizacao_status,
      criadoEm: l.criado_em,
      triadoEm: l.triado_em,
      anonimizado: Boolean(l.anonimizado_em),
    })),
  });
});
