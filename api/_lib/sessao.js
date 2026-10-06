// Cookie de sessão assinado com HMAC-SHA256 (research D4). Sem tabela de sessões:
// o cookie carrega { ctx, id, emitidaEm, expiraEm } e a assinatura impede alteração.
// Dois contextos, e só dois: 'admin' (conta institucional) e 'doador' (doador associado).

import { createHmac, timingSafeEqual } from 'node:crypto';

const NOME = 'sage_sessao';
const VALIDADE_MS = 8 * 60 * 60 * 1000;

function segredo() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET ausente ou curto (mínimo 32 caracteres)');
  return s;
}

const assinar = (dados) => createHmac('sha256', segredo()).update(dados).digest('base64url');

const atributos = 'HttpOnly; Secure; SameSite=Lax; Path=/';

// Devolve o valor do cabeçalho Set-Cookie.
// Sem Max-Age de propósito (decisão de 2026-10-06): é cookie de sessão do navegador, então
// fechar o navegador encerra o login — o computador da secretaria é compartilhado. As 8 h
// continuam valendo pelo `expiraEm` assinado, conferido no servidor a cada requisição.
export function criarCookie({ ctx, id }, agora = Date.now()) {
  if (ctx !== 'admin' && ctx !== 'doador') throw new Error(`Contexto de sessão inválido: ${ctx}`);
  const dados = Buffer.from(JSON.stringify({ ctx, id, emitidaEm: agora, expiraEm: agora + VALIDADE_MS })).toString('base64url');
  return `${NOME}=${dados}.${assinar(dados)}; ${atributos}`;
}

// Apaga o cookie no navegador (logout).
export function cookieDeSaida() {
  return `${NOME}=; ${atributos}; Max-Age=0`;
}

function lerCookie(request, nome) {
  const cabecalho = request.headers.get('cookie') || '';
  for (const parte of cabecalho.split(';')) {
    const [chave, ...valor] = parte.trim().split('=');
    if (chave === nome) return valor.join('=');
  }
  return null;
}

// Devolve { ctx, id, emitidaEm, expiraEm } ou null se ausente, adulterado ou vencido.
export function lerSessao(request, agora = Date.now()) {
  const valor = lerCookie(request, NOME);
  if (!valor) return null;
  const [dados, assinatura] = valor.split('.');
  if (!dados || !assinatura) return null;
  const esperado = Buffer.from(assinar(dados));
  const recebido = Buffer.from(assinatura);
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return null;
  try {
    const sessao = JSON.parse(Buffer.from(dados, 'base64url').toString('utf8'));
    if (typeof sessao.expiraEm !== 'number' || sessao.expiraEm <= agora) return null;
    if (sessao.ctx !== 'admin' && sessao.ctx !== 'doador') return null;
    return sessao;
  } catch {
    return null;
  }
}
