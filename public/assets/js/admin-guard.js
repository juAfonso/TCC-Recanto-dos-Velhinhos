/* =========================================================
   admin-guard.js — protege as páginas do Painel Administrativo

   A página fica escondida até o servidor confirmar a sessão
   (GET /api/admin/sessao). Sem sessão, vai para o login.
   Isto é só conveniência de tela: os dados do Painel são
   protegidos no servidor, rota a rota (exigirAdmin).
   ========================================================= */

(function () {
  document.documentElement.style.visibility = 'hidden';

  const pronto = Auth.verificarAdmin().then((identificador) => {
    if (!identificador) {
      window.location.replace('../login.html');
      return null;
    }
    document.documentElement.style.visibility = '';
    return identificador;
  });

  document.addEventListener('DOMContentLoaded', async () => {
    const toggle = document.querySelector('.admin-menu-toggle');
    const sidebar = document.querySelector('.admin-sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    const logoutBtn = document.getElementById('btn-admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await Auth.logoutAdmin();
        window.location.href = '../login.html';
      });
    }

    const identificador = await pronto;
    const nameEl = document.getElementById('admin-session-name');
    if (nameEl && identificador) nameEl.textContent = 'Conta institucional';
  });
})();
