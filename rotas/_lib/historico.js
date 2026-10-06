// Histórico de alterações (FR-037, FR-001a, FR-032a, research D16): guarda o estado
// ANTERIOR de cada edição. Diferente da auditoria, pode conter dado pessoal — por isso
// a anonimização também alcança estas linhas.

import { executorPadrao } from './db.js';

export async function registrarAlteracao({ entidadeTipo, entidadeId, estadoAnterior, autor }, executor = executorPadrao) {
  if (!entidadeTipo || !entidadeId || !estadoAnterior || !autor) {
    throw new Error('registrarAlteracao: entidadeTipo, entidadeId, estadoAnterior e autor são obrigatórios');
  }
  await executor.query(
    `INSERT INTO historico_alteracao (entidade_tipo, entidade_id, estado_anterior, alterado_por)
     VALUES ($1, $2, $3, $4)`,
    [entidadeTipo, entidadeId, JSON.stringify(estadoAnterior), autor],
  );
}
