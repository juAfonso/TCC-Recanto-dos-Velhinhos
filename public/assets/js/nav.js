/* =========================================================
   nav.js — menu e rodapé do Portal Público

   O menu fica em menu.html e o rodapé em rodape.html, num lugar
   só, como o menu do Painel (admin/menu.html). Cada página tem
   um <header id="portal-menu"> e um <footer id="portal-rodape">
   vazios, e este script os preenche, marcando o link da página
   aberta. Na área do doador (data-area="doador" no <header>),
   o menu não mostra "Participar" e o botão da direita é "Sair".
   ========================================================= */

(function () {
  // O script fica no fim do <body>, então o <header> e o <footer> já existem aqui.
  const cabecalho = document.getElementById('portal-menu');
  const rodape = document.getElementById('portal-rodape');

  if (cabecalho) {
    incluir(cabecalho, 'menu.html',
      '<nav class="navbar"><a href="index.html" class="logo">Recanto dos Velhinhos</a></nav>')
      .then(() => montarMenu(cabecalho));
  }
  if (rodape) incluir(rodape, 'rodape.html', '');

  async function incluir(alvo, arquivo, reserva) {
    try {
      const resp = await fetch(arquivo);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      alvo.innerHTML = await resp.text();
    } catch (err) {
      console.error(`${arquivo} não carregou:`, err);
      alvo.innerHTML = reserva;
    }
  }

  function montarMenu(cabecalho) {
    const semExtensao = (nome) => nome.replace(/\.html$/, '');
    const atual = semExtensao(window.location.pathname.split('/').pop() || 'index');
    cabecalho.querySelectorAll('.menu a').forEach((link) => {
      if (semExtensao(link.getAttribute('href')) !== atual) return;
      link.setAttribute('aria-current', 'page');
      // Página do submenu "Participar": quem fica destacado é o item do topo.
      const grupo = link.closest('.nav-dropdown');
      (grupo ? grupo.querySelector(':scope > a') : link).classList.add('active');
    });

    const toggle = cabecalho.querySelector('.menu-toggle');
    const menu = cabecalho.querySelector('.menu');
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        menu.classList.toggle('open');
        document.documentElement.classList.toggle('menu-aberto', menu.classList.contains('open'));
        toggle.setAttribute('aria-expanded', menu.classList.contains('open') ? 'true' : 'false');
      });
    }

    const acoes = cabecalho.querySelector('.nav-actions');
    if (!acoes) return;

    if (cabecalho.dataset.area === 'doador') {
      cabecalho.querySelector('.nav-dropdown')?.remove();
      acoes.innerHTML = '<button class="btn-login" id="btn-logout" style="border:none;">Sair</button>';
      document.getElementById('btn-logout').addEventListener('click', async () => {
        await Auth.logoutDoador();
        window.location.href = 'index.html';
      });
      return;
    }

    // Doador com sessão ativa vê "Minha área" no lugar de "Entrar".
    if (typeof Auth !== 'undefined' && Auth.getSession()?.tipo === 'doador') {
      const btn = acoes.querySelector('.btn-login');
      if (btn) {
        btn.textContent = 'Minha área';
        btn.setAttribute('href', 'autoatendimento.html');
      }
    }
  }
})();
