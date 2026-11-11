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

    // Menu em duas colunas (2026-11-11): o trilho escolhe a seção e o painel mostra as telas dela.
    // Abre na seção da página aberta; sem página do menu aberta, na primeira.
    const botoes = aside.querySelectorAll('.menu-grupo');
    const mostrarGrupo = (grupo) => {
      botoes.forEach((b) => {
        const ativo = b.dataset.grupo === grupo;
        b.classList.toggle('active', ativo);
        b.setAttribute('aria-expanded', String(ativo));
      });
      aside.querySelectorAll('.menu-painel .admin-nav').forEach((nav) => { nav.hidden = nav.dataset.grupo !== grupo; });
    };
    if (botoes.length) {
      const aberta = aside.querySelector('.menu-painel .admin-nav a.active');
      mostrarGrupo(aberta ? aberta.closest('.admin-nav').dataset.grupo : botoes[0].dataset.grupo);
      botoes.forEach((b) => b.addEventListener('click', () => mostrarGrupo(b.dataset.grupo)));
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
