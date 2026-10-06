// Conta do doador associado (FR-006, FR-006a, FR-006b, FR-046, research D11 e D15).
//
// Quem já tem cadastro:
// - CPF ou e-mail de um doador associado → bloqueia com a mensagem neutra (FR-006b).
// - E-mail que já pertence a OUTRA pessoa (CPF diferente) → bloqueia com a mesma mensagem.
//   Sem isso, o cadastro novo colidiria com o e-mail único da pessoa existente; e quem
//   digitou o e-mail de outra pessoa não pode ganhar nada com isso (2026-10-06).
// - CPF de pessoa já cadastrada sem papel de doador (ex.: voluntária) → segue; o papel é
//   adicionado ao cadastro existente e o link vai para o e-mail QUE JÁ ESTÁ NO CADASTRO (D15).

import { sql, executorPadrao } from './db.js';
import { soDigitos } from './validacao.js';
import { gerarToken, hashToken } from './senha.js';
import { enviarEmail } from './email.js';
import { adicionarPapel } from './papeis.js';

export const MENSAGEM_NEUTRA =
  'Se você já é associado, entre no autoatendimento para doar. Se não, faça a doação espontânea.';

const VALIDADE = { definir: '7 days', redefinir: '1 hour' };

// Devolve { bloqueado, pessoaId } — pessoaId só quando o CPF já existe e pode receber o papel.
export async function verificarAssociativa({ cpf, email }, executor = executorPadrao) {
  const digitos = soDigitos(cpf);
  const emailNormal = String(email ?? '').trim().toLowerCase();
  const pessoas = await executor.query(
    `SELECT p.id, p.cpf, lower(p.email) AS email,
            EXISTS (SELECT 1 FROM papel WHERE pessoa_id = p.id AND tipo = 'doador_associado') AS doador
     FROM pessoa p
     WHERE p.anonimizado_em IS NULL AND (p.cpf = $1 OR lower(p.email) = $2)`,
    [digitos, emailNormal]);

  if (pessoas.some((p) => p.doador)) return { bloqueado: true };
  const pelaCpf = pessoas.find((p) => p.cpf === digitos);
  const outraComEmail = pessoas.find((p) => p.email === emailNormal && p.cpf !== digitos);
  if (outraComEmail) return { bloqueado: true };
  return { bloqueado: false, pessoaId: pelaCpf?.id ?? null };
}

// Dentro de uma transação: cria a pessoa ou reaproveita a do CPF, e adiciona o papel de doador.
// Devolve o id da pessoa. Chamar só depois de verificarAssociativa() não ter bloqueado.
export async function prepararDoador(tx, { nome, cpf, email, telefone }, pessoaExistenteId) {
  let pessoaId = pessoaExistenteId;
  if (!pessoaId) {
    const [nova] = await tx.query(
      `INSERT INTO pessoa (cpf, nome, email, telefone, criado_por) VALUES ($1, $2, $3, $4, 'publico') RETURNING id`,
      [soDigitos(cpf), String(nome).trim(), String(email).trim().toLowerCase(), soDigitos(telefone)]);
    pessoaId = nova.id;
  }
  await adicionarPapel(tx, pessoaId, 'doador_associado', null, 'publico');
  return pessoaId;
}

// Gera um link de definição (7 dias) ou redefinição (1 hora) e o envia ao e-mail DO CADASTRO.
// Links anteriores da mesma finalidade deixam de valer. O banco guarda só o hash do token.
// `baseUrl` é a origem do site (APP_URL ou a do próprio pedido).
export async function emitirLink(pessoaId, finalidade, baseUrl) {
  if (!VALIDADE[finalidade]) throw new Error(`Finalidade de link inválida: ${finalidade}`);
  const [pessoa] = await sql`SELECT nome, email FROM pessoa WHERE id = ${pessoaId} AND anonimizado_em IS NULL`;
  if (!pessoa?.email) return false;

  const token = gerarToken();
  await sql`
    UPDATE token_senha SET invalidado_em = now()
    WHERE pessoa_id = ${pessoaId} AND finalidade = ${finalidade} AND usado_em IS NULL AND invalidado_em IS NULL`;
  await sql`
    INSERT INTO token_senha (pessoa_id, finalidade, token_hash, expira_em)
    VALUES (${pessoaId}, ${finalidade}, ${hashToken(token)}, now() + ${VALIDADE[finalidade]}::interval)`;

  // O token vai depois do "#": o navegador não o envia ao servidor nem a outros sites.
  const link = `${String(baseUrl).replace(/\/$/, '')}/definir-senha.html#token=${token}`;
  return enviarEmail({
    para: pessoa.email,
    modelo: finalidade === 'definir' ? 'definir_senha' : 'redefinir_senha',
    dados: { nome: pessoa.nome, link },
    motivo: finalidade === 'definir' ? 'definir_senha' : 'redefinir_senha',
    entidadeTipo: 'pessoa',
    entidadeId: pessoaId,
  });
}

// Origem para montar links: APP_URL (produção) ou a do próprio pedido (desenvolvimento).
export const origemDoSite = (request) => process.env.APP_URL || new URL(request.url).origin;
