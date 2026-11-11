// GET /api/admin/campanhas/:id/relatorio — dados do relatório de uma campanha ENCERRADA, que o
// Painel imprime ou salva em PDF (decisão de 2026-11-11). Só leitura.
// Traz o que a equipe informou à mão: o valor da barra (se havia meta) e a quantidade
// arrecadada de cada recurso. O sistema não soma nada sozinho: doação Pix não é ligada a
// campanha (2026-10-04). Da proposta externa sai só o protocolo e o nome de quem propôs.

import { sql } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { dataTexto } from '../../../_lib/datas.js';
import { json, falhar, idDaRota, rota } from '../../../_lib/http.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const id = idDaRota(request);
  if (!UUID.test(id)) falhar(404, 'NAO_ENCONTRADO', 'Campanha não encontrada.');

  const [c] = await sql`
    SELECT c.*, s.protocolo, s.nome_iniciativa, s.anonimizado_em AS solicitacao_anonimizada,
           s.nome_contato
    FROM campanha c LEFT JOIN solicitacao_externa s ON s.id = c.solicitacao_origem_id
    WHERE c.id = ${id}`;
  if (!c) falhar(404, 'NAO_ENCONTRADO', 'Campanha não encontrada.');
  if (c.status !== 'encerrado') {
    falhar(422, 'CAMPANHA_ATIVA', 'O relatório é só de campanha encerrada. Encerre a campanha antes de gerar o relatório.');
  }

  const recursos = await sql`
    SELECT id, tipo, descricao, quantidade_arrecadada, unidade, arrecadado_por, arrecadado_em
    FROM recurso WHERE campanha_id = ${id} AND ativo ORDER BY criado_em`;

  return json({
    emitidoEm: new Date().toISOString(),
    campanha: {
      id: c.id, nome: c.nome, objetivo: c.objetivo,
      periodoInicio: dataTexto(c.periodo_inicio), periodoFim: dataTexto(c.periodo_fim),
      meta: c.meta_valor === null ? null : Number(c.meta_valor),
      arrecadado: c.arrecadado_valor === null ? null : Number(c.arrecadado_valor),
      arrecadadoEm: c.arrecadado_em,
      criadoPor: c.criado_por, criadoEm: c.criado_em,
      encerradoPor: c.encerrado_por, encerradoEm: c.encerrado_em,
      origem: c.solicitacao_origem_id ? {
        protocolo: c.protocolo,
        proponente: c.solicitacao_anonimizada ? 'Proponente anonimizado' : c.nome_contato,
      } : null,
    },
    recursos: recursos.map((r) => ({
      tipo: r.tipo, descricao: r.descricao,
      quantidade: r.quantidade_arrecadada === null ? null : Number(r.quantidade_arrecadada),
      unidade: r.unidade, arrecadadoPor: r.arrecadado_por, arrecadadoEm: r.arrecadado_em,
    })),
  });
});
