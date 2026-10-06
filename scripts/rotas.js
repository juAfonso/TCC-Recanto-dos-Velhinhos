// Encontra o arquivo de api/ que atende uma rota, seguindo a convenção da Vercel:
//   /api/admin/sessao            → api/admin/sessao.js
//   /api/admin/doacoes           → api/admin/doacoes/index.js
//   /api/admin/doacoes/7/confirmar → api/admin/doacoes/[id]/confirmar.js  (parametros = { id: '7' })
// Pastas e arquivos que começam com "_" (api/_lib) nunca viram rota.
// Usado pelo servidor de desenvolvimento (scripts/dev.js) e pelos testes (tests/_apoio.js).

import { stat, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = path.join(RAIZ, 'api');

const existe = (p) => stat(p).then((s) => s, () => null);

async function procurar(segmentos, pasta, parametros) {
  if (!segmentos.length) {
    const indice = path.join(pasta, 'index.js');
    return (await existe(indice)) ? { arquivo: indice, parametros } : null;
  }
  const [atual, ...resto] = segmentos;
  if (atual.startsWith('_') || atual.startsWith('.')) return null;

  if (!resto.length && (await existe(path.join(pasta, `${atual}.js`)))?.isFile()) {
    return { arquivo: path.join(pasta, `${atual}.js`), parametros };
  }
  if ((await existe(path.join(pasta, atual)))?.isDirectory()) {
    const achado = await procurar(resto, path.join(pasta, atual), parametros);
    if (achado) return achado;
  }
  const itens = await readdir(pasta, { withFileTypes: true }).catch(() => []);
  for (const item of itens) {
    const m = /^\[(\w+)\](\.js)?$/.exec(item.name);
    if (!m) continue;
    const novos = { ...parametros, [m[1]]: decodeURIComponent(atual) };
    if (m[2] && !resto.length && item.isFile()) return { arquivo: path.join(pasta, item.name), parametros: novos };
    if (!m[2] && item.isDirectory()) {
      const achado = await procurar(resto, path.join(pasta, item.name), novos);
      if (achado) return achado;
    }
  }
  return null;
}

// `caminho` começa com /api/. Devolve { arquivo, parametros } ou null.
export function acharFuncao(caminho) {
  const segmentos = caminho.split('/').filter(Boolean);
  if (segmentos[0] !== 'api') return Promise.resolve(null);
  return procurar(segmentos.slice(1), API, {});
}
