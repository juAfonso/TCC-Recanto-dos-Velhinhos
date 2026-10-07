// Gestão de pessoas no Painel (US7, FR-023 a FR-024, FR-048). Decisões de 2026-10-07:
// - o Painel cadastra funcionário e voluntário; doador associado só nasce com a primeira doação
//   associativa (2026-10-04), então o Painel não cria esse papel;
// - inativar e reativar é papel por papel (a pessoa pode deixar de ser voluntária e continuar doadora);
// - funcionário não registra consentimento: o vínculo de trabalho é a base do cadastro.

import * as v from './validacao.js';
import { hojeBrasilia } from './datas.js';
import { falhar } from './http.js';
import { gerarProtocolo } from './protocolo.js';
import { CAMPOS } from './voluntarios.js';
import { encontrarOuCriarPessoa, adicionarPapel } from './papeis.js';

export const PAPEIS = ['funcionario', 'voluntario', 'doador_associado'];

const texto = (valor, max) => String(valor ?? '').trim().slice(0, max);

// Dados da pessoa (cadastro de funcionário e correção). O CPF só entra no cadastro: ele
// identifica a pessoa (FR-048) e não muda na correção.
// Na correção a data de nascimento pode ficar vazia: o doador associado se cadastra sem ela.
export function validarPessoa(corpo, { comCpf = true } = {}) {
  const dados = {
    nome: texto(corpo.nome, 150),
    cpf: v.soDigitos(corpo.cpf),
    data_nascimento: String(corpo.dataNascimento ?? '') || null,
    email: texto(corpo.email, 254).toLowerCase(),
    telefone: v.soDigitos(corpo.telefone),
  };
  const nascimento = !dados.data_nascimento && !comCpf ? null
    : v.data(dados.data_nascimento) ? 'Informe a data de nascimento.'
    : dados.data_nascimento > hojeBrasilia() ? 'A data de nascimento não pode estar no futuro.'
      : dados.data_nascimento < '1900-01-01' ? 'Confira o ano de nascimento.' : null;
  const falha = v.conferir({
    nome: v.obrigatorio(dados.nome, 'O nome'),
    cpf: comCpf ? v.cpf(dados.cpf) : null,
    dataNascimento: nascimento,
    email: v.email(dados.email),
    telefone: v.telefone(dados.telefone),
  });
  if (falha) falhar(400, 'DADOS_INVALIDOS', falha.mensagem, falha.campos, falha.mensagens);
  return dados;
}

// Submissões ainda em triagem ligadas à pessoa, pelo vínculo ou pelo mesmo CPF (FR-023a).
export async function submissoesEmTriagem(executor, pessoa) {
  return executor.query(
    `SELECT 'cadastro_voluntario' AS tipo, protocolo, status FROM cadastro_voluntario
     WHERE (pessoa_id = $1 OR cpf = $2) AND status IN ('pendente', 'entrevista') AND anonimizado_em IS NULL
     UNION ALL
     SELECT 'candidatura', protocolo, status FROM candidatura
     WHERE (pessoa_id = $1 OR cpf = $2) AND status IN ('em_analise', 'entrevista') AND anonimizado_em IS NULL`,
    [pessoa.id, pessoa.cpf]);
}

// E-mail único entre pessoas (índice pessoa_email_unico) vira mensagem no campo.
export function traduzirEmailEmUso(e) {
  if (e.code === '23505' && String(e.constraint ?? e.message).includes('pessoa_email_unico')) {
    falhar(409, 'EMAIL_EM_USO', 'Este e-mail já pertence a outra pessoa cadastrada.', ['email']);
  }
  throw e;
}

// Voluntário cadastrado direto no Painel (FR-023, 2026-10-06): gera um cadastro de voluntário com
// origem "painel" e os dados do termo de adesão (FR-011). Sem triagem e sem consentimento
// eletrônico: o termo é impresso e assinado na sede (FR-012a).
//   maior de idade → já aprovado, com pessoa e papel de voluntário;
//   menor de idade → pendente, com autorização pendente; a pessoa e o papel nascem na aprovação
//                    (POST /api/admin/voluntarios/:id/aprovar), depois da autorização recebida.
// `dados` vem de validarCadastro(); `tx` é de transacao().
export async function cadastrarVoluntarioPainel(tx, dados, autor) {
  const protocolo = gerarProtocolo('VOL');
  const adulto = !dados.menor_de_idade;
  const colunas = [...CAMPOS, 'protocolo', 'origem', 'menor_de_idade', 'autorizacao_status', 'status', 'criado_por'];
  const valores = [...CAMPOS.map((c) => dados[c]), protocolo, 'painel', dados.menor_de_idade,
    adulto ? 'nao_se_aplica' : 'pendente', adulto ? 'aprovado' : 'pendente', autor];
  const [cadastro] = await tx.query(
    `INSERT INTO cadastro_voluntario (${colunas.join(', ')})
     VALUES (${colunas.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING id, protocolo, status, autorizacao_status`,
    valores);

  let pessoaId = null;
  if (adulto) {
    await tx.query(
      `UPDATE cadastro_voluntario SET triado_por = $2, triado_em = now(), concluido_em = now() WHERE id = $1`,
      [cadastro.id, autor]);
    try {
      ({ id: pessoaId } = await encontrarOuCriarPessoa(tx, {
        cpf: dados.cpf, nome: dados.nome, email: dados.email, telefone: dados.telefone, dataNascimento: dados.data_nascimento,
      }, autor));
    } catch (e) { traduzirEmailEmUso(e); }
    await adicionarPapel(tx, pessoaId, 'voluntario', cadastro.id, autor);
    await tx.query('UPDATE cadastro_voluntario SET pessoa_id = $2 WHERE id = $1', [cadastro.id, pessoaId]);
  }
  return {
    cadastroVoluntarioId: cadastro.id, protocolo: cadastro.protocolo, status: cadastro.status,
    autorizacaoStatus: cadastro.autorizacao_status, pessoaId,
  };
}
