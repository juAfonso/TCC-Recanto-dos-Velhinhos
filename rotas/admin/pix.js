// GET/PUT /api/admin/pix — chave Pix da instituição (FR-007, CLAUDE.md 2026-09-05).
// PUT grava uma linha nova ativa e desativa a anterior (nada é apagado: a linha antiga é o histórico).
// Chave do tipo CPF ou telefone é dado de pessoa física: o primeiro PUT responde 409 com o
// aviso, e só grava se a tela repetir com `confirmarAviso: true` (contracts/api.md → Avisos).

import { sql, transacao } from '../_lib/db.js';
import { exigirAdmin } from '../_lib/acesso.js';
import { registrarAuditoria } from '../_lib/auditoria.js';
import * as v from '../_lib/validacao.js';
import { json, lerJson, falhar, rota } from '../_lib/http.js';

const TIPOS = new Set(['cnpj', 'cpf', 'email', 'telefone', 'aleatoria']);
const ALEATORIA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function erroDaChave(tipo, chave) {
  if (!chave) return 'Informe a chave Pix.';
  if (tipo === 'cnpj') return v.cnpj(chave);
  if (tipo === 'cpf') return v.cpf(chave);
  if (tipo === 'email') return v.email(chave);
  if (tipo === 'telefone') return v.telefone(chave);
  return ALEATORIA.test(chave) ? null : 'Chave aleatória inválida. Ela tem 36 caracteres, com hífens.';
}

// Guarda CNPJ, CPF e telefone só com dígitos; e-mail em minúsculas.
function normalizar(tipo, chave) {
  if (tipo === 'cnpj' || tipo === 'cpf' || tipo === 'telefone') return v.soDigitos(chave);
  if (tipo === 'email') return chave.trim().toLowerCase();
  return chave.trim().toLowerCase();
}

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const [chave] = await sql`
    SELECT chave, tipo_chave, nome_recebedor, cidade, atualizado_por, atualizado_em
    FROM chave_pix_institucional WHERE ativa LIMIT 1`;
  return json(chave ? {
    chave: chave.chave,
    tipoChave: chave.tipo_chave,
    nomeRecebedor: chave.nome_recebedor,
    cidade: chave.cidade,
    atualizadoPor: chave.atualizado_por,
    atualizadoEm: chave.atualizado_em,
  } : null);
});

export const PUT = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const corpo = await lerJson(request);
  const tipo = String(corpo.tipoChave ?? '');
  const chave = String(corpo.chave ?? '').trim();
  const nome = String(corpo.nomeRecebedor ?? '').trim();
  const cidade = String(corpo.cidade ?? '').trim();

  if (!TIPOS.has(tipo)) falhar(400, 'TIPO_DE_CHAVE_INVALIDO', 'Escolha o tipo da chave.', ['tipoChave']);
  const falha = v.conferir({
    chave: erroDaChave(tipo, chave),
    nomeRecebedor: v.obrigatorio(nome, 'O nome do recebedor') ?? (nome.length > 60 ? 'Use no máximo 60 caracteres.' : null),
    cidade: v.obrigatorio(cidade, 'A cidade') ?? (cidade.length > 40 ? 'Use no máximo 40 caracteres.' : null),
  });
  if (falha) falhar(400, 'DADOS_INVALIDOS', falha.mensagem, falha.campos);

  if ((tipo === 'cpf' || tipo === 'telefone') && corpo.confirmarAviso !== true) {
    falhar(409, 'AVISO_CHAVE_PESSOAL',
      'CPF e telefone costumam ser chaves de pessoa física: ficariam expostos no site e o dinheiro cairia na conta de uma pessoa, não da instituição. Use o CNPJ do Recanto sempre que possível. Deseja salvar mesmo assim?');
  }

  await transacao(async (tx) => {
    await tx.query(
      `UPDATE chave_pix_institucional SET ativa = false, atualizado_por = $1, atualizado_em = now() WHERE ativa`,
      [conta.identificador]);
    await tx.query(
      `INSERT INTO chave_pix_institucional (chave, tipo_chave, nome_recebedor, cidade, criado_por, atualizado_por)
       VALUES ($1, $2, $3, $4, $5, $5)`,
      [normalizar(tipo, chave), tipo, nome, cidade, conta.identificador]);
    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id,
      acao: 'pix.atualizar', entidadeTipo: 'chave_pix_institucional',
      detalhe: { tipoChave: tipo },
    }, tx);
  });

  return json({ ok: true });
});
