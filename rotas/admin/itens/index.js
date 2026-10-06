// GET /api/admin/itens?busca= · POST /api/admin/itens (FR-026, FR-028).
// `semAtualizacao`: item ativo cuja quantidade não muda há `item_sem_atualizacao_dias`
// (configuração editável, 30 por padrão — nunca constante no código).

import { sql } from '../../_lib/db.js';
import { exigirAdmin } from '../../_lib/acesso.js';
import { registrarAuditoria } from '../../_lib/auditoria.js';
import { json, lerJson, rota } from '../../_lib/http.js';
import { validarItem } from '../../_lib/itens.js';

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const busca = (new URL(request.url).searchParams.get('busca') || '').trim().slice(0, 100);
  const [{ valor: dias }] = await sql`SELECT valor FROM configuracao WHERE chave = 'item_sem_atualizacao_dias'`;

  const itens = await sql`
    SELECT id, nome, quantidade, unidade, prioridade, status, quantidade_atualizada_em,
           atualizado_por, atualizado_em, baixa_por, baixa_em,
           (status = 'ativo' AND quantidade_atualizada_em < now() - make_interval(days => ${Number(dias)})) AS sem_atualizacao
    FROM item_necessario
    WHERE ${busca} = '' OR nome ILIKE ${'%' + busca.replace(/[%_\\]/g, '\\$&') + '%'}
    ORDER BY (status = 'ativo') DESC,
             CASE prioridade WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END,
             nome
    LIMIT 500`;

  return json({
    diasSemAtualizacao: Number(dias),
    itens: itens.map((i) => ({
      id: i.id,
      nome: i.nome,
      quantidade: Number(i.quantidade),
      unidade: i.unidade,
      prioridade: i.prioridade,
      status: i.status,
      quantidadeAtualizadaEm: i.quantidade_atualizada_em,
      semAtualizacao: i.sem_atualizacao,
      atualizadoPor: i.atualizado_por,
      atualizadoEm: i.atualizado_em,
      baixaPor: i.baixa_por,
      baixaEm: i.baixa_em,
    })),
  });
});

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const item = validarItem(await lerJson(request));
  const [novo] = await sql`
    INSERT INTO item_necessario (nome, quantidade, unidade, prioridade, criado_por)
    VALUES (${item.nome}, ${item.quantidade}, ${item.unidade}, ${item.prioridade}, ${conta.identificador})
    RETURNING id`;
  await registrarAuditoria({
    autorTipo: 'conta_institucional', autorId: conta.id,
    acao: 'item.criar', entidadeTipo: 'item_necessario', entidadeId: novo.id,
    detalhe: { prioridade: item.prioridade },
  });
  return json({ id: novo.id }, 201);
});

