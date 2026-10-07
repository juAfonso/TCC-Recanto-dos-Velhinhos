// GET /api/admin/falhas-email?situacao=pendentes|todas — e-mails que falharam nas duas tentativas
// (FR-049a, FR-049b). A equipe reenvia ou marca como tratada depois de avisar a pessoa por telefone.

import { sql } from '../../_lib/db.js';
import { exigirAdmin } from '../../_lib/acesso.js';
import { json, rota } from '../../_lib/http.js';

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const todas = new URL(request.url).searchParams.get('situacao') === 'todas';

  const linhas = await sql`
    SELECT f.*,
           COALESCE(v.protocolo, k.protocolo, s.protocolo) AS protocolo,
           COALESCE(v.telefone, k.telefone, s.telefone, p.telefone) AS telefone
    FROM falha_email f
    LEFT JOIN cadastro_voluntario v ON f.entidade_tipo = 'cadastro_voluntario' AND v.id = f.entidade_id
    LEFT JOIN candidatura k ON f.entidade_tipo = 'candidatura' AND k.id = f.entidade_id
    LEFT JOIN solicitacao_externa s ON f.entidade_tipo = 'solicitacao_externa' AND s.id = f.entidade_id
    LEFT JOIN pessoa p ON f.entidade_tipo = 'pessoa' AND p.id = f.entidade_id
    WHERE f.anonimizado_em IS NULL AND (${todas} OR f.tratada_em IS NULL)
    ORDER BY f.falhou_em DESC
    LIMIT 200`;

  return json({
    falhas: linhas.map((f) => ({
      id: f.id,
      destinatario: f.destinatario,
      telefone: f.telefone,
      motivo: f.motivo,
      modelo: f.modelo,
      entidadeTipo: f.entidade_tipo,
      protocolo: f.protocolo,
      erro: f.erro,
      falhouEm: f.falhou_em,
      tratadaPor: f.tratada_por,
      tratadaEm: f.tratada_em,
      podeReenviar: ['confirmacao', 'triagem'].includes(f.motivo) && !f.tratada_em,
    })),
  });
});
