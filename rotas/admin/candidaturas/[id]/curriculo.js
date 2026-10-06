// GET /api/admin/candidaturas/:id/curriculo — abre o currículo em arquivo (research D3, revisto).
// O arquivo é PRIVADO: a função confere o login e entrega o conteúdo; nenhum link circula.

import { sql } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { registrarAuditoria } from '../../../_lib/auditoria.js';
import { respostaArquivoPrivado } from '../../../_lib/blob.js';
import { falhar, idDaRota, rota } from '../../../_lib/http.js';

export const GET = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const [c] = await sql`SELECT curriculo_arquivo_id FROM candidatura WHERE id = ${id}`;
  if (!c?.curriculo_arquivo_id) falhar(404, 'NAO_ENCONTRADO', 'Esta candidatura não tem currículo em arquivo.');
  const resposta = await respostaArquivoPrivado(c.curriculo_arquivo_id);
  if (!resposta) falhar(404, 'NAO_ENCONTRADO', 'O arquivo do currículo não está mais disponível.');
  await registrarAuditoria({
    autorTipo: 'conta_institucional', autorId: conta.id,
    acao: 'candidatura.abrir_curriculo', entidadeTipo: 'candidatura', entidadeId: id,
  });
  return resposta;
});
