// PUT /api/admin/institucional/imagens/:id — { alt }: corrige o texto alternativo (Princípio II).
// O texto anterior vai para o histórico.

import { transacao } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { registrarAuditoria } from '../../../_lib/auditoria.js';
import { registrarAlteracao } from '../../../_lib/historico.js';
import { validarAlt } from '../../../_lib/conteudo.js';
import { json, lerJson, falhar, idDaRota, rota } from '../../../_lib/http.js';

export const PUT = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const alt = validarAlt((await lerJson(request)).alt, 'alt');

  await transacao(async (tx) => {
    const [atual] = await tx.query(
      'SELECT texto_alternativo FROM conteudo_institucional_imagem WHERE id = $1 AND ativo FOR UPDATE', [id]);
    if (!atual) falhar(404, 'NAO_ENCONTRADO', 'Imagem não encontrada. Recarregue a página.');
    await registrarAlteracao({
      entidadeTipo: 'conteudo_institucional_imagem', entidadeId: id, estadoAnterior: atual, autor: conta.identificador,
    }, tx);
    await tx.query('UPDATE conteudo_institucional_imagem SET texto_alternativo = $2 WHERE id = $1', [id, alt]);
    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id, acao: 'institucional.imagem_alt',
      entidadeTipo: 'conteudo_institucional_imagem', entidadeId: id,
    }, tx);
  });
  return json({ ok: true });
});
