/* Campanhas e Eventos (US1, FR-002): só o que está vigente, vindo da API.
   Evento tem data e recursos em texto; campanha tem período, recursos e barra só com meta. */
document.addEventListener('DOMContentLoaded', () => {
  const lista = document.getElementById('campanhas-lista');
  if (!lista) return;

  Api.get('/api/public/eventos-campanhas')
    .then(({ eventos, campanhas }) => {
      if (!eventos.length && !campanhas.length) {
        lista.innerHTML = PortalCards.vazio('Nenhuma campanha ou evento ativo no momento. Volte em breve!');
        return;
      }
      lista.innerHTML = [
        ...campanhas.map(PortalCards.campanha),
        ...eventos.map(PortalCards.evento),
      ].join('');
    })
    .catch(() => { lista.innerHTML = PortalCards.erro(); });
});
