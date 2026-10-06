// Respostas e erros no formato de contracts/api.md → "Formato de erro".
// Toda resposta leva `Cache-Control: no-store` (SC-002 e dado pessoal no Painel).

export class ErroHttp extends Error {
  constructor(status, codigo, mensagem, campos) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
    this.campos = campos;
  }
}

export function json(dados, status = 200, cabecalhos = {}) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...cabecalhos,
    },
  });
}

export function erro(status, codigo, mensagem, campos) {
  const corpo = { codigo, mensagem };
  if (campos?.length) corpo.campos = campos;
  return json({ erro: corpo }, status);
}

// Interrompe a rota com um erro; `rota()` transforma em resposta.
export function falhar(status, codigo, mensagem, campos) {
  throw new ErroHttp(status, codigo, mensagem, campos);
}

export async function lerJson(request) {
  try {
    const corpo = await request.json();
    if (corpo === null || typeof corpo !== 'object' || Array.isArray(corpo)) throw new Error();
    return corpo;
  } catch {
    falhar(400, 'JSON_INVALIDO', 'Não foi possível ler os dados enviados. Recarregue a página e tente de novo.');
  }
}

// Envio com arquivo (multipart/form-data — research D3).
export async function lerFormulario(request) {
  try {
    return await request.formData();
  } catch {
    falhar(400, 'FORMULARIO_INVALIDO', 'Não foi possível ler o formulário. Recarregue a página e tente de novo.');
  }
}

// Parâmetro de rota dinâmica ([id].js): a Vercel o entrega como parâmetro de consulta.
// Id que não é uuid vira 404 direto, sem chegar ao banco.
export function idDaRota(request, nome = 'id') {
  const valor = new URL(request.url).searchParams.get(nome) ?? '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor)) {
    falhar(404, 'NAO_ENCONTRADO', 'Registro não encontrado.');
  }
  return valor;
}

// Envolve o handler: ErroHttp vira a resposta de erro; qualquer outro erro vira 500
// sem detalhe técnico para o usuário (o detalhe vai só para o log da Vercel).
export function rota(handler) {
  return async (request, ...resto) => {
    try {
      return await handler(request, ...resto);
    } catch (e) {
      if (e instanceof ErroHttp) return erro(e.status, e.codigo, e.message, e.campos);
      if (e instanceof Response) return e;
      console.error(e);
      return erro(500, 'ERRO_INTERNO', 'Algo deu errado do nosso lado. Tente de novo em alguns minutos.');
    }
  };
}
