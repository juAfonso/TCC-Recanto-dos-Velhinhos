// Relatório de doações para imprimir ou salvar em PDF (decidido em 2026-11-10).
// Filtra por período (data do clique em "Já fiz o Pix", no fuso de Brasília), por faixa de valor,
// por tipo (espontânea ou associativa) e por situação. Funções puras: a rota só consulta o banco.

import { hojeBrasilia } from './datas.js';

export const TIPOS = new Set(['todas', 'espontanea', 'associativa']);
export const SITUACOES = new Set(['confirmada', 'pendente', 'nao_localizada', 'todas']);
export const ORDENS = new Set(['data', 'valor']);
// Acima disso o relatório não cabe num PDF razoável: pede-se um período menor.
export const MAXIMO_LINHAS = 5000;

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const dataValida = (t) => DATA.test(t) && new Date(`${t}T00:00:00Z`).toISOString().slice(0, 10) === t;

// "1.234,56", "1234,56" ou "1234.56" → 1234.56. Vazio → null. Inválido → NaN.
export function lerValor(texto) {
  const t = String(texto ?? '').trim().replace(/^R\$\s*/i, '');
  if (!t) return null;
  const normal = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t;
  return /^\d+(\.\d{1,2})?$/.test(normal) ? Number(normal) : NaN;
}

// Lê e valida os filtros da URL. Devolve { filtros } ou { erros: { campo: mensagem } }.
// Sem período informado: do dia 1º do mês corrente até hoje.
export function lerFiltros(params, hoje = hojeBrasilia()) {
  const erros = {};
  const de = params.get('de') || `${hoje.slice(0, 8)}01`;
  const ate = params.get('ate') || hoje;
  if (!dataValida(de)) erros.de = 'Data inicial inválida.';
  if (!dataValida(ate)) erros.ate = 'Data final inválida.';
  if (!erros.de && !erros.ate && de > ate) erros.ate = 'A data final não pode ser antes da inicial.';

  const valorMin = lerValor(params.get('valorMin'));
  const valorMax = lerValor(params.get('valorMax'));
  if (Number.isNaN(valorMin)) erros.valorMin = 'Valor mínimo inválido. Use números, como 10 ou 10,50.';
  if (Number.isNaN(valorMax)) erros.valorMax = 'Valor máximo inválido. Use números, como 100 ou 100,00.';
  if (valorMin !== null && valorMax !== null && !Number.isNaN(valorMin) && !Number.isNaN(valorMax) && valorMin > valorMax) {
    erros.valorMax = 'O valor máximo não pode ser menor que o mínimo.';
  }

  const tipo = params.get('tipo') || 'todas';
  const situacao = params.get('situacao') || 'confirmada';
  const ordem = params.get('ordem') || 'data';
  if (!TIPOS.has(tipo)) erros.tipo = 'Tipo de doação inválido.';
  if (!SITUACOES.has(situacao)) erros.situacao = 'Situação inválida.';
  if (!ORDENS.has(ordem)) erros.ordem = 'Ordem inválida.';

  if (Object.keys(erros).length) return { erros };
  return { filtros: { de, ate, valorMin, valorMax, tipo, situacao, ordem } };
}

const centavos = (v) => Math.round(Number(v) * 100);
const somaVazia = () => ({ quantidade: 0, total: 0 });
function somar(alvo, valor) {
  alvo.quantidade += 1;
  alvo.total = (centavos(alvo.total) + centavos(valor)) / 100;
}

// Totais por tipo e por mês (AAAA-MM do clique, fuso de Brasília), a partir das linhas já filtradas.
// Soma em centavos para não acumular erro de ponto flutuante.
export function resumir(doacoes) {
  const geral = somaVazia();
  const porTipo = { espontanea: somaVazia(), associativa: somaVazia() };
  const meses = new Map();
  let maior = null;
  let menor = null;

  for (const d of doacoes) {
    somar(geral, d.valor);
    somar(porTipo[d.tipo], d.valor);
    const mes = hojeBrasilia(new Date(d.declaradaEm)).slice(0, 7);
    if (!meses.has(mes)) meses.set(mes, { mes, espontanea: somaVazia(), associativa: somaVazia(), total: somaVazia() });
    const m = meses.get(mes);
    somar(m[d.tipo], d.valor);
    somar(m.total, d.valor);
    if (maior === null || d.valor > maior) maior = d.valor;
    if (menor === null || d.valor < menor) menor = d.valor;
  }

  return {
    ...geral,
    media: geral.quantidade ? Math.round(centavos(geral.total) / geral.quantidade) / 100 : 0,
    maior,
    menor,
    porTipo,
    porMes: [...meses.values()].sort((a, b) => a.mes.localeCompare(b.mes)),
  };
}
