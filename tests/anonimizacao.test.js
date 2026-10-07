// FR-055, SC-016 — anonimização (contracts/api.md, teste 3; research D16).
// Doador associado com doações confirmadas, histórico de alteração, falha de e-mail,
// consentimento e um cadastro de voluntário com o mesmo CPF (alcance decidido em 2026-10-07):
// depois de anonimizar, nenhum dado pessoal fica legível em nenhuma dessas tabelas, as doações
// mantêm valor, data, tipo e status, e nenhuma linha é apagada.

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { prepararBanco, chamar, criarConta, criarDoador, sql } from './_apoio.js';

const CPF = '52998224725';
const EMAIL = 'doador-teste@exemplo.invalid';
const TELEFONE_ANTIGO = '24988887777';
const ENDERECO = 'Rua das Acácias, 123';
const PESSOAIS = [CPF, EMAIL, TELEFONE_ANTIGO, 'Doador de Teste', ENDERECO, '12.345.678-9'];

let conta;
let doador;

const TABELAS = ['pessoa', 'papel', 'doacao', 'historico_alteracao', 'falha_email', 'consentimento', 'cadastro_voluntario'];
async function contagens() {
  const r = {};
  for (const t of TABELAS) {
    const [{ n }] = await sql.query(`SELECT count(*)::int AS n FROM ${t}`);
    r[t] = n;
  }
  return r;
}

before(async () => {
  await prepararBanco();
  const { rodarSeed } = await import('../db/seed.js');
  await rodarSeed(process.env.DATABASE_URL, {});
  conta = await criarConta();
  doador = await criarDoador({ cpf: CPF, email: EMAIL });

  await sql`UPDATE pessoa SET telefone = '24930164023' WHERE id = ${doador.id}`;
  await sql`
    INSERT INTO historico_alteracao (entidade_tipo, entidade_id, estado_anterior, alterado_por)
    VALUES ('pessoa', ${doador.id}, ${JSON.stringify({ nome: 'Doador de Teste', cpf: CPF, telefone: TELEFONE_ANTIGO })}, 'teste')`;
  await sql`
    INSERT INTO falha_email (destinatario, motivo, modelo, entidade_tipo, entidade_id, erro)
    VALUES (${EMAIL}, 'definir_senha', 'definir_senha', 'pessoa', ${doador.id}, 'teste')`;
  const [{ versao }] = await sql`SELECT versao FROM aviso_privacidade LIMIT 1`;
  await sql`INSERT INTO consentimento (pessoa_id, aviso_versao, finalidade) VALUES (${doador.id}, ${versao}, 'doacao_associativa')`;
  for (const status of ['confirmada', 'confirmada', 'pendente']) {
    await sql`
      INSERT INTO doacao (tipo, valor, pessoa_id, status, criado_por)
      VALUES ('associativa', 50, ${doador.id}, ${status}, 'teste')`;
  }
  // Cadastro de voluntário rejeitado da mesma pessoa (mesmo CPF), com endereço e RG.
  await sql`
    INSERT INTO cadastro_voluntario (protocolo, nome, cpf, rg, data_nascimento, endereco, cidade, uf, telefone, email,
                                     menor_de_idade, autorizacao_status, status, criado_por)
    VALUES ('VOL-TESTEANON1', 'Doador de Teste', ${CPF}, '12.345.678-9', '1980-01-01', ${ENDERECO}, 'Pinheiral', 'RJ',
            ${TELEFONE_ANTIGO}, ${EMAIL}, false, 'nao_se_aplica', 'rejeitado', 'publico')`;
});

test('anonimizar o doador: nada pessoal legível, doações e linhas preservadas', async () => {
  const antes = await contagens();
  const [{ n: auditoriaAntes }] = await sql`SELECT count(*)::int AS n FROM registro_auditoria`;
  const doacoesAntes = await sql`SELECT id, valor, declarada_em, tipo, status FROM doacao ORDER BY id`;

  const r = await chamar('/api/admin/anonimizacoes', {
    metodo: 'POST', corpo: { alvo: 'pessoa', id: doador.id }, cookie: conta.cookie,
  });
  assert.equal(r.status, 200, JSON.stringify(r.corpo));

  // Nenhum dado pessoal em nenhuma tabela ligada.
  const despejo = JSON.stringify({
    pessoa: await sql`SELECT * FROM pessoa`,
    historico: await sql`SELECT * FROM historico_alteracao`,
    falhas: await sql`SELECT * FROM falha_email`,
    voluntario: await sql`SELECT * FROM cadastro_voluntario`,
  });
  for (const dado of PESSOAIS) assert.ok(!despejo.includes(dado), `"${dado}" continua legível`);

  const [p] = await sql`SELECT ativo, anonimizado_em, senha_hash FROM pessoa WHERE id = ${doador.id}`;
  assert.equal(p.ativo, false);
  assert.ok(p.anonimizado_em);
  assert.equal(p.senha_hash, null);
  const ativos = await sql`SELECT 1 FROM papel WHERE pessoa_id = ${doador.id} AND status = 'ativo'`;
  assert.equal(ativos.length, 0, 'papéis ficam inativos');

  // Doações intactas, ainda ligadas à linha anonimizada ("doador anonimizado").
  const doacoesDepois = await sql`SELECT id, valor, declarada_em, tipo, status FROM doacao ORDER BY id`;
  assert.deepEqual(doacoesDepois, doacoesAntes);
  const ligadas = await sql`SELECT 1 FROM doacao WHERE pessoa_id = ${doador.id}`;
  assert.equal(ligadas.length, 3);

  // Nenhuma linha apagada; auditoria só ganha a linha da anonimização.
  assert.deepEqual(await contagens(), antes);
  const [{ n: auditoriaDepois }] = await sql`SELECT count(*)::int AS n FROM registro_auditoria`;
  assert.equal(auditoriaDepois, auditoriaAntes + 1);
  const [aud] = await sql`SELECT detalhe FROM registro_auditoria WHERE acao = 'anonimizacao.executar'`;
  assert.ok(!JSON.stringify(aud).includes(CPF));

  // Sem login e sem acesso: a sessão antiga do doador não vale mais.
  const { exigirDoador } = await import('../rotas/_lib/acesso.js');
  await assert.rejects(
    exigirDoador(new Request('http://teste.local/', { headers: { cookie: doador.cookie } })),
    (erro) => erro.status === 403);

  // Não anonimiza duas vezes.
  const de_novo = await chamar('/api/admin/anonimizacoes', {
    metodo: 'POST', corpo: { alvo: 'pessoa', id: doador.id }, cookie: conta.cookie,
  });
  assert.equal(de_novo.status, 409);
});

test('reter dados por obrigação legal exige justificativa e mantém só o marcado', async () => {
  const [p] = await sql`
    INSERT INTO pessoa (cpf, nome, email, telefone, criado_por)
    VALUES ('11144477735', 'Ex Funcionária', 'ex@exemplo.invalid', '24977776666', 'teste') RETURNING id`;
  await sql`INSERT INTO papel (pessoa_id, tipo, status, criado_por) VALUES (${p.id}, 'funcionario', 'encerrado', 'teste')`;

  const semJustificativa = await chamar('/api/admin/anonimizacoes', {
    metodo: 'POST', corpo: { alvo: 'pessoa', id: p.id, reter: ['nome', 'cpf'] }, cookie: conta.cookie,
  });
  assert.equal(semJustificativa.status, 422);
  assert.equal(semJustificativa.corpo.erro.codigo, 'JUSTIFICATIVA_OBRIGATORIA');

  const ok = await chamar('/api/admin/anonimizacoes', {
    metodo: 'POST',
    corpo: { alvo: 'pessoa', id: p.id, reter: ['nome', 'cpf'], justificativaRetencao: 'Registros trabalhistas (CLT).' },
    cookie: conta.cookie,
  });
  assert.equal(ok.status, 200, JSON.stringify(ok.corpo));
  const [depois] = await sql`SELECT nome, cpf, email, telefone FROM pessoa WHERE id = ${p.id}`;
  assert.deepEqual(depois, { nome: 'Ex Funcionária', cpf: '11144477735', email: null, telefone: null });
  const [registro] = await sql`SELECT campos_retidos, justificativa FROM anonimizacao WHERE entidade_id = ${p.id}`;
  assert.deepEqual(registro.campos_retidos, ['nome', 'cpf']);
  assert.match(registro.justificativa, /CLT/);
});
