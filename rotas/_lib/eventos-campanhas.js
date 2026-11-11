// Evento e campanha: tipos diferentes, mesma tela (FR-029, DER, 2026-10-05).
// Evento: nome, data, objetivo e recursos em texto. Campanha: nome, período, objetivo,
// recursos a arrecadar (≥ 1, tabela `recurso`) e meta opcional.
// Conflito de data só entre eventos, e é AVISO, nunca bloqueio (FR-030).
// "Objetivo" era "descrição" até 2026-11-11 (migração 009), alinhado à solicitação externa.
// Campanha vinda de solicitação externa não arrecada dinheiro: sem recurso "dinheiro" e sem
// meta em R$ (decisão de 2026-11-11). Só a equipe cria campanha que arrecada dinheiro.

import * as v from './validacao.js';
import { hojeBrasilia } from './datas.js';
import { falhar } from './http.js';
import { registrarAuditoria } from './auditoria.js';

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
    objetivo: texto(corpo.objetivo, 4000),
    data: String(corpo.data ?? ''),
    recursos: texto(corpo.recursos, 2000),
  };
  const falha = v.conferir({
    nome: v.obrigatorio(evento.nome, 'O nome do evento'),
    data: dataValida(evento.data, dataAnterior),
    objetivo: v.obrigatorio(evento.objetivo, 'O objetivo'),
  });
  if (falha) falhar(400, 'DADOS_INVALIDOS', falha.mensagem, falha.campos, falha.mensagens);
  return evento;
}

// `externa`: campanha que nasceu de solicitação externa (só itens, sem meta em R$).
export function validarCampanha(corpo, { inicioAnterior, externa = false } = {}) {
  const recursos = Array.isArray(corpo.recursos) ? corpo.recursos : [];
  const campanha = {
    nome: texto(corpo.nome, 150),
    objetivo: texto(corpo.objetivo, 4000),
    periodoInicio: String(corpo.periodoInicio ?? ''),
    periodoFim: String(corpo.periodoFim ?? ''),
    meta: corpo.meta === undefined || corpo.meta === null || String(corpo.meta).trim() === '' ? null : String(corpo.meta).trim().replace(',', '.'),
    recursos: recursos
      .map((r) => ({ id: typeof r.id === 'string' ? r.id : null, tipo: r.tipo, descricao: texto(r.descricao, 300) }))
      .filter((r) => r.descricao),
  };
  const erroRecursos = !campanha.recursos.length
    ? 'Informe ao menos um recurso que a campanha arrecada (dinheiro ou item).'
    : campanha.recursos.some((r) => r.tipo !== 'dinheiro' && r.tipo !== 'item') ? 'Cada recurso precisa ser "dinheiro" ou "item".'
    : externa && campanha.recursos.some((r) => r.tipo === 'dinheiro')
      ? 'Campanha proposta de fora do Recanto arrecada só itens, não dinheiro.' : null;
  const erroFim = v.data(campanha.periodoFim) ? 'Informe uma data de fim válida.'
    : campanha.periodoFim < hojeBrasilia() ? 'O fim do período não pode estar no passado.'
    : campanha.periodoFim < campanha.periodoInicio ? 'O fim precisa ser igual ou depois do início.' : null;
  const falha = v.conferir({
    nome: v.obrigatorio(campanha.nome, 'O nome da campanha'),
    periodoInicio: dataValida(campanha.periodoInicio, inicioAnterior),
    periodoFim: erroFim,
    objetivo: v.obrigatorio(campanha.objetivo, 'O objetivo'),
    meta: campanha.meta === null ? null
      : externa ? 'Campanha proposta de fora do Recanto não tem meta em dinheiro.'
      : v.valorMonetario(campanha.meta, 0.01),
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

// Cria o evento já ativo (publicado, FR-031). Usado pelo Painel e pela confirmação de uma
// solicitação externa (`origemId`, FR-022). Roda dentro da transação de quem chama.
export async function criarEvento(tx, evento, { conta, origemId = null, confirmarAviso = false }) {
  const conflitos = await conferirConflito(tx, evento.data, { confirmarAviso });
  const [novo] = await tx.query(
    `INSERT INTO evento (nome, objetivo, recursos_necessarios, data, solicitacao_origem_id, criado_por)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [evento.nome, evento.objetivo, evento.recursos || null, evento.data, origemId, conta.identificador]);
  await registrarAuditoria({
    autorTipo: 'conta_institucional', autorId: conta.id, acao: 'evento.criar', entidadeTipo: 'evento', entidadeId: novo.id,
    detalhe: { conflitoConfirmado: conflitos.length > 0, deSolicitacao: Boolean(origemId) },
  }, tx);
  return novo.id;
}

export async function criarCampanha(tx, campanha, { conta, origemId = null }) {
  const autor = conta.identificador;
  const [nova] = await tx.query(
    `INSERT INTO campanha (nome, objetivo, periodo_inicio, periodo_fim, meta_valor, solicitacao_origem_id, criado_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [campanha.nome, campanha.objetivo, campanha.periodoInicio, campanha.periodoFim, campanha.meta, origemId, autor]);
  for (const r of campanha.recursos) {
    await tx.query(`INSERT INTO recurso (campanha_id, tipo, descricao, criado_por) VALUES ($1, $2, $3, $4)`,
      [nova.id, r.tipo, r.descricao, autor]);
  }
  await registrarAuditoria({
    autorTipo: 'conta_institucional', autorId: conta.id, acao: 'campanha.criar', entidadeTipo: 'campanha', entidadeId: nova.id,
    detalhe: { comMeta: campanha.meta !== null, recursos: campanha.recursos.length, deSolicitacao: Boolean(origemId) },
  }, tx);
  return nova.id;
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

// Quantidade arrecadada de cada recurso (decisão de 2026-11-11), informada à mão pela equipe.
// Item: quantidade + unidade (da lista ou outra, escrita pela equipe). Dinheiro: valor em R$.
// Em branco = ainda não informado. Recebe [{ id, quantidade, unidade }].
export const UNIDADES = ['unidades', 'kg', 'litros', 'pacotes', 'caixas', 'fardos'];

export function validarArrecadacaoRecursos(lista, recursosDaCampanha) {
  const porId = new Map(recursosDaCampanha.map((r) => [r.id, r]));
  const erros = [];
  const valores = (Array.isArray(lista) ? lista : []).map((x) => {
    const recurso = porId.get(x?.id);
    if (!recurso) falhar(400, 'RECURSO_INVALIDO', 'Um dos recursos não pertence a esta campanha. Recarregue a página.');
    // "1.234,5" ou "1234.5": com vírgula, o ponto é separador de milhar.
    const digitado = String(x.quantidade ?? '').trim();
    const bruto = digitado.includes(',') ? digitado.replace(/\./g, '').replace(',', '.') : digitado;
    if (!bruto) return { id: recurso.id, quantidade: null, unidade: null };
    const quantidade = Number(bruto);
    if (!/^\d+(\.\d{1,2})?$/.test(bruto) || !Number.isFinite(quantidade) || quantidade > 9999999999) {
      erros.push(`"${recurso.descricao}": informe um número (até duas casas decimais).`);
      return null;
    }
    if (recurso.tipo === 'dinheiro') return { id: recurso.id, quantidade, unidade: null };
    const unidade = texto(x.unidade, 40);
    if (!unidade) erros.push(`"${recurso.descricao}": escolha a unidade (kg, pacotes…).`);
    return { id: recurso.id, quantidade, unidade };
  });
  if (erros.length) falhar(400, 'DADOS_INVALIDOS', erros.join(' '), ['recursos'], { recursos: erros.join(' ') });
  return valores;
}

export { dataTexto } from './datas.js';
