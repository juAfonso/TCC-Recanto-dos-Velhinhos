// FR-050 — uma declaração de doação não é confirmada duas vezes (contracts/api.md, teste 1).
// A segunda confirmação responde 409 e não altera nada: status, conferido_em e auditoria.
// Também com duas chamadas simultâneas: só uma confirma.

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { prepararBanco, chamar, criarConta, contarAuditoria, sql } from './_apoio.js';

let conta;

before(async () => {
  await prepararBanco();
  conta = await criarConta();
});

async function novaDoacao(valor = 25) {
  const [d] = await sql`
    INSERT INTO doacao (tipo, valor, criado_por) VALUES ('espontanea', ${valor}, 'publico') RETURNING id`;
  return d.id;
}

const confirmar = (id) => chamar(`/api/admin/doacoes/${id}/confirmar`, { metodo: 'POST', corpo: {}, cookie: conta.cookie });

test('confirmar duas vezes: a segunda responde 409 e não muda o registro', async () => {
  const id = await novaDoacao();

  const primeira = await confirmar(id);
  assert.equal(primeira.status, 200);
  const [depoisDaPrimeira] = await sql`SELECT status, conferido_em, conferido_por FROM doacao WHERE id = ${id}`;
  assert.equal(depoisDaPrimeira.status, 'confirmada');
  const auditoria = await contarAuditoria('doacao.confirmar');

  const segunda = await confirmar(id);
  assert.equal(segunda.status, 409);
  assert.equal(segunda.corpo.erro.codigo, 'DOACAO_JA_CONFERIDA');

  const [depoisDaSegunda] = await sql`SELECT status, conferido_em, conferido_por FROM doacao WHERE id = ${id}`;
  assert.deepEqual(depoisDaSegunda, depoisDaPrimeira, 'a segunda tentativa não pode alterar o registro');
  assert.equal(await contarAuditoria('doacao.confirmar'), auditoria, 'a segunda tentativa não gera auditoria de confirmação');
});

test('duas confirmações simultâneas: só uma vale', async () => {
  const id = await novaDoacao(40);
  const antes = await contarAuditoria('doacao.confirmar');

  const respostas = await Promise.all([confirmar(id), confirmar(id)]);
  const status = respostas.map((r) => r.status).sort();
  assert.deepEqual(status, [200, 409]);
  assert.equal(await contarAuditoria('doacao.confirmar'), antes + 1);
});

test('doação marcada como não localizada não pode ser confirmada depois', async () => {
  const id = await novaDoacao(10);
  const marcar = await chamar(`/api/admin/doacoes/${id}/nao-localizar`, { metodo: 'POST', corpo: {}, cookie: conta.cookie });
  assert.equal(marcar.status, 200);

  const resposta = await confirmar(id);
  assert.equal(resposta.status, 409);
  const [d] = await sql`SELECT status FROM doacao WHERE id = ${id}`;
  assert.equal(d.status, 'nao_localizada');
});

test('doação inexistente → 404, sem criar nada', async () => {
  const resposta = await confirmar('00000000-0000-0000-0000-000000000000');
  assert.equal(resposta.status, 404);
});
