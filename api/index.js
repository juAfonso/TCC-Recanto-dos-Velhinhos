// A única função serverless do projeto (decisão de 2026-10-06, research D1 revisto).
// O plano gratuito da Vercel aceita no máximo 12 funções por deploy; o SAGE terá dezenas de
// rotas. Então todo /api/... chega aqui (rewrite no vercel.json) e é despachado para o arquivo
// correspondente em rotas/, com a mesma convenção de pastas que a Vercel usaria.
// Os endereços públicos da API não mudam.

import { pathToFileURL } from 'node:url';
import { acharFuncao } from '../rotas/_lib/roteador.js';

// Importações estáticas dos módulos compartilhados: fazem a Vercel empacotar as dependências
// (Neon, Blob, nodemailer), que os arquivos de rota só carregam dinamicamente.
import '../rotas/_lib/db.js';
import '../rotas/_lib/email.js';
import '../rotas/_lib/blob.js';

const responder = (status, codigo, mensagem) =>
  new Response(JSON.stringify({ erro: { codigo, mensagem } }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const modulos = new Map();

async function despachar(request) {
  const url = new URL(request.url);
  // Na Vercel o caminho original chega em ?__rota= (vercel.json); no npm run dev e nos testes,
  // o próprio caminho já é o original.
  const caminho = url.searchParams.get('__rota') || url.pathname;
  url.searchParams.delete('__rota');

  const achado = await acharFuncao(caminho);
  if (!achado) return responder(404, 'NAO_ENCONTRADO', 'Rota não encontrada.');

  let modulo = modulos.get(achado.arquivo);
  if (!modulo) {
    modulo = await import(pathToFileURL(achado.arquivo).href);
    modulos.set(achado.arquivo, modulo);
  }
  const handler = modulo[request.method];
  if (typeof handler !== 'function') return responder(405, 'METODO_NAO_PERMITIDO', 'Método não permitido.');

  // Remonta o pedido com o caminho original e os parâmetros de rota ([id]) na consulta,
  // exatamente como cada arquivo de rota espera receber.
  const destino = new URL(caminho, url.origin);
  url.searchParams.forEach((valor, chave) => destino.searchParams.set(chave, valor));
  for (const [chave, valor] of Object.entries(achado.parametros)) destino.searchParams.set(chave, valor);

  const temCorpo = !['GET', 'HEAD'].includes(request.method);
  return handler(new Request(destino, {
    method: request.method,
    headers: request.headers,
    body: temCorpo ? await request.arrayBuffer() : undefined,
  }));
}

// Só os métodos que o projeto usa. Não há DELETE em lugar nenhum (Princípio III).
export const GET = despachar;
export const POST = despachar;
export const PUT = despachar;
