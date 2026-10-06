// GET /api/admin/candidaturas/:id — todos os campos (FR-037a); diz se há arquivo, nunca a URL.
// Avisa se o CPF já é de voluntário ativo (na aprovação, esse papel é encerrado — FR-048).
// PUT — corrige os dados sem mudar status nem arquivo (FR-037); histórico; anonimizada → 409;
// se aprovada, nome, e-mail e telefone também na `pessoa`. O CPF da aprovada não muda por aqui.

import { sql, transacao } from '../../_lib/db.js';
import { exigirAdmin } from '../../_lib/acesso.js';
import { registrarAuditoria } from '../../_lib/auditoria.js';
import { registrarAlteracao } from '../../_lib/historico.js';
import { validarCandidatura, CAMPOS } from '../../_lib/candidaturas.js';
import { idadeEm, dataTexto } from '../../_lib/datas.js';
import { json, lerJson, falhar, idDaRota, rota } from '../../_lib/http.js';

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const id = idDaRota(request);
  const [c] = await sql`
    SELECT c.*, a.nome_original AS arquivo_nome, a.tamanho_bytes AS arquivo_tamanho, a.removido_em AS arquivo_removido
    FROM candidatura c LEFT JOIN arquivo a ON a.id = c.curriculo_arquivo_id
    WHERE c.id = ${id}`;
  if (!c) falhar(404, 'NAO_ENCONTRADO', 'Candidatura não encontrada.');
  const [consentimento] = await sql`SELECT aviso_versao, aceito_em, revogado_em FROM consentimento WHERE candidatura_id = ${id}`;
  const [voluntario] = c.anonimizado_em ? [] : await sql`
    SELECT 1 FROM pessoa p JOIN papel pa ON pa.pessoa_id = p.id
    WHERE p.cpf = ${c.cpf} AND p.anonimizado_em IS NULL AND pa.tipo = 'voluntario' AND pa.status = 'ativo'`;
  const nascimento = c.data_nascimento ? dataTexto(c.data_nascimento) : null;
  return json({
    id: c.id, protocolo: c.protocolo, cargo: c.cargo, status: c.status,
    nome: c.nome, cpf: c.cpf, dataNascimento: nascimento, idade: nascimento ? idadeEm(nascimento) : null,
    telefone: c.telefone, email: c.email, curriculoTexto: c.curriculo_texto,
    arquivo: c.curriculo_arquivo_id && !c.arquivo_removido ? { nome: c.arquivo_nome, tamanho: c.arquivo_tamanho } : null,
    curriculoAnonimizado: Boolean(c.curriculo_anonimizado_em),
    motivoRejeicao: c.motivo_rejeicao, triadoPor: c.triado_por, triadoEm: c.triado_em,
    efetivadoEm: c.efetivado_em, criadoEm: c.criado_em, anonimizado: Boolean(c.anonimizado_em),
    jaVoluntario: Boolean(voluntario),
    consentimento: consentimento ? { avisoVersao: consentimento.aviso_versao, aceitoEm: consentimento.aceito_em, revogadoEm: consentimento.revogado_em } : null,
  });
});

export const PUT = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const corpo = await lerJson(request);
  const dados = validarCandidatura(corpo);
  const autor = conta.identificador;

  await transacao(async (tx) => {
    const [atual] = await tx.query('SELECT * FROM candidatura WHERE id = $1 FOR UPDATE', [id]);
    if (!atual) falhar(404, 'NAO_ENCONTRADO', 'Candidatura não encontrada.');
    if (atual.anonimizado_em) falhar(409, 'REGISTRO_ANONIMIZADO', 'Esta candidatura foi anonimizada e não pode ser corrigida.');
    if (atual.status === 'aprovada' && dados.cpf !== atual.cpf) {
      falhar(422, 'CPF_NAO_ALTERAVEL', 'O CPF de uma candidatura aprovada identifica o funcionário e não pode ser trocado aqui.', ['cpf']);
    }
    // O texto do currículo só muda se vier no corpo; o arquivo nunca muda por aqui.
    const texto = corpo.curriculoTexto === undefined ? atual.curriculo_texto : dados.curriculo_texto;
    if (!texto && !atual.curriculo_arquivo_id) {
      falhar(422, 'CURRICULO_OBRIGATORIO', 'Sem arquivo, a descrição da experiência não pode ficar vazia.', ['curriculoTexto']);
    }
    await registrarAlteracao({ entidadeTipo: 'candidatura', entidadeId: id, estadoAnterior: atual, autor }, tx);
    await tx.query(
      `UPDATE candidatura SET ${CAMPOS.map((c, i) => `${c} = $${i + 2}`).join(', ')}, curriculo_texto = $${CAMPOS.length + 2}
       WHERE id = $1`,
      [id, ...CAMPOS.map((c) => dados[c]), texto]);
    if (atual.status === 'aprovada' && atual.pessoa_id) {
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
      acao: 'candidatura.corrigir', entidadeTipo: 'candidatura', entidadeId: id,
    }, tx);
  });
  return json({ ok: true });
});
