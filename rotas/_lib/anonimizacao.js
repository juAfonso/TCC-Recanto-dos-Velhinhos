// Anonimização a pedido do titular ou por fim do prazo de retenção (FR-055, FR-056, research D16).
// Nada é apagado: os campos pessoais viram "[anonimizado]" ou NULL, a linha continua, e o histórico
// de alterações, as falhas de e-mail e o arquivo do currículo ligados ao registro são alcançados
// na mesma operação — senão o valor antigo continuaria legível (SC-016).
//
// Decisões de 2026-10-07: (1) nome, CPF e data de nascimento podem ser RETIDOS por obrigação legal
// (ex.: registros trabalhistas), e aí a justificativa é obrigatória; (2) anonimizar a PESSOA alcança
// também os cadastros de voluntário e as candidaturas dela (pelo vínculo ou pelo mesmo CPF).
// Doações não têm campo pessoal: ficam com valor, data, tipo e status, ligadas à linha anonimizada.

import { sql, transacao } from './db.js';
import { registrarAuditoria } from './auditoria.js';
import { removerArquivo } from './blob.js';
import { falhar } from './http.js';

export const ANONIMO = '[anonimizado]';
// O mesmo marcador como literal SQL (constante fixa, nunca dado de fora).
const A = `'${ANONIMO}'`;

const ALVOS = {
  pessoa: 'pessoa',
  cadastro_voluntario: 'cadastro_voluntario',
  candidatura: 'candidatura',
  curriculo: 'curriculo',
  solicitacao: 'solicitacao_externa',
  solicitacao_externa: 'solicitacao_externa',
};

// Campos que a equipe pode reter por obrigação legal, por tipo de registro.
export const RETIVEIS = {
  pessoa: ['nome', 'cpf', 'data_nascimento'],
  cadastro_voluntario: ['nome', 'cpf', 'data_nascimento'],
  candidatura: ['nome', 'cpf', 'data_nascimento'],
  curriculo: [],
  solicitacao_externa: [],
};

// Submissão ainda em triagem sai da fila ao ser anonimizada.
const ENCERRAR = {
  cadastro_voluntario: { de: ['pendente', 'entrevista'], para: 'encerrado_titular' },
  candidatura: { de: ['em_analise', 'entrevista'], para: 'encerrada_titular' },
  solicitacao_externa: { de: ['em_analise', 'aguardando_contato'], para: 'encerrada_titular' },
};

const ret = (reter, campo, coluna = campo, vazio = 'NULL') =>
  (reter.includes(campo) ? coluna : vazio);

// Histórico e falhas de e-mail ligados ao registro (D16).
async function limparLigados(tx, tipo, id, emails) {
  await tx.query(
    `UPDATE historico_alteracao SET estado_anterior = '{"anonimizado": true}'::jsonb, anonimizado_em = now()
     WHERE entidade_tipo = $1 AND entidade_id = $2 AND anonimizado_em IS NULL`, [tipo, id]);
  await tx.query(
    `UPDATE falha_email SET destinatario = $3, anonimizado_em = now()
     WHERE anonimizado_em IS NULL
       AND ((entidade_tipo = $1 AND entidade_id = $2) OR lower(destinatario) = ANY($4::text[]))`,
    [tipo, id, ANONIMO, emails.filter(Boolean).map((e) => e.toLowerCase())]);
}

async function encerrarSeEmTriagem(tx, tipo, registro, autor) {
  const regra = ENCERRAR[tipo];
  if (regra && regra.de.includes(registro.status)) {
    await tx.query(
      `UPDATE ${tipo} SET status = $2, concluido_em = now(), triado_por = $3, triado_em = now() WHERE id = $1`,
      [registro.id, regra.para, autor]);
  }
}

async function registrar(tx, { tipo, id, reter, justificativa, autor, origemId = null }) {
  const [linha] = await tx.query(
    `INSERT INTO anonimizacao (entidade_tipo, entidade_id, origem_id, campos_retidos, justificativa, executado_por)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [tipo, id, origemId, reter, reter.length ? justificativa : null, autor]);
  return linha.id;
}

// Cada função recebe o registro já travado (FOR UPDATE) e devolve os e-mails que ele tinha.
const EXECUTORES = {
  async pessoa(tx, p, reter, autor) {
    await tx.query(
      `UPDATE pessoa SET nome = ${ret(reter, 'nome', 'nome', A)}, cpf = ${ret(reter, 'cpf', 'cpf', A)},
              data_nascimento = ${ret(reter, 'data_nascimento')}, email = NULL, telefone = NULL,
              senha_hash = NULL, senha_definida_em = NULL, ativo = false, anonimizado_em = now(),
              atualizado_por = $2, atualizado_em = now()
       WHERE id = $1`, [p.id, autor]);
    await tx.query(
      `UPDATE papel SET status = 'inativo', fim_em = COALESCE(fim_em, now()), alterado_por = $2, alterado_em = now()
       WHERE pessoa_id = $1 AND status = 'ativo'`, [p.id, autor]);
    await tx.query(
      `UPDATE token_senha SET invalidado_em = now() WHERE pessoa_id = $1 AND usado_em IS NULL AND invalidado_em IS NULL`, [p.id]);
    return [p.email];
  },

  async cadastro_voluntario(tx, c, reter, autor) {
    await encerrarSeEmTriagem(tx, 'cadastro_voluntario', c, autor);
    await tx.query(
      `UPDATE cadastro_voluntario
       SET nome = ${ret(reter, 'nome', 'nome', A)}, cpf = ${ret(reter, 'cpf', 'cpf', A)},
           data_nascimento = ${ret(reter, 'data_nascimento')}, rg = NULL, endereco = NULL, bairro = NULL, cep = NULL,
           telefone = NULL, email = NULL, escolaridade = NULL, profissao = NULL, objetivos = NULL, condicoes = NULL,
           motivo_rejeicao = CASE WHEN motivo_rejeicao IS NULL THEN NULL ELSE ${A} END, anonimizado_em = now()
       WHERE id = $1`, [c.id]);
    return [c.email];
  },

  async candidatura(tx, c, reter, autor) {
    await encerrarSeEmTriagem(tx, 'candidatura', c, autor);
    await tx.query(
      `UPDATE candidatura
       SET nome = ${ret(reter, 'nome', 'nome', A)}, cpf = ${ret(reter, 'cpf', 'cpf', A)},
           data_nascimento = ${ret(reter, 'data_nascimento')}, telefone = NULL, email = NULL, curriculo_texto = NULL,
           motivo_rejeicao = CASE WHEN motivo_rejeicao IS NULL THEN NULL ELSE ${A} END,
           curriculo_anonimizado_em = COALESCE(curriculo_anonimizado_em, now()), anonimizado_em = now()
       WHERE id = $1`, [c.id]);
    if (c.curriculo_arquivo_id) await tx.query('UPDATE arquivo SET nome_original = $2 WHERE id = $1', [c.curriculo_arquivo_id, ANONIMO]);
    return [c.email];
  },

  // Só o currículo do aprovado, 6 meses depois da efetivação (FR-056). O resto continua.
  async curriculo(tx, c) {
    if (c.curriculo_anonimizado_em) falhar(409, 'JA_ANONIMIZADO', 'O currículo desta candidatura já foi anonimizado.');
    await tx.query(
      'UPDATE candidatura SET curriculo_texto = NULL, curriculo_anonimizado_em = now() WHERE id = $1', [c.id]);
    if (c.curriculo_arquivo_id) await tx.query('UPDATE arquivo SET nome_original = $2 WHERE id = $1', [c.curriculo_arquivo_id, ANONIMO]);
    return [];
  },

  async solicitacao_externa(tx, s, reter, autor) {
    await encerrarSeEmTriagem(tx, 'solicitacao_externa', s, autor);
    await tx.query(
      `UPDATE solicitacao_externa
       SET nome_contato = ${A}, email = NULL, telefone = NULL, objetivo = ${A}, recursos_esperados = NULL,
           motivo_rejeicao = CASE WHEN motivo_rejeicao IS NULL THEN NULL ELSE ${A} END, anonimizado_em = now()
       WHERE id = $1`, [s.id]);
    return [s.email];
  },
};

const TABELA = { curriculo: 'candidatura' };

async function travar(tx, tipo, id) {
  const tabela = TABELA[tipo] ?? tipo;
  const [registro] = await tx.query(`SELECT * FROM ${tabela} WHERE id = $1 FOR UPDATE`, [id]);
  if (!registro) falhar(404, 'NAO_ENCONTRADO', 'Registro não encontrado.');
  if (registro.anonimizado_em) falhar(409, 'JA_ANONIMIZADO', 'Este registro já foi anonimizado.');
  return registro;
}

// Arquivos de currículo que a operação alcança. Saem do Blob ANTES da transação: se ela falhar,
// o arquivo já se foi, mas a anonimização pode ser repetida (removerArquivo ignora o já removido).
async function curriculosAlcancados(tipo, id) {
  if (tipo === 'candidatura' || tipo === 'curriculo') {
    return sql`SELECT curriculo_arquivo_id AS id FROM candidatura WHERE id = ${id} AND curriculo_arquivo_id IS NOT NULL`;
  }
  if (tipo === 'pessoa') {
    return sql`
      SELECT c.curriculo_arquivo_id AS id FROM candidatura c, pessoa p
      WHERE p.id = ${id} AND c.curriculo_arquivo_id IS NOT NULL AND c.anonimizado_em IS NULL
        AND (c.pessoa_id = p.id OR c.cpf = p.cpf)`;
  }
  return [];
}

// `reter`: nomes de campo de RETIVEIS[tipo]. `conta` = { id, identificador } da sessão do Painel.
export async function anonimizar({ alvo, id, reter = [], justificativaRetencao, conta }) {
  const tipo = ALVOS[alvo];
  if (!tipo) falhar(400, 'ALVO_INVALIDO', 'Tipo de registro inválido para anonimização.');
  const campos = [...new Set(Array.isArray(reter) ? reter : [])];
  const invalidos = campos.filter((c) => !RETIVEIS[tipo].includes(c));
  if (invalidos.length) falhar(400, 'CAMPO_NAO_RETIVEL', `Estes dados não podem ser retidos aqui: ${invalidos.join(', ')}.`, ['reter']);
  const justificativa = String(justificativaRetencao ?? '').trim().slice(0, 2000);
  if (campos.length && !justificativa) {
    falhar(422, 'JUSTIFICATIVA_OBRIGATORIA',
      'Para manter algum dado por obrigação legal, escreva a justificativa (por exemplo, qual lei exige).', ['justificativaRetencao']);
  }
  const autor = conta.identificador;

  for (const { id: arquivoId } of await curriculosAlcancados(tipo, id)) await removerArquivo(arquivoId);

  return transacao(async (tx) => {
    const registro = await travar(tx, tipo, id);
    const emails = await EXECUTORES[tipo](tx, registro, campos, autor);
    await limparLigados(tx, TABELA[tipo] ?? tipo, id, tipo === 'curriculo' ? [] : emails);
    const principal = await registrar(tx, { tipo, id, reter: campos, justificativa, autor });

    // A pessoa alcança os cadastros e candidaturas dela (decisão de 2026-10-07).
    let alcancados = 0;
    if (tipo === 'pessoa') {
      for (const tabela of ['cadastro_voluntario', 'candidatura']) {
        const ligados = await tx.query(
          `SELECT * FROM ${tabela} WHERE anonimizado_em IS NULL AND (pessoa_id = $1 OR cpf = $2) FOR UPDATE`,
          [id, registro.cpf]);
        for (const ligado of ligados) {
          const emailsLigado = await EXECUTORES[tabela](tx, ligado, campos, autor);
          await limparLigados(tx, tabela, ligado.id, emailsLigado);
          await registrar(tx, { tipo: tabela, id: ligado.id, reter: campos, justificativa, autor, origemId: principal });
          alcancados += 1;
        }
      }
    }

    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id, acao: 'anonimizacao.executar',
      entidadeTipo: TABELA[tipo] ?? tipo, entidadeId: id,
      detalhe: { alvo: tipo, camposRetidos: campos, comJustificativa: Boolean(campos.length), alcancados },
    }, tx);
    return { id, alvo: tipo, camposRetidos: campos, alcancados };
  });
}
