document.addEventListener('DOMContentLoaded', () => {

  /* já autenticado? redireciona direto */
  const existing = Auth.getSession();
  if (existing) {
    if (existing.tipo === 'admin') window.location.href = 'admin/dashboard.html';
    else window.location.href = 'autoatendimento.html';
    return;
  }

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
  document.getElementById('form-admin-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const userInput = document.getElementById('admin-user');
    const passInput = document.getElementById('admin-pass');
    Utils.clearFieldError(userInput.closest('.form-group'));
    Utils.clearFieldError(passInput.closest('.form-group'));

    const ok = Auth.loginAdmin(userInput.value.trim(), passInput.value);
    if (ok) {
      Utils.toast('Login realizado com sucesso!');
      window.location.href = 'admin/dashboard.html';
    } else {
      Utils.setFieldError(passInput.closest('.form-group'), 'Usuário ou senha inválidos.');
      Utils.toast('Não foi possível entrar. Verifique usuário e senha.', 'danger');
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

  document.getElementById('btn-esqueci-senha').addEventListener('click', () => {
    Utils.toast('Se o e-mail informado estiver cadastrado, um link de redefinição de senha será enviado.');
  });
});
