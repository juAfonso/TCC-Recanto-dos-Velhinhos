/* Criar ou redefinir a senha pelo link do e-mail (FR-006a, FR-046, research D11).
   O token vem depois do "#" do link: o navegador não o envia a nenhum servidor sozinho.
   Assim que lido, ele sai da barra de endereço e do histórico. */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const token = new URLSearchParams(location.hash.slice(1)).get('token');
  if (token) history.replaceState(null, '', location.pathname);
  // Outro link aberto na mesma aba (só muda o "#"): recarrega para ler o token novo.
  window.addEventListener('hashchange', () => location.reload());

  function linkInvalido(mensagem) {
    $('form-senha').style.display = 'none';
    if (mensagem) $('link-invalido-texto').textContent = mensagem;
    $('link-invalido').style.display = 'block';
    $('email').focus();
  }

  if (!token) {
    linkInvalido('Para criar a senha, use o link que enviamos ao seu e-mail. Se não recebeu ou ele venceu, peça outro abaixo.');
  }

  $('form-senha').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    Utils.clearAllErrors(form);
    const senha = $('senha').value;
    if (senha.length < 8) {
      Utils.setFieldError($('senha').closest('.form-group'), 'A senha precisa ter pelo menos 8 caracteres.');
      $('senha').focus();
      return;
    }
    if (senha !== $('senha2').value) {
      Utils.setFieldError($('senha2').closest('.form-group'), 'As duas senhas não são iguais.');
      $('senha2').focus();
      return;
    }
    const botao = form.querySelector('[type=submit]');
    botao.disabled = true;
    try {
      const r = await Api.post('/api/auth/definir-senha', { token, senha }, { form });
      form.style.display = 'none';
      $('sucesso-texto').textContent = r.mensagem;
      $('sucesso').style.display = 'flex';
    } catch (erro) {
      if (erro.codigo === 'LINK_INVALIDO_OU_EXPIRADO') linkInvalido(erro.message);
      else if (!erro.campos.length && erro.status !== 429) Utils.toast(erro.message, 'danger');
    } finally {
      botao.disabled = false;
    }
  });

  $('form-novo-link').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    Utils.clearAllErrors(form);
    if (!Utils.isValidEmail($('email').value.trim())) {
      Utils.setFieldError($('email').closest('.form-group'), 'Informe um e-mail válido.');
      return;
    }
    const botao = form.querySelector('[type=submit]');
    botao.disabled = true;
    try {
      const r = await Api.post('/api/auth/link-senha', { email: $('email').value.trim() }, { form });
      form.innerHTML = `<div class="alert alert-info" role="status"><span aria-hidden="true">📧</span><div>${Utils.escapeHtml(r.mensagem)}</div></div>`;
    } catch (erro) {
      if (!erro.campos.length && erro.status !== 429) Utils.toast(erro.message, 'danger');
      botao.disabled = false;
    }
  });
});
