// FR-043 (parte 1) — protocolos únicos, no formato e alfabeto definidos, sem ordem
// previsível (research D6, contracts/api.md, teste 2). A parte 2 (consulta com resposta
// idêntica para inexistente e mal formado, FR-044a) vem com a rota de consulta (T117).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gerarProtocolo, formatoValido, normalizarProtocolo } from '../api/_lib/protocolo.js';

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
