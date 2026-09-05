document.addEventListener('DOMContentLoaded', () => {
  const db = DB.load();
  const lista = document.getElementById('campanhas-lista');
  if (!lista) return;

  // FR-002: lista somente campanhas/eventos ativos (oculta encerrados)
  const campanhas = db.campanhas
    .filter(c => c.status === 'ativo')
    .sort((a, b) => new Date(a.data) - new Date(b.data));

  if (campanhas.length === 0) {
    lista.innerHTML = `<div class="empty-state"><span class="icon">📭</span><p>Nenhuma campanha ou evento ativo no momento. Volte em breve!</p></div>`;
    return;
  }

  lista.innerHTML = campanhas.map(c => {
    const pct = Math.min(100, Math.round((c.arrecadado / c.metaValor) * 100));
    return `
      <div class="campanha-card" style="max-width:none;margin:0;">
        <div class="campanha-head">
          <h3>${c.titulo}</h3>
          <span class="badge ${c.origem === 'externa' ? 'badge-info' : 'badge-success'}">${c.origem === 'externa' ? 'Parceria externa' : 'Iniciativa interna'}</span>
        </div>
        <p class="desc">${c.descricao}</p>
        <div class="barra"><div class="progresso" style="width:${pct}%;"></div></div>
        <p>${pct}% arrecadado — ${Utils.formatCurrency(c.arrecadado)} de ${Utils.formatCurrency(c.metaValor)}</p>
        <div class="campanha-foot">
          <span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calendar-heart" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4zM1 14V4h14v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1m7-6.507c1.664-1.711 5.825 1.283 0 5.132-5.825-3.85-1.664-6.843 0-5.132"/>
</svg> Data: ${Utils.formatDate(c.data)}</span>
          <span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bag-heart" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M10.5 3.5a2.5 2.5 0 0 0-5 0V4h5zm1 0V4H15v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4h3.5v-.5a3.5 3.5 0 1 1 7 0M14 14V5H2v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1M8 7.993c1.664-1.711 5.825 1.283 0 5.132-5.825-3.85-1.664-6.843 0-5.132"/>
</svg> Recursos: ${c.recursos}</span>
        </div>
      </div>
    `;
  }).join('');
});
