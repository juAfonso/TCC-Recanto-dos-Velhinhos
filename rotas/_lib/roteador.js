// Encontra o arquivo de rotas/ que atende um endereço /api/..., na convenção da Vercel:
//   /api/admin/sessao              → rotas/admin/sessao.js
//   /api/admin/doacoes             → rotas/admin/doacoes/index.js
//   /api/admin/doacoes/7/confirmar → rotas/admin/doacoes/[id]/confirmar.js  (parametros = { id: '7' })
// Pastas e arquivos que começam com "_" (rotas/_lib) nunca viram rota.
//
// Por que existe (2026-10-06): o plano gratuito da Vercel aceita no máximo 12 funções por deploy,
// e o projeto terá dezenas de rotas. Então só api/index.js é função; ele usa este roteador para
// chamar o arquivo certo. O mesmo roteador serve ao npm run dev e aos testes.

import { stat, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ROTAS = path.join(RAIZ, 'rotas');

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
  return procurar(segmentos.slice(1), ROTAS, {});
}
