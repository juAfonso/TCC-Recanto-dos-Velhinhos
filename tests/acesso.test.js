// FR-047 — controle de acesso por perfil, verificado no servidor (contracts/api.md, teste 4).
// Rota do Painel chamada sem sessão, com sessão de doador ou com sessão adulterada:
// 403, corpo só com `erro`, e uma linha `acesso.negado` nova na auditoria.

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { prepararBanco, chamar, criarConta, criarDoador, contarAuditoria } from './_apoio.js';

const ROTAS = ['/api/admin/dashboard', '/api/admin/doacoes', '/api/admin/pessoas'];
let doador;
let conta;
let contaInativa;

before(async () => {
  await prepararBanco();
  doador = await criarDoador();
  conta = await criarConta();
  contaInativa = await criarConta({ identificador: 'inativa@exemplo.invalid', ativo: false });
});

async function esperarNegado(rota, cookie) {
  const antes = await contarAuditoria('acesso.negado');
  const resposta = await chamar(rota, { cookie });
  assert.equal(resposta.status, 403, `${rota} deveria responder 403`);
  assert.deepEqual(Object.keys(resposta.corpo), ['erro'], 'o corpo não pode levar nada além do erro');
  assert.equal(resposta.corpo.erro.codigo, 'ACESSO_NEGADO');
  assert.equal(await contarAuditoria('acesso.negado'), antes + 1, 'a tentativa deve ficar na auditoria');
}

for (const rota of ROTAS) {
  test(`${rota} sem sessão → 403 e auditoria`, () => esperarNegado(rota));

  test(`${rota} com sessão de doador associado → 403 e auditoria`, () => esperarNegado(rota, doador.cookie));

  test(`${rota} com cookie adulterado → 403 e auditoria`, () => {
    const [valor] = conta.cookie.split('.');
    return esperarNegado(rota, `${valor}.assinatura-falsa`);
  });

  test(`${rota} com conta institucional inativa → 403 e auditoria`, () => esperarNegado(rota, contaInativa.cookie));

  test(`${rota} com conta institucional ativa → passa pelo controle de acesso`, async () => {
    const resposta = await chamar(rota, { cookie: conta.cookie });
    assert.notEqual(resposta.status, 403);
  });
}

test('a auditoria da negação não guarda dado pessoal nem o motivo', async () => {
  const { sql } = await import('./_apoio.js');
  const linhas = await sql`SELECT autor_tipo, detalhe FROM registro_auditoria WHERE acao = 'acesso.negado'`;
  assert.ok(linhas.some((l) => l.autor_tipo === 'doador'), 'tentativa com sessão de doador identifica o tipo de autor');
  assert.ok(linhas.some((l) => l.autor_tipo === 'anonimo'), 'tentativa sem sessão fica como anônimo');
  for (const { detalhe } of linhas) assert.deepEqual(Object.keys(detalhe).sort(), ['metodo', 'rota']);
});
