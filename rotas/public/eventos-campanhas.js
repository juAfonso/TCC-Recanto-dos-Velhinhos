// GET /api/public/eventos-campanhas → eventos e campanhas vigentes (FR-002, FR-029b, research D12).
// Filtra pela data no fuso de Brasília, além do status: o que venceu some do Portal mesmo
// antes de o cron diário registrar o encerramento.

import { sql } from '../_lib/db.js';
import { hojeBrasilia } from '../_lib/datas.js';
import { json, rota } from '../_lib/http.js';

export const GET = rota(async () => {
  const hoje = hojeBrasilia();

  const eventos = await sql`
    SELECT id, nome, descricao, recursos_necessarios, to_char(data, 'YYYY-MM-DD') AS data
    FROM evento
    WHERE status = 'ativo' AND data >= ${hoje}::date
    ORDER BY data, nome`;

  const campanhas = await sql`
    SELECT c.id, c.nome, c.descricao,
           to_char(c.periodo_inicio, 'YYYY-MM-DD') AS periodo_inicio,
           to_char(c.periodo_fim, 'YYYY-MM-DD') AS periodo_fim,
           c.meta_valor, c.arrecadado_valor,
           COALESCE(json_agg(json_build_object('tipo', r.tipo, 'descricao', r.descricao) ORDER BY r.criado_em)
                    FILTER (WHERE r.id IS NOT NULL), '[]') AS recursos
    FROM campanha c
    LEFT JOIN recurso r ON r.campanha_id = c.id AND r.ativo
    WHERE c.status = 'ativo' AND c.periodo_inicio <= ${hoje}::date AND c.periodo_fim >= ${hoje}::date
    GROUP BY c.id
    ORDER BY c.periodo_fim, c.nome`;

  return json({
    eventos: eventos.map((e) => ({
      tipo: 'evento',
      id: e.id,
      nome: e.nome,
      descricao: e.descricao,
      data: e.data,
      recursos: e.recursos_necessarios ?? '',
    })),
    campanhas: campanhas.map((c) => {
      const campanha = {
        tipo: 'campanha',
        id: c.id,
        nome: c.nome,
        descricao: c.descricao,
        periodoInicio: c.periodo_inicio,
        periodoFim: c.periodo_fim,
        recursos: c.recursos,
      };
      // Sem meta, não há barra nem valor arrecadado no Portal (FR-029b).
      if (c.meta_valor !== null) {
        campanha.meta = Number(c.meta_valor);
        campanha.arrecadado = Number(c.arrecadado_valor ?? 0);
      }
      return campanha;
    }),
  });
});
