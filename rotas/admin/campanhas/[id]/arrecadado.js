// PUT /api/admin/campanhas/:id/arrecadado { valor?, recursos?: [{ id, quantidade, unidade }] }
// O que a campanha arrecadou, informado à mão pela equipe (FR-029b): doação Pix não é ligada a
// campanha, então o sistema não calcula nada sozinho (2026-10-04).
// - `valor`: total em R$ da barra do Portal; só para campanha COM meta.
// - `recursos`: quanto veio de cada recurso — item com unidade, dinheiro em R$ (2026-11-11).
// Vale também para campanha ENCERRADA: a contagem final costuma sair depois do fim, e é ela
// que vai para o relatório da campanha (decisão de 2026-11-11). O antes fica no histórico.

import { transacao } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { registrarAuditoria } from '../../../_lib/auditoria.js';
import { registrarAlteracao } from '../../../_lib/historico.js';
import { valorMonetario } from '../../../_lib/validacao.js';
import { validarArrecadacaoRecursos } from '../../../_lib/eventos-campanhas.js';
import { json, lerJson, falhar, idDaRota, rota } from '../../../_lib/http.js';

export const PUT = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const corpo = await lerJson(request);
  const temValor = corpo.valor !== undefined;
  const bruto = String(corpo.valor ?? '').trim().replace(',', '.');

  await transacao(async (tx) => {
    const [c] = await tx.query(
      `SELECT meta_valor, arrecadado_valor, status FROM campanha WHERE id = $1 FOR UPDATE`, [id]);
    if (!c) falhar(404, 'NAO_ENCONTRADO', 'Campanha não encontrada.');
    if (temValor && c.meta_valor === null) {
      falhar(422, 'CAMPANHA_SEM_META', 'Esta campanha não tem meta em dinheiro, então não mostra valor arrecadado. Edite a campanha para definir uma meta, se quiser.');
    }
    if (temValor) {
      const erro = valorMonetario(bruto, 0);
      if (erro) falhar(400, 'VALOR_INVALIDO', erro, ['valor']);
    }

    const recursosAntes = await tx.query(
      `SELECT id, tipo, descricao, quantidade_arrecadada, unidade FROM recurso WHERE campanha_id = $1 AND ativo`, [id]);
    const recursos = corpo.recursos === undefined ? [] : validarArrecadacaoRecursos(corpo.recursos, recursosAntes);

    await registrarAlteracao({
      entidadeTipo: 'campanha', entidadeId: id, autor: conta.identificador,
      estadoAnterior: {
        arrecadado_valor: c.arrecadado_valor,
        recursos: recursosAntes.map((r) => ({ id: r.id, quantidade_arrecadada: r.quantidade_arrecadada, unidade: r.unidade })),
      },
    }, tx);

    if (temValor) {
      await tx.query(
        `UPDATE campanha SET arrecadado_valor = $2, arrecadado_por = $3, arrecadado_em = now() WHERE id = $1`,
        [id, Number(bruto), conta.identificador]);
    }
    for (const r of recursos) {
      const antes = recursosAntes.find((a) => a.id === r.id);
      const mudou = (antes.quantidade_arrecadada === null ? null : Number(antes.quantidade_arrecadada)) !== r.quantidade
        || (antes.unidade ?? null) !== r.unidade;
      if (!mudou) continue;
      await tx.query(
        `UPDATE recurso SET quantidade_arrecadada = $2, unidade = $3, arrecadado_por = $4, arrecadado_em = now() WHERE id = $1`,
        [r.id, r.quantidade, r.unidade, conta.identificador]);
    }

    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id,
      acao: 'campanha.arrecadado', entidadeTipo: 'campanha', entidadeId: id,
      detalhe: { valor: temValor, recursos: recursos.length, encerrada: c.status !== 'ativo' },
    }, tx);
  });
  return json({ ok: true });
});
