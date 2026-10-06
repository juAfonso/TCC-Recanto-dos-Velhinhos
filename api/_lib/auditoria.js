// Registro de auditoria (FR-035, FR-047): quem fez o quê, quando. Somente inclusão.
// O `detalhe` NUNCA leva dado pessoal — o valor antigo de um campo vai para
// historico_alteracao, não para cá (research D16).

import { executorPadrao } from './db.js';

const AUTORES = new Set(['conta_institucional', 'doador', 'sistema', 'anonimo']);
const PALAVRAS_PESSOAIS = new Set(['cpf', 'email', 'telefone', 'nome', 'rg', 'endereco']);

// "nomeContato" → ["nome", "contato"]; "data_nascimento" → ["data", "nascimento"]
const palavras = (chave) =>
  chave.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[_\-\s]+/);

function conferirDetalhe(detalhe, caminho = 'detalhe') {
  if (detalhe === null || typeof detalhe !== 'object') return;
  for (const [chave, valor] of Object.entries(detalhe)) {
    if (palavras(chave).some((p) => PALAVRAS_PESSOAIS.has(p))) {
      throw new Error(`Auditoria recusada: "${caminho}.${chave}" parece dado pessoal`);
    }
    conferirDetalhe(valor, `${caminho}.${chave}`);
  }
}

// `executor` permite gravar dentro de uma transação (`transacao(tx => registrarAuditoria({...}, tx))`).
export async function registrarAuditoria(
  { autorTipo, autorId = null, acao, entidadeTipo = null, entidadeId = null, detalhe = {} },
  executor = executorPadrao,
) {
  if (!AUTORES.has(autorTipo)) throw new Error(`autorTipo inválido: ${autorTipo}`);
  if (!acao) throw new Error('acao é obrigatória');
  conferirDetalhe(detalhe);
  await executor.query(
    `INSERT INTO registro_auditoria (autor_tipo, autor_id, acao, entidade_tipo, entidade_id, detalhe)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [autorTipo, autorId, acao, entidadeTipo, entidadeId, JSON.stringify(detalhe)],
  );
}
