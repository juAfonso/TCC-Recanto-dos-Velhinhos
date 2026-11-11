// Relatório de doações (2026-11-10): leitura dos filtros e totais. Funções puras, sem banco.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerFiltros, lerValor, resumir } from '../rotas/_lib/relatorio-doacoes.js';

const p = (o) => new URLSearchParams(o);

test('sem filtros: mês corrente até hoje, só confirmadas, todas os tipos, por data', () => {
  const { filtros } = lerFiltros(p({}), '2026-11-10');
  assert.deepEqual(filtros, {
    de: '2026-11-01', ate: '2026-11-10', valorMin: null, valorMax: null,
    tipo: 'todas', situacao: 'confirmada', ordem: 'data',
  });
});

test('valores aceitam vírgula, ponto de milhar e R$', () => {
  assert.equal(lerValor('10'), 10);
  assert.equal(lerValor('10,50'), 10.5);
  assert.equal(lerValor('1.234,56'), 1234.56);
  assert.equal(lerValor('R$ 50'), 50);
  assert.equal(lerValor('  '), null);
  assert.ok(Number.isNaN(lerValor('abc')));
  assert.ok(Number.isNaN(lerValor('-5')));
});

test('filtros inválidos voltam com a mensagem de cada campo', () => {
  const { erros } = lerFiltros(p({ de: '2026-02-30', ate: '2026-01-01', valorMin: 'x', tipo: 'outra' }), '2026-11-10');
  assert.ok(erros.de);
  assert.ok(erros.valorMin);
  assert.ok(erros.tipo);
  assert.ok(lerFiltros(p({ de: '2026-05-01', ate: '2026-04-01' })).erros.ate);
  assert.ok(lerFiltros(p({ valorMin: '100', valorMax: '10' })).erros.valorMax);
});

test('resumo separa espontânea e associativa, soma em centavos e agrupa por mês de Brasília', () => {
  const resumo = resumir([
    { tipo: 'espontanea', valor: 0.1, declaradaEm: '2026-10-15T15:00:00Z' },
    { tipo: 'espontanea', valor: 0.2, declaradaEm: '2026-10-20T15:00:00Z' },
    { tipo: 'associativa', valor: 50, declaradaEm: '2026-11-01T02:00:00Z' }, // 31/10 23h em Brasília
    { tipo: 'associativa', valor: 100, declaradaEm: '2026-11-05T12:00:00Z' },
  ]);
  assert.equal(resumo.quantidade, 4);
  assert.equal(resumo.total, 150.3);
  assert.deepEqual(resumo.porTipo.espontanea, { quantidade: 2, total: 0.3 });
  assert.deepEqual(resumo.porTipo.associativa, { quantidade: 2, total: 150 });
  assert.equal(resumo.menor, 0.1);
  assert.equal(resumo.maior, 100);
  assert.deepEqual(resumo.porMes.map((m) => [m.mes, m.total.total]), [['2026-10', 50.3], ['2026-11', 100]]);
});

test('resumo vazio', () => {
  const r = resumir([]);
  assert.equal(r.quantidade, 0);
  assert.equal(r.total, 0);
  assert.equal(r.media, 0);
  assert.deepEqual(r.porMes, []);
});
