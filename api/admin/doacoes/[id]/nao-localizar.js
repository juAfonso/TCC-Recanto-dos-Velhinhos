// POST /api/admin/doacoes/:id/nao-localizar { motivo?, motivoPadrao? } (FR-008, FR-008a).
// O motivo é opcional. `motivoPadrao: true` grava o texto exato do FR-008a, para quando a
// entrada no extrato é depósito ou transferência que não é Pix.
// Não existe rota que edite valor, tipo, data ou doador de uma declaração (FR-037, 2026-10-06):
// declaração errada é marcada aqui como não localizada.

import { sql } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { registrarAuditoria } from '../../../_lib/auditoria.js';
import { json, lerJson, falhar, idDaRota, rota } from '../../../_lib/http.js';

export const MOTIVO_PADRAO =
  'Pagamento recebido por depósito ou transferência, fora do Pix. Registrado pela secretaria da instituição, fora deste sistema.';

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const corpo = await lerJson(request);

  const livre = typeof corpo.motivo === 'string' ? corpo.motivo.trim().slice(0, 500) : '';
  const motivo = corpo.motivoPadrao === true ? MOTIVO_PADRAO : livre || null;

  const [doacao] = await sql`
    UPDATE doacao
    SET status = 'nao_localizada', motivo_nao_localizada = ${motivo},
        conferido_por = ${conta.identificador}, conferido_em = now()
    WHERE id = ${id} AND status = 'pendente'
    RETURNING id, status, conferido_em`;

  if (!doacao) {
    const [existe] = await sql`SELECT status FROM doacao WHERE id = ${id}`;
    if (!existe) falhar(404, 'NAO_ENCONTRADO', 'Doação não encontrada.');
    falhar(409, 'DOACAO_JA_CONFERIDA', 'Esta doação já foi conferida antes. Recarregue a página para ver a situação atual.');
  }

  // O texto do motivo não vai para a auditoria (pode conter nome de quem pagou).
  await registrarAuditoria({
    autorTipo: 'conta_institucional', autorId: conta.id,
    acao: 'doacao.nao_localizar', entidadeTipo: 'doacao', entidadeId: id,
    detalhe: { motivoPadrao: corpo.motivoPadrao === true, comMotivo: Boolean(motivo) },
  });
  return json({ id: doacao.id, status: doacao.status, conferidoEm: doacao.conferido_em });
});
