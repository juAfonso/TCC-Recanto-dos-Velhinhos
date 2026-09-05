document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('solicitacoes-tbody');
  let filtro = 'em_analise';
  let rejeitandoId = null;

  function render() {
    const db = DB.load();
    const lista = db.solicitacoesExternas.filter(s => s.status === filtro).sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

    tbody.innerHTML = lista.map(s => `
      <tr>
        <td class="cell-muted">${s.protocolo}</td>
        <td><strong>${s.nomeContato}</strong><br><span class="cell-muted">${s.email}</span></td>
        <td><span class="badge badge-info">${s.tipo === 'evento' ? 'Evento' : 'Campanha'}</span></td>
        <td>${s.objetivo.slice(0, 70)}${s.objetivo.length > 70 ? '…' : ''}</td>
        <td class="cell-muted">${Utils.formatDate(s.dataPretendida)}</td>
        <td>${Utils.statusBadge(s.status)}</td>
        <td>
          ${s.status === 'em_analise' ? `
            <div class="row-actions">
              <button class="btn btn-viridian btn-sm" data-aprovar="${s.id}">Aprovar</button>
              <button class="btn btn-danger-outline btn-sm" data-rejeitar="${s.id}">Rejeitar</button>
            </div>
          ` : s.status === 'rejeitada' && s.motivo ? `<span class="cell-muted">Motivo: ${s.motivo}</span>` : ''}
        </td>
      </tr>
    `).join('') || `<tr><td colspan="7"><div class="empty-state"><span class="icon">📅</span><p>Nenhuma solicitação nesta situação.</p></div></td></tr>`;

    tbody.querySelectorAll('[data-aprovar]').forEach(btn => btn.addEventListener('click', () => aprovar(btn.dataset.aprovar)));
    tbody.querySelectorAll('[data-rejeitar]').forEach(btn => btn.addEventListener('click', () => {
      rejeitandoId = btn.dataset.rejeitar;
      document.getElementById('form-rejeitar').reset();
      Utils.clearAllErrors(document.getElementById('form-rejeitar'));
      openModal('modal-rejeitar');
    }));
  }

  document.querySelectorAll('.tabs-nav .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabs-nav .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filtro = btn.dataset.filtro;
      render();
    });
  });

  function aprovar(id) {
    const db = DB.load();
    const s = db.solicitacoesExternas.find(x => x.id === id);
    if (!s) return;

    // FR-030: verifica conflito de data antes de gerar o evento/campanha
    const conflita = db.campanhas.some(c => c.status === 'ativo' && c.data.slice(0, 10) === s.dataPretendida.slice(0, 10));
    const msg = conflita
      ? 'Atenção: já existe um evento/campanha confirmado nesta data. Aprovar mesmo assim e gerar o registro?'
      : 'Aprovar esta solicitação? Um novo evento/campanha será criado e publicado automaticamente no Portal Público.';
    if (!confirm(msg)) return;

    s.status = 'aprovada';

    // FR-022: gera automaticamente o evento/campanha correspondente
    db.campanhas.push({
      id: Utils.generateId('c'),
      titulo: `${s.tipo === 'evento' ? 'Evento' : 'Campanha'}: ${s.objetivo.slice(0, 60)}`,
      descricao: s.objetivo,
      data: s.dataPretendida,
      recursos: s.recursos,
      metaValor: 1000,
      arrecadado: 0,
      origem: 'externa',
      status: 'ativo',
      criadoEm: new Date().toISOString()
    });

    DB.addAudit(db, 'Aprovação de solicitação externa', `Solicitação de ${s.nomeContato} aprovada — evento/campanha gerado e publicado.`);
    DB.save(db);
    Utils.toast('Solicitação aprovada. Evento/campanha publicado no Portal Público.');
    render();
  }

  document.getElementById('form-rejeitar').addEventListener('submit', (e) => {
    e.preventDefault();
    const motivoGroup = document.getElementById('rej-motivo').closest('.form-group');
    Utils.clearFieldError(motivoGroup);
    const motivo = document.getElementById('rej-motivo').value.trim();

    // FR-022: motivo obrigatório para rejeição de solicitação externa
    if (!motivo) {
      Utils.setFieldError(motivoGroup, 'O motivo é obrigatório para rejeitar uma solicitação externa.');
      return;
    }

    const db = DB.load();
    const s = db.solicitacoesExternas.find(x => x.id === rejeitandoId);
    if (!s) return;
    s.status = 'rejeitada';
    s.motivo = motivo;
    DB.addAudit(db, 'Rejeição de solicitação externa', `${s.nomeContato} — motivo: ${motivo}`);
    DB.save(db);
    Utils.toast('Solicitação rejeitada. O registro foi preservado no histórico.', 'warning');
    closeModal('modal-rejeitar');
    render();
  });

  render();
});
