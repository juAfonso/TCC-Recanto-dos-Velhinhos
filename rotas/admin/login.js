// POST /api/admin/login { identificador, senha } → cookie ctx=admin (FR-040, research D4).
// Mesma mensagem para usuário inexistente e senha errada. Cinco falhas por IP + conta
// em 15 minutos → 429 (D13).

import { sql } from '../_lib/db.js';
import { conferir, gerarHash } from '../_lib/senha.js';
import { criarCookie } from '../_lib/sessao.js';
import { limiteAtingido, registrarTentativa, ipDe } from '../_lib/limite.js';
import { registrarAuditoria } from '../_lib/auditoria.js';
import { json, lerJson, falhar, rota } from '../_lib/http.js';

const MAX_FALHAS = 5;
const JANELA_MIN = 15;
// Hash de mentira, com os mesmos parâmetros, para conferir quando a conta não existe.
const hashFalso = gerarHash('conta-inexistente');

export const POST = rota(async (request) => {
  const { identificador, senha } = await lerJson(request);
  const id = String(identificador ?? '').trim().toLowerCase();
  if (!id || !senha) {
    falhar(400, 'CAMPOS_OBRIGATORIOS', 'Informe o usuário e a senha.', [!id ? 'identificador' : 'senha']);
  }

  const chaveLimite = `${ipDe(request)}|${id}`;
  if (await limiteAtingido('login_admin', chaveLimite, MAX_FALHAS, JANELA_MIN)) {
    falhar(429, 'MUITAS_TENTATIVAS', 'Muitas tentativas seguidas. Aguarde 15 minutos e tente de novo.');
  }

  const [conta] = await sql`
    SELECT id, identificador, senha_hash FROM conta_institucional
    WHERE lower(identificador) = ${id} AND ativo`;
  // Confere a senha mesmo sem conta, para o tempo de resposta não revelar se ela existe.
  const ok = await conferir(senha, conta?.senha_hash ?? (await hashFalso));
  if (!conta || !ok) {
    await registrarTentativa('login_admin', chaveLimite, JANELA_MIN);
    falhar(401, 'LOGIN_INVALIDO', 'Usuário ou senha incorretos.', ['senha']);
  }

  await registrarAuditoria({ autorTipo: 'conta_institucional', autorId: conta.id, acao: 'painel.login' });
  return json({ identificador: conta.identificador }, 200, { 'Set-Cookie': criarCookie({ ctx: 'admin', id: conta.id }) });
});
