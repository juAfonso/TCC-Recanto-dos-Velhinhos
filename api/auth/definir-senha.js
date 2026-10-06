// POST /api/auth/definir-senha { token, senha } — usa o link de definição ou redefinição (D11).
// O link vale uma vez só, dentro do prazo, e só para doador associado ativo. Definir a senha
// encerra as sessões de autoatendimento abertas antes (exigirDoador compara com senha_definida_em)
// e invalida os outros links pendentes da pessoa.

import { transacao } from '../_lib/db.js';
import { gerarHash, hashToken } from '../_lib/senha.js';
import { registrarAuditoria } from '../_lib/auditoria.js';
import { json, lerJson, falhar, rota } from '../_lib/http.js';

const TAMANHO_MINIMO = 8;
const LINK_INVALIDO = 'Este link não vale mais: ele vence em pouco tempo e só pode ser usado uma vez. Peça um novo link logo abaixo.';

export const POST = rota(async (request) => {
  const { token, senha } = await lerJson(request);
  if (typeof senha !== 'string' || senha.length < TAMANHO_MINIMO) {
    falhar(400, 'SENHA_CURTA', `A senha precisa ter pelo menos ${TAMANHO_MINIMO} caracteres.`, ['senha']);
  }
  if (senha.length > 200) falhar(400, 'SENHA_LONGA', 'A senha pode ter no máximo 200 caracteres.', ['senha']);
  if (typeof token !== 'string' || !token) falhar(400, 'LINK_INVALIDO_OU_EXPIRADO', LINK_INVALIDO);

  const hash = await gerarHash(senha);
  const pessoaId = await transacao(async (tx) => {
    const [link] = await tx.query(
      `SELECT t.id, t.pessoa_id, t.finalidade
       FROM token_senha t
       JOIN pessoa p ON p.id = t.pessoa_id
       WHERE t.token_hash = $1 AND t.usado_em IS NULL AND t.invalidado_em IS NULL AND t.expira_em > now()
         AND p.ativo AND p.anonimizado_em IS NULL
         AND EXISTS (SELECT 1 FROM papel WHERE pessoa_id = p.id AND tipo = 'doador_associado' AND status = 'ativo')
       FOR UPDATE OF t`,
      [hashToken(token)]);
    if (!link) return null;

    await tx.query('UPDATE token_senha SET usado_em = now() WHERE id = $1', [link.id]);
    await tx.query(
      `UPDATE token_senha SET invalidado_em = now()
       WHERE pessoa_id = $1 AND id <> $2 AND usado_em IS NULL AND invalidado_em IS NULL`,
      [link.pessoa_id, link.id]);
    await tx.query(
      `UPDATE pessoa SET senha_hash = $2, senha_definida_em = now(), atualizado_por = 'doador', atualizado_em = now()
       WHERE id = $1`,
      [link.pessoa_id, hash]);
    await registrarAuditoria({
      autorTipo: 'doador', autorId: link.pessoa_id,
      acao: link.finalidade === 'definir' ? 'doador.definir_senha' : 'doador.redefinir_senha',
      entidadeTipo: 'pessoa', entidadeId: link.pessoa_id,
    }, tx);
    return link.pessoa_id;
  });

  if (!pessoaId) falhar(400, 'LINK_INVALIDO_OU_EXPIRADO', LINK_INVALIDO);
  return json({ ok: true, mensagem: 'Senha criada! Agora você já pode entrar na área do doador.' });
});
