/* =========================================================
   api.js — chamadas ao servidor (substitui aos poucos o data.js)

   Api.get/post/put(url, corpo) e Api.enviarFormulario(url, formData).
   Em caso de erro, lança ApiErro { status, codigo, mensagem, campos }
   depois de já ter avisado a pessoa:
   - 401 no Painel → volta para o login;
   - 429 → "muitas tentativas, aguarde alguns minutos";
   - erro com campos[] → marca cada campo (Utils.setFieldError).
   ========================================================= */

class ApiErro extends Error {
  constructor(status, corpo) {
    const erro = (corpo && corpo.erro) || {};
    super(erro.mensagem || 'Não foi possível concluir. Tente de novo em alguns minutos.');
    this.status = status;
    this.codigo = erro.codigo || 'ERRO';
    this.campos = erro.campos || [];
  }
}

const Api = (() => {

  const noPainel = () => window.location.pathname.includes('/admin/');

  // Marca o campo pelo id, name ou data-campo dentro do formulário (ou do documento).
  function marcarCampos(campos, mensagem, form) {
    const raiz = form || document;
    campos.forEach((campo) => {
      const el = raiz.querySelector(`[data-campo="${campo}"], [name="${campo}"], #${CSS.escape(campo)}`);
      const grupo = el && el.closest('.form-group');
      if (grupo) Utils.setFieldError(grupo, mensagem);
    });
  }

  async function tratar(resposta, opcoes) {
    let corpo = null;
    try { corpo = await resposta.json(); } catch (e) { /* resposta sem corpo */ }
    if (resposta.ok) return corpo;

    const erro = new ApiErro(resposta.status, corpo);
    if (resposta.status === 401 && noPainel() && !opcoes.semRedirecionar) {
      window.location.href = '../login.html';
    } else if (resposta.status === 429) {
      erro.message = 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.';
      Utils.toast(erro.message, 'warning');
    } else if (erro.campos.length) {
      marcarCampos(erro.campos, erro.message, opcoes.form);
    }
    throw erro;
  }

  async function chamar(metodo, url, corpo, opcoes = {}) {
    let resposta;
    try {
      resposta = await fetch(url, {
        method: metodo,
        credentials: 'same-origin',
        headers: corpo !== undefined ? { 'Content-Type': 'application/json' } : {},
        body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      });
    } catch (e) {
      throw new ApiErro(0, { erro: { codigo: 'SEM_CONEXAO', mensagem: 'Sem conexão com o servidor. Confira sua internet e tente de novo.' } });
    }
    return tratar(resposta, opcoes);
  }

  // Envio com arquivo (multipart/form-data): o navegador monta o cabeçalho.
  async function enviarFormulario(url, formData, opcoes = {}) {
    let resposta;
    try {
      resposta = await fetch(url, { method: 'POST', credentials: 'same-origin', body: formData });
    } catch (e) {
      throw new ApiErro(0, { erro: { codigo: 'SEM_CONEXAO', mensagem: 'Sem conexão com o servidor. Confira sua internet e tente de novo.' } });
    }
    return tratar(resposta, opcoes);
  }

  return {
    get: (url, opcoes) => chamar('GET', url, undefined, opcoes),
    post: (url, corpo = {}, opcoes) => chamar('POST', url, corpo, opcoes),
    put: (url, corpo = {}, opcoes) => chamar('PUT', url, corpo, opcoes),
    enviarFormulario,
  };
})();
