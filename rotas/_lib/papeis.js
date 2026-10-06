// Pessoas e papéis (FR-048, research D14). Uma pessoa por CPF; um papel por linha.
// Funcionário e voluntário ativos são exclusivos — o banco garante pelo índice
// `papel_exclusivo_ativo`, e aqui a violação vira uma mensagem compreensível.
// Todas as funções recebem `tx` (de transacao()) porque sempre fazem parte de algo maior.

import { soDigitos } from './validacao.js';
import { falhar } from './http.js';

// Encontra pela CPF (não anonimizada) ou cria. Não sobrescreve dados de quem já existe.
export async function encontrarOuCriarPessoa(tx, { cpf, nome, email = null, telefone = null, dataNascimento = null }, autor) {
  const digitos = soDigitos(cpf);
  const [existente] = await tx.query(
    'SELECT id FROM pessoa WHERE cpf = $1 AND anonimizado_em IS NULL', [digitos]);
  if (existente) return { id: existente.id, criada: false };
  const [nova] = await tx.query(
    `INSERT INTO pessoa (cpf, nome, email, telefone, data_nascimento, criado_por)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [digitos, nome, email, telefone, dataNascimento, autor]);
  return { id: nova.id, criada: true };
}

export async function adicionarPapel(tx, pessoaId, tipo, origemId, autor) {
  try {
    const [papel] = await tx.query(
      `INSERT INTO papel (pessoa_id, tipo, origem_id, criado_por) VALUES ($1, $2, $3, $4) RETURNING id`,
      [pessoaId, tipo, origemId ?? null, autor]);
    return papel.id;
  } catch (e) {
    if (e.code === '23505' && String(e.constraint ?? e.message).includes('papel_exclusivo_ativo')) {
      falhar(422, 'FUNCIONARIO_NAO_PODE_SER_VOLUNTARIO',
        'Esta pessoa já tem um vínculo ativo de funcionário ou voluntário. Funcionário não pode ser voluntário ao mesmo tempo.');
    }
    throw e;
  }
}

async function mudarStatus(tx, pessoaId, tipo, de, para, autor) {
  return tx.query(
    `UPDATE papel SET status = $4, alterado_por = $5, alterado_em = now(),
            fim_em = CASE WHEN $4 = 'ativo' THEN NULL ELSE now() END
     WHERE pessoa_id = $1 AND tipo = $2 AND status = $3 RETURNING id`,
    [pessoaId, tipo, de, para, autor]);
}

// Terminal: efetivação do voluntário como funcionário; revogação do doador (FR-057).
export const encerrarPapel = (tx, pessoaId, tipo, autor) => mudarStatus(tx, pessoaId, tipo, 'ativo', 'encerrado', autor);

// Reversível pelo Painel (FR-024).
export const inativarPapel = (tx, pessoaId, tipo, autor) => mudarStatus(tx, pessoaId, tipo, 'ativo', 'inativo', autor);
export const reativarPapel = (tx, pessoaId, tipo, autor) => mudarStatus(tx, pessoaId, tipo, 'inativo', 'ativo', autor);
