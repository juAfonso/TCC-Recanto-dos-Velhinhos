// Datas de negócio são avaliadas no fuso de Brasília (data-model.md, regra 5).
// Datas sem hora circulam como texto 'AAAA-MM-DD', igual ao tipo `date` do PostgreSQL.

const FUSO = 'America/Sao_Paulo';

// 'AAAA-MM-DD' de hoje em Brasília (en-CA formata exatamente nesse padrão).
export function hojeBrasilia(agora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO }).format(agora);
}

function partes(data) {
  const texto = data instanceof Date ? data.toISOString().slice(0, 10) : String(data).slice(0, 10);
  const [ano, mes, dia] = texto.split('-').map(Number);
  return { ano, mes, dia };
}

// Idade completa em anos na data de referência.
export function idadeEm(dataNascimento, referencia = hojeBrasilia()) {
  const n = partes(dataNascimento);
  const r = partes(referencia);
  let idade = r.ano - n.ano;
  if (r.mes < n.mes || (r.mes === n.mes && r.dia < n.dia)) idade--;
  return idade;
}

// Maioridade aos 18 anos (FR-012).
export function ehMenorDeIdade(dataNascimento, referencia = hojeBrasilia()) {
  return idadeEm(dataNascimento, referencia) < 18;
}

// Soma meses mantendo o dia; se o mês de destino for mais curto, usa o último dia dele
// (31/08 + 6 meses = 28 ou 29/02).
export function somarMeses(data, n) {
  const d = new Date(data);
  const dia = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const ultimoDia = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(dia, ultimoDia));
  return d;
}

// 'AAAA-MM-DD' ou Date → 'DD/MM/AAAA'. Date é lido no fuso de Brasília.
export function formatarDataBR(data) {
  if (!data) return '';
  const texto = data instanceof Date ? hojeBrasilia(data) : String(data).slice(0, 10);
  const [ano, mes, dia] = texto.split('-');
  return `${dia}/${mes}/${ano}`;
}
