// Acesso ao banco (research D2): `neon()` por HTTP para consultas avulsas e `Pool` só
// quando vários comandos precisam estar na mesma transação.
// SQL escrito à mão, sem ORM, para que a proibição de DELETE fique fácil de auditar.

import { neon, Pool } from '@neondatabase/serverless';

function urlDoBanco() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não definida (veja .env.example)');
  return url;
}

let cliente;
let clienteUrl;

function clienteHttp() {
  // Recria se a URL mudar (os testes trocam DATABASE_URL pela branch de teste).
  const url = urlDoBanco();
  if (!cliente || clienteUrl !== url) {
    cliente = neon(url);
    clienteUrl = url;
  }
  return cliente;
}

// Uso: await sql`SELECT ... WHERE id = ${id}` — os valores viram parâmetros, nunca texto.
export function sql(partes, ...valores) {
  return clienteHttp()(partes, ...valores);
}

// Uso: await sql.query('SELECT ... WHERE id = $1', [id])
sql.query = (texto, parametros = []) => clienteHttp().query(texto, parametros);

// Executa `fn(tx)` dentro de BEGIN/COMMIT; qualquer erro faz ROLLBACK e é relançado.
// `tx.query(texto, parametros)` devolve as linhas; `tx` também serve como executor para
// registrarAuditoria e registrarAlteracao, para que fiquem na mesma transação.
export async function transacao(fn) {
  const pool = new Pool({ connectionString: urlDoBanco() });
  const conexao = await pool.connect();
  const tx = {
    query: async (texto, parametros = []) => (await conexao.query(texto, parametros)).rows,
  };
  try {
    await conexao.query('BEGIN');
    const resultado = await fn(tx);
    await conexao.query('COMMIT');
    return resultado;
  } catch (erro) {
    await conexao.query('ROLLBACK').catch(() => {});
    throw erro;
  } finally {
    conexao.release();
    await pool.end();
  }
}

// Fora de transação, o executor padrão é o cliente HTTP.
export const executorPadrao = { query: (texto, parametros = []) => sql.query(texto, parametros) };
