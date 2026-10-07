// GET/PUT /api/admin/configuracao — valores que a equipe muda sem mexer no código (research D10):
//   itemSemAtualizacaoDias (FR-028), retencaoMeses (FR-056) e contatoInstituicao (FR-007a, FR-053).
// O aviso de privacidade não é configuração: tem versões próprias, na tela de Privacidade (LGPD).

import { sql, transacao } from '../_lib/db.js';
import { exigirAdmin } from '../_lib/acesso.js';
import { registrarAuditoria } from '../_lib/auditoria.js';
import * as v from '../_lib/validacao.js';
import { json, lerJson, falhar, rota } from '../_lib/http.js';

const CHAVES = {
  itemSemAtualizacaoDias: 'item_sem_atualizacao_dias',
  retencaoMeses: 'retencao_meses',
  contatoInstituicao: 'contato_instituicao',
};

function inteiro(valor, min, max, rotulo) {
  return /^\d+$/.test(valor) && Number(valor) >= min && Number(valor) <= max
    ? null : `${rotulo} deve ser um número inteiro de ${min} a ${max}.`;
}

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const linhas = await sql`
    SELECT chave, valor, atualizado_por, atualizado_em FROM configuracao WHERE chave = ANY(${Object.values(CHAVES)})`;
  const por = Object.fromEntries(linhas.map((l) => [l.chave, l]));
  return json(Object.fromEntries(Object.entries(CHAVES).map(([campo, chave]) => [campo, {
    valor: por[chave]?.valor ?? '',
    atualizadoPor: por[chave]?.atualizado_por ?? null,
    atualizadoEm: por[chave]?.atualizado_em ?? null,
  }])));
});

export const PUT = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const corpo = await lerJson(request);
  const novos = {
    itemSemAtualizacaoDias: String(corpo.itemSemAtualizacaoDias ?? '').trim(),
    retencaoMeses: String(corpo.retencaoMeses ?? '').trim(),
    contatoInstituicao: String(corpo.contatoInstituicao ?? '').trim().slice(0, 300),
  };
  const falha = v.conferir({
    itemSemAtualizacaoDias: inteiro(novos.itemSemAtualizacaoDias, 1, 365, 'O prazo de item sem atualização'),
    retencaoMeses: inteiro(novos.retencaoMeses, 1, 60, 'O prazo de retenção'),
    contatoInstituicao: v.obrigatorio(novos.contatoInstituicao, 'O contato da instituição'),
  });
  if (falha) falhar(400, 'DADOS_INVALIDOS', falha.mensagem, falha.campos, falha.mensagens);

  const alteradas = await transacao(async (tx) => {
    const atuais = await tx.query(
      'SELECT chave, valor FROM configuracao WHERE chave = ANY($1) FOR UPDATE', [Object.values(CHAVES)]);
    const antes = Object.fromEntries(atuais.map((l) => [l.chave, l.valor]));
    const mudou = Object.entries(CHAVES).filter(([campo, chave]) => antes[chave] !== novos[campo]);
    for (const [campo, chave] of mudou) {
      await tx.query(
        `INSERT INTO configuracao (chave, valor, atualizado_por) VALUES ($1, $2, $3)
         ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, atualizado_por = EXCLUDED.atualizado_por, atualizado_em = now()`,
        [chave, novos[campo], conta.identificador]);
    }
    if (mudou.length) {
      // Prazos vão com o valor anterior; o contato, só como "alterado".
      const prazos = mudou.filter(([campo]) => campo !== 'contatoInstituicao')
        .map(([campo, chave]) => ({ chave, de: antes[chave] ?? null, para: novos[campo] }));
      await registrarAuditoria({
        autorTipo: 'conta_institucional', autorId: conta.id, acao: 'configuracao.alterar',
        detalhe: { prazos, contatoAlterado: mudou.some(([campo]) => campo === 'contatoInstituicao') },
      }, tx);
    }
    return mudou.map(([campo]) => campo);
  });
  return json({ alteradas });
});
