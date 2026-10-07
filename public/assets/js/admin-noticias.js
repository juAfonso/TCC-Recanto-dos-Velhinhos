/* Notícias (US8 — FR-032, FR-032a, FR-032b): criar, editar, despublicar e publicar de novo,
   com uma imagem opcional de texto alternativo obrigatório. Não há exclusão nem envio para
   redes sociais (FR-033 removido em 2026-10-03). */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const e = (t) => Utils.escapeHtml(t);
  const tbody = $('noticias-tbody');
  const form = $('form-noticia');
  let noticias = [];
  let editando = null; // notícia aberta para edição, ou null para nova

  /* ---------- Lista ---------- */
  async function carregar() {
    tbody.innerHTML = '<tr><td colspan="5" class="cell-muted">Carregando…</td></tr>';
    try {
      noticias = (await Api.get('/api/admin/noticias')).noticias;
      tbody.innerHTML = noticias.map((n) => `
        <tr>
          <td><strong>${e(n.titulo)}</strong><br><span class="cell-muted">${e(n.corpo.slice(0, 90))}${n.corpo.length > 90 ? '…' : ''}</span></td>
          <td>${n.imagem ? `<img src="${e(n.imagem.url)}" alt="${e(n.imagem.alt)}" style="width:64px;height:44px;object-fit:cover;border-radius:6px;">` : '<span class="cell-muted">—</span>'}</td>
          <td class="cell-muted">${Utils.formatDateTime(n.criadoEm)}${n.atualizadoEm ? `<br><span style="font-size:.8rem;">editada em ${Utils.formatDateTime(n.atualizadoEm)}</span>` : ''}</td>
          <td>${n.status === 'publicada' ? '<span class="badge badge-success">No site</span>' : '<span class="badge badge-neutral">Despublicada</span>'}</td>
          <td><div class="row-actions">
            <button class="btn btn-outline btn-sm" data-editar="${n.id}">Editar</button>
            ${n.status === 'publicada'
              ? `<button class="btn btn-danger-outline btn-sm" data-despublicar="${n.id}">Despublicar</button>`
              : `<button class="btn btn-outline btn-sm" data-publicar="${n.id}">Publicar de novo</button>`}
          </div></td>
        </tr>`).join('')
        || '<tr><td colspan="5"><div class="empty-state"><p>Nenhuma notícia ainda.</p></div></td></tr>';
    } catch (erro) {
      tbody.innerHTML = `<tr><td colspan="5">${e(erro.message)}</td></tr>`;
    }
  }

  tbody.addEventListener('click', async (ev) => {
    const ed = ev.target.closest('[data-editar]');
    const des = ev.target.closest('[data-despublicar]');
    const pub = ev.target.closest('[data-publicar]');
    if (ed) abrir(noticias.find((n) => n.id === ed.dataset.editar));
    try {
      if (des && confirm('Tirar esta notícia do site? Ela continua aqui e pode ser publicada de novo.')) {
        await Api.post(`/api/admin/noticias/${des.dataset.despublicar}/despublicar`);
        Utils.toast('Notícia despublicada. Ela não aparece mais no site.');
        carregar();
      }
      if (pub && confirm('Publicar esta notícia de novo no site?')) {
        await Api.post(`/api/admin/noticias/${pub.dataset.publicar}/publicar`);
        Utils.toast('Notícia publicada de novo.');
        carregar();
      }
    } catch (erro) { Utils.toast(erro.message, 'danger'); }
  });

  /* ---------- Formulário ---------- */
  // O texto alternativo aparece sempre que a notícia vai ficar com imagem.
  function atualizarImagem() {
    const nova = $('not-imagem').files.length > 0;
    const temAtual = Boolean(editando && editando.imagem);
    const remover = $('not-remover-imagem').checked;
    $('grupo-alt').hidden = !(nova || (temAtual && !remover));
    $('rotulo-imagem').textContent = temAtual ? 'Trocar por outra imagem' : 'Escolher imagem';
  }
  $('not-imagem').addEventListener('change', () => {
    if ($('not-imagem').files.length) $('not-remover-imagem').checked = false;
    atualizarImagem();
  });
  $('not-remover-imagem').addEventListener('change', atualizarImagem);

  function abrir(noticia = null) {
    editando = noticia;
    form.reset();
    Utils.clearAllErrors(form);
    $('modal-noticia-titulo').textContent = noticia ? 'Editar notícia' : 'Nova notícia';
    $('btn-salvar-noticia').textContent = noticia ? 'Salvar alterações' : 'Publicar no site';
    $('imagem-atual').hidden = !(noticia && noticia.imagem);
    if (noticia) {
      $('not-titulo').value = noticia.titulo;
      $('not-corpo').value = noticia.corpo;
      if (noticia.imagem) {
        $('imagem-atual-img').src = noticia.imagem.url;
        $('imagem-atual-img').alt = noticia.imagem.alt;
        $('not-alt').value = noticia.imagem.alt;
      }
    }
    atualizarImagem();
    openModal('modal-noticia');
    $('not-titulo').focus();
  }
  $('btn-nova-noticia').addEventListener('click', () => abrir());

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    Utils.clearAllErrors(form);
    const dados = new FormData();
    dados.set('titulo', $('not-titulo').value);
    dados.set('corpo', $('not-corpo').value);
    if (!$('grupo-alt').hidden) dados.set('imagemAlt', $('not-alt').value);
    const arquivo = $('not-imagem').files[0];
    if (arquivo) dados.set('imagem', arquivo);
    if ($('not-remover-imagem').checked) dados.set('removerImagem', '1');

    // Confere no navegador o que dá para conferir, para não enviar 2 MB à toa.
    if (arquivo && arquivo.size > 2 * 1024 * 1024) {
      Utils.setFieldError($('not-imagem').closest('.form-group'), 'A imagem é grande demais. Envie uma de até 2 MB.');
      return;
    }
    if (!$('grupo-alt').hidden && !$('not-alt').value.trim()) {
      Utils.setFieldError($('not-alt').closest('.form-group'), 'Descreva a imagem para quem não enxerga.');
      $('not-alt').focus();
      return;
    }

    const botao = $('btn-salvar-noticia');
    botao.disabled = true;
    try {
      if (editando) {
        await Api.enviarFormulario(`/api/admin/noticias/${editando.id}`, dados, { form, metodo: 'PUT' });
        Utils.toast('Notícia atualizada. O site já mostra a versão nova.');
      } else {
        await Api.enviarFormulario('/api/admin/noticias', dados, { form });
        Utils.toast('Notícia publicada no site.');
      }
      closeModal('modal-noticia');
      carregar();
    } catch (erro) {
      if (!erro.campos.length) Utils.toast(erro.message, 'danger');
    } finally {
      botao.disabled = false;
    }
  });

  carregar();
});
