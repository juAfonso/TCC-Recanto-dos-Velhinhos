document.addEventListener('DOMContentLoaded', () => {
  const db = DB.load();

  /* Itens urgentes (ativos, urgentes primeiro) */
  const itensGrid = document.getElementById('itens-urgentes-grid');
  if (itensGrid) {
    const itens = db.itens
      .filter(i => i.status === 'ativo')
      .sort((a, b) => (b.urgente === true) - (a.urgente === true))
      .slice(0, 4);

    itensGrid.innerHTML = itens.map(i => `
      <div class="card item-card">
        <div>
          <h3>${i.nome}</h3>
          <p>${i.urgente ? 'Necessidade imediata.' : 'Contribuição sempre bem-vinda.'}</p>
        </div>
        <span class="qtd">${i.quantidade} ${i.unidade}</span>
      </div>
    `).join('') || '<p class="cell-muted">Nenhuma necessidade cadastrada no momento.</p>';
  }

  /* Campanhas próximas da meta */
  const campanhasEl = document.getElementById('campanhas-destaque');
  if (campanhasEl) {
    const campanhas = db.campanhas
      .filter(c => c.status === 'ativo')
      .map(c => ({ ...c, pct: Math.min(100, Math.round((c.arrecadado / c.metaValor) * 100)) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 2);

    campanhasEl.innerHTML = campanhas.map(c => `
      <div class="campanha-card">
        <h3>${c.titulo}</h3>
        <div class="barra"><div class="progresso" style="width:${c.pct}%;"></div></div>
        <p>${c.pct}% arrecadado — ${Utils.formatCurrency(c.arrecadado)} de ${Utils.formatCurrency(c.metaValor)}</p>
      </div>
    `).join('') || '<p style="text-align:center;">Nenhuma campanha ativa no momento.</p>';
  }

  /* Notícias recentes */
  const noticiasGrid = document.getElementById('noticias-home-grid');
  if (noticiasGrid) {
    const noticias = [...db.noticias]
      .sort((a, b) => new Date(b.dataPublicacao) - new Date(a.dataPublicacao))
      .slice(0, 3);

    noticiasGrid.innerHTML = noticias.map(n => `
      <div class="noticia-card">
        <div class="noticia-thumb">📰</div>
        <div class="body">
          <h3>${n.titulo}</h3>
          <p>${n.conteudo.slice(0, 110)}${n.conteudo.length > 110 ? '…' : ''}</p>
          <div class="meta">
            <span>${Utils.formatDate(n.dataPublicacao)}</span>
            <a href="noticias.html" style="color:var(--viridian);font-weight:700;text-decoration:none;">Ler mais →</a>
          </div>
        </div>
      </div>
    `).join('') || '<p class="cell-muted">Nenhuma notícia publicada ainda.</p>';
  }
});
