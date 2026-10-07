// POST /api/admin/institucional/imagens (multipart) — { imagem, imagemAlt } (FR-001a).
// Galeria opcional de até 6 imagens ativas (decisão de 2026-10-07), texto alternativo obrigatório,
// mesmo tamanho máximo das imagens de notícia (FR-032b). Entra no fim da galeria.

import { sql, transacao } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { registrarAuditoria } from '../../../_lib/auditoria.js';
import { validarArquivo, salvarArquivo, removerArquivo } from '../../../_lib/blob.js';
import { MAX_IMAGENS_INSTITUCIONAIS, validarAlt, campoTexto, campoArquivo } from '../../../_lib/conteudo.js';
import { json, lerFormulario, falhar, rota } from '../../../_lib/http.js';

const LIMITE = `A página já tem ${MAX_IMAGENS_INSTITUCIONAIS} imagens, o máximo. Retire uma antes de incluir outra.`;

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const form = await lerFormulario(request);
  const arquivo = campoArquivo(form, 'imagem');
  if (!arquivo) falhar(400, 'ARQUIVO_AUSENTE', 'Escolha uma imagem para enviar.', ['imagem']);
  const alt = validarAlt(campoTexto(form, 'imagemAlt'));
  validarArquivo(arquivo, { categoria: 'imagem_institucional', campo: 'imagem' });

  // Confere o limite antes de enviar ao Blob; a transação confere de novo.
  const [{ ativas }] = await sql`SELECT count(*)::int AS ativas FROM conteudo_institucional_imagem WHERE ativo`;
  if (ativas >= MAX_IMAGENS_INSTITUCIONAIS) falhar(409, 'LIMITE_DE_IMAGENS', LIMITE);

  const imagem = await salvarArquivo(arquivo, { categoria: 'imagem_institucional', enviadoPor: conta.identificador, campo: 'imagem' });

  const nova = await transacao(async (tx) => {
    // Trava a linha da página: dois envios ao mesmo tempo não passam juntos do limite.
    await tx.query('SELECT 1 FROM conteudo_institucional WHERE id = 1 FOR UPDATE');
    const [{ total, ordem }] = await tx.query(
      `SELECT count(*) FILTER (WHERE ativo)::int AS total, COALESCE(max(ordem), 0) + 1 AS ordem FROM conteudo_institucional_imagem`);
    if (total >= MAX_IMAGENS_INSTITUCIONAIS) falhar(409, 'LIMITE_DE_IMAGENS', LIMITE);
    const [linha] = await tx.query(
      `INSERT INTO conteudo_institucional_imagem (arquivo_id, texto_alternativo, ordem, criado_por)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [imagem.id, alt, ordem, conta.identificador]);
    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id, acao: 'institucional.imagem_incluir',
      entidadeTipo: 'conteudo_institucional_imagem', entidadeId: linha.id,
    }, tx);
    return linha;
  }).catch(async (erro) => {
    await removerArquivo(imagem.id).catch(() => {});
    throw erro;
  });

  return json({ id: nova.id, url: imagem.blob_url }, 201);
});
