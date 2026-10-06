// Textos dos e-mails (FR-049, FR-049b, FR-006a, FR-046). Texto simples, português do dia a dia.
// O protocolo é o canal principal e o e-mail é complementar (pode cair no spam):
// todo texto com protocolo pede para GUARDAR o código.
//
// Cada modelo recebe `dados` e devolve { assunto, texto }.

const ASSINATURA = '\n\nRecanto dos Velhinhos Francisco Gonçalves Barbosa\nPinheiral/RJ\n\n(Este e-mail foi enviado automaticamente. Não é preciso responder.)';

// Nome de cada submissão com triagem, para compor as frases.
const SUBMISSOES = {
  cadastro_voluntario: { nome: 'seu cadastro de voluntário', aprovado: 'aprovado', naoAprovado: 'não aprovado' },
  candidatura: { nome: 'sua candidatura', aprovado: 'aprovada', naoAprovado: 'não aprovada' },
  solicitacao_externa: { nome: 'sua solicitação de evento ou campanha', aprovado: 'aprovada', naoAprovado: 'não aprovada' },
};

const saudacao = (nome) => (nome ? `Olá, ${String(nome).split(' ')[0]}!` : 'Olá!');

const lembreteProtocolo = (protocolo) =>
  `Seu código de protocolo é:\n\n    ${protocolo}\n\nGuarde este código. É com ele que você acompanha o andamento em "Consultar status", no site do Recanto. Se este e-mail se perder, o código continua valendo.`;

function submissao(tipo) {
  const s = SUBMISSOES[tipo];
  if (!s) throw new Error(`Tipo de submissão desconhecido: ${tipo}`);
  return s;
}

export const modelos = {
  // FR-049 — logo depois do envio do formulário.
  confirmacao_submissao({ tipo, nome, protocolo }) {
    const s = submissao(tipo);
    return {
      assunto: `Recebemos ${s.nome} — protocolo ${protocolo}`,
      texto: `${saudacao(nome)}\n\nRecebemos ${s.nome}. Obrigado pelo interesse no Recanto dos Velhinhos.\n\n${lembreteProtocolo(protocolo)}\n\nA análise é feita pela nossa equipe e pode levar alguns dias. Você receberá um e-mail a cada etapa.${ASSINATURA}`,
    };
  },

  // FR-049b — chamado para entrevista (voluntário ou candidato).
  entrevista({ tipo, nome, protocolo }) {
    const s = submissao(tipo);
    return {
      assunto: `Próxima etapa: entrevista — protocolo ${protocolo}`,
      texto: `${saudacao(nome)}\n\nAnalisamos ${s.nome} e gostaríamos de conversar com você. Nossa equipe vai entrar em contato pelo telefone ou e-mail informados para combinar a entrevista.\n\n${lembreteProtocolo(protocolo)}${ASSINATURA}`,
    };
  },

  // FR-049b, FR-022 — solicitação aprovada, ainda sem publicação.
  solicitacao_aguardando_contato({ nome, protocolo }) {
    return {
      assunto: `Solicitação aprovada — vamos entrar em contato — protocolo ${protocolo}`,
      texto: `${saudacao(nome)}\n\nSua solicitação foi aprovada. Nossa equipe vai entrar em contato para combinar os detalhes. O evento ou campanha só aparece no site depois dessa conversa.\n\n${lembreteProtocolo(protocolo)}${ASSINATURA}`,
    };
  },

  // FR-049b — resultado final positivo.
  aprovado({ tipo, nome, protocolo }) {
    const s = submissao(tipo);
    const frase = tipo === 'solicitacao_externa'
      ? 'O evento ou campanha combinado já está publicado no site do Recanto.'
      : 'Nossa equipe vai entrar em contato para os próximos passos.';
    return {
      assunto: `Resultado: ${s.nome} foi ${s.aprovado} — protocolo ${protocolo}`,
      texto: `${saudacao(nome)}\n\nTemos uma boa notícia: ${s.nome} foi ${s.aprovado}. ${frase}\n\n${lembreteProtocolo(protocolo)}${ASSINATURA}`,
    };
  },

  // FR-049b — resultado final negativo; o motivo é opcional (2026-10-03).
  nao_aprovado({ tipo, nome, protocolo, motivo }) {
    const s = submissao(tipo);
    const explicacao = motivo && String(motivo).trim() ? `\n\nMotivo informado pela equipe: ${String(motivo).trim()}` : '';
    return {
      assunto: `Resultado: ${s.nome} — protocolo ${protocolo}`,
      texto: `${saudacao(nome)}\n\nInformamos que ${s.nome} foi ${s.naoAprovado}.${explicacao}\n\nAgradecemos muito o seu interesse pelo Recanto dos Velhinhos.\n\nProtocolo: ${protocolo}${ASSINATURA}`,
    };
  },

  // FR-006a, D11 — conta nova de doador associado. Validade de 7 dias.
  definir_senha({ nome, link }) {
    return {
      assunto: 'Crie sua senha de doador associado do Recanto dos Velhinhos',
      texto: `${saudacao(nome)}\n\nObrigado pela sua doação associativa. Para acompanhar suas doações confirmadas no site, crie sua senha pelo link abaixo:\n\n${link}\n\nO link vale por 7 dias e só pode ser usado uma vez. Se ele vencer, peça outro em "Esqueci minha senha", na tela de login.\n\nSe você não fez uma doação associativa no site do Recanto, ignore este e-mail.${ASSINATURA}`,
    };
  },

  // FR-046, D11 — redefinição. Validade de 1 hora.
  redefinir_senha({ nome, link }) {
    return {
      assunto: 'Redefinição de senha — Recanto dos Velhinhos',
      texto: `${saudacao(nome)}\n\nRecebemos um pedido para trocar a sua senha de doador associado. Para criar uma senha nova, use o link abaixo:\n\n${link}\n\nO link vale por 1 hora e só pode ser usado uma vez.\n\nSe não foi você que pediu, ignore este e-mail: a sua senha atual continua valendo.${ASSINATURA}`,
    };
  },
};

export function montarEmail(modelo, dados) {
  const fn = modelos[modelo];
  if (!fn) throw new Error(`Modelo de e-mail desconhecido: ${modelo}`);
  return fn(dados);
}
