/* =========================================================
   nav.js — comportamento da navbar pública (menu mobile)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('open');
      const expanded = menu.classList.contains('open');
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  }

  // Atualiza área de login/autoatendimento conforme sessão ativa
  const navActions = document.querySelector('.nav-actions');
  if (navActions && typeof Auth !== 'undefined') {
    const session = Auth.getSession();
    if (session && (session.tipo === 'voluntario' || session.tipo === 'doador')) {
      const btn = navActions.querySelector('.btn-login');
      if (btn) {
        btn.textContent = 'Minha área';
        btn.setAttribute('href', 'autoatendimento.html');
      }
    }
  }
});
