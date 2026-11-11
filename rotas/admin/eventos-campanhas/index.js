// GET/POST /api/admin/eventos-campanhas (FR-029, FR-029b, FR-030, FR-031).
// POST com `tipo`: evento ou campanha. Publicar no Portal é automático: nasce `ativo`.
// Evento em data de outro evento ativo → 409 CONFLITO_DE_DATA; grava só com `confirmarAviso: true`.

import { sql, transacao } from '../../_lib/db.js';
import { exigirAdmin } from '../../_lib/acesso.js';
import { hojeBrasilia } from '../../_lib/datas.js';
import { validarEvento, validarCampanha, criarEvento, criarCampanha } from '../../_lib/eventos-campanhas.js';
import { json, lerJson, falhar, rota } from '../../_lib/http.js';

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const hoje = hojeBrasilia();

  // As duas listas não dependem uma da outra: buscar juntas poupa uma ida ao banco.
  const [eventos, campanhas] = await Promise.all([
    sql`
    SELECT e.id, e.nome, e.objetivo, e.recursos_necessarios, to_char(e.data, 'YYYY-MM-DD') AS data, e.status,
           e.solicitacao_origem_id IS NOT NULL AS externa, s.protocolo AS protocolo_origem, e.criado_por, e.criado_em,
           e.atualizado_por, e.atualizado_em, e.encerrado_por, e.encerrado_em
    FROM evento e LEFT JOIN solicitacao_externa s ON s.id = e.solicitacao_origem_id
    ORDER BY (e.status = 'ativo') DESC, e.data`,
    sql`
    SELECT c.id, c.nome, c.objetivo, to_char(c.periodo_inicio, 'YYYY-MM-DD') AS periodo_inicio,
           to_char(c.periodo_fim, 'YYYY-MM-DD') AS periodo_fim, c.meta_valor, c.arrecadado_valor,
           c.arrecadado_por, c.arrecadado_em, c.status, c.solicitacao_origem_id IS NOT NULL AS externa,
           c.criado_por, c.criado_em, c.atualizado_por, c.atualizado_em, c.encerrado_por, c.encerrado_em,
           COALESCE(json_agg(json_build_object('id', r.id, 'tipo', r.tipo, 'descricao', r.descricao,
                      'quantidade', r.quantidade_arrecadada, 'unidade', r.unidade,
                      'arrecadadoPor', r.arrecadado_por, 'arrecadadoEm', r.arrecadado_em) ORDER BY r.criado_em)
                    FILTER (WHERE r.id IS NOT NULL), '[]') AS recursos,
           (SELECT protocolo FROM solicitacao_externa s WHERE s.id = c.solicitacao_origem_id) AS protocolo_origem
    FROM campanha c LEFT JOIN recurso r ON r.campanha_id = c.id AND r.ativo
    GROUP BY c.id ORDER BY (c.status = 'ativo') DESC, c.periodo_fim`,
  ]);

  const comum = (x) => ({
    id: x.id, nome: x.nome, objetivo: x.objetivo, status: x.status, externa: x.externa, protocoloOrigem: x.protocolo_origem,
    criadoPor: x.criado_por, criadoEm: x.criado_em, atualizadoPor: x.atualizado_por, atualizadoEm: x.atualizado_em,
    encerradoPor: x.encerrado_por, encerradoEm: x.encerrado_em,
  });
  return json({
    hoje,
    itens: [
      ...eventos.map((e) => ({
        ...comum(e), tipo: 'evento', data: e.data, recursos: e.recursos_necessarios ?? '',
        // Venceu, mas o cron diário ainda não registrou o encerramento (o Portal já esconde).
        vencido: e.status === 'ativo' && e.data < hoje,
      })),
      ...campanhas.map((c) => ({
        ...comum(c), tipo: 'campanha', periodoInicio: c.periodo_inicio, periodoFim: c.periodo_fim,
        meta: c.meta_valor === null ? null : Number(c.meta_valor),
        arrecadado: c.arrecadado_valor === null ? null : Number(c.arrecadado_valor),
        arrecadadoPor: c.arrecadado_por, arrecadadoEm: c.arrecadado_em,
        recursos: c.recursos.map((r) => ({ ...r, quantidade: r.quantidade === null ? null : Number(r.quantidade) })),
        vencido: c.status === 'ativo' && c.periodo_fim < hoje,
      })),
    ],
  });
});

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const corpo = await lerJson(request);

  if (corpo.tipo === 'evento') {
    const evento = validarEvento(corpo);
    const id = await transacao((tx) => criarEvento(tx, evento, { conta, confirmarAviso: corpo.confirmarAviso === true }));
    return json({ id, tipo: 'evento' }, 201);
  }

  if (corpo.tipo === 'campanha') {
    const campanha = validarCampanha(corpo);
    const id = await transacao((tx) => criarCampanha(tx, campanha, { conta }));
    return json({ id, tipo: 'campanha' }, 201);
  }

  falhar(400, 'TIPO_INVALIDO', 'Escolha se é um evento ou uma campanha.', ['tipo']);
});
