// POST /api/admin/pessoas/:id/inativar — { papel, confirmar? }. Inativa UM papel (2026-10-07).
// Inativar não apaga nem oculta dados e pode ser desfeito (FR-024). Doador associado inativado
// perde o login na hora: toda rota do autoatendimento confere o papel ativo (acesso.js).
// Submissão em triagem ligada à pessoa → 409 + confirmarAviso, e segue com `confirmar: true` (FR-023a).

import { transacao } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { registrarAuditoria } from '../../../_lib/auditoria.js';
import { inativarPapel } from '../../../_lib/papeis.js';
import { PAPEIS, submissoesEmTriagem } from '../../../_lib/pessoas.js';
import { json, lerJson, falhar, idDaRota, rota } from '../../../_lib/http.js';

const NOMES = { cadastro_voluntario: 'cadastro de voluntário', candidatura: 'candidatura a vaga' };

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const corpo = await lerJson(request);
  if (!PAPEIS.includes(corpo.papel)) falhar(400, 'DADOS_INVALIDOS', 'Escolha qual papel inativar.', ['papel']);

  await transacao(async (tx) => {
    const [pessoa] = await tx.query('SELECT id, cpf FROM pessoa WHERE id = $1 AND anonimizado_em IS NULL FOR UPDATE', [id]);
    if (!pessoa) falhar(404, 'NAO_ENCONTRADO', 'Pessoa não encontrada.');

    const pendencias = await submissoesEmTriagem(tx, pessoa);
    if (pendencias.length && corpo.confirmar !== true) {
      const lista = pendencias.map((s) => `${NOMES[s.tipo]} ${s.protocolo}`).join(', ');
      falhar(409, 'SUBMISSAO_EM_TRIAGEM',
        `Esta pessoa tem submissão em triagem (${lista}). A inativação não muda a triagem, que continua na fila. Deseja inativar mesmo assim?`,
        null, null, { confirmarAviso: true });
    }

    const inativados = await inativarPapel(tx, id, corpo.papel, conta.identificador);
    if (!inativados.length) falhar(409, 'PAPEL_NAO_ATIVO', 'Este papel já não está ativo. Recarregue a página.');
    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id, acao: 'pessoa.inativar',
      entidadeTipo: 'pessoa', entidadeId: id, detalhe: { papel: corpo.papel, comPendencia: pendencias.length > 0 },
    }, tx);
  });
  return json({ ok: true });
});
