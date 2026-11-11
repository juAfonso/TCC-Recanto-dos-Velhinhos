// GET /api/admin/doacoes/relatorio?de=AAAA-MM-DD&ate=AAAA-MM-DD&valorMin=&valorMax=
//     &tipo=todas|espontanea|associativa&situacao=confirmada|pendente|nao_localizada|todas&ordem=data|valor
// Dados do relatório de doações que o Painel imprime ou salva em PDF (2026-11-10).
// Só leitura. O período é pela data do clique em "Já fiz o Pix", no fuso de Brasília.
// Como os totais da tela de Doações, é só o Pix declarado no site: não é a arrecadação (FR-060a).

import { sql } from '../../_lib/db.js';
import { exigirAdmin } from '../../_lib/acesso.js';
import { json, falhar, rota } from '../../_lib/http.js';
import { lerFiltros, resumir, MAXIMO_LINHAS } from '../../_lib/relatorio-doacoes.js';

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const { filtros, erros } = lerFiltros(new URL(request.url).searchParams);
  if (erros) {
    const campos = Object.keys(erros);
    falhar(400, 'FILTRO_INVALIDO', erros[campos[0]], campos, erros);
  }
  const { de, ate, valorMin, valorMax, tipo, situacao, ordem } = filtros;

  const linhas = await sql`
    SELECT d.id, d.tipo, d.valor, d.declarada_em, d.status, d.conferido_em,
           CASE WHEN p.anonimizado_em IS NOT NULL THEN 'Doador anonimizado' ELSE p.nome END AS doador_nome
    FROM doacao d
    LEFT JOIN pessoa p ON p.id = d.pessoa_id
    WHERE (d.declarada_em AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN ${de}::date AND ${ate}::date
      AND (${tipo} = 'todas' OR d.tipo = ${tipo})
      AND (${situacao} = 'todas' OR d.status = ${situacao})
      AND (${valorMin}::numeric IS NULL OR d.valor >= ${valorMin}::numeric)
      AND (${valorMax}::numeric IS NULL OR d.valor <= ${valorMax}::numeric)
    ORDER BY CASE WHEN ${ordem} = 'valor' THEN d.valor END DESC NULLS LAST, d.declarada_em ASC
    LIMIT ${MAXIMO_LINHAS + 1}`;

  if (linhas.length > MAXIMO_LINHAS) {
    falhar(422, 'RELATORIO_GRANDE_DEMAIS',
      `O relatório passaria de ${MAXIMO_LINHAS} doações. Escolha um período menor ou uma faixa de valor.`, ['de', 'ate']);
  }

  const doacoes = linhas.map((d) => ({
    id: d.id,
    tipo: d.tipo,
    valor: Number(d.valor),
    declaradaEm: d.declarada_em,
    status: d.status,
    conferidoEm: d.conferido_em,
    doador: d.tipo === 'associativa' ? d.doador_nome : null,
  }));

  return json({ filtros, emitidoEm: new Date().toISOString(), resumo: resumir(doacoes), doacoes });
});
