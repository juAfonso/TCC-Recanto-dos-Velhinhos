// PUT /api/admin/eventos-campanhas/:id — editar evento ou campanha ativos (FR-029, FR-030, FR-037).
// Mesmas validações do cadastro; a data já gravada pode ficar no passado se não mudar.
// Na campanha, recurso que saiu da lista é DESATIVADO (nunca apagado) e os novos são criados.
// Encerrado não se edita.

import { transacao } from '../../_lib/db.js';
import { exigirAdmin } from '../../_lib/acesso.js';
import { registrarAuditoria } from '../../_lib/auditoria.js';
import { registrarAlteracao } from '../../_lib/historico.js';
import { validarEvento, validarCampanha, conferirConflito, carregar, dataTexto } from '../../_lib/eventos-campanhas.js';
import { json, lerJson, falhar, idDaRota, rota } from '../../_lib/http.js';

export const PUT = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const corpo = await lerJson(request);
  const autor = conta.identificador;

  await transacao(async (tx) => {
    const { tabela, registro } = await carregar(tx, id, { travar: true });
    if (registro.status !== 'ativo') {
      falhar(409, 'JA_ENCERRADO', 'Este evento ou campanha já foi encerrado e faz parte do histórico.');
    }

    if (tabela === 'evento') {
      const evento = validarEvento(corpo, { dataAnterior: dataTexto(registro.data) });
      if (evento.data !== dataTexto(registro.data)) {
        await conferirConflito(tx, evento.data, { excetoId: id, confirmarAviso: corpo.confirmarAviso === true });
      }
      await registrarAlteracao({ entidadeTipo: 'evento', entidadeId: id, estadoAnterior: registro, autor }, tx);
      await tx.query(
        `UPDATE evento SET nome = $2, descricao = $3, recursos_necessarios = $4, data = $5,
                atualizado_por = $6, atualizado_em = now() WHERE id = $1`,
        [id, evento.nome, evento.descricao, evento.recursos || null, evento.data, autor]);
    } else {
      const campanha = validarCampanha(corpo, { inicioAnterior: dataTexto(registro.periodo_inicio) });
      // Sem meta não há arrecadado (FR-029b): o UPDATE abaixo zera; o valor antigo fica no histórico.
      const recursosAntes = await tx.query(
        `SELECT id, tipo, descricao FROM recurso WHERE campanha_id = $1 AND ativo`, [id]);
      await registrarAlteracao({
        entidadeTipo: 'campanha', entidadeId: id, estadoAnterior: { ...registro, recursos: recursosAntes }, autor,
      }, tx);
      await tx.query(
        `UPDATE campanha SET nome = $2, descricao = $3, periodo_inicio = $4, periodo_fim = $5, meta_valor = $6,
                arrecadado_valor = CASE WHEN $6::numeric IS NULL THEN NULL ELSE arrecadado_valor END,
                atualizado_por = $7, atualizado_em = now() WHERE id = $1`,
        [id, campanha.nome, campanha.descricao, campanha.periodoInicio, campanha.periodoFim, campanha.meta, autor]);

      // Mantém os recursos que vieram com id e não mudaram; desativa os que saíram ou mudaram.
      const mantidos = new Set();
      for (const r of campanha.recursos) {
        const igual = r.id && recursosAntes.find((a) => a.id === r.id && a.tipo === r.tipo && a.descricao === r.descricao);
        if (igual) { mantidos.add(r.id); continue; }
        await tx.query(`INSERT INTO recurso (campanha_id, tipo, descricao, criado_por) VALUES ($1, $2, $3, $4)`,
          [id, r.tipo, r.descricao, autor]);
      }
      for (const a of recursosAntes) {
        if (!mantidos.has(a.id)) {
          await tx.query(`UPDATE recurso SET ativo = false, desativado_por = $2, desativado_em = now() WHERE id = $1`, [a.id, autor]);
        }
      }
    }

    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id,
      acao: `${tabela}.editar`, entidadeTipo: tabela, entidadeId: id,
    }, tx);
  });
  return json({ ok: true });
});
