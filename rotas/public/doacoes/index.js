// POST /api/public/doacoes — o clique em "Já fiz o Pix" (FR-005, FR-006, FR-006a, FR-008).
//
// - espontânea: só { tipo, valor }. Nenhum dado pessoal, sem consentimento (FR-051).
// - associativa com sessão de doador: só { tipo, valor }; o vínculo vem da sessão.
// - associativa sem sessão: { doador, consentimento } também. Repete a verificação do FR-006b,
//   cria ou reaproveita a pessoa, grava o consentimento e manda o link de definição de senha
//   ao e-mail do cadastro (D11, D15).
//
// A data/hora é a do banco no momento do clique (D9): o corpo não aceita data.
// Nada aqui produz `confirmada` — só um funcionário, conferindo o extrato (Princípio VII).
// Resposta sem protocolo (2026-10-04).

import { sql, transacao } from '../../_lib/db.js';
import { doadorDaSessao } from '../../_lib/acesso.js';
import { verificarAssociativa, prepararDoador, emitirLink, origemDoSite, MENSAGEM_NEUTRA } from '../../_lib/conta-doador.js';
import { validarAceite, registrarConsentimento } from '../../_lib/consentimento.js';
import { registrarAuditoria } from '../../_lib/auditoria.js';
import { verificarLimite, ipDe } from '../../_lib/limite.js';
import * as v from '../../_lib/validacao.js';
import { json, lerJson, falhar, rota } from '../../_lib/http.js';

const OBRIGADO = 'Obrigado! A equipe confere sua doação no extrato do banco.';

function lerValor(bruto) {
  if (bruto === undefined || bruto === null || bruto === '') {
    falhar(400, 'VALOR_INVALIDO', 'Escolha ou digite o valor da doação.', ['valor']);
  }
  const erro = v.valorMonetario(typeof bruto === 'number' ? bruto.toFixed(2) : bruto);
  if (erro) {
    const codigo = /mínimo/.test(erro) ? 'VALOR_ABAIXO_DO_MINIMO' : 'VALOR_INVALIDO';
    falhar(400, codigo, erro, ['valor']);
  }
  return Number(String(bruto).replace(',', '.'));
}

async function registrar({ tipo, valor, pessoaId, criadoPor, executor }) {
  const [doacao] = await executor.query(
    `INSERT INTO doacao (tipo, valor, pessoa_id, criado_por) VALUES ($1, $2, $3, $4) RETURNING id`,
    [tipo, valor, pessoaId, criadoPor]);
  return doacao.id;
}

export const POST = rota(async (request) => {
  const corpo = await lerJson(request);
  const tipo = corpo.tipo;
  if (tipo !== 'espontanea' && tipo !== 'associativa') {
    falhar(400, 'TIPO_INVALIDO', 'Escolha entre doação espontânea e associativa.', ['tipo']);
  }
  const valor = lerValor(corpo.valor);
  const executor = { query: (t, p) => sql.query(t, p) };

  // Espontânea: anônima.
  if (tipo === 'espontanea') {
    const id = await registrar({ tipo, valor, pessoaId: null, criadoPor: 'publico', executor });
    await registrarAuditoria({ autorTipo: 'anonimo', acao: 'doacao.declarar', entidadeTipo: 'doacao', entidadeId: id, detalhe: { tipo } });
    return json({ status: 'pendente', mensagem: OBRIGADO }, 201);
  }

  // Associativa de quem já entrou no autoatendimento.
  const logado = await doadorDaSessao(request);
  if (logado) {
    const id = await registrar({ tipo, valor, pessoaId: logado.id, criadoPor: 'doador', executor });
    await registrarAuditoria({ autorTipo: 'doador', autorId: logado.id, acao: 'doacao.declarar', entidadeTipo: 'doacao', entidadeId: id, detalhe: { tipo } });
    return json({ status: 'pendente', mensagem: OBRIGADO }, 201);
  }

  // Associativa sem login: cadastro junto com a primeira doação (2026-10-04).
  if (!(await verificarLimite('verificar_associativa', ipDe(request), 10, 15))) {
    falhar(429, 'MUITAS_TENTATIVAS', 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.');
  }
  const d = corpo.doador ?? {};
  const falha = v.conferir({
    nome: v.obrigatorio(d.nome, 'O nome'),
    cpf: v.cpf(d.cpf),
    email: v.email(d.email),
    telefone: v.telefone(d.telefone),
  });
  if (falha) falhar(400, 'DADOS_INVALIDOS', falha.mensagem, falha.campos);
  const avisoVersao = await validarAceite(corpo.consentimento);

  const resultado = await transacao(async (tx) => {
    const verificacao = await verificarAssociativa({ cpf: d.cpf, email: d.email }, tx);
    if (verificacao.bloqueado) return { bloqueado: true };
    const pessoaId = await prepararDoador(tx, d, verificacao.pessoaId);
    await registrarConsentimento({ alvo: 'pessoa', alvoId: pessoaId, avisoVersao, finalidade: 'doacao_associativa' }, tx);
    const id = await registrar({ tipo, valor, pessoaId, criadoPor: 'publico', executor: tx });
    await registrarAuditoria({ autorTipo: 'anonimo', acao: 'doacao.declarar', entidadeTipo: 'doacao', entidadeId: id, detalhe: { tipo, comCadastro: true } }, tx);
    return { pessoaId };
  });

  if (resultado.bloqueado) falhar(422, 'ASSOCIADO_DEVE_ENTRAR', MENSAGEM_NEUTRA);

  // Depois do commit: a falha do e-mail não desfaz a declaração (FR-049a vale aqui também).
  await emitirLink(resultado.pessoaId, 'definir', origemDoSite(request));
  return json({
    status: 'pendente',
    mensagem: `${OBRIGADO} Se os dados estiverem corretos, você receberá um link por e-mail para criar sua senha de doador associado.`,
  }, 201);
});
