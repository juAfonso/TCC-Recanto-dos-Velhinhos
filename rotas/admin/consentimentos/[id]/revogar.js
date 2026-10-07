// POST /api/admin/consentimentos/:id/revogar — registra a revogação pedida pelo titular por
// contato (FR-054, FR-057). Marca o consentimento e aplica o efeito conforme o dono, na mesma
// transação. NÃO anonimiza (é outro pedido, FR-055) e não envia e-mail.
//   submissão em triagem → "encerrada a pedido do titular" (sai da fila, conta o prazo do FR-056)
//   cadastro de voluntário aprovado → papel de voluntário inativado
//   doador associado → papel encerrado (perde o login) e TODOS os aceites dele revogados

import { transacao } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { registrarAuditoria } from '../../../_lib/auditoria.js';
import { json, falhar, idDaRota, rota } from '../../../_lib/http.js';

const SUBMISSOES = {
  cadastro_voluntario_id: { tabela: 'cadastro_voluntario', triagem: ['pendente', 'entrevista'], encerrado: 'encerrado_titular' },
  candidatura_id: { tabela: 'candidatura', triagem: ['em_analise', 'entrevista'], encerrado: 'encerrada_titular' },
  solicitacao_externa_id: { tabela: 'solicitacao_externa', triagem: ['em_analise', 'aguardando_contato'], encerrado: 'encerrada_titular' },
};

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const autor = conta.identificador;

  const resultado = await transacao(async (tx) => {
    const [c] = await tx.query('SELECT * FROM consentimento WHERE id = $1 FOR UPDATE', [id]);
    if (!c) falhar(404, 'NAO_ENCONTRADO', 'Consentimento não encontrado.');
    if (c.revogado_em) falhar(409, 'JA_REVOGADO', 'Este consentimento já foi revogado.');

    let efeito = 'nenhum';
    let entidade = null;
    if (c.pessoa_id) {
      entidade = { tipo: 'pessoa', id: c.pessoa_id };
      await tx.query(
        `UPDATE consentimento SET revogado_em = now(), revogado_por = $2 WHERE pessoa_id = $1 AND revogado_em IS NULL`,
        [c.pessoa_id, autor]);
      const encerrados = await tx.query(
        `UPDATE papel SET status = 'encerrado', fim_em = now(), alterado_por = $2, alterado_em = now()
         WHERE pessoa_id = $1 AND tipo = 'doador_associado' AND status <> 'encerrado' RETURNING id`, [c.pessoa_id, autor]);
      if (encerrados.length) efeito = 'doador_encerrado';
    } else {
      await tx.query('UPDATE consentimento SET revogado_em = now(), revogado_por = $2 WHERE id = $1', [id, autor]);
      const [coluna, regra] = Object.entries(SUBMISSOES).find(([col]) => c[col]);
      const [s] = await tx.query(`SELECT * FROM ${regra.tabela} WHERE id = $1 FOR UPDATE`, [c[coluna]]);
      entidade = { tipo: regra.tabela, id: s.id };
      if (regra.triagem.includes(s.status)) {
        await tx.query(
          `UPDATE ${regra.tabela} SET status = $2, concluido_em = now(), triado_por = $3, triado_em = now() WHERE id = $1`,
          [s.id, regra.encerrado, autor]);
        efeito = 'submissao_encerrada';
      } else if (regra.tabela === 'cadastro_voluntario' && s.status === 'aprovado' && s.pessoa_id) {
        const inativados = await tx.query(
          `UPDATE papel SET status = 'inativo', alterado_por = $2, alterado_em = now()
           WHERE pessoa_id = $1 AND tipo = 'voluntario' AND status = 'ativo' RETURNING id`, [s.pessoa_id, autor]);
        if (inativados.length) efeito = 'voluntario_inativado';
      }
    }

    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id, acao: 'consentimento.revogar',
      entidadeTipo: entidade.tipo, entidadeId: entidade.id, detalhe: { consentimento: id, efeito },
    }, tx);
    return { id, efeito };
  });
  return json(resultado);
});
