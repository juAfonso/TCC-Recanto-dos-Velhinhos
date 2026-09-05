document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('campanhas-tbody');
  const buscaInput = document.getElementById('busca-campanha');
  let filtro = '';

  function render() {
    const db = DB.load();
    let campanhas = [...db.campanhas];
    if (filtro) campanhas = campanhas.filter(c => c.titulo.toLowerCase().includes(filtro.toLowerCase()));
    campanhas.sort((a, b) => new Date(b.data) - new Date(a.data));

    tbody.innerHTML = campanhas.map(c => {
      const pct = Math.min(100, Math.round((c.arrecadado / c.metaValor) * 100));
      return `
        <tr>
          <td><strong>${c.titulo}</strong></td>
          <td class="cell-muted">${Utils.formatDate(c.data)}</td>
          <td>${c.origem === 'externa' ? '<span class="badge badge-info">Externa</span>' : '<span class="badge badge-success">Interna</span>'}</td>
          <td>${pct}% (${Utils.formatCurrency(c.arrecadado)} / ${Utils.formatCurrency(c.metaValor)})</td>
          <td>${Utils.statusBadge(c.status)}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn-outline btn-sm" data-edit="${c.id}">Editar</button>
              ${c.status === 'ativo' ? `<button class="btn btn-danger-outline btn-sm" data-encerrar="${c.id}">Encerrar</button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('') || `<tr><td colspan="6"><div class="empty-state"><span class="icon">🎉</span><p>Nenhuma campanha/evento encontrado.</p></div></td></tr>`;

    tbody.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openEdit(btn.dataset.edit)));
    tbody.querySelectorAll('[data-encerrar]').forEach(btn => btn.addEventListener('click', () => encerrar(btn.dataset.encerrar)));
  }

  buscaInput.addEventListener('input', () => { filtro = buscaInput.value; render(); });

  const dataInput = document.getElementById('camp-data');
  const dataHint = document.getElementById('camp-data-hint');

  function checkConflito(ignorarId) {
    const db = DB.load();
    const val = dataInput.value;
    if (!val) { dataHint.textContent = ''; return false; }
    const conflita = db.campanhas.some(c => c.status === 'ativo' && c.id !== ignorarId && c.data.slice(0, 10) === val);
    dataHint.textContent = conflita ? '⚠️ Conflito: já existe uma campanha/evento confirmado nesta data.' : '';
    dataHint.style.color = 'var(--warning)';
    return conflita;
  }
  dataInput.addEventListener('change', () => checkConflito(document.getElementById('camp-id').value));

  function openNew() {
    document.getElementById('modal-campanha-titulo').textContent = 'Nova campanha/evento';
    document.getElementById('form-campanha').reset();
    document.getElementById('camp-id').value = '';
    dataHint.textContent = '';
    Utils.clearAllErrors(document.getElementById('form-campanha'));
    openModal('modal-campanha');
  }
  document.getElementById('btn-nova-campanha').addEventListener('click', openNew);

  function openEdit(id) {
    const db = DB.load();
    const c = db.campanhas.find(x => x.id === id);
    if (!c) return;
    document.getElementById('modal-campanha-titulo').textContent = 'Editar campanha/evento';
    document.getElementById('camp-id').value = c.id;
    document.getElementById('camp-titulo').value = c.titulo;
    document.getElementById('camp-descricao').value = c.descricao;
    document.getElementById('camp-data').value = c.data.slice(0, 10);
    document.getElementById('camp-meta').value = c.metaValor;
    document.getElementById('camp-recursos').value = c.recursos;
    dataHint.textContent = '';
    Utils.clearAllErrors(document.getElementById('form-campanha'));
    openModal('modal-campanha');
  }

  function encerrar(id) {
    if (!confirm('Encerrar esta campanha/evento? Ela deixará de aparecer como ativa no Portal Público.')) return;
    const db = DB.load();
    const c = db.campanhas.find(x => x.id === id);
    if (!c) return;
    c.status = 'encerrado';
    DB.addAudit(db, 'Encerramento de campanha/evento', `"${c.titulo}" foi encerrado.`);
    DB.save(db);
    Utils.toast(`"${c.titulo}" foi encerrado.`);
    render();
  }

  document.getElementById('form-campanha').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    Utils.clearAllErrors(form);

    const id = document.getElementById('camp-id').value;
    const titulo = document.getElementById('camp-titulo').value.trim();
    const descricao = document.getElementById('camp-descricao').value.trim();
    const data = dataInput.value;
    const meta = document.getElementById('camp-meta').value;
    const recursos = document.getElementById('camp-recursos').value.trim();

    let valid = true;
    const fail = (input, msg) => { Utils.setFieldError(input.closest('.form-group'), msg); valid = false; };
    if (!titulo) fail(document.getElementById('camp-titulo'), 'Informe o título.');
    if (!descricao) fail(document.getElementById('camp-descricao'), 'Informe a descrição.');
    if (!data) fail(dataInput, 'Informe a data.');
    if (meta === '' || Number(meta) < 0) fail(document.getElementById('camp-meta'), 'Informe uma meta válida.');
    if (!recursos) fail(document.getElementById('camp-recursos'), 'Informe os recursos necessários.');
    if (!valid) return;

    // FR-030: verifica disponibilidade de data
    const conflita = checkConflito(id);
    if (conflita && !confirm('Já existe uma campanha/evento confirmado nesta data. Deseja confirmar o cadastro mesmo assim?')) {
      return;
    }

    const db = DB.load();

    if (id) {
      const c = db.campanhas.find(x => x.id === id);
      c.titulo = titulo; c.descricao = descricao; c.data = new Date(data).toISOString();
      c.metaValor = Number(meta); c.recursos = recursos;
      DB.addAudit(db, 'Atualização de campanha/evento', `"${titulo}" foi atualizado.`);
      Utils.toast('Campanha/evento atualizado com sucesso.');
    } else {
      db.campanhas.push({
        id: Utils.generateId('c'), titulo, descricao, data: new Date(data).toISOString(),
        recursos, metaValor: Number(meta), arrecadado: 0, origem: 'interna', status: 'ativo',
        criadoEm: new Date().toISOString()
      });
      DB.addAudit(db, 'Cadastro de campanha/evento', `"${titulo}" cadastrado e publicado.`);
      Utils.toast('Campanha/evento publicado automaticamente no Portal Público.');
    }

    DB.save(db);
    closeModal('modal-campanha');
    render();
  });

  render();
});
