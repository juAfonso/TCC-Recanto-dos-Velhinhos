// PUT /api/admin/itens/:id — editar item necessário (FR-026, FR-028).
// Mudar a quantidade renova `quantidade_atualizada_em` (base do alerta de 30 dias).
// O estado anterior vai para o histórico (FR-037). Item com baixa não se edita.

import { transacao } from '../../_lib/db.js';
import { exigirAdmin } from '../../_lib/acesso.js';
import { registrarAuditoria } from '../../_lib/auditoria.js';
import { registrarAlteracao } from '../../_lib/historico.js';
import { validarItem } from '../../_lib/itens.js';
import { json, lerJson, falhar, idDaRota, rota } from '../../_lib/http.js';

export const PUT = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const item = validarItem(await lerJson(request));

  await transacao(async (tx) => {
    const [atual] = await tx.query(
      `SELECT nome, quantidade, unidade, prioridade, status FROM item_necessario WHERE id = $1 FOR UPDATE`, [id]);
    if (!atual) falhar(404, 'NAO_ENCONTRADO', 'Item não encontrado.');
    if (atual.status !== 'ativo') falhar(409, 'ITEM_SUPRIDO', 'Este item já teve baixa e faz parte do histórico. Cadastre um item novo, se precisar.');

    const quantidadeMudou = Number(atual.quantidade) !== item.quantidade;
    await registrarAlteracao({ entidadeTipo: 'item_necessario', entidadeId: id, estadoAnterior: atual, autor: conta.identificador }, tx);
    await tx.query(
      `UPDATE item_necessario
       SET nome = $2, quantidade = $3, unidade = $4, prioridade = $5,
           quantidade_atualizada_em = CASE WHEN $6 THEN now() ELSE quantidade_atualizada_em END,
           atualizado_por = $7, atualizado_em = now()
       WHERE id = $1`,
      [id, item.nome, item.quantidade, item.unidade, item.prioridade, quantidadeMudou, conta.identificador]);
    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id,
      acao: 'item.editar', entidadeTipo: 'item_necessario', entidadeId: id,
      detalhe: { quantidadeMudou, prioridade: item.prioridade },
    }, tx);
  });
  return json({ ok: true });
});
