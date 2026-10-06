document.addEventListener('DOMContentLoaded', () => {

  /* já autenticado? redireciona direto (o Painel é confirmado pelo servidor) */
  const existing = Auth.getSession();
  if (existing && existing.tipo !== 'admin') {
    window.location.href = 'autoatendimento.html';
    return;
  }
  Auth.verificarAdmin().then((identificador) => {
    if (identificador) window.location.href = 'admin/dashboard.html';
  });

  /* alternância de abas */
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector(`.tab-panel[data-tab="${btn.dataset.tab}"]`).classList.add('active');
    });
  });

  /* login admin */
  const formAdmin = document.getElementById('form-admin-login');
  formAdmin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userInput = document.getElementById('admin-user');
    const passInput = document.getElementById('admin-pass');
    const botao = formAdmin.querySelector('[type="submit"]');
    Utils.clearAllErrors(formAdmin);

    botao.disabled = true;
    botao.textContent = 'Entrando…';
    try {
      await Auth.loginAdmin(userInput.value.trim(), passInput.value, formAdmin);
      window.location.href = 'admin/dashboard.html';
    } catch (erro) {
      // Erros com campo já foram marcados pelo Api; o 429 já virou aviso.
      if (erro.status !== 429) Utils.toast(erro.message, 'danger');
      botao.disabled = false;
      botao.textContent = 'Entrar no Painel';
    }
  });

  /* login autoatendimento */
  document.getElementById('form-auto-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('auto-email');
    const passInput = document.getElementById('auto-pass');
    Utils.clearFieldError(emailInput.closest('.form-group'));
    Utils.clearFieldError(passInput.closest('.form-group'));

    const usuario = Auth.loginAutoatendimento(emailInput.value.trim(), passInput.value);
    if (usuario) {
      Utils.toast(`Bem-vindo(a), ${usuario.nome.split(' ')[0]}!`);
      window.location.href = 'autoatendimento.html';
    } else {
      Utils.setFieldError(passInput.closest('.form-group'), 'E-mail ou senha inválidos, ou cadastro ainda não aprovado.');
      Utils.toast('Não foi possível entrar. Verifique e-mail e senha.', 'danger');
    }
  });

  /* Esqueci a senha / não recebi o link: a página de senha pede um link novo (FR-046, D11) */
  document.getElementById('btn-esqueci-senha').addEventListener('click', () => {
    window.location.href = 'definir-senha.html';
  });
});
