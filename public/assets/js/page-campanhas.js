/* Campanhas e Eventos (US1, FR-002): só o que está vigente, vindo da API.
   Evento tem data e recursos em texto; campanha tem período, recursos e barra só com meta.
   Filtro Todos / Campanhas / Eventos (2026-11-11), sem nova ida ao servidor. */
document.addEventListener('DOMContentLoaded', () => {
  const lista = document.getElementById('campanhas-lista');
  if (!lista) return;
  const filtro = document.getElementById('filtro-tipo');
  const anuncio = document.getElementById('filtro-tipo-anuncio');
  const VAZIO = {
    todos: 'Nenhuma campanha ou evento ativo no momento. Volte em breve!',
    campanha: 'Nenhuma campanha ativa no momento.',
    evento: 'Nenhum evento marcado no momento.',
  };
  let dados = { eventos: [], campanhas: [] };

  function mostrar(tipo) {
    const cartoes = [
      ...(tipo === 'evento' ? [] : dados.campanhas.map(PortalCards.campanha)),
      ...(tipo === 'campanha' ? [] : dados.eventos.map(PortalCards.evento)),
    ];
    lista.innerHTML = cartoes.join('') || PortalCards.vazio(VAZIO[tipo]);
    filtro.querySelectorAll('[data-tipo]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tipo === tipo)));
    anuncio.textContent = `${cartoes.length} ${cartoes.length === 1 ? 'resultado' : 'resultados'}.`;
  }

  filtro.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-tipo]');
    if (b) mostrar(b.dataset.tipo);
  });

  Api.get('/api/public/eventos-campanhas')
    .then((r) => {
      dados = r;
      if (!r.eventos.length && !r.campanhas.length) {
        lista.innerHTML = PortalCards.vazio(VAZIO.todos);
        return;
      }
      filtro.hidden = false;
      mostrar('todos');
      anuncio.textContent = '';
    })
    .catch(() => { lista.innerHTML = PortalCards.erro(); });
});
