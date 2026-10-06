// GET /api/admin/doacoes?status=pendente|confirmada|nao_localizada|todas (FR-008, FR-050, research D18).
// Para cada declaração: valor, data/hora do clique e, na associativa, o nome do doador —
// os critérios de busca no extrato. `possivelDuplicata` quando outra pendente tem o mesmo
// valor a até 30 minutos (sinalização, nunca bloqueio).

import { sql } from '../../_lib/db.js';
import { exigirAdmin } from '../../_lib/acesso.js';
import { json, falhar, rota } from '../../_lib/http.js';

const STATUS = new Set(['pendente', 'confirmada', 'nao_localizada', 'todas']);
const JANELA_DUPLICATA = '30 minutes';

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const status = new URL(request.url).searchParams.get('status') || 'pendente';
  if (!STATUS.has(status)) falhar(400, 'STATUS_INVALIDO', 'Filtro de status inválido.');

  const doacoes = await sql`
    SELECT d.id, d.tipo, d.valor, d.declarada_em, d.status, d.motivo_nao_localizada,
           d.conferido_por, d.conferido_em,
           CASE WHEN p.anonimizado_em IS NOT NULL THEN 'Doador anonimizado' ELSE p.nome END AS doador_nome,
           (d.status = 'pendente' AND EXISTS (
              SELECT 1 FROM doacao o
              WHERE o.id <> d.id AND o.status = 'pendente' AND o.valor = d.valor
                AND abs(extract(epoch FROM o.declarada_em - d.declarada_em)) <= extract(epoch FROM ${JANELA_DUPLICATA}::interval)
           )) AS possivel_duplicata
    FROM doacao d
    LEFT JOIN pessoa p ON p.id = d.pessoa_id
    WHERE ${status} = 'todas' OR d.status = ${status}
    ORDER BY CASE WHEN d.status = 'pendente' THEN d.declarada_em END ASC,
             d.declarada_em DESC
    LIMIT 300`;

  // Totais só do que veio por Pix e foi declarado no site — não é a arrecadação (FR-060a).
  const [resumo] = await sql`
    SELECT count(*) FILTER (WHERE status = 'pendente')::int AS pendentes,
           count(*) FILTER (WHERE status = 'confirmada')::int AS confirmadas,
           COALESCE(sum(valor) FILTER (WHERE status = 'confirmada'), 0) AS total_confirmado
    FROM doacao`;

  return json({
    resumo: { pendentes: resumo.pendentes, confirmadas: resumo.confirmadas, totalConfirmado: Number(resumo.total_confirmado) },
    doacoes: doacoes.map((d) => ({
      id: d.id,
      tipo: d.tipo,
      valor: Number(d.valor),
      declaradaEm: d.declarada_em,
      status: d.status,
      doador: d.tipo === 'associativa' ? d.doador_nome : null,
      possivelDuplicata: d.possivel_duplicata,
      motivoNaoLocalizada: d.motivo_nao_localizada,
      conferidoPor: d.conferido_por,
      conferidoEm: d.conferido_em,
    })),
  });
});
