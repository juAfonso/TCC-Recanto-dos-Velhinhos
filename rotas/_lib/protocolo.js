// Código de protocolo (research D6): prefixo + 10 caracteres Crockford Base32 sorteados.
// Sem I, L, O e U, para não confundir na leitura. ~50 bits: não dá para adivinhar.
// Doação não tem protocolo (2026-10-04).

import { randomBytes } from 'node:crypto';

const ALFABETO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // 32 símbolos
const PREFIXOS = new Set(['VOL', 'CAN', 'SOL']);
const FORMATO = /^(VOL|CAN|SOL)-[0-9A-HJKMNP-TV-Z]{10}$/;

export function gerarProtocolo(prefixo) {
  if (!PREFIXOS.has(prefixo)) throw new Error(`Prefixo de protocolo inválido: ${prefixo}`);
  // 256 é múltiplo de 32, então `byte % 32` é uniforme.
  const corpo = Array.from(randomBytes(10), (b) => ALFABETO[b % 32]).join('');
  return `${prefixo}-${corpo}`;
}

// Aceita o que a pessoa digitou (minúsculas, espaços) e devolve no formato canônico.
export function normalizarProtocolo(texto) {
  return String(texto ?? '').trim().toUpperCase().replace(/\s+/g, '');
}

export function formatoValido(texto) {
  return FORMATO.test(String(texto ?? ''));
}
