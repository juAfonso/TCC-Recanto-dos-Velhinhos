/* =========================================================
   portal-cards.js — cartões do Portal Público (US1)

   Usado pela página inicial, campanhas, notícias e doações.
   Todo texto vindo da API passa por Utils.escapeHtml.
   ========================================================= */

const PortalCards = (() => {
  const e = (t) => Utils.escapeHtml(t);

  // Só aceita imagem servida por https (o Blob da Vercel).
  const urlSegura = (url) => (/^https:\/\//.test(url || '') ? e(url) : '');

  const ICONE_CALENDARIO = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" aria-hidden="true" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4zM1 14V4h14v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1m7-6.507c1.664-1.711 5.825 1.283 0 5.132-5.825-3.85-1.664-6.843 0-5.132"/></svg>';
  const ICONE_SACOLA = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" aria-hidden="true" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10.5 3.5a2.5 2.5 0 0 0-5 0V4h5zm1 0V4H15v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4h3.5v-.5a3.5 3.5 0 1 1 7 0M14 14V5H2v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1M8 7.993c1.664-1.711 5.825 1.283 0 5.132-5.825-3.85-1.664-6.843 0-5.132"/></svg>';

  function quantidade(n) {
    return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  }

  /* Item necessário com prioridade em texto (FR-003, FR-026). */
  function item(i, { comData = false } = {}) {
    const p = Utils.prioridade(i.prioridade);
    return `
      <div class="card item-card">
        <div>
          <span class="badge ${p.cls}">${p.rotulo}</span>
          <span class="qtd">${quantidade(i.quantidade)} ${e(i.unidade)}</span>
          <h3 style="margin-top:10px;">${e(i.nome)}</h3>
          <p>${p.frase}</p>
          ${comData ? `<p class="card-meta">Atualizado em ${Utils.formatDate(i.atualizadoEm)}</p>` : ''}
        </div>
      </div>`;
  }

  /* Barra de arrecadação: só para campanha com meta (FR-029b). */
  function progresso(c) {
    if (typeof c.meta !== 'number') return '';
    const pct = Math.min(100, Math.round((c.arrecadado / c.meta) * 100));
    return `
      <div class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"
           aria-label="Arrecadação da campanha ${e(c.nome)}">
        <div class="progresso" style="width:${pct}%;"></div>
      </div>
      <p>${pct}% arrecadado — ${Utils.formatCurrency(c.arrecadado)} de ${Utils.formatCurrency(c.meta)}</p>`;
  }

  function recursosDaCampanha(recursos) {
    if (!recursos || !recursos.length) return '';
    return recursos.map(r => e(r.descricao)).join(' · ');
  }

  function campanha(c) {
    const recursos = recursosDaCampanha(c.recursos);
    return `
      <div class="campanha-card" style="max-width:none;margin:0;">
        <div class="campanha-head">
          <h3>${e(c.nome)}</h3>
          <span class="badge badge-success">Campanha</span>
        </div>
        <p class="desc">${e(c.descricao)}</p>
        ${progresso(c)}
        <div class="campanha-foot">
          <span>${ICONE_CALENDARIO} De ${Utils.formatDay(c.periodoInicio)} a ${Utils.formatDay(c.periodoFim)}</span>
          ${recursos ? `<span>${ICONE_SACOLA} Arrecadando: ${recursos}</span>` : ''}
        </div>
      </div>`;
  }

  function evento(ev) {
    return `
      <div class="campanha-card" style="max-width:none;margin:0;">
        <div class="campanha-head">
          <h3>${e(ev.nome)}</h3>
          <span class="badge badge-info">Evento</span>
        </div>
        <p class="desc">${e(ev.descricao)}</p>
        <div class="campanha-foot">
          <span>${ICONE_CALENDARIO} Data: ${Utils.formatDay(ev.data)}</span>
          ${ev.recursos ? `<span>${ICONE_SACOLA} Precisamos de: ${e(ev.recursos)}</span>` : ''}
        </div>
      </div>`;
  }

  /* Notícia: imagem com texto alternativo quando houver (FR-032b, Princípio II).
     O cartão mostra um resumo; "Ler mais" abre a notícia inteira numa janela por cima da
     página (decisão de 2026-10-17). Antes, o "Ler mais" da home levava à lista, que
     mostrava o mesmo texto, e parecia que a notícia não abria. */
  const noticiasCarregadas = new Map();

  function noticia(n) {
    noticiasCarregadas.set(String(n.id), n);
    const url = n.imagem ? urlSegura(n.imagem.url) : '';
    const capa = url
      ? `<img src="${url}" alt="${e(n.imagem.alt)}" class="noticia-thumb" style="object-fit:cover;width:100%;" loading="lazy">` : '';
    return `
      <article class="noticia-card" data-noticia="${e(n.id)}">
        ${capa}
        <div class="body">
          <h3>${e(n.titulo)}</h3>
          <p>${e(n.corpo.slice(0, 110))}${n.corpo.length > 110 ? '…' : ''}</p>
          <div class="meta">
            <span>${Utils.formatDate(n.publicadaEm)}</span>
            <button type="button" class="noticia-ler" data-noticia="${e(n.id)}">Ler mais<span class="sr-only">: ${e(n.titulo)}</span> →</button>
          </div>
        </div>
      </article>`;
  }

  // <dialog> nativo: Esc fecha e o foco fica dentro da janela enquanto ela está aberta.
  function janelaNoticia() {
    let d = document.getElementById('noticia-janela');
    if (d) return d;
    d = document.createElement('dialog');
    d.id = 'noticia-janela';
    d.className = 'noticia-janela';
    d.setAttribute('aria-labelledby', 'noticia-janela-titulo');
    d.innerHTML = `
      <button type="button" class="modal-close noticia-janela-fechar" aria-label="Fechar notícia">✕</button>
      <div id="noticia-janela-conteudo"></div>`;
    d.querySelector('.noticia-janela-fechar').addEventListener('click', () => d.close());
    // Clique no fundo escurecido (fora da caixa) também fecha.
    d.addEventListener('click', (ev) => {
      const r = d.getBoundingClientRect();
      const fora = ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom;
      if (ev.target === d && fora) d.close();
    });
    document.body.appendChild(d);
    return d;
  }

  function abrirNoticia(id, origem) {
    const n = noticiasCarregadas.get(String(id));
    if (!n) return;
    const d = janelaNoticia();
    const url = n.imagem ? urlSegura(n.imagem.url) : '';
    d.querySelector('#noticia-janela-conteudo').innerHTML = `
      ${url ? `<img src="${url}" alt="${e(n.imagem.alt)}" class="noticia-janela-imagem">` : ''}
      <h2 id="noticia-janela-titulo">${e(n.titulo)}</h2>
      <p class="noticia-janela-data">${Utils.formatDate(n.publicadaEm)}</p>
      <div class="noticia-janela-texto">${Utils.paragrafos(n.corpo)}</div>`;
    d.addEventListener('close', () => { if (origem && origem.isConnected) origem.focus(); }, { once: true });
    d.showModal();
    d.scrollTop = 0;
  }

  // O cartão inteiro abre a notícia com o mouse; pelo teclado, o botão "Ler mais".
  document.addEventListener('click', (ev) => {
    const alvo = ev.target.closest('.noticia-card[data-noticia], .noticia-ler[data-noticia]');
    if (!alvo) return;
    const card = alvo.closest('.noticia-card');
    abrirNoticia(alvo.dataset.noticia, card ? card.querySelector('.noticia-ler') : alvo);
  });

  function vazio(mensagem) {
    return `<div class="empty-state"><p>${e(mensagem)}</p></div>`;
  }

  function erro() {
    return vazio('Não foi possível carregar agora. Recarregue a página em alguns instantes.');
  }

  return { item, campanha, evento, noticia, vazio, erro };
})();
