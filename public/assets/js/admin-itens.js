document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('itens-tbody');
  const buscaInput = document.getElementById('busca-item');
  let filtro = '';

  function render() {
    const db = DB.load();
    let itens = [...db.itens];

    if (filtro) {
      itens = itens.filter(i => i.nome.toLowerCase().includes(filtro.toLowerCase()));
    }

    itens.sort((a, b) => (b.status === 'ativo') - (a.status === 'ativo') || (b.urgente === true) - (a.urgente === true));

    tbody.innerHTML = itens.map(i => {
      const stale = i.status === 'ativo' && Utils.daysSince(i.atualizadoEm) > 30;
      return `
        <tr>
          <td>${stale ? '<span class="cell-flag" title="Sem atualização recente">●</span> ' : ''}${i.nome}</td>
          <td>${i.quantidade} ${i.unidade}</td>
          <td>${i.urgente ? '<span class="badge badge-warning">Urgente</span>' : '<span class="cell-muted">—</span>'}</td>
          <td>${Utils.statusBadge(i.status)}</td>
          <td class="cell-muted">${Utils.formatDate(i.atualizadoEm)}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn-outline btn-sm" data-edit="${i.id}">Editar</button>
              ${i.status === 'ativo' ? `<button class="btn btn-danger-outline btn-sm" data-baixa="${i.id}">Dar baixa</button>` : '<span class="cell-muted">Histórico</span>'}
            </div>
          </td>
        </tr>
      `;
    }).join('') || `<tr><td colspan="6"><div class="empty-state"><span class="icon">📦</span><p>Nenhum item encontrado.</p></div></td></tr>`;

    tbody.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openEdit(btn.dataset.edit)));
    tbody.querySelectorAll('[data-baixa]').forEach(btn => btn.addEventListener('click', () => darBaixa(btn.dataset.baixa)));
  }

  buscaInput.addEventListener('input', () => { filtro = buscaInput.value; render(); });

  function openNew() {
    document.getElementById('modal-item-titulo').textContent = 'Novo item necessário';
    document.getElementById('form-item').reset();
    document.getElementById('item-id').value = '';
    Utils.clearAllErrors(document.getElementById('form-item'));
    openModal('modal-item');
  }
  document.getElementById('btn-novo-item').addEventListener('click', openNew);

  function openEdit(id) {
    const db = DB.load();
    const item = db.itens.find(i => i.id === id);
    if (!item) return;
    document.getElementById('modal-item-titulo').textContent = 'Editar item necessário';
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-nome').value = item.nome;
    document.getElementById('item-quantidade').value = item.quantidade;
    document.getElementById('item-unidade').value = item.unidade;
    document.getElementById('item-urgente').checked = !!item.urgente;
    Utils.clearAllErrors(document.getElementById('form-item'));
    openModal('modal-item');
  }

  function darBaixa(id) {
    if (!confirm('Confirmar baixa deste item? Ele deixará de aparecer no Portal Público, mas seu histórico será mantido.')) return;
    const db = DB.load();
    const item = db.itens.find(i => i.id === id);
    if (!item) return;
    item.status = 'suprido';
    item.atualizadoEm = new Date().toISOString();
    DB.addAudit(db, 'Baixa de item necessário', `"${item.nome}" marcado como suprido.`);
    DB.save(db);
    Utils.toast(`"${item.nome}" foi marcado como suprido.`);
    render();
  }

  document.getElementById('form-item').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    Utils.clearAllErrors(form);

    const id = document.getElementById('item-id').value;
    const nome = document.getElementById('item-nome').value.trim();
    const quantidade = document.getElementById('item-quantidade').value;
    const unidade = document.getElementById('item-unidade').value.trim();
    const urgente = document.getElementById('item-urgente').checked;

    let valid = true;
    const fail = (input, msg) => { Utils.setFieldError(input.closest('.form-group'), msg); valid = false; };
    if (!nome) fail(document.getElementById('item-nome'), 'Informe o nome do item.');
    if (quantidade === '' || Number(quantidade) < 0) fail(document.getElementById('item-quantidade'), 'Informe uma quantidade válida.');
    if (!unidade) fail(document.getElementById('item-unidade'), 'Informe a unidade de medida.');
    if (!valid) return;

    const db = DB.load();

    if (id) {
      const item = db.itens.find(i => i.id === id);
      item.nome = nome; item.quantidade = Number(quantidade); item.unidade = unidade; item.urgente = urgente;
      item.atualizadoEm = new Date().toISOString();
      DB.addAudit(db, 'Atualização de item necessário', `"${nome}" foi atualizado.`);
      Utils.toast('Item atualizado com sucesso.');
    } else {
      db.itens.push({
        id: Utils.generateId('it'), nome, quantidade: Number(quantidade), unidade, urgente,
        status: 'ativo', atualizadoEm: new Date().toISOString()
      });
      DB.addAudit(db, 'Cadastro de item necessário', `"${nome}" cadastrado (${quantidade} ${unidade}).`);
      Utils.toast('Item cadastrado e publicado no Portal Público.');
    }

    DB.save(db);
    closeModal('modal-item');
    render();
  });

  render();
});
