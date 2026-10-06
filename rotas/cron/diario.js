// GET /api/cron/diario — tarefa agendada da Vercel, 01:00 de Brasília (vercel.json, research D12).
// 1. Encerra eventos com data passada e campanhas com período terminado, autor `sistema` (FR-029c).
//    O Portal já esconde o que venceu pela data; aqui o status do banco é acertado.
// 2. Apaga janelas expiradas de `limite_tentativa` — a ÚNICA remoção física do sistema: são
//    contadores técnicos, sem dado pessoal nem de negócio (research D13).
// Idempotente: rodar de novo não muda nada. Sem o CRON_SECRET certo → 401.

import { timingSafeEqual } from 'node:crypto';
import { transacao } from '../_lib/db.js';
import { registrarAuditoria } from '../_lib/auditoria.js';
import { hojeBrasilia } from '../_lib/datas.js';
import { json, falhar, rota } from '../_lib/http.js';

function autorizado(request) {
  const segredo = process.env.CRON_SECRET;
  const recebido = request.headers.get('authorization') ?? '';
  if (!segredo) return false;
  const esperado = Buffer.from(`Bearer ${segredo}`);
  const veio = Buffer.from(recebido);
  return esperado.length === veio.length && timingSafeEqual(esperado, veio);
}

export const GET = rota(async (request) => {
  if (!autorizado(request)) falhar(401, 'NAO_AUTORIZADO', 'Acesso restrito à tarefa agendada.');
  const hoje = hojeBrasilia();

  const resultado = await transacao(async (tx) => {
    const eventos = await tx.query(
      `UPDATE evento SET status = 'encerrado', encerrado_por = 'sistema', encerrado_em = now()
       WHERE status = 'ativo' AND data < $1::date RETURNING id`, [hoje]);
    const campanhas = await tx.query(
      `UPDATE campanha SET status = 'encerrado', encerrado_por = 'sistema', encerrado_em = now()
       WHERE status = 'ativo' AND periodo_fim < $1::date RETURNING id`, [hoje]);

    for (const { id } of eventos) {
      await registrarAuditoria({ autorTipo: 'sistema', acao: 'evento.encerrar_auto', entidadeTipo: 'evento', entidadeId: id }, tx);
    }
    for (const { id } of campanhas) {
      await registrarAuditoria({ autorTipo: 'sistema', acao: 'campanha.encerrar_auto', entidadeTipo: 'campanha', entidadeId: id }, tx);
    }

    // Maior janela de limite é de 60 min; um dia de folga basta.
    const limpas = await tx.query(
      `DELETE FROM limite_tentativa WHERE janela_inicio < now() - interval '1 day' RETURNING chave`);

    return { eventosEncerrados: eventos.length, campanhasEncerradas: campanhas.length, limitesLimpos: limpas.length };
  });

  return json({ hoje, ...resultado });
});
