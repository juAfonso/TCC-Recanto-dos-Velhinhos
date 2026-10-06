// Controle de acesso no servidor (Princípio IV, FR-047). Toda rota /api/admin/* começa
// com exigirAdmin(request); toda /api/me/*, com exigirDoador(request).
// Negação: 403 sem detalhe do motivo e linha `acesso.negado` na auditoria.

import { sql } from './db.js';
import { lerSessao } from './sessao.js';
import { registrarAuditoria } from './auditoria.js';
import { falhar } from './http.js';

async function negar(request, sessao) {
  const autor =
    sessao?.ctx === 'admin' ? { autorTipo: 'conta_institucional', autorId: sessao.id }
    : sessao?.ctx === 'doador' ? { autorTipo: 'doador', autorId: sessao.id }
    : { autorTipo: 'anonimo', autorId: null };
  const { pathname } = new URL(request.url);
  await registrarAuditoria({ ...autor, acao: 'acesso.negado', detalhe: { rota: pathname, metodo: request.method } });
  falhar(403, 'ACESSO_NEGADO', 'Você não tem acesso a esta área.');
}

// Sessão de Painel com conta institucional ativa. Devolve { conta: { id, identificador } }.
export async function exigirAdmin(request) {
  const sessao = lerSessao(request);
  if (sessao?.ctx === 'admin') {
    const [conta] = await sql`
      SELECT id, identificador FROM conta_institucional WHERE id = ${sessao.id} AND ativo`;
    if (conta) return { conta, sessao };
  }
  return negar(request, sessao);
}

// Como exigirDoador, mas sem negar nem auditar: para rotas públicas em que estar logado é
// opcional (doação associativa de quem já entrou no autoatendimento). Devolve a pessoa ou null.
export async function doadorDaSessao(request) {
  const sessao = lerSessao(request);
  if (sessao?.ctx !== 'doador') return null;
  const [pessoa] = await sql`
    SELECT p.id, p.senha_definida_em
    FROM pessoa p
    WHERE p.id = ${sessao.id} AND p.ativo AND p.anonimizado_em IS NULL AND p.senha_definida_em IS NOT NULL
      AND EXISTS (SELECT 1 FROM papel WHERE pessoa_id = p.id AND tipo = 'doador_associado' AND status = 'ativo')`;
  if (!pessoa || sessao.emitidaEm < new Date(pessoa.senha_definida_em).getTime()) return null;
  return { id: pessoa.id };
}

// Sessão de doador com pessoa ativa, papel de doador associado ativo e senha definida.
// Sessões abertas antes da última definição/redefinição de senha deixam de valer (D11).
// Devolve { pessoa: { id, nome, email } } — o id SEMPRE vem daqui, nunca da URL ou do corpo.
export async function exigirDoador(request) {
  const sessao = lerSessao(request);
  if (sessao?.ctx === 'doador') {
    const [pessoa] = await sql`
      SELECT p.id, p.nome, p.email, p.senha_definida_em
      FROM pessoa p
      WHERE p.id = ${sessao.id} AND p.ativo AND p.anonimizado_em IS NULL
        AND p.senha_definida_em IS NOT NULL
        AND EXISTS (SELECT 1 FROM papel WHERE pessoa_id = p.id AND tipo = 'doador_associado' AND status = 'ativo')`;
    if (pessoa && sessao.emitidaEm >= new Date(pessoa.senha_definida_em).getTime()) {
      const { senha_definida_em, ...dados } = pessoa;
      return { pessoa: dados, sessao };
    }
  }
  return negar(request, sessao);
}
