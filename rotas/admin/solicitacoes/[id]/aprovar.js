// POST /api/admin/solicitacoes/:id/aprovar { confirmarAviso? } — em análise → aguardando contato.
// NADA é publicado: o solicitante só é avisado de que a equipe vai procurá-lo (FR-022, 2026-10-03).
// Evento numa data com outro evento ativo → 409 CONFLITO_DE_DATA; segue com `confirmarAviso` (FR-030).

import { exigirAdmin } from '../../../_lib/acesso.js';
import { decidir } from '../../../_lib/triagem.js';
import { conferirConflito } from '../../../_lib/eventos-campanhas.js';
import { json, lerJson, idDaRota, rota } from '../../../_lib/http.js';

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const { confirmarAviso } = await lerJson(request);
  return json(await decidir({
    tabela: 'solicitacao_externa', id, para: 'aguardando_contato', conta,
    efeito: async (tx) => {
      const [s] = await tx.query(
        `SELECT tipo, to_char(data_pretendida, 'YYYY-MM-DD') AS data FROM solicitacao_externa WHERE id = $1`, [id]);
      if (s.tipo === 'evento' && s.data) await conferirConflito(tx, s.data, { confirmarAviso: confirmarAviso === true });
    },
  }));
});
