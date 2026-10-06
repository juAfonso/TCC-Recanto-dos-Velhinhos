// Validação do item necessário (FR-026): nome, quantidade ≥ 0, unidade e prioridade.

import * as v from './validacao.js';
import { falhar } from './http.js';

const PRIORIDADES = new Set(['alta', 'media', 'baixa']);

export function validarItem(corpo) {
  const nome = String(corpo.nome ?? '').trim();
  const unidade = String(corpo.unidade ?? '').trim();
  const prioridade = String(corpo.prioridade ?? '');
  const texto = String(corpo.quantidade ?? '').trim().replace(',', '.');
  const quantidade = Number(texto);

  const falha = v.conferir({
    nome: v.obrigatorio(nome, 'O nome do item') ?? (nome.length > 120 ? 'Use no máximo 120 caracteres.' : null),
    quantidade: texto === '' || !/^\d+(\.\d{1,2})?$/.test(texto) ? 'Informe uma quantidade válida (zero ou mais).' : null,
    unidade: v.obrigatorio(unidade, 'A unidade de medida') ?? (unidade.length > 40 ? 'Use no máximo 40 caracteres.' : null),
    prioridade: PRIORIDADES.has(prioridade) ? null : 'Escolha a prioridade: alta, média ou baixa.',
  });
  if (falha) falhar(400, 'DADOS_INVALIDOS', falha.mensagem, falha.campos, falha.mensagens);
  return { nome, quantidade, unidade, prioridade };
}
