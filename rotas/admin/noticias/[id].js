// GET /api/admin/noticias/:id — a notícia e o histórico de edições.
// PUT /api/admin/noticias/:id (multipart) — edita título, texto e imagem (FR-032a, FR-032b):
//   imagem nova substitui a anterior; removerImagem=1 tira a imagem; imagemAlt é obrigatório
//   sempre que a notícia ficar com imagem. A imagem anterior é só desvinculada, nunca apagada.
//   Estado anterior em historico_alteracao (FR-037). Não muda o status (publicar/despublicar à parte).

import { sql, transacao } from '../../_lib/db.js';
import { exigirAdmin } from '../../_lib/acesso.js';
import { registrarAuditoria } from '../../_lib/auditoria.js';
import { registrarAlteracao } from '../../_lib/historico.js';
import { validarArquivo, salvarArquivo, removerArquivo } from '../../_lib/blob.js';
import { validarNoticia, validarAlt, campoTexto, campoArquivo } from '../../_lib/conteudo.js';
import { paraTela } from './index.js';
import { json, lerFormulario, falhar, idDaRota, rota } from '../../_lib/http.js';

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const id = idDaRota(request);
  const [n] = await sql`
    SELECT n.*, a.blob_url AS imagem_url FROM noticia n
    LEFT JOIN arquivo a ON a.id = n.imagem_arquivo_id AND a.removido_em IS NULL
    WHERE n.id = ${id}`;
  if (!n) falhar(404, 'NAO_ENCONTRADO', 'Notícia não encontrada.');
  const historico = await sql`
    SELECT alterado_por, alterado_em FROM historico_alteracao
    WHERE entidade_tipo = 'noticia' AND entidade_id = ${id} ORDER BY alterado_em DESC`;
  return json({ ...paraTela(n), historico: historico.map((h) => ({ alteradoPor: h.alterado_por, alteradoEm: h.alterado_em })) });
});

export const PUT = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const form = await lerFormulario(request);
  const dados = validarNoticia({ titulo: campoTexto(form, 'titulo'), corpo: campoTexto(form, 'corpo') });
  const arquivo = campoArquivo(form, 'imagem');
  const remover = campoTexto(form, 'removerImagem') === '1' && !arquivo;
  if (arquivo) validarArquivo(arquivo, { categoria: 'imagem_noticia', campo: 'imagem' });

  const [atual] = await sql`SELECT imagem_arquivo_id FROM noticia WHERE id = ${id}`;
  if (!atual) falhar(404, 'NAO_ENCONTRADO', 'Notícia não encontrada.');
  const ficaComImagem = Boolean(arquivo) || (Boolean(atual.imagem_arquivo_id) && !remover);
  const alt = ficaComImagem ? validarAlt(campoTexto(form, 'imagemAlt')) : null;

  const imagem = arquivo
    ? await salvarArquivo(arquivo, { categoria: 'imagem_noticia', enviadoPor: conta.identificador, campo: 'imagem' })
    : null;

  await transacao(async (tx) => {
    const [anterior] = await tx.query(
      'SELECT titulo, corpo, imagem_arquivo_id, imagem_alt FROM noticia WHERE id = $1 FOR UPDATE', [id]);
    await registrarAlteracao({ entidadeTipo: 'noticia', entidadeId: id, estadoAnterior: anterior, autor: conta.identificador }, tx);
    const imagemId = imagem ? imagem.id : remover ? null : anterior.imagem_arquivo_id;
    await tx.query(
      `UPDATE noticia SET titulo = $2, corpo = $3, imagem_arquivo_id = $4, imagem_alt = $5,
              atualizado_por = $6, atualizado_em = now()
       WHERE id = $1`,
      [id, dados.titulo, dados.corpo, imagemId, imagemId ? alt : null, conta.identificador]);
    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id, acao: 'noticia.editar', entidadeTipo: 'noticia', entidadeId: id,
      detalhe: { imagem: imagem ? 'trocada' : remover && anterior.imagem_arquivo_id ? 'retirada' : 'mantida' },
    }, tx);
  }).catch(async (erro) => {
    if (imagem) await removerArquivo(imagem.id).catch(() => {});
    throw erro;
  });

  return json({ ok: true });
});
