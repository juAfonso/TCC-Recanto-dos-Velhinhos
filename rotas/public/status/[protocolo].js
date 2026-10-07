// GET /api/public/status/:protocolo — consulta pública pelo código de protocolo (FR-044, FR-044a).
// Devolve só tipo, status e data do envio: nenhum dado pessoal, nem o motivo da rejeição (que vai
// por e-mail ao autor). Doação não tem protocolo (2026-10-04).
// Protocolo inexistente e mal formado recebem a MESMA resposta, e o mal formado também passa por
// uma consulta ao banco, para o tempo de resposta não denunciar a diferença. Limite de 10
// consultas por IP em 15 min (D13), contado ANTES de procurar: errar ou acertar, conta igual.

import { sql } from '../../_lib/db.js';
import { normalizarProtocolo, formatoValido } from '../../_lib/protocolo.js';
import { verificarLimite, ipDe } from '../../_lib/limite.js';
import { hojeBrasilia } from '../../_lib/datas.js';
import { json, falhar, rota } from '../../_lib/http.js';

const TABELAS = {
  VOL: { tabela: 'cadastro_voluntario', tipo: 'voluntario' },
  CAN: { tabela: 'candidatura', tipo: 'candidatura' },
  SOL: { tabela: 'solicitacao_externa', tipo: 'solicitacao_externa' },
};

// Rótulos em português simples, os mesmos para quem enviou pelo site.
const ROTULOS = {
  pendente: 'Recebido — aguardando análise',
  em_analise: 'Recebida — aguardando análise',
  entrevista: 'Chamado para entrevista',
  aguardando_contato: 'Aprovada — aguardando contato',
  aprovado: 'Aprovado',
  aprovada: 'Aprovada',
  confirmada: 'Confirmada e publicada no site',
  rejeitado: 'Não aprovado',
  rejeitada: 'Não aprovada',
  encerrado_titular: 'Encerrado a pedido do titular',
  encerrada_titular: 'Encerrada a pedido do titular',
};

const NAO_ENCONTRADO = 'Não encontramos nenhuma solicitação com este código. Confira se digitou o código inteiro, com o hífen, como aparece no e-mail ou na tela de envio.';

export const GET = rota(async (request) => {
  if (!(await verificarLimite('consulta_status', ipDe(request), 10, 15))) {
    falhar(429, 'MUITAS_TENTATIVAS', 'Muitas consultas seguidas. Aguarde 15 minutos e tente de novo.');
  }

  const protocolo = normalizarProtocolo(new URL(request.url).searchParams.get('protocolo'));
  const valido = formatoValido(protocolo);
  // Mal formado consulta uma tabela com um código que não existe: mesmo caminho, mesmo tempo.
  const { tabela, tipo } = TABELAS[valido ? protocolo.slice(0, 3) : 'VOL'];
  const [achado] = await sql.query(
    `SELECT status, criado_em FROM ${tabela} WHERE protocolo = $1`, [valido ? protocolo : 'VOL-INVALIDO00']);
  if (!achado) falhar(404, 'NAO_ENCONTRADO', NAO_ENCONTRADO);

  return json({
    tipo,
    status: achado.status,
    rotuloStatus: ROTULOS[achado.status] ?? achado.status,
    data: hojeBrasilia(new Date(achado.criado_em)),
  });
});
