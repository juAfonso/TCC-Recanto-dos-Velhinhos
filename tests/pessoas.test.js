// US7 — gestão de pessoas no Painel (FR-023, FR-023a, FR-024, FR-048) e decisões de 2026-10-07:
// cadastro direto sem triagem, CPF repetido abre o existente, inativação papel por papel sem
// apagar nada, Painel não cria doador associado, funcionário e voluntário exclusivos.

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { prepararBanco, chamar, criarConta, criarDoador, sql } from './_apoio.js';

let conta;
let doador;
let exigirDoador;

// O login do autoatendimento é da fase 12; aqui confere-se a mesma regra de acesso que ele usa.
async function doadorEntra(cookie) {
  try {
    await exigirDoador(new Request('http://teste.local/api/me', { headers: { cookie } }));
    return true;
  } catch {
    return false;
  }
}

const VOLUNTARIO = {
  perfil: 'voluntario', nome: 'Voluntária do Painel', dataNascimento: '1990-05-10', cpf: '11144477735',
  rg: '123456', endereco: 'Rua A, 10', bairro: 'Centro', cep: '27197000', cidade: 'Pinheiral', uf: 'RJ',
  telefone: '24999998888', email: 'voluntaria.painel@exemplo.invalid', tipoServico: 'Atividades recreativas',
};

before(async () => {
  await prepararBanco();
  conta = await criarConta();
  doador = await criarDoador();
  ({ exigirDoador } = await import('../rotas/_lib/acesso.js'));
});

const post = (caminho, corpo) => chamar(caminho, { metodo: 'POST', corpo, cookie: conta.cookie });

test('funcionário cadastrado no Painel nasce ativo, sem triagem; CPF repetido devolve o existente', async () => {
  const r = await post('/api/admin/pessoas', {
    perfil: 'funcionario', nome: 'Funcionária Teste', cpf: '39053344705', dataNascimento: '1985-01-02',
    email: 'func@exemplo.invalid', telefone: '2433334444',
  });
  assert.equal(r.status, 201);
  const [papel] = await sql`SELECT tipo, status FROM papel WHERE pessoa_id = ${r.corpo.id}`;
  assert.deepEqual({ ...papel }, { tipo: 'funcionario', status: 'ativo' });

  const repetido = await post('/api/admin/pessoas', {
    perfil: 'funcionario', nome: 'Outra', cpf: '390.533.447-05', dataNascimento: '1985-01-02',
    email: 'outra@exemplo.invalid', telefone: '2433334444',
  });
  assert.equal(repetido.status, 409);
  assert.equal(repetido.corpo.erro.codigo, 'CPF_JA_CADASTRADO');
  assert.equal(repetido.corpo.erro.id, r.corpo.id);
});

test('voluntário adulto do Painel nasce aprovado com papel; menor fica pendente sem papel', async () => {
  const adulto = await post('/api/admin/pessoas', VOLUNTARIO);
  assert.equal(adulto.status, 201);
  assert.equal(adulto.corpo.status, 'aprovado');
  const [cadastro] = await sql`SELECT origem, pessoa_id FROM cadastro_voluntario WHERE id = ${adulto.corpo.cadastroVoluntarioId}`;
  assert.equal(cadastro.origem, 'painel');
  assert.equal(cadastro.pessoa_id, adulto.corpo.id);

  const menor = await post('/api/admin/pessoas', {
    ...VOLUNTARIO, cpf: '86288366757', email: 'menor@exemplo.invalid', dataNascimento: '2012-03-04',
  });
  assert.equal(menor.status, 201);
  assert.equal(menor.corpo.status, 'pendente');
  assert.equal(menor.corpo.autorizacaoStatus, 'pendente');
  assert.equal(menor.corpo.id, null, 'a pessoa só nasce na aprovação, depois da autorização');
});

test('o Painel não adiciona o papel de doador associado', async () => {
  const [p] = await sql`SELECT id FROM pessoa WHERE cpf = '39053344705'`;
  const r = await post(`/api/admin/pessoas/${p.id}/papeis`, { tipo: 'doador_associado' });
  assert.equal(r.status, 422);
  assert.equal(r.corpo.erro.codigo, 'PAPEL_NAO_PERMITIDO');
});

test('funcionário ativo não vira voluntário; voluntário vira funcionário só com confirmação', async () => {
  const [func] = await sql`SELECT id FROM pessoa WHERE cpf = '39053344705'`;
  const negado = await post(`/api/admin/pessoas/${func.id}/papeis`, { tipo: 'voluntario', ...VOLUNTARIO });
  assert.equal(negado.status, 422);
  assert.equal(negado.corpo.erro.codigo, 'FUNCIONARIO_NAO_PODE_SER_VOLUNTARIO');

  const [vol] = await sql`SELECT id FROM pessoa WHERE cpf = ${VOLUNTARIO.cpf}`;
  const aviso = await post(`/api/admin/pessoas/${vol.id}/papeis`, { tipo: 'funcionario' });
  assert.equal(aviso.status, 409);
  assert.equal(aviso.corpo.erro.confirmarAviso, true);

  const ok = await post(`/api/admin/pessoas/${vol.id}/papeis`, { tipo: 'funcionario', confirmar: true });
  assert.equal(ok.status, 201);
  const papeis = await sql`SELECT tipo, status FROM papel WHERE pessoa_id = ${vol.id} ORDER BY inicio_em`;
  assert.deepEqual(papeis.map((p) => `${p.tipo}:${p.status}`), ['voluntario:encerrado', 'funcionario:ativo']);
});

test('inativar o papel de doador tira o login, não apaga nada, e reativar devolve', async () => {
  assert.equal(await doadorEntra(doador.cookie), true);

  const r = await post(`/api/admin/pessoas/${doador.id}/inativar`, { papel: 'doador_associado' });
  assert.equal(r.status, 200);
  assert.equal(await doadorEntra(doador.cookie), false, 'doador inativo não entra no autoatendimento');

  const [pessoa] = await sql`SELECT nome, cpf, email FROM pessoa WHERE id = ${doador.id}`;
  assert.equal(pessoa.cpf, '52998224725', 'os dados continuam lá');
  const busca = await chamar('/api/admin/pessoas?situacao=inativos', { cookie: conta.cookie });
  assert.ok(busca.corpo.pessoas.some((p) => p.id === doador.id && p.ativo === false), 'inativo continua consultável');

  assert.equal((await post(`/api/admin/pessoas/${doador.id}/reativar`, { papel: 'doador_associado' })).status, 200);
  assert.equal(await doadorEntra(doador.cookie), true);
});

test('inativar com submissão em triagem avisa e só segue com confirmação (FR-023a)', async () => {
  const [p] = await sql`SELECT id FROM pessoa WHERE cpf = '39053344705'`;
  await sql`
    INSERT INTO candidatura (protocolo, cargo, nome, cpf, data_nascimento, telefone, email, curriculo_texto, criado_por)
    VALUES ('CAN-TESTE00001', 'cozinha', 'Funcionária Teste', '39053344705', '1985-01-02', '2433334444', 'func@exemplo.invalid', 'Experiência em cozinha.', 'teste')`;
  const aviso = await post(`/api/admin/pessoas/${p.id}/inativar`, { papel: 'funcionario' });
  assert.equal(aviso.status, 409);
  assert.equal(aviso.corpo.erro.confirmarAviso, true);
  const [ainda] = await sql`SELECT status FROM papel WHERE pessoa_id = ${p.id} AND tipo = 'funcionario'`;
  assert.equal(ainda.status, 'ativo');

  const ok = await post(`/api/admin/pessoas/${p.id}/inativar`, { papel: 'funcionario', confirmar: true });
  assert.equal(ok.status, 200);
});
