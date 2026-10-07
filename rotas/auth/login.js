// POST /api/auth/login { email, senha } → cookie ctx=doador (FR-041, research D4).
// A MESMA mensagem para e-mail desconhecido, senha errada, senha ainda não criada, pessoa
// inativa ou papel de doador inativo: a tela não revela quem é associado (FR-006b, FR-046).
// Cinco falhas por IP + e-mail em 15 minutos → 429 (D13). Mesmo cookie do Painel, outro contexto:
// entrar como doador no computador da secretaria encerra a sessão do Painel naquele navegador.

import { sql } from '../_lib/db.js';
import { conferir, gerarHash } from '../_lib/senha.js';
import { criarCookie } from '../_lib/sessao.js';
import { limiteAtingido, registrarTentativa, ipDe } from '../_lib/limite.js';
import { registrarAuditoria } from '../_lib/auditoria.js';
import { json, lerJson, falhar, rota } from '../_lib/http.js';

const MAX_FALHAS = 5;
const JANELA_MIN = 15;
// Hash de mentira, com os mesmos parâmetros, para o tempo de resposta não revelar se o e-mail existe.
const hashFalso = gerarHash('doador-inexistente');

export const POST = rota(async (request) => {
  const { email, senha } = await lerJson(request);
  const emailLimpo = String(email ?? '').trim().toLowerCase();
  if (!emailLimpo || !senha) {
    falhar(400, 'CAMPOS_OBRIGATORIOS', 'Informe o e-mail e a senha.', [!emailLimpo ? 'email' : 'senha']);
  }

  const chaveLimite = `${ipDe(request)}|${emailLimpo}`;
  if (await limiteAtingido('login_doador', chaveLimite, MAX_FALHAS, JANELA_MIN)) {
    falhar(429, 'MUITAS_TENTATIVAS', 'Muitas tentativas seguidas. Aguarde 15 minutos e tente de novo.');
  }

  const [pessoa] = await sql`
    SELECT p.id, p.nome, p.senha_hash
    FROM pessoa p
    WHERE lower(p.email) = ${emailLimpo} AND p.ativo AND p.anonimizado_em IS NULL
      AND p.senha_hash IS NOT NULL AND p.senha_definida_em IS NOT NULL
      AND EXISTS (SELECT 1 FROM papel WHERE pessoa_id = p.id AND tipo = 'doador_associado' AND status = 'ativo')`;
  const ok = await conferir(String(senha), pessoa?.senha_hash ?? (await hashFalso));
  if (!pessoa || !ok) {
    await registrarTentativa('login_doador', chaveLimite, JANELA_MIN);
    falhar(401, 'LOGIN_INVALIDO', 'E-mail ou senha incorretos. Se ainda não criou sua senha, use "Esqueci minha senha".', ['senha']);
  }

  await registrarAuditoria({ autorTipo: 'doador', autorId: pessoa.id, acao: 'doador.login' });
  return json({ nome: pessoa.nome }, 200, { 'Set-Cookie': criarCookie({ ctx: 'doador', id: pessoa.id }) });
});
