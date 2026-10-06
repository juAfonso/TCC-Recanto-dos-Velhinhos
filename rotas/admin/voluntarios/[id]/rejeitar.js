// POST /api/admin/voluntarios/:id/rejeitar { motivo? } — motivo OPCIONAL (2026-10-03).
// Sem motivo, o e-mail diz só "não aprovado" (FR-049b). O cadastro fica no histórico (FR-015).

import { exigirAdmin } from '../../../_lib/acesso.js';
import { decidir } from '../../../_lib/triagem.js';
import { json, lerJson, idDaRota, rota } from '../../../_lib/http.js';

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const { motivo } = await lerJson(request);
  const resultado = await decidir({
    tabela: 'cadastro_voluntario', id: idDaRota(request), para: 'rejeitado',
    motivo: typeof motivo === 'string' ? motivo.slice(0, 1000) : null, conta,
  });
  return json(resultado);
});
