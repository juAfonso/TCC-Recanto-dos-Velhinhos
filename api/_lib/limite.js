// Limite de tentativas guardado no próprio PostgreSQL (research D13).
// A chave gravada é o SHA-256 de escopo + IP/e-mail: o IP nunca fica em claro.
// Janela fixa: a contagem recomeça a cada `janelaMin` minutos.

import { createHash } from 'node:crypto';
import { sql } from './db.js';

const chaveDe = (escopo, chaveBruta) =>
  createHash('sha256').update(`${escopo}:${String(chaveBruta).toLowerCase()}`).digest('hex');

const inicioDaJanela = (janelaMin, agora = Date.now()) => {
  const ms = janelaMin * 60 * 1000;
  return new Date(Math.floor(agora / ms) * ms);
};

// Soma uma tentativa e devolve a contagem atual da janela.
export async function registrarTentativa(escopo, chaveBruta, janelaMin) {
  const [linha] = await sql`
    INSERT INTO limite_tentativa (chave, janela_inicio, contagem)
    VALUES (${chaveDe(escopo, chaveBruta)}, ${inicioDaJanela(janelaMin)}, 1)
    ON CONFLICT (chave, janela_inicio) DO UPDATE SET contagem = limite_tentativa.contagem + 1
    RETURNING contagem`;
  return linha.contagem;
}

// Só consulta, sem somar (usado no login, que conta apenas as falhas).
export async function limiteAtingido(escopo, chaveBruta, maximo, janelaMin) {
  const [linha] = await sql`
    SELECT contagem FROM limite_tentativa
    WHERE chave = ${chaveDe(escopo, chaveBruta)} AND janela_inicio = ${inicioDaJanela(janelaMin)}`;
  return (linha?.contagem ?? 0) >= maximo;
}

// Soma uma tentativa e diz se ainda pode seguir (contagem dentro do máximo).
export async function verificarLimite(escopo, chaveBruta, maximo, janelaMin) {
  return (await registrarTentativa(escopo, chaveBruta, janelaMin)) <= maximo;
}

// IP de quem chamou, como a Vercel informa. Usado só para formar a chave com hash.
export function ipDe(request) {
  const encaminhado = request.headers.get('x-forwarded-for');
  return encaminhado?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'desconhecido';
}
