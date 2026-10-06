// Arquivos no Vercel Blob (research D3, revisto em 2026-10-06). O arquivo chega no mesmo envio
// do formulário. Na Vercel, privado/público é escolhido POR STORE, então são dois:
// - privado (currículos): só o Painel abre, e o arquivo é entregue pela própria função depois de
//   conferir o login — nenhum link de currículo circula (BLOB_PRIVADO_READ_WRITE_TOKEN);
// - público (imagens de notícia e da página institucional): conteúdo do Portal
//   (BLOB_PUBLICO_READ_WRITE_TOKEN).

import { randomUUID } from 'node:crypto';
import { put, del, get } from '@vercel/blob';
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

const acessoBlob = (acesso) => (acesso === 'privado' ? 'private' : 'public');

function token(acesso) {
  const valor = acesso === 'privado'
    ? process.env.BLOB_PRIVADO_READ_WRITE_TOKEN
    : process.env.BLOB_PUBLICO_READ_WRITE_TOKEN;
  if (!valor) {
    falhar(503, 'ARQUIVOS_INDISPONIVEIS', acesso === 'privado'
      ? 'Não conseguimos receber arquivos agora. Descreva sua experiência no campo de texto.'
      : 'Não conseguimos receber imagens agora. Tente de novo mais tarde.');
  }
  return valor;
}

// Confere tipo e tamanho ANTES de qualquer envio. `campo` é o nome no formulário.
export function validarArquivo(file, { categoria, campo = 'arquivo' }) {
  const regra = REGRAS[categoria];
  if (!regra) throw new Error(`Categoria de arquivo desconhecida: ${categoria}`);
  if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) {
    falhar(400, 'ARQUIVO_AUSENTE', 'Escolha um arquivo para enviar.', [campo]);
  }
  if (file.size > regra.tamanhoMaximo) {
    falhar(413, 'ARQUIVO_GRANDE_DEMAIS', `O arquivo é grande demais. Envie ${regra.rotulo}.`, [campo]);
  }
  if (!regra.tipos[file.type]) {
    falhar(400, 'TIPO_DE_ARQUIVO_NAO_ACEITO', `Tipo de arquivo não aceito. Envie ${regra.rotulo}.`, [campo]);
  }
  return regra;
}

// Envia ao Blob e grava a linha em `arquivo`. `enviadoPor` é 'publico' ou a conta.
// Se a gravação no banco falhar, apaga o objeto para não deixar arquivo sem dono.
export async function salvarArquivo(file, { categoria, enviadoPor, campo = 'arquivo' }, executor) {
  const regra = validarArquivo(file, { categoria, campo });
  // O nome no Blob não leva o nome original, que pode conter o nome da pessoa.
  const pathname = `${categoria}/${randomUUID()}.${regra.tipos[file.type]}`;
  const blob = await put(pathname, file, {
    access: acessoBlob(regra.acesso),
    contentType: file.type,
    addRandomSuffix: false,
    token: token(regra.acesso),
  });
  try {
    const consulta = `INSERT INTO arquivo (blob_url, blob_pathname, acesso, categoria, nome_original, mime_type, tamanho_bytes, enviado_por)
                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, blob_url, acesso`;
    const valores = [blob.url, blob.pathname, regra.acesso, categoria, String(file.name || 'arquivo').slice(0, 200), file.type, file.size, enviadoPor];
    const [linha] = executor ? await executor.query(consulta, valores) : await sql.query(consulta, valores);
    return linha;
  } catch (e) {
    await del(blob.url, { token: token(regra.acesso) }).catch(() => {});
    throw e;
  }
}

// Entrega um arquivo PRIVADO pela própria função (Painel, com login já conferido pela rota).
// Devolve uma Response com o arquivo, ou null se não existir mais.
export async function respostaArquivoPrivado(arquivoId) {
  const [arquivo] = await sql`
    SELECT blob_pathname, nome_original, mime_type FROM arquivo
    WHERE id = ${arquivoId} AND acesso = 'privado' AND removido_em IS NULL`;
  if (!arquivo) return null;
  const resultado = await get(arquivo.blob_pathname, { access: 'private', token: token('privado') });
  if (!resultado || resultado.statusCode !== 200) return null;
  const nome = arquivo.nome_original.replace(/[^\w.\- ]+/g, '_');
  return new Response(resultado.stream, {
    headers: {
      'Content-Type': arquivo.mime_type,
      'Content-Disposition': `inline; filename="${nome}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  });
}

// Apaga o OBJETO no Blob (anonimização, FR-055/FR-056) e marca a linha. A linha fica.
export async function removerArquivo(arquivoId, executor) {
  const [arquivo] = await sql`SELECT blob_url, acesso FROM arquivo WHERE id = ${arquivoId} AND removido_em IS NULL`;
  if (!arquivo) return false;
  await del(arquivo.blob_url, { token: token(arquivo.acesso) });
  const marcar = 'UPDATE arquivo SET removido_em = now() WHERE id = $1';
  if (executor) await executor.query(marcar, [arquivoId]);
  else await sql.query(marcar, [arquivoId]);
  return true;
}
