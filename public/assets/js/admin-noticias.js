document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('noticias-tbody');

  function render() {
    const db = DB.load();
    const lista = [...db.noticias].sort((a, b) => new Date(b.dataPublicacao) - new Date(a.dataPublicacao));

    tbody.innerHTML = lista.map(n => `
      <tr>
        <td><strong>${n.titulo}</strong><br><span class="cell-muted">${n.conteudo.slice(0, 70)}${n.conteudo.length > 70 ? '…' : ''}</span></td>
        <td class="cell-muted">${Utils.formatDateTime(n.dataPublicacao)}</td>
        <td>${n.syncStatus === 'sincronizado' ? '<span class="badge badge-success">Instagram OK</span>' : '<span class="badge badge-warning">Falha na sincronização</span>'}</td>
        <td><span class="badge badge-success">Publicada no site</span></td>
      </tr>
    `).join('') || `<tr><td colspan="4"><div class="empty-state"><span class="icon">📰</span><p>Nenhuma notícia publicada ainda.</p></div></td></tr>`;
  }

  document.getElementById('btn-nova-noticia').addEventListener('click', () => {
    document.getElementById('form-noticia').reset();
    document.getElementById('not-sincronizar').checked = true;
    Utils.clearAllErrors(document.getElementById('form-noticia'));
    openModal('modal-noticia');
  });

  document.getElementById('form-noticia').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    Utils.clearAllErrors(form);

    const titulo = document.getElementById('not-titulo').value.trim();
    const conteudo = document.getElementById('not-conteudo').value.trim();
    const tentarSincronizar = document.getElementById('not-sincronizar').checked;

    let valid = true;
    const fail = (input, msg) => { Utils.setFieldError(input.closest('.form-group'), msg); valid = false; };
    if (!titulo) fail(document.getElementById('not-titulo'), 'Informe o título da notícia.');
    if (!conteudo) fail(document.getElementById('not-conteudo'), 'Informe o conteúdo da notícia.');
    if (!valid) return;

    // FR-033: tenta sincronizar com a rede social; uma falha nunca impede a publicação no site
    const sincronizouComSucesso = tentarSincronizar && Math.random() > 0.4;

    const db = DB.load();
    db.noticias.push({
      id: Utils.generateId('n'),
      titulo, conteudo,
      dataPublicacao: new Date().toISOString(),
      syncStatus: sincronizouComSucesso ? 'sincronizado' : 'nao_sincronizado'
    });
    DB.addAudit(db, 'Publicação de notícia', `"${titulo}" publicada no Portal Público${sincronizouComSucesso ? ' e sincronizada com o Instagram' : ' (sincronização com o Instagram não realizada)'}.`);
    DB.save(db);

    closeModal('modal-noticia');
    render();

    if (tentarSincronizar && !sincronizouComSucesso) {
      Utils.toast('Notícia publicada no site. A sincronização com o Instagram não foi concluída.', 'warning');
    } else {
      Utils.toast('Notícia publicada com sucesso!');
    }
  });

  render();
});
