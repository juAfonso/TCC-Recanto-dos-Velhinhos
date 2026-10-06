// GET /api/admin/voluntarios/:id — todos os campos coletados (FR-037a).
// PUT /api/admin/voluntarios/:id — corrige os dados sem mudar o status (FR-037, 2026-10-06):
// mesmas validações do Portal; estado anterior no histórico; anonimizado → 409; se aprovado,
// nome, e-mail e telefone são corrigidos também na `pessoa`. O CPF de quem já foi aprovado não
// muda por aqui: ele identifica a pessoa (FR-048).

import { sql, transacao } from '../../_lib/db.js';
import { exigirAdmin } from '../../_lib/acesso.js';
import { registrarAuditoria } from '../../_lib/auditoria.js';
import { registrarAlteracao } from '../../_lib/historico.js';
import { validarCadastro, CAMPOS } from '../../_lib/voluntarios.js';
import { idadeEm, dataTexto } from '../../_lib/datas.js';
import { json, lerJson, falhar, idDaRota, rota } from '../../_lib/http.js';

export function paraTela(c, consentimento) {
  const nascimento = c.data_nascimento ? dataTexto(c.data_nascimento) : null;
  return {
    id: c.id,
    protocolo: c.protocolo,
    origem: c.origem,
    status: c.status,
    nome: c.nome,
    dataNascimento: nascimento,
    idade: nascimento ? idadeEm(nascimento) : null,
    cpf: c.cpf,
    rg: c.rg,
    escolaridade: c.escolaridade,
    profissao: c.profissao,
    endereco: c.endereco,
    bairro: c.bairro,
    cep: c.cep,
    cidade: c.cidade,
    uf: c.uf,
    telefone: c.telefone,
    email: c.email,
    tipoServico: c.tipo_servico,
    objetivos: c.objetivos,
    condicoes: c.condicoes,
    menorDeIdade: c.menor_de_idade,
    autorizacaoStatus: c.autorizacao_status,
    autorizacaoRecebidaPor: c.autorizacao_recebida_por,
    autorizacaoRecebidaEm: c.autorizacao_recebida_em,
    motivoRejeicao: c.motivo_rejeicao,
    triadoPor: c.triado_por,
    triadoEm: c.triado_em,
    criadoEm: c.criado_em,
    anonimizado: Boolean(c.anonimizado_em),
    consentimento: consentimento ? { avisoVersao: consentimento.aviso_versao, aceitoEm: consentimento.aceito_em, revogadoEm: consentimento.revogado_em } : null,
  };
}

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const id = idDaRota(request);
  const [c] = await sql`SELECT * FROM cadastro_voluntario WHERE id = ${id}`;
  if (!c) falhar(404, 'NAO_ENCONTRADO', 'Cadastro não encontrado.');
  const [consentimento] = await sql`SELECT aviso_versao, aceito_em, revogado_em FROM consentimento WHERE cadastro_voluntario_id = ${id}`;
  return json(paraTela(c, consentimento));
});

export const PUT = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const dados = validarCadastro(await lerJson(request));
  const autor = conta.identificador;

  await transacao(async (tx) => {
    const [atual] = await tx.query('SELECT * FROM cadastro_voluntario WHERE id = $1 FOR UPDATE', [id]);
    if (!atual) falhar(404, 'NAO_ENCONTRADO', 'Cadastro não encontrado.');
    if (atual.anonimizado_em) falhar(409, 'REGISTRO_ANONIMIZADO', 'Este cadastro foi anonimizado e não pode ser corrigido.');
    if (atual.status === 'aprovado' && dados.cpf !== atual.cpf) {
      falhar(422, 'CPF_NAO_ALTERAVEL', 'O CPF de um voluntário já aprovado identifica a pessoa e não pode ser trocado aqui.', ['cpf']);
    }

    // Data de nascimento corrigida enquanto em triagem: refaz a regra do menor (FR-012).
    let autorizacao = atual.autorizacao_status;
    if (['pendente', 'entrevista'].includes(atual.status) && atual.autorizacao_status !== 'recebida') {
      autorizacao = dados.menor_de_idade ? 'pendente' : 'nao_se_aplica';
    }

    await registrarAlteracao({ entidadeTipo: 'cadastro_voluntario', entidadeId: id, estadoAnterior: atual, autor }, tx);
    await tx.query(
      `UPDATE cadastro_voluntario SET ${CAMPOS.map((c, i) => `${c} = $${i + 2}`).join(', ')},
              menor_de_idade = $${CAMPOS.length + 2}, autorizacao_status = $${CAMPOS.length + 3}
       WHERE id = $1`,
      [id, ...CAMPOS.map((c) => dados[c]), dados.menor_de_idade, autorizacao]);

    if (atual.status === 'aprovado' && atual.pessoa_id) {
      const [pessoa] = await tx.query('SELECT nome, email, telefone FROM pessoa WHERE id = $1', [atual.pessoa_id]);
      await registrarAlteracao({ entidadeTipo: 'pessoa', entidadeId: atual.pessoa_id, estadoAnterior: pessoa, autor }, tx);
      try {
        await tx.query(
          `UPDATE pessoa SET nome = $2, email = $3, telefone = $4, atualizado_por = $5, atualizado_em = now() WHERE id = $1`,
          [atual.pessoa_id, dados.nome, dados.email, dados.telefone, autor]);
      } catch (e) {
        if (e.code === '23505') falhar(409, 'EMAIL_EM_USO', 'Este e-mail já pertence a outra pessoa cadastrada.', ['email']);
        throw e;
      }
    }

    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id,
      acao: 'voluntario.corrigir', entidadeTipo: 'cadastro_voluntario', entidadeId: id,
    }, tx);
  });
  return json({ ok: true });
});
