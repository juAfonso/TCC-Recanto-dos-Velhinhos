// POST /api/admin/pix/desativar — tira a chave Pix do site (FR-007a). Sem chave ativa, o Portal
// não oferece a doação e mostra o contato da instituição. Uso: chave trocada no banco, conta
// encerrada, suspeita de fraude. Nada é apagado: a linha fica como histórico, e para voltar basta
// salvar a chave de novo na mesma tela.

import { sql } from '../../_lib/db.js';
import { exigirAdmin } from '../../_lib/acesso.js';
import { registrarAuditoria } from '../../_lib/auditoria.js';
import { json, falhar, rota } from '../../_lib/http.js';

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const desativadas = await sql`
    UPDATE chave_pix_institucional SET ativa = false, atualizado_por = ${conta.identificador}, atualizado_em = now()
    WHERE ativa RETURNING id`;
  if (!desativadas.length) falhar(409, 'SEM_CHAVE_ATIVA', 'Não há chave ativa: a doação pelo site já está desligada.');
  await registrarAuditoria({
    autorTipo: 'conta_institucional', autorId: conta.id, acao: 'pix.desativar', entidadeTipo: 'chave_pix_institucional',
  });
  return json({ ok: true });
});
