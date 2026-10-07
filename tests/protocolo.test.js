// FR-043 (parte 1) — protocolos únicos, no formato e alfabeto definidos, sem ordem
// previsível (research D6, contracts/api.md, teste 2). Parte 2 (FR-044, FR-044a): a consulta
// pública responde igual a protocolo inexistente e mal formado, não mostra dado pessoal e limita
// as tentativas por IP.

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { prepararBanco, chamar, sql } from './_apoio.js';
import { gerarProtocolo, formatoValido, normalizarProtocolo } from '../rotas/_lib/protocolo.js';

before(prepararBanco);

const QUANTIDADE = 10_000;
const FORMATO = /^(VOL|CAN|SOL)-[0-9A-HJKMNP-TV-Z]{10}$/;

for (const prefixo of ['VOL', 'CAN', 'SOL']) {
  test(`${QUANTIDADE} protocolos ${prefixo}: únicos, no formato e sem ordem previsível`, () => {
    const gerados = Array.from({ length: QUANTIDADE }, () => gerarProtocolo(prefixo));

    assert.equal(new Set(gerados).size, QUANTIDADE, 'houve protocolo repetido');
    for (const p of gerados) {
      assert.match(p, FORMATO);
      assert.ok(formatoValido(p));
      assert.ok(!/[ILOU]/.test(p.slice(4)), `caractere ambíguo em ${p}`);
    }

    // Sorteio: cada protocolo é maior que o anterior em ~50% dos casos. Um gerador
    // sequencial ou baseado no relógio daria perto de 100%.
    let crescentes = 0;
    for (let i = 1; i < gerados.length; i++) if (gerados[i] > gerados[i - 1]) crescentes++;
    const proporcao = crescentes / (gerados.length - 1);
    assert.ok(proporcao > 0.45 && proporcao < 0.55, `proporção de crescentes suspeita: ${proporcao}`);
  });
}

test('formato inválido é recusado', () => {
  for (const texto of ['', 'VOL-123', 'XYZ-0123456789', 'VOL-0123456789A', 'vol-0123456789', 'VOL-012345678I', 'VOL 0123456789']) {
    assert.equal(formatoValido(texto), false, texto);
  }
});

test('o que a pessoa digita é normalizado antes de conferir', () => {
  assert.equal(normalizarProtocolo('  vol-7k2m9xq4rt '), 'VOL-7K2M9XQ4RT');
  assert.ok(formatoValido(normalizarProtocolo('  vol-7k2m9xq4rt ')));
});

test('prefixo desconhecido não gera protocolo', () => {
  assert.throws(() => gerarProtocolo('DOA'));
});

// Cada teste usa um IP próprio, para o limite de um não contaminar o outro.
const consultar = (protocolo, ip) =>
  chamar(`/api/public/status/${encodeURIComponent(protocolo)}`, { cabecalhos: { 'x-forwarded-for': ip } });

test('consulta mostra só tipo, status e data — nenhum dado pessoal (FR-044)', async () => {
  const protocolo = gerarProtocolo('CAN');
  await sql`
    INSERT INTO candidatura (protocolo, cargo, nome, cpf, data_nascimento, telefone, email, curriculo_texto, status, criado_por)
    VALUES (${protocolo}, 'cozinha', 'Pessoa Sigilosa', '39053344705', '1990-01-01', '24999998888',
            'sigilo@exemplo.invalid', 'Experiência.', 'entrevista', 'teste')`;
  const r = await consultar(protocolo.toLowerCase(), '198.51.100.1');
  assert.equal(r.status, 200);
  assert.deepEqual(Object.keys(r.corpo).sort(), ['data', 'rotuloStatus', 'status', 'tipo']);
  assert.equal(r.corpo.tipo, 'candidatura');
  assert.equal(r.corpo.rotuloStatus, 'Chamado para entrevista');
  const texto = JSON.stringify(r.corpo);
  for (const pessoal of ['Sigilosa', '39053344705', 'sigilo@', '24999998888']) assert.ok(!texto.includes(pessoal));
});

test('protocolo inexistente e mal formado recebem a mesma resposta (FR-044a)', async () => {
  const inexistente = await consultar(gerarProtocolo('VOL'), '198.51.100.2');
  const malFormado = await consultar('isso-nao-e-protocolo', '198.51.100.2');
  assert.equal(inexistente.status, 404);
  assert.equal(malFormado.status, inexistente.status);
  assert.deepEqual(malFormado.corpo, inexistente.corpo);
  for (const cabecalho of ['content-type', 'cache-control']) {
    assert.equal(malFormado.headers.get(cabecalho), inexistente.headers.get(cabecalho), cabecalho);
  }
});

test('a 11ª consulta do mesmo IP em 15 minutos é barrada (FR-044a)', async () => {
  for (let i = 0; i < 10; i++) assert.equal((await consultar(gerarProtocolo('SOL'), '198.51.100.3')).status, 404);
  const decima = await consultar(gerarProtocolo('SOL'), '198.51.100.3');
  assert.equal(decima.status, 429);
  assert.equal((await consultar(gerarProtocolo('SOL'), '198.51.100.4')).status, 404, 'outro IP segue normal');
});
