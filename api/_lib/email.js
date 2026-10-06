// Envio de e-mail pelo SMTP do Gmail institucional (research D5, CLAUDE.md 2026-09-23).
// Política (FR-049a): o registro já foi gravado antes; tenta com tempo-limite de 8 s,
// espera 3 s e tenta de novo; se falhar outra vez, grava em falha_email e devolve false.
// NUNCA lança erro: falha de e-mail não pode derrubar nem reverter o que o usuário fez.

import nodemailer from 'nodemailer';
import { sql } from './db.js';
import { montarEmail } from './email-modelos.js';

const TEMPO_LIMITE_MS = 8000;
const ESPERA_ENTRE_TENTATIVAS_MS = 3000;
const MOTIVOS = new Set(['confirmacao', 'triagem', 'definir_senha', 'redefinir_senha']);

// Com EMAIL_MODO=teste (definido por tests/_apoio.js), nada sai: as mensagens ficam aqui.
export const caixaDeTeste = [];

let transporte;
function transporteGmail() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('GMAIL_USER ou GMAIL_APP_PASSWORD não definidos');
  transporte ??= nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    connectionTimeout: TEMPO_LIMITE_MS,
    greetingTimeout: TEMPO_LIMITE_MS,
    socketTimeout: TEMPO_LIMITE_MS,
  });
  return transporte;
}

async function tentar(mensagem) {
  // Desenvolvimento sem Gmail configurado: o e-mail aparece no terminal do `npm run dev`.
  if (process.env.EMAIL_MODO === 'console') {
    console.log(`\n───── E-mail (não enviado: EMAIL_MODO=console) ─────\nPara: ${mensagem.to}\nAssunto: ${mensagem.subject}\n\n${mensagem.text}\n────────────────────────────────────────────────────\n`);
    return;
  }
  if (process.env.EMAIL_MODO === 'teste') {
    if (process.env.EMAIL_FALHAR === '1') throw new Error('falha simulada');
    caixaDeTeste.push(mensagem);
    return;
  }
  let cronometro;
  const limite = new Promise((_, rejeitar) => {
    cronometro = setTimeout(() => rejeitar(new Error('tempo-limite de 8 s')), TEMPO_LIMITE_MS);
  });
  try {
    await Promise.race([transporteGmail().sendMail(mensagem), limite]);
  } finally {
    clearTimeout(cronometro);
  }
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Devolve true se enviou, false se falhou duas vezes (e a falha ficou registrada).
export async function enviarEmail({ para, modelo, dados = {}, motivo, entidadeTipo = null, entidadeId = null }) {
  if (!MOTIVOS.has(motivo)) throw new Error(`motivo de e-mail inválido: ${motivo}`);
  const { assunto, texto } = montarEmail(modelo, dados);
  const mensagem = {
    from: `Recanto dos Velhinhos <${process.env.GMAIL_USER ?? 'nao-configurado@invalid'}>`,
    to: para,
    subject: assunto,
    text: texto,
  };

  let ultimoErro;
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    try {
      await tentar(mensagem);
      return true;
    } catch (e) {
      ultimoErro = e;
      if (tentativa === 1) await esperar(process.env.EMAIL_MODO === 'teste' ? 0 : ESPERA_ENTRE_TENTATIVAS_MS);
    }
  }

  // Mensagem técnica sem dado pessoal: tira qualquer endereço de e-mail do texto do erro.
  const erroLimpo = String(ultimoErro?.message ?? ultimoErro).replace(/[^\s<>"']+@[^\s<>"']+/g, '[e-mail]').slice(0, 500);
  try {
    await sql`
      INSERT INTO falha_email (destinatario, motivo, modelo, entidade_tipo, entidade_id, erro)
      VALUES (${para}, ${motivo}, ${modelo}, ${entidadeTipo}, ${entidadeId}, ${erroLimpo})`;
  } catch (e) {
    console.error('Não foi possível registrar a falha de e-mail', e);
  }
  return false;
}
