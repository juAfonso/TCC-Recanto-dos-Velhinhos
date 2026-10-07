// GET /api/admin/noticias — todas as notícias, publicadas e despublicadas, mais recentes primeiro
// (FR-032a: a despublicada continua consultável no Painel).
// POST /api/admin/noticias (multipart) — titulo, corpo, imagem opcional (JPEG/PNG/WebP até 2 MB)
// com imagemAlt obrigatório se houver imagem (FR-032b). Nasce publicada (FR-032).
// Ordem: valida tudo → envia a imagem ao Blob público → grava; se a gravação falhar, a imagem
// é removida do Blob, para não ficar arquivo sem dono.

import { sql, transacao } from '../../_lib/db.js';
import { exigirAdmin } from '../../_lib/acesso.js';
import { registrarAuditoria } from '../../_lib/auditoria.js';
import { validarArquivo, salvarArquivo, removerArquivo } from '../../_lib/blob.js';
import { validarNoticia, validarAlt, campoTexto, campoArquivo } from '../../_lib/conteudo.js';
import { json, lerFormulario, rota } from '../../_lib/http.js';

export function paraTela(n) {
  return {
    id: n.id,
    titulo: n.titulo,
    corpo: n.corpo,
    status: n.status,
    imagem: n.imagem_url ? { url: n.imagem_url, alt: n.imagem_alt } : null,
    criadoPor: n.criado_por,
    criadoEm: n.criado_em,
    atualizadoPor: n.atualizado_por,
    atualizadoEm: n.atualizado_em,
    statusAlteradoPor: n.status_alterado_por,
    statusAlteradoEm: n.status_alterado_em,
  };
}

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const noticias = await sql`
    SELECT n.*, a.blob_url AS imagem_url
    FROM noticia n
    LEFT JOIN arquivo a ON a.id = n.imagem_arquivo_id AND a.removido_em IS NULL
    ORDER BY n.criado_em DESC`;
  return json({ noticias: noticias.map(paraTela) });
});

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const form = await lerFormulario(request);
  const dados = validarNoticia({ titulo: campoTexto(form, 'titulo'), corpo: campoTexto(form, 'corpo') });
  const arquivo = campoArquivo(form, 'imagem');
  const alt = arquivo ? validarAlt(campoTexto(form, 'imagemAlt')) : null;
  if (arquivo) validarArquivo(arquivo, { categoria: 'imagem_noticia', campo: 'imagem' });

  const imagem = arquivo
    ? await salvarArquivo(arquivo, { categoria: 'imagem_noticia', enviadoPor: conta.identificador, campo: 'imagem' })
    : null;

  const noticia = await transacao(async (tx) => {
    const [nova] = await tx.query(
      `INSERT INTO noticia (titulo, corpo, imagem_arquivo_id, imagem_alt, criado_por, status_alterado_por, status_alterado_em)
       VALUES ($1, $2, $3, $4, $5, $5, now()) RETURNING id`,
      [dados.titulo, dados.corpo, imagem?.id ?? null, alt, conta.identificador]);
    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id, acao: 'noticia.publicar',
      entidadeTipo: 'noticia', entidadeId: nova.id, detalhe: { comImagem: Boolean(imagem), nova: true },
    }, tx);
    return nova;
  }).catch(async (erro) => {
    if (imagem) await removerArquivo(imagem.id).catch(() => {});
    throw erro;
  });

  return json({ id: noticia.id, status: 'publicada' }, 201);
});
