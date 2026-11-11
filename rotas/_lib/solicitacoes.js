// Solicitação externa de evento ou campanha (FR-020, CSU08). Tipo obrigatório; contato com nome,
// e-mail e telefone; nome da iniciativa e objetivo; data (evento) ou período (campanha) a partir
// de amanhã; recursos esperados da instituição opcionais (decisões de 2026-10-06, fase 8).
// Campanha lista os itens que vai arrecadar (pelo menos um, decisão de 2026-11-11): na
// confirmação eles viram os recursos da campanha, todos do tipo item.

export const MAXIMO_ITENS = 30;

import * as v from './validacao.js';
import { hojeBrasilia } from './datas.js';
import { falhar } from './http.js';

const texto = (valor, max) => String(valor ?? '').trim().slice(0, max);

// Na correção pelo Painel (`anterior`), uma data já gravada pode ficar como está, mesmo vencida.
function dataFutura(valor, rotulo, anterior) {
  if (v.data(valor)) return `Informe ${rotulo}.`;
  if (valor <= hojeBrasilia() && valor !== anterior) return 'Escolha uma data a partir de amanhã.';
  return null;
}

export function validarSolicitacao(corpo, anterior = {}) {
  const tipo = corpo.tipo === 'evento' || corpo.tipo === 'campanha' ? corpo.tipo : '';
  const dados = {
    tipo,
    nome_contato: texto(corpo.nomeContato, 150),
    email: texto(corpo.email, 254).toLowerCase(),
    telefone: v.soDigitos(corpo.telefone),
    nome_iniciativa: texto(corpo.nomeIniciativa, 150),
    objetivo: texto(corpo.objetivo, 4000),
    data_pretendida: tipo === 'evento' ? String(corpo.dataPretendida ?? '') : null,
    periodo_inicio: tipo === 'campanha' ? String(corpo.periodoInicio ?? '') : null,
    periodo_fim: tipo === 'campanha' ? String(corpo.periodoFim ?? '') : null,
    recursos_esperados: texto(corpo.recursosEsperados, 2000) || null,
    itens_arrecadar: tipo === 'campanha'
      ? (Array.isArray(corpo.itensArrecadar) ? corpo.itensArrecadar : []).map((i) => texto(i, 300)).filter(Boolean)
      : null,
  };
  const erroFim = tipo !== 'campanha' ? null
    : v.data(dados.periodo_fim) ? 'Informe o fim do período.'
    : dados.periodo_fim < dados.periodo_inicio ? 'O fim precisa ser igual ou depois do início.' : null;
  const falha = v.conferir({
    tipo: tipo ? null : 'Escolha se é um evento ou uma campanha.',
    nomeContato: v.obrigatorio(dados.nome_contato, 'O nome da pessoa ou organização'),
    email: v.email(dados.email),
    telefone: v.telefone(dados.telefone),
    nomeIniciativa: v.obrigatorio(dados.nome_iniciativa, { evento: 'O nome do evento', campanha: 'O nome da campanha' }[tipo] || 'O nome da proposta'),
    objetivo: v.obrigatorio(dados.objetivo, 'O objetivo'),
    dataPretendida: tipo === 'evento' ? dataFutura(dados.data_pretendida, 'a data pretendida', anterior.data_pretendida) : null,
    periodoInicio: tipo === 'campanha' ? dataFutura(dados.periodo_inicio, 'o início do período', anterior.periodo_inicio) : null,
    periodoFim: erroFim,
    itensArrecadar: tipo !== 'campanha' ? null
      : !dados.itens_arrecadar.length ? 'Informe ao menos um item que a campanha vai arrecadar.'
      : dados.itens_arrecadar.length > MAXIMO_ITENS ? `Informe no máximo ${MAXIMO_ITENS} itens.` : null,
  });
  if (falha) falhar(400, 'DADOS_INVALIDOS', falha.mensagem, falha.campos, falha.mensagens);
  return dados;
}

export const CAMPOS = ['tipo', 'nome_contato', 'email', 'telefone', 'nome_iniciativa', 'objetivo',
  'data_pretendida', 'periodo_inicio', 'periodo_fim', 'recursos_esperados', 'itens_arrecadar'];
