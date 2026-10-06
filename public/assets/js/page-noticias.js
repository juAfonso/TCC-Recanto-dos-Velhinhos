/* Notícias (US1): só as publicadas, mais recentes primeiro (FR-032a). */
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('noticias-grid');
  if (!grid) return;

  Api.get('/api/public/noticias')
    .then(({ noticias }) => {
      grid.innerHTML = noticias.map(n => PortalCards.noticia(n)).join('')
        || PortalCards.vazio('Nenhuma notícia publicada ainda.');
    })
    .catch(() => { grid.innerHTML = PortalCards.erro(); });
});
