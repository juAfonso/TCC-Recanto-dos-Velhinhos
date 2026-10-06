// Evento e campanha: tipos diferentes, mesma tela (FR-029, DER, 2026-10-05).
// Evento: nome, data, descrição e recursos em texto. Campanha: nome, período, descrição,
// recursos a arrecadar (≥ 1, tabela `recurso`) e meta opcional.
// Conflito de data só entre eventos, e é AVISO, nunca bloqueio (FR-030).

import * as v from './validacao.js';
import { hojeBrasilia } from './datas.js';
import { falhar } from './http.js';

const texto = (valor, max) => String(valor ?? '').trim().slice(0, max);

// `dataAnterior`: na edição, a data já gravada pode continuar no passado se não mudar.
function dataValida(valor, dataAnterior) {
  const erro = v.data(valor);
  if (erro) return 'Informe uma data válida.';
  if (valor < hojeBrasilia() && valor !== dataAnterior) return 'A data não pode estar no passado.';
  return null;
}

export function validarEvento(corpo, { dataAnterior } = {}) {
  const evento = {
    nome: texto(corpo.nome, 150),
    descricao: texto(corpo.descricao, 4000),
    data: String(corpo.data ?? ''),
    recursos: texto(corpo.recursos, 2000),
  };
  const falha = v.conferir({
    nome: v.obrigatorio(evento.nome, 'O nome do evento'),
    data: dataValida(evento.data, dataAnterior),
    descricao: v.obrigatorio(evento.descricao, 'A descrição'),
  });
  if (falha) falhar(400, 'DADOS_INVALIDOS', falha.mensagem, falha.campos, falha.mensagens);
  return evento;
}

export function validarCampanha(corpo, { inicioAnterior } = {}) {
  const recursos = Array.isArray(corpo.recursos) ? corpo.recursos : [];
  const campanha = {
    nome: texto(corpo.nome, 150),
    descricao: texto(corpo.descricao, 4000),
    periodoInicio: String(corpo.periodoInicio ?? ''),
    periodoFim: String(corpo.periodoFim ?? ''),
    meta: corpo.meta === undefined || corpo.meta === null || String(corpo.meta).trim() === '' ? null : String(corpo.meta).trim().replace(',', '.'),
    recursos: recursos
      .map((r) => ({ id: typeof r.id === 'string' ? r.id : null, tipo: r.tipo, descricao: texto(r.descricao, 300) }))
      .filter((r) => r.descricao),
  };
  const erroRecursos = !campanha.recursos.length
    ? 'Informe ao menos um recurso que a campanha arrecada (dinheiro ou item).'
    : campanha.recursos.some((r) => r.tipo !== 'dinheiro' && r.tipo !== 'item') ? 'Cada recurso precisa ser "dinheiro" ou "item".' : null;
  const erroFim = v.data(campanha.periodoFim) ? 'Informe uma data de fim válida.'
    : campanha.periodoFim < hojeBrasilia() ? 'O fim do período não pode estar no passado.'
    : campanha.periodoFim < campanha.periodoInicio ? 'O fim precisa ser igual ou depois do início.' : null;
  const falha = v.conferir({
    nome: v.obrigatorio(campanha.nome, 'O nome da campanha'),
    periodoInicio: dataValida(campanha.periodoInicio, inicioAnterior),
    periodoFim: erroFim,
    descricao: v.obrigatorio(campanha.descricao, 'A descrição'),
    meta: campanha.meta === null ? null : v.valorMonetario(campanha.meta, 0.01),
    recursos: erroRecursos,
  });
  if (falha) falhar(400, 'DADOS_INVALIDOS', falha.mensagem, falha.campos, falha.mensagens);
  campanha.meta = campanha.meta === null ? null : Number(campanha.meta);
  return campanha;
}

// Outros eventos ATIVOS na mesma data. Se houver e não for confirmado, responde 409 (FR-030).
export async function conferirConflito(executor, data, { excetoId = null, confirmarAviso = false } = {}) {
  const outros = await executor.query(
    `SELECT id, nome FROM evento WHERE status = 'ativo' AND data = $1 AND id IS DISTINCT FROM $2 ORDER BY nome`,
    [data, excetoId]);
  if (outros.length && !confirmarAviso) {
    const nomes = outros.map((o) => `"${o.nome}"`).join(', ');
    falhar(409, 'CONFLITO_DE_DATA',
      `Já existe evento marcado para esta data: ${nomes}. Você pode alterar a data ou prosseguir mesmo assim.`);
  }
  return outros;
}

// Acha o registro pelo id em evento ou campanha. Devolve { tabela, registro } ou falha 404.
export async function carregar(executor, id, { travar = false } = {}) {
  const sufixo = travar ? ' FOR UPDATE' : '';
  const [evento] = await executor.query(`SELECT * FROM evento WHERE id = $1${sufixo}`, [id]);
  if (evento) return { tabela: 'evento', registro: evento };
  const [campanha] = await executor.query(`SELECT * FROM campanha WHERE id = $1${sufixo}`, [id]);
  if (campanha) return { tabela: 'campanha', registro: campanha };
  falhar(404, 'NAO_ENCONTRADO', 'Evento ou campanha não encontrado.');
}

export { dataTexto } from './datas.js';
