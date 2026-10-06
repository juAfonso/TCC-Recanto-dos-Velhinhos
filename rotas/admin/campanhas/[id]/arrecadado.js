// PUT /api/admin/campanhas/:id/arrecadado { valor } — informado à mão pela equipe (FR-029b).
// Só para campanha ativa COM meta: doação Pix não é ligada a campanha, então o sistema não
// calcula esse número sozinho (2026-10-04).

import { transacao } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { registrarAuditoria } from '../../../_lib/auditoria.js';
import { registrarAlteracao } from '../../../_lib/historico.js';
import { valorMonetario } from '../../../_lib/validacao.js';
import { json, lerJson, falhar, idDaRota, rota } from '../../../_lib/http.js';

export const PUT = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const bruto = String((await lerJson(request)).valor ?? '').trim().replace(',', '.');
  const erro = valorMonetario(bruto, 0);
  if (erro) falhar(400, 'VALOR_INVALIDO', erro, ['valor']);

  await transacao(async (tx) => {
    const [c] = await tx.query(
      `SELECT meta_valor, arrecadado_valor, status FROM campanha WHERE id = $1 FOR UPDATE`, [id]);
    if (!c) falhar(404, 'NAO_ENCONTRADO', 'Campanha não encontrada.');
    if (c.status !== 'ativo') falhar(409, 'JA_ENCERRADO', 'Esta campanha já foi encerrada.');
    if (c.meta_valor === null) {
      falhar(422, 'CAMPANHA_SEM_META', 'Esta campanha não tem meta em dinheiro, então não mostra valor arrecadado. Edite a campanha para definir uma meta, se quiser.');
    }
    await registrarAlteracao({
      entidadeTipo: 'campanha', entidadeId: id, estadoAnterior: { arrecadado_valor: c.arrecadado_valor }, autor: conta.identificador,
    }, tx);
    await tx.query(
      `UPDATE campanha SET arrecadado_valor = $2, arrecadado_por = $3, arrecadado_em = now() WHERE id = $1`,
      [id, Number(bruto), conta.identificador]);
    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id,
      acao: 'campanha.arrecadado', entidadeTipo: 'campanha', entidadeId: id,
    }, tx);
  });
  return json({ ok: true });
});
