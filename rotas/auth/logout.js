// POST /api/auth/logout → apaga o cookie de sessão do doador.

import { lerSessao, cookieDeSaida } from '../_lib/sessao.js';
import { registrarAuditoria } from '../_lib/auditoria.js';
import { json, rota } from '../_lib/http.js';

export const POST = rota(async (request) => {
  const sessao = lerSessao(request);
  if (sessao?.ctx === 'doador') {
    await registrarAuditoria({ autorTipo: 'doador', autorId: sessao.id, acao: 'doador.logout' });
  }
  return json({ ok: true }, 200, { 'Set-Cookie': cookieDeSaida() });
});
