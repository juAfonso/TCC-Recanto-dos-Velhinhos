// Aplica em ordem os arquivos db/migrations/*.sql ainda não aplicados (research D7).
// Cada arquivo roda numa transação e fica registrado em schema_migrations.
//
//   npm run migrate              → banco de DATABASE_URL
//   npm run migrate -- --teste   → banco de DATABASE_URL_TESTE (branch de teste do Neon)
//   npm run migrate -- --producao → banco de DATABASE_URL_PRODUCAO (branch main do Neon)

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Pool } from '@neondatabase/serverless';

const PASTA = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

export async function aplicarMigracoes(url, { silencioso = false } = {}) {
  const log = silencioso ? () => {} : console.log;
  const pool = new Pool({ connectionString: url });
  const conexao = await pool.connect();
  try {
    await conexao.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        nome        text PRIMARY KEY,
        aplicada_em timestamptz NOT NULL DEFAULT now()
      )`);
    const { rows } = await conexao.query('SELECT nome FROM schema_migrations');
    const aplicadas = new Set(rows.map((r) => r.nome));

    const arquivos = (await readdir(PASTA)).filter((a) => a.endsWith('.sql')).sort();
    let novas = 0;
    for (const arquivo of arquivos) {
      if (aplicadas.has(arquivo)) continue;
      const texto = await readFile(path.join(PASTA, arquivo), 'utf8');
      try {
        await conexao.query('BEGIN');
        await conexao.query(texto);
        await conexao.query('INSERT INTO schema_migrations (nome) VALUES ($1)', [arquivo]);
        await conexao.query('COMMIT');
      } catch (erro) {
        await conexao.query('ROLLBACK').catch(() => {});
        throw new Error(`Falha em ${arquivo}: ${erro.message}`);
      }
      log(`✔ ${arquivo}`);
      novas++;
    }
    log(novas ? `${novas} migração(ões) aplicada(s).` : 'Nada a aplicar: o banco já está atualizado.');
  } finally {
    conexao.release();
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const nomeVar = process.argv.includes('--producao') ? 'DATABASE_URL_PRODUCAO'
    : process.argv.includes('--teste') ? 'DATABASE_URL_TESTE' : 'DATABASE_URL';
  const url = process.env[nomeVar];
  if (!url) {
    console.error(`${nomeVar} não definida. Confira o .env.local (modelo em .env.example).`);
    process.exit(1);
  }
  console.log(`Aplicando migrações em ${nomeVar}…`);
  aplicarMigracoes(url).catch((erro) => {
    console.error(erro.message);
    process.exit(1);
  });
}
