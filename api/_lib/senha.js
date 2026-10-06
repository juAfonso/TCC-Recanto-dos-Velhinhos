// Senhas com scrypt e salt aleatório por senha; tokens de link de senha (research D4, D11).
// Zero dependências: só node:crypto.

import { scrypt as scryptCallback, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const PARAMETROS = { N: 16384, r: 8, p: 1 };
const TAMANHO = 64;

// Formato guardado: scrypt$N$r$p$salt$hash (salt e hash em base64).
export async function gerarHash(senha) {
  const salt = randomBytes(16);
  const hash = await scrypt(String(senha), salt, TAMANHO, PARAMETROS);
  const { N, r, p } = PARAMETROS;
  return ['scrypt', N, r, p, salt.toString('base64'), hash.toString('base64')].join('$');
}

export async function conferir(senha, guardado) {
  if (typeof guardado !== 'string') return false;
  const [algoritmo, N, r, p, saltB64, hashB64] = guardado.split('$');
  if (algoritmo !== 'scrypt' || !hashB64) return false;
  const esperado = Buffer.from(hashB64, 'base64');
  const calculado = await scrypt(String(senha), Buffer.from(saltB64, 'base64'), esperado.length, {
    N: Number(N), r: Number(r), p: Number(p),
  });
  return timingSafeEqual(calculado, esperado);
}

// Token de 32 bytes que vai na URL do e-mail. O banco guarda só o hash.
export function gerarToken() {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

// Senha aleatória legível para a conta institucional (mostrada uma única vez pelo seed).
export function gerarSenhaAleatoria(tamanho = 16) {
  const alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(tamanho);
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join('');
}
