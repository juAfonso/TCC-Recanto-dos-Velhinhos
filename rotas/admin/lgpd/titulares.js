// GET /api/admin/lgpd/titulares?q= — acha o titular que fez um pedido por contato (FR-054):
// por nome, CPF ou e-mail, em pessoas e nas três submissões, com os consentimentos de cada
// registro. Inclui os já anonimizados (só para a equipe ver que o pedido foi atendido).

import { sql } from '../../_lib/db.js';
import { exigirAdmin } from '../../_lib/acesso.js';
import { soDigitos } from '../../_lib/validacao.js';
import { json, falhar, rota } from '../../_lib/http.js';

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const q = (new URL(request.url).searchParams.get('q') || '').trim();
  if (q.length < 3) falhar(400, 'BUSCA_CURTA', 'Digite ao menos 3 letras do nome, o CPF ou o e-mail.', ['q']);
  const digitos = soDigitos(q);
  const cpf = digitos.length === 11 ? digitos : '__nenhum__';
  const termo = `%${q.toLowerCase().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

  const registros = await sql`
    SELECT 'pessoa' AS alvo, id, NULL AS protocolo, nome, cpf, email, NULL AS status, criado_em, anonimizado_em,
           (SELECT string_agg(tipo || ':' || status, ',') FROM papel WHERE pessoa_id = pessoa.id) AS papeis
    FROM pessoa WHERE cpf = ${cpf} OR lower(email) = lower(${q}) OR lower(nome) LIKE ${termo}
    UNION ALL
    SELECT 'cadastro_voluntario', id, protocolo, nome, cpf, email, status, criado_em, anonimizado_em, NULL
    FROM cadastro_voluntario WHERE cpf = ${cpf} OR lower(email) = lower(${q}) OR lower(nome) LIKE ${termo}
    UNION ALL
    SELECT 'candidatura', id, protocolo, nome, cpf, email, status, criado_em, anonimizado_em, NULL
    FROM candidatura WHERE cpf = ${cpf} OR lower(email) = lower(${q}) OR lower(nome) LIKE ${termo}
    UNION ALL
    SELECT 'solicitacao', id, protocolo, nome_contato, NULL, email, status, criado_em, anonimizado_em, NULL
    FROM solicitacao_externa WHERE lower(email) = lower(${q}) OR lower(nome_contato) LIKE ${termo}
    ORDER BY criado_em DESC
    LIMIT 50`;

  const ids = registros.map((r) => r.id);
  const consentimentos = ids.length ? await sql`
    SELECT id, aviso_versao, finalidade, aceito_em, revogado_em, revogado_por,
           COALESCE(pessoa_id, cadastro_voluntario_id, candidatura_id, solicitacao_externa_id) AS dono
    FROM consentimento
    WHERE pessoa_id = ANY(${ids}::uuid[]) OR cadastro_voluntario_id = ANY(${ids}::uuid[])
       OR candidatura_id = ANY(${ids}::uuid[]) OR solicitacao_externa_id = ANY(${ids}::uuid[])
    ORDER BY aceito_em` : [];
  const anonimizacoes = ids.length ? await sql`
    SELECT entidade_id, campos_retidos, justificativa, executado_por, executado_em
    FROM anonimizacao WHERE entidade_id = ANY(${ids}::uuid[])` : [];

  return json({
    registros: registros.map((r) => {
      const anon = anonimizacoes.find((a) => a.entidade_id === r.id);
      return {
        alvo: r.alvo, id: r.id, protocolo: r.protocolo, nome: r.nome, cpf: r.cpf, email: r.email,
        status: r.status, criadoEm: r.criado_em, anonimizadoEm: r.anonimizado_em,
        papeis: r.papeis ? r.papeis.split(',').map((p) => { const [tipo, status] = p.split(':'); return { tipo, status }; }) : [],
        anonimizacao: anon ? { camposRetidos: anon.campos_retidos, justificativa: anon.justificativa, por: anon.executado_por, em: anon.executado_em } : null,
        consentimentos: consentimentos.filter((c) => c.dono === r.id).map((c) => ({
          id: c.id, avisoVersao: c.aviso_versao, finalidade: c.finalidade, aceitoEm: c.aceito_em,
          revogadoEm: c.revogado_em, revogadoPor: c.revogado_por,
        })),
      };
    }),
  });
});
