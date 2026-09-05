/* =========================================================
   admin-guard.js — protege as páginas do Painel Administrativo
   ========================================================= */

(function () {
  const session = Auth.requireAdmin();
  if (!session) return; // já redirecionado para login

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.admin-menu-toggle');
    const sidebar = document.querySelector('.admin-sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    const logoutBtn = document.getElementById('btn-admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        Auth.logout();
        window.location.href = '../login.html';
      });
    }

    const nameEl = document.getElementById('admin-session-name');
    if (nameEl) nameEl.textContent = session.nome;
  });
})();
