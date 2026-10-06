// Candidatura a vaga (FR-016, FR-016a, FR-017): cargo fixo, nome, CPF, data de nascimento
// (maior de idade — é emprego), telefone e e-mail; currículo em arquivo OU em texto.

import * as v from './validacao.js';
import { ehMenorDeIdade, hojeBrasilia } from './datas.js';
import { falhar } from './http.js';

export const CARGOS = { limpeza: 'Limpeza', cuidador: 'Cuidador(a)', enfermagem: 'Enfermagem', cozinha: 'Cozinha' };

const texto = (valor, max) => String(valor ?? '').trim().slice(0, max);

function nascimento(valor) {
  if (v.data(valor)) return 'Informe a data de nascimento.';
  if (valor > hojeBrasilia() || valor < '1900-01-01') return 'Confira a data de nascimento.';
  if (ehMenorDeIdade(valor)) return 'Para se candidatar a uma vaga de emprego é preciso ter 18 anos ou mais.';
  return null;
}

// `corpo` é um objeto simples (campos do formulário). Devolve os dados normalizados ou falha 400.
export function validarCandidatura(corpo) {
  const dados = {
    cargo: texto(corpo.cargo, 20),
    nome: texto(corpo.nome, 150),
    cpf: v.soDigitos(corpo.cpf),
    data_nascimento: String(corpo.dataNascimento ?? ''),
    telefone: v.soDigitos(corpo.telefone),
    email: texto(corpo.email, 254).toLowerCase(),
    curriculo_texto: texto(corpo.curriculoTexto, 5000) || null,
  };
  const falha = v.conferir({
    cargo: CARGOS[dados.cargo] ? null : 'Escolha o cargo.',
    nome: v.obrigatorio(dados.nome, 'O nome'),
    cpf: v.cpf(dados.cpf),
    dataNascimento: nascimento(dados.data_nascimento),
    telefone: v.telefone(dados.telefone),
    email: v.email(dados.email),
  });
  if (falha) falhar(400, 'DADOS_INVALIDOS', falha.mensagem, falha.campos, falha.mensagens);
  return dados;
}

export const CAMPOS = ['cargo', 'nome', 'cpf', 'data_nascimento', 'telefone', 'email'];
