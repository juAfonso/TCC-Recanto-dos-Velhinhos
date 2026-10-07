// POST /api/admin/pessoas/:id/papeis — adiciona papel a quem já está cadastrado (FR-023, FR-048).
//   { tipo: 'funcionario', confirmar? }
//     Voluntário ativo → 409 + confirmarAviso: o papel de voluntário é ENCERRADO (não apagado),
//     como na efetivação de candidatura (FR-048). Com `confirmar: true`, segue.
//   { tipo: 'voluntario', ...campos do termo de adesão (FR-011) }
//     Gera cadastro de voluntário com origem "painel" (FR-023): adulto já aprovado; menor pendente
//     até a autorização chegar. Funcionário ativo → 422 (FR-048). O CPF é sempre o da pessoa.
//   doador_associado → 422: esse papel só nasce com a primeira doação associativa (2026-10-04).
// Papel do mesmo tipo inativo → 409: reative em vez de criar outro.

import { transacao } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { registrarAuditoria } from '../../../_lib/auditoria.js';
import { validarCadastro } from '../../../_lib/voluntarios.js';
import { cadastrarVoluntarioPainel } from '../../../_lib/pessoas.js';
import { adicionarPapel, encerrarPapel } from '../../../_lib/papeis.js';
import { json, lerJson, falhar, idDaRota, rota } from '../../../_lib/http.js';

const NOMES = { funcionario: 'funcionário', voluntario: 'voluntário' };

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const corpo = await lerJson(request);
  const autor = conta.identificador;
  const tipo = corpo.tipo;

  if (tipo === 'doador_associado') {
    falhar(422, 'PAPEL_NAO_PERMITIDO',
      'O doador associado não é cadastrado pelo Painel: a conta nasce com a primeira doação associativa feita no site.');
  }
  if (!NOMES[tipo]) falhar(400, 'DADOS_INVALIDOS', 'Escolha o papel: funcionário ou voluntário.', ['tipo']);

  const resultado = await transacao(async (tx) => {
    const [pessoa] = await tx.query('SELECT id, cpf, anonimizado_em FROM pessoa WHERE id = $1 FOR UPDATE', [id]);
    if (!pessoa) falhar(404, 'NAO_ENCONTRADO', 'Pessoa não encontrada.');
    if (pessoa.anonimizado_em) falhar(409, 'REGISTRO_ANONIMIZADO', 'Este cadastro foi anonimizado e não pode receber papéis.');

    const papeis = await tx.query(
      `SELECT tipo, status FROM papel WHERE pessoa_id = $1 AND tipo IN ('funcionario', 'voluntario') AND status <> 'encerrado'`, [id]);
    const mesmo = papeis.find((p) => p.tipo === tipo);
    if (mesmo?.status === 'ativo') falhar(409, 'PAPEL_JA_ATIVO', `Esta pessoa já é ${NOMES[tipo]} ativa.`);
    if (mesmo?.status === 'inativo') {
      falhar(409, 'PAPEL_INATIVO', `Esta pessoa já foi ${NOMES[tipo]} e está inativa. Use "Reativar" em vez de cadastrar de novo.`);
    }

    if (tipo === 'funcionario') {
      const voluntarioAtivo = papeis.some((p) => p.tipo === 'voluntario' && p.status === 'ativo');
      if (voluntarioAtivo && corpo.confirmar !== true) {
        falhar(409, 'VOLUNTARIO_SERA_ENCERRADO',
          'Esta pessoa é voluntária. Funcionário e voluntário não podem ser a mesma pessoa ao mesmo tempo: ao continuar, o papel de voluntário é encerrado (o histórico fica guardado).',
          null, null, { confirmarAviso: true });
      }
      if (voluntarioAtivo) await encerrarPapel(tx, id, 'voluntario', autor);
      await adicionarPapel(tx, id, 'funcionario', null, autor);
      await registrarAuditoria({
        autorTipo: 'conta_institucional', autorId: conta.id, acao: 'pessoa.adicionar_papel',
        entidadeTipo: 'pessoa', entidadeId: id, detalhe: { papel: 'funcionario', voluntarioEncerrado: voluntarioAtivo },
      }, tx);
      return { id, papel: 'funcionario' };
    }

    if (papeis.some((p) => p.tipo === 'funcionario' && p.status === 'ativo')) {
      falhar(422, 'FUNCIONARIO_NAO_PODE_SER_VOLUNTARIO',
        'Esta pessoa é funcionária ativa. Funcionário não pode ser voluntário ao mesmo tempo.');
    }
    const [emTriagem] = await tx.query(
      `SELECT protocolo FROM cadastro_voluntario
       WHERE cpf = $1 AND status IN ('pendente', 'entrevista') AND anonimizado_em IS NULL`, [pessoa.cpf]);
    if (emTriagem) {
      falhar(409, 'VOLUNTARIO_EM_TRIAGEM',
        `Esta pessoa já tem um cadastro de voluntário em triagem (protocolo ${emTriagem.protocolo}). Decida por ele em Triagem › Voluntários.`);
    }
    const dados = validarCadastro({ ...corpo, cpf: pessoa.cpf });
    const r = await cadastrarVoluntarioPainel(tx, dados, autor);
    await tx.query('UPDATE cadastro_voluntario SET pessoa_id = $2 WHERE id = $1', [r.cadastroVoluntarioId, id]);
    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id, acao: 'voluntario.cadastrar_painel',
      entidadeTipo: 'cadastro_voluntario', entidadeId: r.cadastroVoluntarioId, detalhe: { menorDeIdade: dados.menor_de_idade },
    }, tx);
    return { id, papel: 'voluntario', ...r, pessoaId: id };
  });
  return json(resultado, 201);
});
