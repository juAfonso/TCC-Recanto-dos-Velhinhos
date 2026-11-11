/* =========================================================
   admin-guard.js — protege as páginas do Painel Administrativo

   A página fica escondida até o servidor confirmar a sessão
   (GET /api/admin/sessao). Sem sessão, vai para o login.
   Isto é só conveniência de tela: os dados do Painel são
   protegidos no servidor, rota a rota (exigirAdmin).

   Também monta o menu lateral: ele fica em admin/menu.html,
   num lugar só, e é colocado no <aside id="admin-menu"> de
   cada tela, com o link da página aberta marcado como ativo.
   ========================================================= */

(function () {
  document.documentElement.style.visibility = 'hidden';

  const sessao = Auth.verificarAdmin();
  const menu = carregarMenu();

  Promise.all([sessao, menu]).then(([identificador]) => {
    if (!identificador) {
      window.location.replace('../login.html');
      return;
    }
    document.documentElement.style.visibility = '';
  });

  // O script fica no fim do <body>, então o <aside> já existe aqui.
  async function carregarMenu() {
    const aside = document.getElementById('admin-menu');
    if (!aside) return;
    try {
      const resp = await fetch('menu.html');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      aside.innerHTML = await resp.text();
    } catch (err) {
      console.error('Menu do Painel não carregou:', err);
      aside.innerHTML = '<nav class="admin-nav"><a href="dashboard.html">Visão Geral</a></nav>'
        + '<div class="side-foot"><button id="btn-admin-logout">Sair</button></div>';
    }

    const semExtensao = (nome) => nome.replace(/\.html$/, '');
    const atual = semExtensao(window.location.pathname.split('/').pop() || 'dashboard');
    aside.querySelectorAll('.admin-nav a').forEach((link) => {
      if (semExtensao(link.getAttribute('href')) === atual) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });

    // Menu em duas colunas (2026-11-11): só o trilho fica à vista; o botão de uma seção abre ao
    // lado, por cima da tela, o painel com as telas dela. Fecha no mesmo botão, no Esc ou ao
    // clicar fora. O botão da seção da página aberta fica marcado mesmo com o painel fechado.
    const botoes = aside.querySelectorAll('.menu-grupo[data-grupo]');
    const painel = aside.querySelector('.menu-painel');
    let aberto = null;
    const mostrarGrupo = (grupo) => {
      aberto = grupo;
      botoes.forEach((b) => {
        const ativo = b.dataset.grupo === grupo;
        b.classList.toggle('active', ativo);
        b.setAttribute('aria-expanded', String(ativo));
      });
      aside.querySelectorAll('.menu-painel .admin-nav').forEach((nav) => { nav.hidden = nav.dataset.grupo !== grupo; });
      if (painel) painel.hidden = !grupo;
      aside.classList.toggle('painel-aberto', Boolean(grupo));
    };
    if (botoes.length && painel) {
      const paginaAberta = aside.querySelector('.menu-painel .admin-nav a.active');
      if (paginaAberta) {
        const grupoAtual = paginaAberta.closest('.admin-nav').dataset.grupo;
        botoes.forEach((b) => b.classList.toggle('atual', b.dataset.grupo === grupoAtual));
      }
      mostrarGrupo(null);
      botoes.forEach((b) => b.addEventListener('click', () => mostrarGrupo(aberto === b.dataset.grupo ? null : b.dataset.grupo)));
      // Fecha e devolve o foco ao botão da seção (Esc e setinha do painel, 2026-11-11).
      const fechar = () => {
        const botao = aside.querySelector(`.menu-grupo[data-grupo="${aberto}"]`);
        mostrarGrupo(null);
        if (botao) botao.focus();
      };
      document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && aberto) fechar(); });
      const setaFechar = aside.querySelector('.menu-painel-fechar');
      if (setaFechar) setaFechar.addEventListener('click', fechar);
      document.addEventListener('click', (ev) => {
        if (aberto && !aside.contains(ev.target)) mostrarGrupo(null);
      });
    }

    const logoutBtn = document.getElementById('btn-admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await Auth.logoutAdmin();
        window.location.href = '../login.html';
      });
    }

    const identificador = await sessao;
    const nameEl = document.getElementById('admin-session-name');
    if (nameEl && identificador) nameEl.textContent = 'Conta institucional';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.admin-menu-toggle');
    const sidebar = document.querySelector('.admin-sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }
  });
})();
