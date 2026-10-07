document.addEventListener('DOMContentLoaded', () => {

  /* já autenticado? redireciona direto (quem decide é o servidor) */
  Auth.verificarDoador().then((r) => {
    if (r.logado) window.location.href = 'autoatendimento.html';
  });
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

  /* login.html#doador abre direto na aba do doador */
  if (location.hash === '#doador') document.querySelector('.tab-btn[data-tab="auto"]').click();

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

  /* login do doador associado (FR-041) */
  const formAuto = document.getElementById('form-auto-login');
  formAuto.addEventListener('submit', async (e) => {
    e.preventDefault();
    const botao = formAuto.querySelector('[type="submit"]');
    Utils.clearAllErrors(formAuto);
    botao.disabled = true;
    botao.textContent = 'Entrando…';
    try {
      await Auth.loginDoador(document.getElementById('auto-email').value.trim(), document.getElementById('auto-pass').value, formAuto);
      window.location.href = 'autoatendimento.html';
    } catch (erro) {
      if (erro.status !== 429) Utils.toast(erro.message, 'danger');
      botao.disabled = false;
      botao.textContent = 'Entrar na minha área';
    }
  });

  /* Esqueci a senha / não recebi o link: a página de senha pede um link novo (FR-046, D11) */
  document.getElementById('btn-esqueci-senha').addEventListener('click', () => {
    window.location.href = 'definir-senha.html';
  });
});
