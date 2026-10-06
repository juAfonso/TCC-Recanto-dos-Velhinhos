// POST /api/admin/logout → apaga o cookie de sessão.

import { lerSessao, cookieDeSaida } from '../_lib/sessao.js';
import { registrarAuditoria } from '../_lib/auditoria.js';
import { json, rota } from '../_lib/http.js';

export const POST = rota(async (request) => {
  const sessao = lerSessao(request);
  if (sessao?.ctx === 'admin') {
    await registrarAuditoria({ autorTipo: 'conta_institucional', autorId: sessao.id, acao: 'painel.logout' });
  }
  return json({ ok: true }, 200, { 'Set-Cookie': cookieDeSaida() });
});
