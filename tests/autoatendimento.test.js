// US9 — autoatendimento do doador associado (FR-041, FR-042, FR-046, FR-047) e decisão de
// 2026-10-07: aviso de privacidade novo é aceito na próxima doação.

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { prepararBanco, chamar, criarDoador, cookieDoSetCookie, contarAuditoria, sql } from './_apoio.js';

let ana;
let beto;

before(async () => {
  await prepararBanco();
  ana = await criarDoador({ cpf: '52998224725', email: 'ana@exemplo.invalid' });
  beto = await criarDoador({ cpf: '11144477735', email: 'beto@exemplo.invalid' });
  await sql`INSERT INTO aviso_privacidade (versao, texto, publicado_por, publicado_em) VALUES ('v1', 'Aviso 1', 'teste', now() - interval '1 day')`;
  await sql`INSERT INTO consentimento (pessoa_id, aviso_versao, finalidade) VALUES (${ana.id}, 'v1', 'doacao_associativa')`;
  await sql`
    INSERT INTO doacao (tipo, valor, pessoa_id, status, criado_por) VALUES
      ('associativa', 50, ${ana.id}, 'confirmada', 'teste'),
      ('associativa', 20, ${ana.id}, 'pendente', 'teste'),
      ('associativa', 30, ${ana.id}, 'nao_localizada', 'teste'),
      ('associativa', 99, ${beto.id}, 'confirmada', 'teste')`;
});

test('login certo entra; senha errada e e-mail desconhecido recebem a mesma resposta', async () => {
  const ok = await chamar('/api/auth/login', { metodo: 'POST', corpo: { email: 'ANA@exemplo.invalid', senha: 'senha-de-teste' } });
  assert.equal(ok.status, 200);
  assert.match(ok.headers.get('set-cookie'), /HttpOnly/i);

  const senhaErrada = await chamar('/api/auth/login', { metodo: 'POST', corpo: { email: 'ana@exemplo.invalid', senha: 'outra-senha' } });
  const desconhecido = await chamar('/api/auth/login', { metodo: 'POST', corpo: { email: 'ninguem@exemplo.invalid', senha: 'outra-senha' } });
  assert.equal(senhaErrada.status, 401);
  assert.deepEqual(senhaErrada.corpo, desconhecido.corpo);
});

test('o histórico mostra só as doações confirmadas do próprio doador', async () => {
  const r = await chamar('/api/me/doacoes', { cookie: ana.cookie });
  assert.equal(r.status, 200);
  assert.deepEqual(r.corpo.doacoes.map((d) => d.valor), [50]);
  assert.equal(r.corpo.total, 50);

  const me = await chamar('/api/me', { cookie: ana.cookie });
  assert.equal(me.corpo.cpf, '52998224725');
  assert.equal(me.corpo.avisoPendente, null);
});

test('sem sessão de doador, /api/me é negado e registrado (FR-047)', async () => {
  const antes = await contarAuditoria('acesso.negado');
  assert.equal((await chamar('/api/me')).status, 403);
  assert.equal((await chamar('/api/me/doacoes')).status, 403);
  assert.equal(await contarAuditoria('acesso.negado'), antes + 2);
});

test('papel de doador inativado: a sessão aberta deixa de valer', async () => {
  await sql`UPDATE papel SET status = 'inativo' WHERE pessoa_id = ${beto.id}`;
  assert.equal((await chamar('/api/me', { cookie: beto.cookie })).status, 403);
  const login = await chamar('/api/auth/login', { metodo: 'POST', corpo: { email: 'beto@exemplo.invalid', senha: 'senha-de-teste' } });
  assert.equal(login.status, 401);
  await sql`UPDATE papel SET status = 'ativo' WHERE pessoa_id = ${beto.id}`;
});

test('aviso de privacidade novo: a próxima doação logada exige e grava o aceite', async () => {
  await sql`INSERT INTO aviso_privacidade (versao, texto, publicado_por) VALUES ('v2', 'Aviso 2', 'teste')`;
  const me = await chamar('/api/me', { cookie: ana.cookie });
  assert.equal(me.corpo.avisoPendente.versao, 'v2');

  const semAceite = await chamar('/api/public/doacoes', { metodo: 'POST', cookie: ana.cookie, corpo: { tipo: 'associativa', valor: 10 } });
  assert.equal(semAceite.status, 422);
  assert.equal(semAceite.corpo.erro.codigo, 'CONSENTIMENTO_OBRIGATORIO');

  const comAceite = await chamar('/api/public/doacoes', {
    metodo: 'POST', cookie: ana.cookie,
    corpo: { tipo: 'associativa', valor: 10, consentimento: { avisoVersao: 'v2', aceito: true } },
  });
  assert.equal(comAceite.status, 201);
  const versoes = await sql`SELECT aviso_versao FROM consentimento WHERE pessoa_id = ${ana.id} ORDER BY aceito_em`;
  assert.deepEqual(versoes.map((c) => c.aviso_versao), ['v1', 'v2'], 'um consentimento por versão aceita');
  assert.equal((await chamar('/api/me', { cookie: ana.cookie })).corpo.avisoPendente, null);
});

test('logout apaga o cookie', async () => {
  const r = await chamar('/api/auth/logout', { metodo: 'POST', cookie: ana.cookie });
  assert.equal(r.status, 200);
  assert.match(r.headers.get('set-cookie'), /Max-Age=0/);
  assert.ok(cookieDoSetCookie(r.headers.get('set-cookie')).endsWith('='));
});
