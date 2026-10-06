// POST /api/auth/link-senha { email } — "Esqueci minha senha / não recebi o link" (FR-046, research D11).
// Doador associado sem senha → link de definição (7 dias); com senha → redefinição (1 hora).
// A resposta é SEMPRE a mesma, inclusive para e-mail desconhecido ou acima do limite
// (3 por e-mail por hora): ninguém descobre por aqui se um e-mail está cadastrado.

import { sql } from '../_lib/db.js';
import { emitirLink, origemDoSite } from '../_lib/conta-doador.js';
import { verificarLimite } from '../_lib/limite.js';
import { email as validarEmail } from '../_lib/validacao.js';
import { json, lerJson, falhar, rota } from '../_lib/http.js';

const RESPOSTA = {
  mensagem: 'Se este e-mail for de um doador associado, você vai receber em instantes um link para criar uma nova senha. Confira também a caixa de spam.',
};

export const POST = rota(async (request) => {
  const corpo = await lerJson(request);
  const email = String(corpo.email ?? '').trim().toLowerCase();
  const erro = validarEmail(email);
  if (erro) falhar(400, 'DADOS_INVALIDOS', erro, ['email']);

  if (await verificarLimite('link_senha', email, 3, 60)) {
    const [pessoa] = await sql`
      SELECT p.id, p.senha_definida_em
      FROM pessoa p
      WHERE lower(p.email) = ${email} AND p.ativo AND p.anonimizado_em IS NULL
        AND EXISTS (SELECT 1 FROM papel WHERE pessoa_id = p.id AND tipo = 'doador_associado' AND status = 'ativo')`;
    if (pessoa) {
      await emitirLink(pessoa.id, pessoa.senha_definida_em ? 'redefinir' : 'definir', origemDoSite(request));
    }
  }
  return json(RESPOSTA);
});
