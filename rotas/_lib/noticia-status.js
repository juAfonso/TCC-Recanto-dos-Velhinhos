// Publicar e despublicar notícia (FR-032a). Despublicar tira do Portal sem apagar: a notícia
// continua no Painel e pode voltar. É o "excluir" do protótipo, sem exclusão (Princípio III).

import { transacao } from './db.js';
import { registrarAuditoria } from './auditoria.js';
import { falhar } from './http.js';

export async function mudarStatusNoticia({ id, para, conta }) {
  const de = para === 'publicada' ? 'despublicada' : 'publicada';
  await transacao(async (tx) => {
    const [n] = await tx.query(
      `UPDATE noticia SET status = $2, status_alterado_por = $3, status_alterado_em = now()
       WHERE id = $1 AND status = $4 RETURNING id`,
      [id, para, conta.identificador, de]);
    if (!n) {
      const [existe] = await tx.query('SELECT 1 FROM noticia WHERE id = $1', [id]);
      if (!existe) falhar(404, 'NAO_ENCONTRADO', 'Notícia não encontrada.');
      falhar(409, 'STATUS_JA_APLICADO', para === 'publicada' ? 'Esta notícia já está publicada.' : 'Esta notícia já está despublicada.');
    }
    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id,
      acao: para === 'publicada' ? 'noticia.publicar' : 'noticia.despublicar',
      entidadeTipo: 'noticia', entidadeId: id,
    }, tx);
  });
  return { id, status: para };
}
