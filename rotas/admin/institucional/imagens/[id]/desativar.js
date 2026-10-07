// POST /api/admin/institucional/imagens/:id/desativar — tira a imagem da página (FR-001a).
// É desativar, nunca apagar: a linha e o arquivo ficam (Princípio III).

import { sql } from '../../../../_lib/db.js';
import { exigirAdmin } from '../../../../_lib/acesso.js';
import { registrarAuditoria } from '../../../../_lib/auditoria.js';
import { json, falhar, idDaRota, rota } from '../../../../_lib/http.js';

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const [linha] = await sql`
    UPDATE conteudo_institucional_imagem SET ativo = false, desativado_por = ${conta.identificador}, desativado_em = now()
    WHERE id = ${id} AND ativo RETURNING id`;
  if (!linha) falhar(409, 'JA_RETIRADA', 'Esta imagem já foi retirada ou não existe. Recarregue a página.');
  await registrarAuditoria({
    autorTipo: 'conta_institucional', autorId: conta.id, acao: 'institucional.imagem_retirar',
    entidadeTipo: 'conteudo_institucional_imagem', entidadeId: id,
  });
  return json({ ok: true });
});
