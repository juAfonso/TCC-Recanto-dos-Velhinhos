document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('usuarios-tbody');
  const buscaInput = document.getElementById('busca-usuario');
  let filtro = '';
  let perfilFiltro = 'todos';

  const PERFIL_LABEL = { funcionario: 'Funcionário', voluntario: 'Voluntário', doador: 'Doador Associado' };

  function render() {
    const db = DB.load();
    let usuarios = [...db.usuarios];

    if (perfilFiltro !== 'todos') usuarios = usuarios.filter(u => u.perfil === perfilFiltro);
    if (filtro) {
      const f = filtro.toLowerCase();
      usuarios = usuarios.filter(u =>
        u.nome.toLowerCase().includes(f) ||
        u.email.toLowerCase().includes(f) ||
        u.cpf.includes(f.replace(/\D/g, ''))
      );
    }

    usuarios.sort((a, b) => a.nome.localeCompare(b.nome));

    tbody.innerHTML = usuarios.map(u => `
      <tr>
        <td><strong>${u.nome}</strong></td>
        <td class="cell-muted">${Utils.maskCPF(u.cpf)}</td>
        <td class="cell-muted">${u.email}</td>
        <td><span class="badge badge-info">${PERFIL_LABEL[u.perfil] || u.perfil}</span></td>
        <td>${Utils.statusBadge(u.status)}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-outline btn-sm" data-edit="${u.id}">Editar</button>
            ${u.status === 'ativo'
              ? `<button class="btn btn-danger-outline btn-sm" data-inativar="${u.id}">Inativar</button>`
              : `<button class="btn btn-outline btn-sm" data-reativar="${u.id}">Reativar</button>`}
          </div>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="6"><div class="empty-state"><span class="icon">👥</span><p>Nenhum usuário encontrado para essa busca.</p></div></td></tr>`;

    tbody.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openEdit(btn.dataset.edit)));
    tbody.querySelectorAll('[data-inativar]').forEach(btn => btn.addEventListener('click', () => setStatus(btn.dataset.inativar, 'inativo')));
    tbody.querySelectorAll('[data-reativar]').forEach(btn => btn.addEventListener('click', () => setStatus(btn.dataset.reativar, 'ativo')));
  }

  buscaInput.addEventListener('input', () => { filtro = buscaInput.value; render(); });
  document.querySelectorAll('[data-perfil]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-perfil]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      perfilFiltro = btn.dataset.perfil;
      render();
    });
  });

  function openEdit(id) {
    const db = DB.load();
    const u = db.usuarios.find(x => x.id === id);
    if (!u) return;
    document.getElementById('us-id').value = u.id;
    document.getElementById('us-nome').value = u.nome;
    document.getElementById('us-cpf').value = Utils.maskCPF(u.cpf);
    document.getElementById('us-perfil').value = PERFIL_LABEL[u.perfil] || u.perfil;
    document.getElementById('us-email').value = u.email;
    document.getElementById('us-telefone').value = u.telefone;
    Utils.clearAllErrors(document.getElementById('form-usuario'));
    openModal('modal-usuario');
  }

  function setStatus(id, novoStatus) {
    const acao = novoStatus === 'inativo' ? 'inativar' : 'reativar';
    if (!confirm(`Confirmar ${acao} este usuário? ${novoStatus === 'inativo' ? 'Ele perderá o acesso, mas o histórico será mantido (FR-024: nunca excluído).' : ''}`)) return;
    const db = DB.load();
    const u = db.usuarios.find(x => x.id === id);
    if (!u) return;
    u.status = novoStatus;
    DB.addAudit(db, novoStatus === 'inativo' ? 'Inativação de usuário' : 'Reativação de usuário', `${u.nome} (${PERFIL_LABEL[u.perfil]}).`);
    DB.save(db);
    Utils.toast(`Usuário ${novoStatus === 'inativo' ? 'inativado' : 'reativado'} com sucesso.`);
    render();
  }

  document.getElementById('form-usuario').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    Utils.clearAllErrors(form);

    const id = document.getElementById('us-id').value;
    const nome = document.getElementById('us-nome').value.trim();
    const email = document.getElementById('us-email').value.trim();
    const telefone = document.getElementById('us-telefone').value.trim();

    let valid = true;
    const fail = (input, msg) => { Utils.setFieldError(input.closest('.form-group'), msg); valid = false; };
    if (!nome) fail(document.getElementById('us-nome'), 'Informe o nome completo.');
    if (!Utils.isValidEmail(email)) fail(document.getElementById('us-email'), 'Informe um e-mail válido.');
    if (!telefone) fail(document.getElementById('us-telefone'), 'Informe um telefone.');
    if (!valid) return;

    const db = DB.load();
    const u = db.usuarios.find(x => x.id === id);
    u.nome = nome; u.email = email; u.telefone = telefone;
    DB.addAudit(db, 'Alteração de dados cadastrais', `Dados de ${nome} atualizados.`);
    DB.save(db);
    Utils.toast('Dados atualizados com sucesso.');
    closeModal('modal-usuario');
    render();
  });

  render();
});
