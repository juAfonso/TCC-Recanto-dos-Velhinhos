// POST /api/admin/solicitacoes/:id/rejeitar { motivo? } — de em análise ou aguardando contato;
// motivo OPCIONAL (2026-10-03, FR-022).

import { exigirAdmin } from '../../../_lib/acesso.js';
import { decidir } from '../../../_lib/triagem.js';
import { json, lerJson, idDaRota, rota } from '../../../_lib/http.js';

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const { motivo } = await lerJson(request);
  return json(await decidir({
    tabela: 'solicitacao_externa', id: idDaRota(request), para: 'rejeitada',
    motivo: typeof motivo === 'string' ? motivo.slice(0, 1000) : null, conta,
  }));
});
