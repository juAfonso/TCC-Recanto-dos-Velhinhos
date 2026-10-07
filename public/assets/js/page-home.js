/* Página inicial (US1): itens, campanhas e notícias vêm da API, sem login (FR-002, FR-003). */
document.addEventListener('DOMContentLoaded', () => {

  /* Itens de maior prioridade (alta → média → baixa, já ordenados pela API) */
  const itensGrid = document.getElementById('itens-urgentes-grid');
  if (itensGrid) {
    Api.get('/api/public/itens-necessarios')
      .then(({ itens }) => {
        itensGrid.innerHTML = itens.slice(0, 4).map(i => PortalCards.item(i)).join('')
          || '<p class="cell-muted">Nenhuma necessidade cadastrada no momento.</p>';
      })
      .catch(() => { itensGrid.innerHTML = PortalCards.erro(); });
  }

  /* Campanhas em andamento: as com meta mais perto de atingi-la primeiro;
     sem meta, aparecem depois e sem barra (FR-029b). */
  const campanhasEl = document.getElementById('campanhas-destaque');
  if (campanhasEl) {
    Api.get('/api/public/eventos-campanhas')
      .then(({ campanhas }) => {
        const pct = (c) => (typeof c.meta === 'number' ? c.arrecadado / c.meta : -1);
        const destaque = [...campanhas].sort((a, b) => pct(b) - pct(a)).slice(0, 2);
        campanhasEl.innerHTML = destaque.length
          ? `<div class="cards" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr));">${destaque.map(PortalCards.campanha).join('')}</div>`
          : '<p class="cell-muted" style="text-align:center;">Nenhuma campanha ativa no momento.</p>';
      })
      .catch(() => { campanhasEl.innerHTML = PortalCards.erro(); });
  }

  /* Notícias recentes */
  const noticiasGrid = document.getElementById('noticias-home-grid');
  if (noticiasGrid) {
    Api.get('/api/public/noticias?limite=3')
      .then(({ noticias }) => {
        noticiasGrid.innerHTML = noticias.map(n => PortalCards.noticia(n, { resumo: true })).join('')
          || '<p class="cell-muted">Nenhuma notícia publicada ainda.</p>';
      })
      .catch(() => { noticiasGrid.innerHTML = PortalCards.erro(); });
  }
});
