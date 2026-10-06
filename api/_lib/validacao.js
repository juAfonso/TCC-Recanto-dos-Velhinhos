// Validadores puros. Cada um devolve `null` se o valor é válido, ou a mensagem em
// português que a tela mostra ao lado do campo (Princípio II, contracts/api.md → campos[]).

import { hojeBrasilia } from './datas.js';

export const soDigitos = (texto) => String(texto ?? '').replace(/\D/g, '');

const vazio = (v) => v === undefined || v === null || String(v).trim() === '';

export function obrigatorio(valor, rotulo = 'Este campo') {
  return vazio(valor) ? `${rotulo} é obrigatório.` : null;
}

export function cpf(valor) {
  const d = soDigitos(valor);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return 'CPF inválido. Confira os 11 números.';
  for (const tamanho of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * (tamanho + 1 - i);
    const digito = ((soma * 10) % 11) % 10;
    if (digito !== Number(d[tamanho])) return 'CPF inválido. Confira os 11 números.';
  }
  return null;
}

// DDDs em uso no Brasil (Anatel).
const DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

// DDD + 8 dígitos (fixo, começa de 2 a 5) ou DDD + 9 dígitos (celular, começa com 9) — FR-037a.
export function telefone(valor) {
  const d = soDigitos(valor);
  const mensagem = 'Telefone inválido. Use DDD + número, por exemplo (24) 99999-9999.';
  if (d.length !== 10 && d.length !== 11) return mensagem;
  if (!DDDS.has(Number(d.slice(0, 2)))) return mensagem;
  if (d.length === 11 && d[2] !== '9') return mensagem;
  if (d.length === 10 && !/[2-5]/.test(d[2])) return mensagem;
  return null;
}

export function email(valor) {
  const texto = String(valor ?? '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto) && texto.length <= 254
    ? null
    : 'E-mail inválido. Confira se está completo, por exemplo nome@gmail.com.';
}

export function cep(valor) {
  return soDigitos(valor).length === 8 ? null : 'CEP inválido. Use os 8 números.';
}

const UFS = new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '));

export function uf(valor) {
  return UFS.has(String(valor ?? '').trim().toUpperCase()) ? null : 'Estado inválido. Escolha uma UF da lista.';
}

// Valor em reais, mínimo R$ 1,00 (2026-10-03), no máximo duas casas decimais.
export function valorMonetario(valor, minimo = 1) {
  const texto = String(valor ?? '').trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(texto)) return 'Valor inválido. Use só números, por exemplo 25,00.';
  if (Number(texto) < minimo) return `O valor mínimo é R$ ${minimo.toFixed(2).replace('.', ',')}.`;
  return null;
}

// 'AAAA-MM-DD' válida.
export function data(valor) {
  const texto = String(valor ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return 'Data inválida.';
  const d = new Date(`${texto}T00:00:00Z`);
  return !isNaN(d) && d.toISOString().slice(0, 10) === texto ? null : 'Data inválida.';
}

// Hoje ou depois, no fuso de Brasília.
export function dataNaoPassada(valor) {
  return data(valor) ?? (String(valor) < hojeBrasilia() ? 'A data não pode estar no passado.' : null);
}

// Recebe { campo: mensagem|null } e devolve { campos, mensagem } se houver erro, senão null.
// Uso: const falha = conferir({ cpf: cpf(corpo.cpf), email: email(corpo.email) });
export function conferir(resultados) {
  const campos = Object.keys(resultados).filter((c) => resultados[c]);
  if (!campos.length) return null;
  return { campos, mensagem: resultados[campos[0]] };
}
