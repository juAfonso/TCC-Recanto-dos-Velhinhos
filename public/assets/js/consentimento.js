/* =========================================================
   consentimento.js — aceite do aviso de privacidade (FR-051, FR-052)

   Em todo <form data-consentimento="finalidade em palavras simples">,
   injeta antes do botão de envio a caixa de aceite com link para o aviso.
   A versão vigente vem de /api/public/aviso-privacidade.

   Na hora de enviar, a página chama:
     Consentimento.dados(form)  → { avisoVersao, aceito }  (anexar ao corpo)
   ou, se o envio é multipart:
     Consentimento.anexar(form, formData)
   ========================================================= */

const Consentimento = (() => {
  let versaoVigente = null;
  let carregamento = null;

  function carregarVersao() {
    carregamento ??= Api.get('/api/public/aviso-privacidade')
      .then((aviso) => { versaoVigente = aviso.versao; })
      .catch(() => { versaoVigente = null; });
    return carregamento;
  }

  function injetar(form) {
    if (form.querySelector('.consentimento-grupo')) return;
    const id = `aceite-${Math.random().toString(36).slice(2, 8)}`;
    const finalidade = form.dataset.consentimento;
    const grupo = document.createElement('div');
    grupo.className = 'form-group consentimento-grupo';
    grupo.innerHTML = `
      <label class="checkbox-line" for="${id}">
        <input type="checkbox" id="${id}" name="aceito" data-campo="aceito" required>
        Li o <a href="aviso-privacidade.html" target="_blank" rel="noopener">aviso de privacidade</a>
        e concordo com o uso dos meus dados ${finalidade ? `para ${finalidade}` : 'informados neste formulário'}.
      </label>
      <div class="form-error"></div>`;
    // Antes do bloco (filho direto do form) que contém o botão de envio.
    let antes = form.querySelector('[type="submit"]');
    while (antes && antes.parentElement !== form) antes = antes.parentElement;
    form.insertBefore(grupo, antes);
  }

  function dados(form) {
    const caixa = form.querySelector('input[name="aceito"]');
    return { avisoVersao: versaoVigente, aceito: Boolean(caixa && caixa.checked) };
  }

  function anexar(form, formData) {
    const d = dados(form);
    formData.set('avisoVersao', d.avisoVersao || '');
    formData.set('aceito', d.aceito ? 'true' : 'false');
    return formData;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form[data-consentimento]');
    if (!forms.length) return;
    forms.forEach(injetar);
    carregarVersao();
  });

  return { dados, anexar, carregarVersao };
})();
