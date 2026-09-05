document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('candidaturas-tbody');
  let filtro = 'em_analise';
  let rejeitandoId = null;

  const CARGO_LABEL = { limpeza: 'Limpeza', cuidador: 'Cuidador', enfermagem: 'Enfermagem', cozinha: 'Cozinha' };

  function render() {
    const db = DB.load();
    const lista = db.candidaturas.filter(c => c.status === filtro).sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

    tbody.innerHTML = lista.map(c => `
      <tr>
        <td class="cell-muted">${c.protocolo}</td>
        <td><strong>${c.nome}</strong><br><span class="cell-muted">${c.email}</span></td>
        <td><span class="badge badge-info">${CARGO_LABEL[c.cargo] || c.cargo}</span></td>
        <td>${c.curriculoNome ? `📎 ${c.curriculoNome}` : `<span class="cell-muted">"${(c.descricaoExperiencia || '').slice(0, 70)}${(c.descricaoExperiencia || '').length > 70 ? '…' : ''}"</span>`}</td>
        <td>${Utils.statusBadge(c.status)}</td>
        <td>
          ${c.status === 'em_analise' ? `
            <div class="row-actions">
              <button class="btn btn-viridian btn-sm" data-aprovar="${c.id}">Aprovar</button>
              <button class="btn btn-danger-outline btn-sm" data-rejeitar="${c.id}">Rejeitar</button>
            </div>
          ` : c.status === 'rejeitada' && c.motivo ? `<span class="cell-muted">Motivo: ${c.motivo}</span>` : ''}
        </td>
      </tr>
    `).join('') || `<tr><td colspan="6"><div class="empty-state"><span class="icon">💼</span><p>Nenhuma candidatura nesta situação.</p></div></td></tr>`;

    tbody.querySelectorAll('[data-aprovar]').forEach(btn => btn.addEventListener('click', () => aprovar(btn.dataset.aprovar)));
    tbody.querySelectorAll('[data-rejeitar]').forEach(btn => btn.addEventListener('click', () => {
      rejeitandoId = btn.dataset.rejeitar;
      document.getElementById('form-rejeitar').reset();
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
    if (!confirm('Aprovar esta candidatura? O cadastro será efetivado como funcionário nos registros administrativos.')) return;
    const db = DB.load();
    const c = db.candidaturas.find(x => x.id === id);
    if (!c) return;

    c.status = 'aprovada';

    // FR-019 + FR-040: efetiva cadastro como funcionário, sem gerar credencial individual
    db.usuarios.push({
      id: Utils.generateId('u'),
      nome: c.nome,
      cpf: c.cpf,
      email: c.email,
      telefone: c.telefone,
      perfil: 'funcionario',
      cargo: CARGO_LABEL[c.cargo] || c.cargo,
      status: 'ativo',
      criadoEm: new Date().toISOString()
    });

    DB.addAudit(db, 'Aprovação de candidatura a vaga', `${c.nome} efetivado(a) como funcionário(a) — ${CARGO_LABEL[c.cargo]}.`);
    DB.save(db);
    Utils.toast(`${c.nome} efetivado(a) como funcionário(a).`);
    render();
  }

  document.getElementById('form-rejeitar').addEventListener('submit', (e) => {
    e.preventDefault();
    const motivo = document.getElementById('rej-motivo').value.trim();
    const db = DB.load();
    const c = db.candidaturas.find(x => x.id === rejeitandoId);
    if (!c) return;
    c.status = 'rejeitada';
    c.motivo = motivo || null;
    DB.addAudit(db, 'Rejeição de candidatura a vaga', `${c.nome}${motivo ? ' — motivo: ' + motivo : ' (sem motivo informado)'}.`);
    DB.save(db);
    Utils.toast('Candidatura rejeitada. O registro foi preservado no histórico.', 'warning');
    closeModal('modal-rejeitar');
    render();
  });

  render();
});
