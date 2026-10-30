// POST /api/admin/solicitacoes/:id/confirmar — aguardando contato → confirmada (FR-022, FR-031).
// Recebe os dados COMBINADOS com o solicitante (podem diferir do pedido) e cria, na mesma
// transação, o evento ou a campanha do tipo da solicitação, já publicado no Portal.
// Evento: { nome, descricao, data, recursos?, confirmarAviso? }.
// Campanha: { nome, descricao, periodoInicio, periodoFim, recursos[], meta? }.

import { sql } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { decidir } from '../../../_lib/triagem.js';
import { validarEvento, validarCampanha, criarEvento, criarCampanha } from '../../../_lib/eventos-campanhas.js';
import { json, lerJson, falhar, idDaRota, rota } from '../../../_lib/http.js';

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const corpo = await lerJson(request);

  const [s] = await sql`SELECT tipo FROM solicitacao_externa WHERE id = ${id}`;
  if (!s) falhar(404, 'NAO_ENCONTRADO', 'Solicitação não encontrada.');
  // Valida antes de abrir a transação, para o funcionário ver todos os erros do formulário de uma vez.
  const dados = s.tipo === 'evento' ? validarEvento(corpo) : validarCampanha(corpo);

  let criadoId = null;
  const resultado = await decidir({
    tabela: 'solicitacao_externa', id, para: 'confirmada', conta,
    // O vínculo fica só no evento/campanha criado (`solicitacao_origem_id`, migração 008).
    efeito: async (tx) => {
      criadoId = s.tipo === 'evento'
        ? await criarEvento(tx, dados, { conta, origemId: id, confirmarAviso: corpo.confirmarAviso === true })
        : await criarCampanha(tx, dados, { conta, origemId: id });
    },
  });
  return json({ ...resultado, tipo: s.tipo, criadoId });
});
