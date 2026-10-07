// GET /api/admin/pessoas/:id — todos os dados, papéis, submissões ligadas (pelo vínculo ou pelo
// mesmo CPF), consentimentos, doações associativas e histórico de correções (FR-023, FR-037a).
// PUT /api/admin/pessoas/:id — corrige nome, data de nascimento, e-mail e telefone (FR-037).
//   O CPF não muda: ele identifica a pessoa (FR-048). Anonimizado → 409. Estado anterior no histórico.

import { sql, transacao } from '../../_lib/db.js';
import { exigirAdmin } from '../../_lib/acesso.js';
import { registrarAuditoria } from '../../_lib/auditoria.js';
import { registrarAlteracao } from '../../_lib/historico.js';
import { validarPessoa, traduzirEmailEmUso } from '../../_lib/pessoas.js';
import { dataTexto } from '../../_lib/datas.js';
import { json, lerJson, falhar, idDaRota, rota } from '../../_lib/http.js';

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const id = idDaRota(request);
  const [p] = await sql`SELECT * FROM pessoa WHERE id = ${id}`;
  if (!p) falhar(404, 'NAO_ENCONTRADO', 'Pessoa não encontrada.');

  const [papeis, voluntarios, candidaturas, consentimentos, [doacoes], historico] = await Promise.all([
    sql`SELECT tipo, status, inicio_em, fim_em, alterado_por, alterado_em FROM papel WHERE pessoa_id = ${id} ORDER BY inicio_em`,
    sql`SELECT id, protocolo, origem, status, autorizacao_status, menor_de_idade, criado_em FROM cadastro_voluntario
        WHERE pessoa_id = ${id} OR (cpf = ${p.cpf} AND anonimizado_em IS NULL) ORDER BY criado_em DESC`,
    sql`SELECT id, protocolo, cargo, status, criado_em FROM candidatura
        WHERE pessoa_id = ${id} OR (cpf = ${p.cpf} AND anonimizado_em IS NULL) ORDER BY criado_em DESC`,
    sql`SELECT c.id, c.aviso_versao, c.finalidade, c.aceito_em, c.revogado_em
        FROM consentimento c
        LEFT JOIN cadastro_voluntario v ON v.id = c.cadastro_voluntario_id
        LEFT JOIN candidatura k ON k.id = c.candidatura_id
        WHERE c.pessoa_id = ${id} OR v.pessoa_id = ${id} OR k.pessoa_id = ${id}
           OR (v.cpf = ${p.cpf} AND v.anonimizado_em IS NULL) OR (k.cpf = ${p.cpf} AND k.anonimizado_em IS NULL)
        ORDER BY c.aceito_em DESC`,
    sql`SELECT count(*) FILTER (WHERE status = 'confirmada')::int AS confirmadas,
               count(*) FILTER (WHERE status = 'pendente')::int AS pendentes
        FROM doacao WHERE pessoa_id = ${id}`,
    sql`SELECT estado_anterior, alterado_por, alterado_em FROM historico_alteracao
        WHERE entidade_tipo = 'pessoa' AND entidade_id = ${id} ORDER BY alterado_em DESC`,
  ]);

  return json({
    id: p.id,
    nome: p.nome,
    cpf: p.cpf,
    dataNascimento: p.data_nascimento ? dataTexto(p.data_nascimento) : null,
    email: p.email,
    telefone: p.telefone,
    ativo: p.ativo && papeis.some((x) => x.status === 'ativo'),
    anonimizado: Boolean(p.anonimizado_em),
    contaDoador: p.senha_definida_em ? 'senha definida' : null,
    criadoPor: p.criado_por,
    criadoEm: p.criado_em,
    atualizadoPor: p.atualizado_por,
    atualizadoEm: p.atualizado_em,
    papeis: papeis.map((x) => ({
      tipo: x.tipo, status: x.status, inicioEm: x.inicio_em, fimEm: x.fim_em, alteradoPor: x.alterado_por, alteradoEm: x.alterado_em,
    })),
    cadastrosVoluntario: voluntarios.map((c) => ({
      id: c.id, protocolo: c.protocolo, origem: c.origem, status: c.status,
      menorDeIdade: c.menor_de_idade, autorizacaoStatus: c.autorizacao_status, criadoEm: c.criado_em,
    })),
    candidaturas: candidaturas.map((c) => ({ id: c.id, protocolo: c.protocolo, cargo: c.cargo, status: c.status, criadoEm: c.criado_em })),
    consentimentos: consentimentos.map((c) => ({
      id: c.id, avisoVersao: c.aviso_versao, finalidade: c.finalidade, aceitoEm: c.aceito_em, revogadoEm: c.revogado_em,
    })),
    doacoes,
    historico: historico.map((h) => ({
      alteradoPor: h.alterado_por,
      alteradoEm: h.alterado_em,
      anterior: {
        nome: h.estado_anterior.nome,
        dataNascimento: h.estado_anterior.data_nascimento ? String(h.estado_anterior.data_nascimento).slice(0, 10) : undefined,
        email: h.estado_anterior.email,
        telefone: h.estado_anterior.telefone,
      },
    })),
  });
});

export const PUT = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const dados = validarPessoa(await lerJson(request), { comCpf: false });
  const autor = conta.identificador;

  await transacao(async (tx) => {
    const [atual] = await tx.query(
      'SELECT nome, data_nascimento, email, telefone, anonimizado_em FROM pessoa WHERE id = $1 FOR UPDATE', [id]);
    if (!atual) falhar(404, 'NAO_ENCONTRADO', 'Pessoa não encontrada.');
    if (atual.anonimizado_em) falhar(409, 'REGISTRO_ANONIMIZADO', 'Este cadastro foi anonimizado e não pode ser corrigido.');

    const { anonimizado_em, ...anterior } = atual;
    if (anterior.data_nascimento) anterior.data_nascimento = dataTexto(anterior.data_nascimento);
    await registrarAlteracao({ entidadeTipo: 'pessoa', entidadeId: id, estadoAnterior: anterior, autor }, tx);
    try {
      await tx.query(
        `UPDATE pessoa SET nome = $2, data_nascimento = $3, email = $4, telefone = $5,
                atualizado_por = $6, atualizado_em = now()
         WHERE id = $1`,
        [id, dados.nome, dados.data_nascimento, dados.email, dados.telefone, autor]);
    } catch (e) { traduzirEmailEmUso(e); }
    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id, acao: 'pessoa.corrigir', entidadeTipo: 'pessoa', entidadeId: id,
    }, tx);
  });
  return json({ ok: true });
});
