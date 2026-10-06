// Consentimento LGPD (FR-051, FR-052). Todo formulário público envia
// { avisoVersao, aceito }; a versão precisa ser a vigente.

import { sql, executorPadrao } from './db.js';
import { falhar } from './http.js';

// Vigente = a versão publicada mais recente (FR-053).
export async function avisoVigente() {
  const [aviso] = await sql`
    SELECT versao, texto, publicado_em FROM aviso_privacidade ORDER BY publicado_em DESC LIMIT 1`;
  return aviso ?? null;
}

// Devolve a versão aceita ou interrompe com 422.
export async function validarAceite(corpo) {
  const vigente = await avisoVigente();
  const aceito = corpo?.aceito === true || corpo?.aceito === 'true';
  if (!vigente || !aceito || corpo?.avisoVersao !== vigente.versao) {
    falhar(422, 'CONSENTIMENTO_OBRIGATORIO',
      'Para enviar, leia o aviso de privacidade e marque que concorda. Se a página ficou aberta muito tempo, recarregue-a.',
      ['aceito']);
  }
  return vigente.versao;
}

const COLUNAS = {
  cadastro_voluntario: 'cadastro_voluntario_id',
  candidatura: 'candidatura_id',
  solicitacao_externa: 'solicitacao_externa_id',
  pessoa: 'pessoa_id',
};

// `alvo` é a tabela dona do consentimento (Restrição 4 do DER: exatamente uma).
export async function registrarConsentimento({ alvo, alvoId, avisoVersao, finalidade }, executor = executorPadrao) {
  const coluna = COLUNAS[alvo];
  if (!coluna) throw new Error(`Alvo de consentimento inválido: ${alvo}`);
  // Doador que já aceitou esta versão não gera linha nova (um por versão).
  const [linha] = await executor.query(
    `INSERT INTO consentimento (${coluna}, aviso_versao, finalidade) VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING RETURNING id`,
    [alvoId, avisoVersao, finalidade]);
  return linha?.id ?? null;
}
