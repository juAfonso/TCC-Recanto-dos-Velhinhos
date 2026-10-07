// GET /api/admin/institucional — textos das cinco seções, imagens ativas e histórico de versões.
// PUT /api/admin/institucional — { historia, missao, equipe, acolhimento, bazar } (FR-001a).
//   Seção vazia é permitida (o Portal a esconde). A versão anterior vai para historico_alteracao
//   e o Portal passa a mostrar a nova ao salvar. Não se publica nem despublica: não é notícia.
// As imagens têm rotas próprias (institucional/imagens), uma imagem por envio: o corpo de uma
// requisição na Vercel é limitado a 4,5 MB (research, limites conferidos em 2026-10-05).

import { sql, transacao } from '../_lib/db.js';
import { exigirAdmin } from '../_lib/acesso.js';
import { registrarAuditoria } from '../_lib/auditoria.js';
import { registrarAlteracao } from '../_lib/historico.js';
import { SECOES, MAX_IMAGENS_INSTITUCIONAIS, ID_HISTORICO_INSTITUCIONAL, validarTextosInstitucionais } from '../_lib/conteudo.js';
import { json, lerJson, rota } from '../_lib/http.js';

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const [[conteudo], imagens, historico] = await Promise.all([
    sql`SELECT * FROM conteudo_institucional WHERE id = 1`,
    sql`SELECT i.id, i.texto_alternativo, i.criado_por, i.criado_em, a.blob_url
        FROM conteudo_institucional_imagem i JOIN arquivo a ON a.id = i.arquivo_id
        WHERE i.ativo AND a.removido_em IS NULL ORDER BY i.ordem, i.criado_em`,
    sql`SELECT estado_anterior, alterado_por, alterado_em FROM historico_alteracao
        WHERE entidade_tipo = 'conteudo_institucional' AND entidade_id = ${ID_HISTORICO_INSTITUCIONAL}
        ORDER BY alterado_em DESC LIMIT 20`,
  ]);
  return json({
    ...Object.fromEntries(SECOES.map((s) => [s, conteudo?.[s] ?? ''])),
    atualizadoPor: conteudo?.atualizado_por ?? null,
    atualizadoEm: conteudo?.atualizado_em ?? null,
    maxImagens: MAX_IMAGENS_INSTITUCIONAIS,
    imagens: imagens.map((i) => ({ id: i.id, url: i.blob_url, alt: i.texto_alternativo, criadoPor: i.criado_por, criadoEm: i.criado_em })),
    // Versões anteriores, para consulta (Princípio III). O texto completo vai junto: é conteúdo público.
    historico: historico.map((h) => ({ alteradoPor: h.alterado_por, alteradoEm: h.alterado_em, versao: h.estado_anterior })),
  });
});

export const PUT = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const novos = validarTextosInstitucionais(await lerJson(request));

  const alteradas = await transacao(async (tx) => {
    const [atual] = await tx.query(
      `SELECT ${SECOES.join(', ')}, atualizado_por, atualizado_em FROM conteudo_institucional WHERE id = 1 FOR UPDATE`);
    const mudou = SECOES.filter((s) => atual[s] !== novos[s]);
    if (!mudou.length) return [];
    await registrarAlteracao({
      entidadeTipo: 'conteudo_institucional', entidadeId: ID_HISTORICO_INSTITUCIONAL, estadoAnterior: atual, autor: conta.identificador,
    }, tx);
    await tx.query(
      `UPDATE conteudo_institucional SET ${SECOES.map((s, i) => `${s} = $${i + 1}`).join(', ')},
              atualizado_por = $${SECOES.length + 1}, atualizado_em = now()
       WHERE id = 1`,
      [...SECOES.map((s) => novos[s]), conta.identificador]);
    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id, acao: 'institucional.editar',
      detalhe: { secoes: mudou },
    }, tx);
    return mudou;
  });
  return json({ alteradas });
});
