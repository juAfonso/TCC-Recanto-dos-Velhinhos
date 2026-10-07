// POST /api/admin/pessoas/:id/reativar — { papel }. Desfaz a inativação de UM papel (FR-024).
// Papel encerrado (efetivação como funcionário, revogação do doador) não volta: é terminal.
// Voluntário cujo consentimento foi revogado (FR-057) não é reativado: precisaria de novo aceite,
// então a pessoa faz novo cadastro. Funcionário ativo impede reativar voluntário e vice-versa (FR-048).

import { transacao } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { registrarAuditoria } from '../../../_lib/auditoria.js';
import { reativarPapel } from '../../../_lib/papeis.js';
import { PAPEIS } from '../../../_lib/pessoas.js';
import { json, lerJson, falhar, idDaRota, rota } from '../../../_lib/http.js';

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const corpo = await lerJson(request);
  if (!PAPEIS.includes(corpo.papel)) falhar(400, 'DADOS_INVALIDOS', 'Escolha qual papel reativar.', ['papel']);

  await transacao(async (tx) => {
    const [pessoa] = await tx.query('SELECT id FROM pessoa WHERE id = $1 AND anonimizado_em IS NULL FOR UPDATE', [id]);
    if (!pessoa) falhar(404, 'NAO_ENCONTRADO', 'Pessoa não encontrada.');

    const [papel] = await tx.query(
      `SELECT origem_id FROM papel WHERE pessoa_id = $1 AND tipo = $2 AND status = 'inativo'`, [id, corpo.papel]);
    if (!papel) falhar(409, 'PAPEL_NAO_INATIVO', 'Não há papel inativo deste tipo para reativar. Recarregue a página.');

    if (corpo.papel === 'voluntario') {
      const [revogado] = await tx.query(
        `SELECT 1 FROM consentimento WHERE cadastro_voluntario_id = $1 AND revogado_em IS NOT NULL`, [papel.origem_id]);
      if (revogado) {
        falhar(409, 'CONSENTIMENTO_REVOGADO',
          'O consentimento deste voluntário foi revogado a pedido dele. Para voltar, ele precisa fazer um cadastro novo.');
      }
    }

    try {
      await reativarPapel(tx, id, corpo.papel, conta.identificador);
    } catch (e) {
      if (e.code === '23505' && String(e.constraint ?? e.message).includes('papel_exclusivo_ativo')) {
        falhar(422, 'FUNCIONARIO_NAO_PODE_SER_VOLUNTARIO',
          'Esta pessoa já tem um vínculo ativo de funcionário ou voluntário. Funcionário não pode ser voluntário ao mesmo tempo.');
      }
      throw e;
    }
    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id, acao: 'pessoa.reativar',
      entidadeTipo: 'pessoa', entidadeId: id, detalhe: { papel: corpo.papel },
    }, tx);
  });
  return json({ ok: true });
});
