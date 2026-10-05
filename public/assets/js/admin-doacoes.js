document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('doacoes-tbody');
  let filtro = 'todas';

  function renderStats(db) {
    const confirmadas = db.doacoes.filter(d => d.status === 'confirmada');
    const pendentes = db.doacoes.filter(d => d.status === 'pendente');
    const total = confirmadas.reduce((s, d) => s + d.valor, 0);

    document.getElementById('doacoes-stats').innerHTML = `
      <div class="stat-card">
        <span class="stat-label">Total confirmado via Pix</span>
        <span class="stat-value">${Utils.formatCurrency(total)}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Doações confirmadas</span>
        <span class="stat-value">${confirmadas.length}</span>
      </div>
      <div class="stat-card ${pendentes.length ? 'alert-card' : ''}">
        <span class="stat-label">Pendentes de confirmação</span>
        <span class="stat-value">${pendentes.length}</span>
      </div>
    `;
  }

  function render() {
    const db = DB.load();
    renderStats(db);

    let doacoes = [...db.doacoes];
    if (filtro !== 'todas') doacoes = doacoes.filter(d => d.status === filtro);
    doacoes.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

    tbody.innerHTML = doacoes.map(d => {
      const doador = d.doadorId ? db.usuarios.find(u => u.id === d.doadorId) : null;
      const nomeDoador = doador ? doador.nome : (d.doadorSnapshot ? d.doadorSnapshot.nome : 'Anônimo (espontânea)');
      return `
        <tr>
          <td class="cell-muted">#${d.id.slice(-6).toUpperCase()}</td>
          <td class="cell-muted">${Utils.formatDateTime(d.criadoEm)}</td>
          <td>${d.tipo === 'espontanea' ? 'Espontânea' : 'Associativa'}</td>
          <td>${nomeDoador}</td>
          <td><strong>${Utils.formatCurrency(d.valor)}</strong></td>
          <td>${Utils.statusBadge(d.status)}</td>
          <td>${d.status === 'pendente' ? `<button class="btn btn-outline btn-sm" data-confirmar="${d.id}">Simular confirmação</button>` : ''}</td>
        </tr>
      `;
    }).join('') || `<tr><td colspan="7"><div class="empty-state"><span class="icon">💸</span><p>Nenhuma doação encontrada.</p></div></td></tr>`;

    tbody.querySelectorAll('[data-confirmar]').forEach(btn => {
      btn.addEventListener('click', () => {
        const fresh = DB.load();
        const d = fresh.doacoes.find(x => x.id === btn.dataset.confirmar);
        if (d) {
          d.status = 'confirmada';
          DB.addAudit(fresh, 'Confirmação de pagamento Pix', `Doação #${d.id.slice(-6).toUpperCase()} (${Utils.formatCurrency(d.valor)}) confirmada.`);
          DB.save(fresh);
          Utils.toast('Pagamento confirmado. Comprovante disponível ao doador.');
          render();
        }
      });
    });
  }

  document.querySelectorAll('.tabs-nav .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabs-nav .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filtro = btn.dataset.filtro;
      render();
    });
  });

  render();
});
