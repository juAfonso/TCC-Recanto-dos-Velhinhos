// GET /api/admin/dashboard — visão consolidada do Painel (FR-036, FR-014, SC-007).
// Só contagens, calculadas na hora (sem cache): o que acabou de chegar já aparece.
// `semAlertas` = nenhuma pendência; a tela mostra "não há alertas" (cenário 8 da US7).

import { sql } from '../_lib/db.js';
import { exigirAdmin } from '../_lib/acesso.js';
import { registrosVencidos } from '../_lib/retencao.js';
import { json, rota } from '../_lib/http.js';

export const GET = rota(async (request) => {
  await exigirAdmin(request);

  const [[contagens], itensPrioritarios, retencao] = await Promise.all([
    sql`
      WITH config AS (
        SELECT COALESCE((SELECT valor::int FROM configuracao WHERE chave = 'item_sem_atualizacao_dias'), 30) AS dias
      )
      SELECT
        (SELECT count(*) FROM item_necessario WHERE status = 'ativo' AND prioridade = 'alta')::int AS itens_alta,
        (SELECT count(*) FROM item_necessario, config
          WHERE status = 'ativo' AND quantidade_atualizada_em < now() - make_interval(days => config.dias))::int AS itens_sem_atualizacao,
        (SELECT dias FROM config) AS dias_sem_atualizacao,
        (SELECT count(*) FROM cadastro_voluntario WHERE status IN ('pendente', 'entrevista') AND anonimizado_em IS NULL)::int AS voluntarios,
        (SELECT count(*) FROM candidatura WHERE status IN ('em_analise', 'entrevista') AND anonimizado_em IS NULL)::int AS candidaturas,
        (SELECT count(*) FROM solicitacao_externa WHERE status IN ('em_analise', 'aguardando_contato') AND anonimizado_em IS NULL)::int AS solicitacoes,
        (SELECT count(*) FROM doacao WHERE status = 'pendente')::int AS doacoes_pendentes,
        (SELECT count(*) FROM falha_email WHERE tratada_em IS NULL AND anonimizado_em IS NULL)::int AS falhas_email`,
    sql`
      SELECT id, nome, quantidade, unidade FROM item_necessario
      WHERE status = 'ativo' AND prioridade = 'alta' ORDER BY quantidade_atualizada_em LIMIT 10`,
    registrosVencidos(),
  ]);

  const c = contagens;
  const indicadores = {
    itensPrioridadeAlta: c.itens_alta,
    itensSemAtualizacao: c.itens_sem_atualizacao,
    diasSemAtualizacao: c.dias_sem_atualizacao,
    triagem: { voluntarios: c.voluntarios, candidaturas: c.candidaturas, solicitacoes: c.solicitacoes },
    doacoesPendentes: c.doacoes_pendentes,
    falhasEmail: c.falhas_email,
    retencaoVencida: retencao.itens.length,
  };
  const total = indicadores.itensPrioridadeAlta + indicadores.itensSemAtualizacao
    + c.voluntarios + c.candidaturas + c.solicitacoes
    + indicadores.doacoesPendentes + indicadores.falhasEmail + indicadores.retencaoVencida;

  return json({
    ...indicadores,
    itensPrioritarios: itensPrioritarios.map((i) => ({ id: i.id, nome: i.nome, quantidade: Number(i.quantidade), unidade: i.unidade })),
    semAlertas: total === 0,
  });
});
