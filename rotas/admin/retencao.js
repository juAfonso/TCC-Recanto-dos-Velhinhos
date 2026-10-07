// GET /api/admin/retencao — registros cujo prazo de retenção venceu (FR-056, data-model "Retenção").
// Calculado na consulta, sem cron, com `retencao_meses` da configuração. A equipe decide e
// anonimiza um por um (POST /api/admin/anonimizacoes). Doador associado inativo NUNCA entra.

import { registrosVencidos } from '../_lib/retencao.js';
import { exigirAdmin } from '../_lib/acesso.js';
import { json, rota } from '../_lib/http.js';

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const { meses, itens } = await registrosVencidos();

  return json({
    meses,
    itens: itens.map((i) => ({
      alvo: i.alvo, id: i.id, protocolo: i.protocolo, nome: i.nome, status: i.status,
      descricao: i.descricao, desde: i.base,
    })),
  });
});
