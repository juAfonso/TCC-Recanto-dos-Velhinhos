// Cadastro de voluntário (FR-011, FR-012): só os campos do termo de adesão da Lei 9.608/1998.
// Decisões de 2026-10-06 (Session 2026-10-06 (3) do spec):
// - obrigatórios: identificação, contato e tipo de serviço; escolaridade, profissão, objetivos
//   e condições são opcionais (a equipe completa na entrevista);
// - tipo de serviço: lista fixa + "Outro" com texto livre;
// - sem idade mínima: todo menor de 18 entra com autorização do responsável PENDENTE.

import * as v from './validacao.js';
import { ehMenorDeIdade, hojeBrasilia } from './datas.js';
import { falhar } from './http.js';

export const TIPOS_SERVICO = [
  'Atividades recreativas',
  'Oficinas de artesanato',
  'Leitura e contação de histórias',
  'Acompanhamento aos idosos',
  'Apoio em eventos e campanhas',
  'Manutenção predial',
  'Apoio administrativo',
];

const texto = (valor, max) => String(valor ?? '').trim().slice(0, max);

function dataNascimento(valor) {
  const erro = v.data(valor);
  if (erro) return 'Informe a data de nascimento.';
  if (valor > hojeBrasilia()) return 'A data de nascimento não pode estar no futuro.';
  if (valor < '1900-01-01') return 'Confira o ano de nascimento.';
  return null;
}

// Devolve os campos normalizados (CPF, CEP e telefone só com dígitos; UF maiúscula) ou falha 400.
export function validarCadastro(corpo) {
  const tipoEscolhido = texto(corpo.tipoServico, 60);
  const outro = texto(corpo.tipoServicoOutro, 200);
  const dados = {
    nome: texto(corpo.nome, 150),
    data_nascimento: String(corpo.dataNascimento ?? ''),
    cpf: v.soDigitos(corpo.cpf),
    rg: texto(corpo.rg, 30),
    escolaridade: texto(corpo.escolaridade, 80) || null,
    profissao: texto(corpo.profissao, 80) || null,
    endereco: texto(corpo.endereco, 200),
    bairro: texto(corpo.bairro, 80),
    cep: v.soDigitos(corpo.cep),
    cidade: texto(corpo.cidade, 80),
    uf: texto(corpo.uf, 2).toUpperCase(),
    telefone: v.soDigitos(corpo.telefone),
    email: texto(corpo.email, 254).toLowerCase(),
    tipo_servico: tipoEscolhido === 'Outro' ? outro : tipoEscolhido,
    objetivos: texto(corpo.objetivos, 2000) || null,
    condicoes: texto(corpo.condicoes, 2000) || null,
  };

  const erroServico = tipoEscolhido === 'Outro'
    ? (outro ? null : 'Descreva o tipo de serviço que você quer prestar.')
    : TIPOS_SERVICO.includes(tipoEscolhido) ? null : 'Escolha o tipo de serviço.';

  const falha = v.conferir({
    nome: v.obrigatorio(dados.nome, 'O nome'),
    dataNascimento: dataNascimento(dados.data_nascimento),
    cpf: v.cpf(dados.cpf),
    rg: v.obrigatorio(dados.rg, 'O RG'),
    endereco: v.obrigatorio(dados.endereco, 'O endereço'),
    bairro: v.obrigatorio(dados.bairro, 'O bairro'),
    cep: v.cep(dados.cep),
    cidade: v.obrigatorio(dados.cidade, 'A cidade'),
    uf: v.uf(dados.uf),
    telefone: v.telefone(dados.telefone),
    email: v.email(dados.email),
    tipoServico: tipoEscolhido === 'Outro' ? null : erroServico,
    tipoServicoOutro: tipoEscolhido === 'Outro' ? erroServico : null,
  });
  if (falha) falhar(400, 'DADOS_INVALIDOS', falha.mensagem, falha.campos, falha.mensagens);

  dados.menor_de_idade = ehMenorDeIdade(dados.data_nascimento);
  return dados;
}

// Campos do cadastro na ordem de gravação (os mesmos do termo de adesão).
export const CAMPOS = ['nome', 'data_nascimento', 'cpf', 'rg', 'escolaridade', 'profissao', 'endereco', 'bairro',
  'cep', 'cidade', 'uf', 'telefone', 'email', 'tipo_servico', 'objetivos', 'condicoes'];
