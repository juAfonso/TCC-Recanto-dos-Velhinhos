// Arquivos no Vercel Blob (research D3). O arquivo chega no mesmo envio do formulário.
// Currículo é PRIVADO: só o Painel abre, por URL assinada de vida curta.
// Imagens (notícia, página institucional) são públicas: são conteúdo do Portal.

import { randomUUID } from 'node:crypto';
import { put, del, issueSignedToken, presignUrl } from '@vercel/blob';
import { sql } from './db.js';
import { falhar } from './http.js';

const MB = 1024 * 1024;
const REGRAS = {
  curriculo: {
    acesso: 'privado',
    tamanhoMaximo: 4 * MB,
    tipos: {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.oasis.opendocument.text': 'odt',
    },
    rotulo: 'PDF, DOC, DOCX ou ODT de até 4 MB',
  },
  imagem_noticia: {
    acesso: 'publico',
    tamanhoMaximo: 2 * MB,
    tipos: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' },
    rotulo: 'JPEG, PNG ou WebP de até 2 MB',
  },
};
REGRAS.imagem_institucional = REGRAS.imagem_noticia;

const VALIDADE_URL_PRIVADA_MS = 5 * 60 * 1000;
const acessoBlob = (acesso) => (acesso === 'privado' ? 'private' : 'public');

// `file` é o File vindo de request.formData(). `enviadoPor` é 'publico' ou a conta.
// `campo` é o nome do campo no formulário, para a tela marcar o erro.
export async function salvarArquivo(file, { categoria, enviadoPor, campo = 'arquivo' }) {
  const regra = REGRAS[categoria];
  if (!regra) throw new Error(`Categoria de arquivo desconhecida: ${categoria}`);
  if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) {
    falhar(400, 'ARQUIVO_AUSENTE', 'Escolha um arquivo para enviar.', [campo]);
  }
  if (file.size > regra.tamanhoMaximo) {
    falhar(413, 'ARQUIVO_GRANDE_DEMAIS', `O arquivo é grande demais. Envie ${regra.rotulo}.`, [campo]);
  }
  const extensao = regra.tipos[file.type];
  if (!extensao) {
    falhar(400, 'TIPO_DE_ARQUIVO_NAO_ACEITO', `Tipo de arquivo não aceito. Envie ${regra.rotulo}.`, [campo]);
  }

  // Nome no Blob não leva o nome original (pode conter o nome da pessoa).
  const pathname = `${categoria}/${randomUUID()}.${extensao}`;
  const blob = await put(pathname, file, {
    access: acessoBlob(regra.acesso),
    contentType: file.type,
    addRandomSuffix: false,
  });

  const [linha] = await sql`
    INSERT INTO arquivo (blob_url, blob_pathname, acesso, categoria, nome_original, mime_type, tamanho_bytes, enviado_por)
    VALUES (${blob.url}, ${blob.pathname}, ${regra.acesso}, ${categoria}, ${String(file.name || 'arquivo').slice(0, 200)},
            ${file.type}, ${file.size}, ${enviadoPor})
    RETURNING id, blob_url, acesso`;
  return linha;
}

// URL de vida curta (5 min) para o Painel abrir um arquivo privado. Nunca usar na zona pública.
export async function urlAssinada(arquivoId) {
  const [arquivo] = await sql`
    SELECT blob_pathname, acesso FROM arquivo WHERE id = ${arquivoId} AND removido_em IS NULL`;
  if (!arquivo) return null;
  const validUntil = Date.now() + VALIDADE_URL_PRIVADA_MS;
  const token = await issueSignedToken({ pathname: arquivo.blob_pathname, operations: ['get'], validUntil });
  const { presignedUrl } = await presignUrl(token, {
    operation: 'get',
    pathname: arquivo.blob_pathname,
    validUntil,
    access: acessoBlob(arquivo.acesso),
  });
  return presignedUrl;
}

// Apaga o OBJETO no Blob (anonimização, FR-055/FR-056) e marca a linha. A linha fica.
export async function removerArquivo(arquivoId, executor) {
  const [arquivo] = await sql`SELECT blob_url FROM arquivo WHERE id = ${arquivoId} AND removido_em IS NULL`;
  if (!arquivo) return false;
  await del(arquivo.blob_url);
  const marcar = 'UPDATE arquivo SET removido_em = now() WHERE id = $1';
  if (executor) await executor.query(marcar, [arquivoId]);
  else await sql.query(marcar, [arquivoId]);
  return true;
}
