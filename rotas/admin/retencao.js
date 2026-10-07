// GET /api/admin/retencao — registros cujo prazo de retenção venceu (FR-056, data-model "Retenção").
// Calculado na consulta, sem cron, com `retencao_meses` da configuração. A equipe decide e
// anonimiza um por um (POST /api/admin/anonimizacoes). Doador associado inativo NUNCA entra.

import { sql } from '../_lib/db.js';
import { exigirAdmin } from '../_lib/acesso.js';
import { json, rota } from '../_lib/http.js';

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const [config] = await sql`SELECT valor FROM configuracao WHERE chave = 'retencao_meses'`;
  const meses = Math.max(0, parseInt(config?.valor ?? '6', 10) || 0);

  const itens = await sql`
    SELECT 'cadastro_voluntario' AS alvo, id, protocolo, nome, status, concluido_em AS base,
           'Cadastro de voluntário não aprovado' AS descricao
    FROM cadastro_voluntario
    WHERE anonimizado_em IS NULL AND status IN ('rejeitado', 'encerrado_titular')
      AND concluido_em + make_interval(months => ${meses}) <= now()
    UNION ALL
    SELECT 'candidatura', id, protocolo, nome, status, concluido_em, 'Candidatura não aprovada'
    FROM candidatura
    WHERE anonimizado_em IS NULL AND status IN ('rejeitada', 'encerrada_titular')
      AND concluido_em + make_interval(months => ${meses}) <= now()
    UNION ALL
    SELECT 'curriculo', id, protocolo, nome, status, efetivado_em, 'Currículo de quem foi contratado'
    FROM candidatura
    WHERE anonimizado_em IS NULL AND status = 'aprovada' AND curriculo_anonimizado_em IS NULL
      AND efetivado_em + make_interval(months => ${meses}) <= now()
    UNION ALL
    SELECT 'solicitacao', id, protocolo, nome_contato, status, concluido_em, 'Proposta externa não realizada'
    FROM solicitacao_externa
    WHERE anonimizado_em IS NULL AND status IN ('rejeitada', 'encerrada_titular')
      AND concluido_em + make_interval(months => ${meses}) <= now()
    ORDER BY base`;

  return json({
    meses,
    itens: itens.map((i) => ({
      alvo: i.alvo, id: i.id, protocolo: i.protocolo, nome: i.nome, status: i.status,
      descricao: i.descricao, desde: i.base,
    })),
  });
});
