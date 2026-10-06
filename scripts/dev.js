// Servidor de desenvolvimento: `npm run dev` → http://localhost:3000
//
// Faz no computador o mesmo que a Vercel faz em produção, sem instalar o Vercel CLI:
// - arquivos de public/ servidos como páginas estáticas;
// - /api/... passa pela MESMA função da produção (api/index.js), que despacha para rotas/;
// - segmentos dinâmicos ([id].js) chegam como parâmetro de consulta, como na Vercel.
// Mudou um arquivo de rotas/? Reinicie o npm run dev (Ctrl+C e de novo) para carregar.
// Só para desenvolvimento. Não vai para produção (a Vercel ignora a pasta scripts/).

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { RAIZ } from '../rotas/_lib/roteador.js';
import * as api from '../api/index.js';
import path from 'node:path';

const PUBLICO = path.join(RAIZ, 'public');
const PORTA = Number(process.env.PORT) || 3000;

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

const existe = (p) => stat(p).then((s) => s, () => null);

async function lerCorpo(req) {
  const partes = [];
  for await (const parte of req) partes.push(parte);
  return partes.length ? Buffer.concat(partes) : undefined;
}

async function servirApi(req, res, url) {
  const handler = api[req.method];
  if (typeof handler !== 'function') {
    return responder(res, 405, { erro: { codigo: 'METODO_NAO_PERMITIDO', mensagem: 'Método não permitido.' } });
  }

  const cabecalhos = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (v !== undefined) cabecalhos.set(k, Array.isArray(v) ? v.join(', ') : v);
  cabecalhos.set('x-forwarded-for', req.socket.remoteAddress ?? '127.0.0.1');

  const corpo = ['GET', 'HEAD'].includes(req.method) ? undefined : await lerCorpo(req);
  const request = new Request(url, { method: req.method, headers: cabecalhos, body: corpo });
  const resposta = await handler(request);

  res.statusCode = resposta.status;
  resposta.headers.forEach((v, k) => { if (k !== 'set-cookie') res.setHeader(k, v); });
  const cookies = resposta.headers.getSetCookie();
  if (cookies.length) res.setHeader('Set-Cookie', cookies);
  res.end(Buffer.from(await resposta.arrayBuffer()));
}

function responder(res, status, dados) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(dados));
}

async function servirArquivo(res, url) {
  let caminho = path.normalize(path.join(PUBLICO, decodeURIComponent(url.pathname)));
  if (!caminho.startsWith(PUBLICO)) return responder(res, 403, { erro: { codigo: 'PROIBIDO', mensagem: 'Proibido.' } });
  const info = await existe(caminho);
  if (info?.isDirectory()) caminho = path.join(caminho, 'index.html');
  try {
    const conteudo = await readFile(caminho);
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(caminho).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(conteudo);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Página não encontrada.');
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  try {
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) await servirApi(req, res, url);
    else await servirArquivo(res, url);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) responder(res, 500, { erro: { codigo: 'ERRO_INTERNO', mensagem: 'Erro no servidor de desenvolvimento.' } });
  }
  console.log(`${req.method} ${url.pathname} → ${res.statusCode}`);
}).on('error', (e) => {
  if (e.code !== 'EADDRINUSE') throw e;
  console.error(`A porta ${PORTA} já está em uso — provavelmente outro "npm run dev" ainda está aberto.`);
  console.error('Feche a outra janela (Ctrl+C) ou use outra porta:  set PORT=3001 && npm run dev');
  process.exit(1);
}).listen(PORTA, () => {
  console.log(`SAGE rodando em http://localhost:${PORTA}`);
  if (!process.env.DATABASE_URL) console.warn('Atenção: DATABASE_URL não definida (confira o .env.local).');
});
