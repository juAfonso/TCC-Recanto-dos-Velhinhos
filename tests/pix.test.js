// FR-007a — sem chave Pix ativa, o Portal não oferece a doação. A equipe tira a chave do site
// pelo Painel (quickstart V4); nada é apagado, e salvar de novo devolve a doação ao site.

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { prepararBanco, chamar, criarConta, sql } from './_apoio.js';

let conta;
before(async () => {
  await prepararBanco();
  conta = await criarConta();
});

const CHAVE = { tipoChave: 'cnpj', chave: '11.222.333/0001-81', nomeRecebedor: 'Instituicao Teste', cidade: 'Pinheiral' };

test('tirar a chave do site desliga a doação no Portal, sem apagar nada', async () => {
  assert.equal((await chamar('/api/admin/pix', { metodo: 'PUT', cookie: conta.cookie, corpo: CHAVE })).status, 200);
  assert.equal((await chamar('/api/public/pix')).corpo.disponivel, true);

  assert.equal((await chamar('/api/admin/pix/desativar', { metodo: 'POST', cookie: conta.cookie })).status, 200);
  const portal = await chamar('/api/public/pix');
  assert.equal(portal.corpo.disponivel, false);
  assert.ok(!('chave' in portal.corpo), 'sem chave, o Portal não mostra chave nenhuma');
  assert.equal((await chamar('/api/admin/pix', { cookie: conta.cookie })).corpo, null);

  assert.equal((await chamar('/api/admin/pix/desativar', { metodo: 'POST', cookie: conta.cookie })).status, 409);
  const [{ total }] = await sql`SELECT count(*)::int AS total FROM chave_pix_institucional`;
  assert.equal(total, 1, 'a linha continua como histórico');

  assert.equal((await chamar('/api/admin/pix', { metodo: 'PUT', cookie: conta.cookie, corpo: CHAVE })).status, 200);
  assert.equal((await chamar('/api/public/pix')).corpo.disponivel, true, 'salvar de novo devolve a doação ao site');
});
