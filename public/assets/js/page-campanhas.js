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
          <span>📅 Data: ${Utils.formatDate(c.data)}</span>
          <span>🧰 Recursos: ${c.recursos}</span>
        </div>
      </div>
    `;
  }).join('');
});
