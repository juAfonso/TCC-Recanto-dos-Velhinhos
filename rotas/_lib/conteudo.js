// Notícias e página institucional (US8 — FR-001a, FR-032, FR-032a, FR-032b).
// Imagens vão para o store PÚBLICO do Blob (blob.js). Toda imagem tem texto alternativo
// (Princípio II). Nada é apagado: notícia é despublicada, imagem é desativada ou desvinculada,
// e o objeto continua no Blob (Princípio III).

import * as v from './validacao.js';
import { falhar } from './http.js';

export const SECOES = ['historia', 'missao', 'equipe', 'acolhimento', 'bazar'];
export const MAX_IMAGENS_INSTITUCIONAIS = 6; // decisão de 2026-10-07: galeria de até 6, opcional

// historico_alteracao.entidade_id é uuid; a página institucional é uma linha só (id = 1).
export const ID_HISTORICO_INSTITUCIONAL = '00000000-0000-0000-0000-000000000001';

const texto = (valor, max) => String(valor ?? '').trim().slice(0, max);

// Campo de texto de um FormData (arquivo ou ausente vira '').
export const campoTexto = (form, nome) => {
  const valor = form.get(nome);
  return typeof valor === 'string' ? valor : '';
};

// Arquivo de um FormData, ou null se não veio nada.
export const campoArquivo = (form, nome) => {
  const valor = form.get(nome);
  return valor && typeof valor === 'object' && valor.size > 0 ? valor : null;
};

export function validarAlt(valor, campo = 'imagemAlt') {
  const alt = texto(valor, 300);
  if (!alt) {
    falhar(400, 'TEXTO_ALTERNATIVO_OBRIGATORIO',
      'Descreva a imagem para quem não enxerga (texto alternativo). Ex.: "Voluntárias servindo o café da tarde aos residentes".', [campo]);
  }
  return alt;
}

export function validarNoticia({ titulo, corpo }) {
  const dados = { titulo: texto(titulo, 150), corpo: String(corpo ?? '').trim().slice(0, 10000) };
  const falha = v.conferir({
    titulo: v.obrigatorio(dados.titulo, 'O título'),
    corpo: v.obrigatorio(dados.corpo, 'O texto da notícia'),
  });
  if (falha) falhar(400, 'DADOS_INVALIDOS', falha.mensagem, falha.campos, falha.mensagens);
  return dados;
}

// Seções da página institucional. Seção vazia é permitida: o Portal a esconde.
export function validarTextosInstitucionais(corpo) {
  return Object.fromEntries(SECOES.map((s) => [s, String(corpo[s] ?? '').trim().slice(0, 10000)]));
}
