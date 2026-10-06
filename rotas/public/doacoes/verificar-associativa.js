// POST /api/public/doacoes/verificar-associativa { cpf, email } (FR-006b, research D15).
// Chamado ANTES de gerar o QR, para ninguém pagar à toa. A resposta não diz qual dos dois
// campos bateu. No "Já fiz o Pix" a mesma verificação roda de novo no servidor.
// Limite: 10 por IP a cada 15 minutos (D13) — o risco residual foi aceito pelo grupo em 2026-10-05.

import { verificarAssociativa, MENSAGEM_NEUTRA } from '../../_lib/conta-doador.js';
import { verificarLimite, ipDe } from '../../_lib/limite.js';
import * as v from '../../_lib/validacao.js';
import { json, lerJson, falhar, rota } from '../../_lib/http.js';

export const POST = rota(async (request) => {
  if (!(await verificarLimite('verificar_associativa', ipDe(request), 10, 15))) {
    falhar(429, 'MUITAS_TENTATIVAS', 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.');
  }
  const { cpf, email } = await lerJson(request);
  const falha = v.conferir({ cpf: v.cpf(cpf), email: v.email(email) });
  if (falha) falhar(400, 'DADOS_INVALIDOS', falha.mensagem, falha.campos);

  const { bloqueado } = await verificarAssociativa({ cpf, email });
  return json(bloqueado ? { podeSeguir: false, mensagem: MENSAGEM_NEUTRA } : { podeSeguir: true });
});
