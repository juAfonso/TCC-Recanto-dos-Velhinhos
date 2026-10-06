// Apoio aos testes automatizados (research D8). Os testes rodam SEMPRE na branch de
// teste do Neon (DATABASE_URL_TESTE), nunca no banco de desenvolvimento ou produção.
//
// Importe este arquivo ANTES de qualquer módulo de api/: ele troca DATABASE_URL pela
// URL de teste e liga o modo de e-mail de teste (nada é enviado de verdade).

import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { Pool } from '@neondatabase/serverless';
import { aplicarMigracoes } from '../db/migrate.js';
import { acharFuncao } from '../scripts/rotas.js';

const urlTeste = process.env.DATABASE_URL_TESTE;
if (!urlTeste) {
  throw new Error('DATABASE_URL_TESTE não definida. Crie a branch "teste" no Neon e ponha a URL no .env.local.');
}
if (urlTeste === process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL_TESTE é igual a DATABASE_URL. Os testes APAGAM o banco: use uma branch separada.');
}
process.env.DATABASE_URL = urlTeste;
process.env.EMAIL_MODO = 'teste';
process.env.SESSION_SECRET ||= randomBytes(32).toString('hex');

// Imports dinâmicos para que os módulos leiam as variáveis já trocadas.
const { sql } = await import('../api/_lib/db.js');
const { gerarHash } = await import('../api/_lib/senha.js');
const { criarCookie } = await import('../api/_lib/sessao.js');
export { sql };

// Recria o schema do zero e aplica as migrações. Chamar no `before` de cada arquivo.
export async function prepararBanco() {
  const pool = new Pool({ connectionString: urlTeste });
  try {
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
  } finally {
    await pool.end();
  }
  await aplicarMigracoes(urlTeste, { silencioso: true });
}

// Executa a função de api/ que atende `caminho`, como a Vercel faria.
export async function chamar(caminho, { metodo = 'GET', corpo, cookie, cabecalhos = {} } = {}) {
  const url = new URL(caminho, 'http://teste.local');
  const achado = await acharFuncao(url.pathname);
  if (!achado) throw new Error(`Nenhuma função atende ${url.pathname}`);
  for (const [k, v] of Object.entries(achado.parametros)) url.searchParams.set(k, v);

  const modulo = await import(pathToFileURL(achado.arquivo).href);
  const handler = modulo[metodo];
  if (typeof handler !== 'function') throw new Error(`${url.pathname} não exporta ${metodo}`);

  const headers = new Headers({ 'x-forwarded-for': '203.0.113.7', ...cabecalhos });
  if (cookie) headers.set('cookie', cookie);
  if (corpo !== undefined) headers.set('content-type', 'application/json');
  const resposta = await handler(new Request(url, {
    method: metodo,
    headers,
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  }));
  const texto = await resposta.text();
  return {
    status: resposta.status,
    headers: resposta.headers,
    corpo: texto ? JSON.parse(texto) : null,
  };
}

// "nome=valor; HttpOnly; ..." → "nome=valor" (o que o navegador mandaria de volta).
export const cookieDoSetCookie = (setCookie) => setCookie.split(';')[0];

export async function criarConta({ identificador = 'conta-teste@exemplo.invalid', senha = 'senha-de-teste', ativo = true } = {}) {
  const [conta] = await sql`
    INSERT INTO conta_institucional (identificador, senha_hash, ativo, criado_por)
    VALUES (${identificador}, ${await gerarHash(senha)}, ${ativo}, 'teste') RETURNING id`;
  return { id: conta.id, identificador, senha, cookie: cookieDoSetCookie(criarCookie({ ctx: 'admin', id: conta.id })) };
}

export async function criarDoador({ cpf = '52998224725', email = 'doador-teste@exemplo.invalid', senha = 'senha-de-teste' } = {}) {
  const [pessoa] = await sql`
    INSERT INTO pessoa (cpf, nome, email, senha_hash, senha_definida_em, criado_por)
    VALUES (${cpf}, 'Doador de Teste', ${email}, ${await gerarHash(senha)}, now() - interval '1 minute', 'teste')
    RETURNING id`;
  await sql`INSERT INTO papel (pessoa_id, tipo, criado_por) VALUES (${pessoa.id}, 'doador_associado', 'teste')`;
  return { id: pessoa.id, cookie: cookieDoSetCookie(criarCookie({ ctx: 'doador', id: pessoa.id })) };
}

export async function contarAuditoria(acao) {
  const [{ total }] = await sql`SELECT count(*)::int AS total FROM registro_auditoria WHERE acao = ${acao}`;
  return total;
}
