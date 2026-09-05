document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('voluntarios-tbody');
  let filtro = 'pendente';
  let rejeitandoId = null;

  function render() {
    const db = DB.load();
    const lista = db.voluntarios.filter(v => v.status === filtro).sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

    tbody.innerHTML = lista.map(v => `
      <tr>
        <td class="cell-muted">${v.protocolo}</td>
        <td><strong>${v.nome}</strong>${v.menorIdade ? ' <span class="badge badge-warning">Menor de idade</span>' : ''}</td>
        <td>${v.idade} anos</td>
        <td>${v.areaInteresse}</td>
        <td>${v.anexoAutorizacao ? `📎 ${v.anexoAutorizacao}` : '<span class="cell-muted">—</span>'}</td>
        <td>${Utils.statusBadge(v.status)}</td>
        <td>
          ${v.status === 'pendente' ? `
            <div class="row-actions">
              <button class="btn btn-viridian btn-sm" data-aprovar="${v.id}">Aprovar</button>
              <button class="btn btn-danger-outline btn-sm" data-rejeitar="${v.id}">Rejeitar</button>
            </div>
          ` : v.status === 'rejeitado' && v.motivo ? `<span class="cell-muted">Motivo: ${v.motivo}</span>` : ''}
        </td>
      </tr>
    `).join('') || `<tr><td colspan="7"><div class="empty-state"><span class="icon">🤝</span><p>Nenhum cadastro nesta situação.</p></div></td></tr>`;

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
    if (!confirm('Aprovar este cadastro de voluntário? A pessoa passará a constar como voluntária ativa e receberá login de autoatendimento.')) return;
    const db = DB.load();
    const v = db.voluntarios.find(x => x.id === id);
    if (!v) return;

    v.status = 'aprovado';

    // efetiva o usuário voluntário (login próprio de autoatendimento — FR-041)
    const emailGerado = `${v.nome.toLowerCase().split(' ')[0]}.voluntario@email.com`;
    const novoUsuario = {
      id: Utils.generateId('u'),
      nome: v.nome,
      cpf: '00000000000',
      email: emailGerado,
      telefone: v.telefone,
      perfil: 'voluntario',
      areaInteresse: v.areaInteresse,
      idade: v.idade,
      status: 'ativo',
      senha: 'voluntario123',
      criadoEm: new Date().toISOString()
    };
    db.usuarios.push(novoUsuario);
    v.usuarioId = novoUsuario.id;

    DB.addAudit(db, 'Aprovação de cadastro de voluntário', `${v.nome} aprovado(a) como voluntário(a). Login: ${emailGerado} / senha inicial: voluntario123.`);
    DB.save(db);
    Utils.toast(`${v.nome} aprovado(a) como voluntário(a).`);
    render();
  }

  document.getElementById('form-rejeitar').addEventListener('submit', (e) => {
    e.preventDefault();
    const motivo = document.getElementById('rej-motivo').value.trim();
    const db = DB.load();
    const v = db.voluntarios.find(x => x.id === rejeitandoId);
    if (!v) return;
    v.status = 'rejeitado';
    v.motivo = motivo || null;
    DB.addAudit(db, 'Rejeição de cadastro de voluntário', `${v.nome}${motivo ? ' — motivo: ' + motivo : ' (sem motivo informado)'}.`);
    DB.save(db);
    Utils.toast('Cadastro rejeitado. O registro foi preservado no histórico.', 'warning');
    closeModal('modal-rejeitar');
    render();
  });

  render();
});
