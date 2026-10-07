// GET/POST /api/admin/aviso-privacidade (FR-053). Uma versão publicada nunca se edita: mudar o
// texto é publicar uma versão nova, que passa a valer para os próximos aceites (FR-052). Os
// consentimentos antigos continuam apontando para a versão que a pessoa aceitou.

import { sql, transacao } from '../_lib/db.js';
import { exigirAdmin } from '../_lib/acesso.js';
import { registrarAuditoria } from '../_lib/auditoria.js';
import { hojeBrasilia } from '../_lib/datas.js';
import { json, lerJson, falhar, rota } from '../_lib/http.js';

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const versoes = await sql`
    SELECT a.versao, a.texto, a.publicado_por, a.publicado_em,
           (SELECT count(*)::int FROM consentimento c WHERE c.aviso_versao = a.versao) AS aceites
    FROM aviso_privacidade a ORDER BY a.publicado_em DESC`;
  return json({
    versoes: versoes.map((v, i) => ({
      versao: v.versao, texto: v.texto, publicadoPor: v.publicado_por, publicadoEm: v.publicado_em,
      aceites: v.aceites, vigente: i === 0,
    })),
  });
});

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const { texto } = await lerJson(request);
  const limpo = String(texto ?? '').trim().slice(0, 30000);
  if (limpo.length < 200) {
    falhar(400, 'DADOS_INVALIDOS', 'O aviso precisa explicar quais dados são coletados, para quê, por quanto tempo e o contato. Escreva o texto completo.', ['texto']);
  }

  const versao = await transacao(async (tx) => {
    // Versão "AAAA-MM-vN": N conta as publicações do mês. Trava a tabela para não repetir o número.
    await tx.query('LOCK TABLE aviso_privacidade IN EXCLUSIVE MODE');
    const [vigente] = await tx.query('SELECT texto FROM aviso_privacidade ORDER BY publicado_em DESC LIMIT 1');
    if (vigente && vigente.texto.trim() === limpo) falhar(409, 'SEM_MUDANCA', 'O texto é igual ao da versão vigente. Nada foi publicado.');
    const mes = hojeBrasilia().slice(0, 7);
    const [{ n }] = await tx.query('SELECT count(*)::int AS n FROM aviso_privacidade WHERE versao LIKE $1', [`${mes}-v%`]);
    const nova = `${mes}-v${n + 1}`;
    await tx.query('INSERT INTO aviso_privacidade (versao, texto, publicado_por) VALUES ($1, $2, $3)', [nova, limpo, conta.identificador]);
    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id, acao: 'aviso_privacidade.publicar',
      entidadeTipo: 'aviso_privacidade', detalhe: { versao: nova },
    }, tx);
    return nova;
  });
  return json({ versao }, 201);
});
