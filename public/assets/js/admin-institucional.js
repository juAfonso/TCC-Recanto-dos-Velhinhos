/* Página institucional (US8 — FR-001a): textos das cinco seções e galeria opcional de até 6
   imagens, cada uma com texto alternativo. Salvar publica na hora; a versão anterior dos
   textos fica no histórico. Retirar uma imagem a desativa, sem apagar. */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const e = (t) => Utils.escapeHtml(t);
  const SECOES = { historia: 'Nossa história', missao: 'Missão', equipe: 'Equipe', acolhimento: 'Acolhimento de residentes', bazar: 'Nosso bazar' };
  const formT = $('form-textos');
  const formI = $('form-imagem');
  let pagina = null;

  async function carregar() {
    try {
      pagina = await Api.get('/api/admin/institucional');
    } catch (erro) { Utils.toast(erro.message, 'danger'); return; }
    Object.keys(SECOES).forEach((s) => { $(`t-${s}`).value = pagina[s]; });
    $('inst-ultima').textContent = pagina.atualizadoEm
      ? `Última alteração por ${pagina.atualizadoPor} em ${Utils.formatDateTime(pagina.atualizadoEm)}` : '';
    renderImagens();
    renderVersoes();
  }

  /* ---------- Imagens ---------- */
  function renderImagens() {
    const lista = pagina.imagens;
    $('img-contagem').textContent = `${lista.length} de ${pagina.maxImagens} (opcionais)`;
    formI.hidden = lista.length >= pagina.maxImagens;
    $('img-lista').innerHTML = lista.map((img) => `
      <div class="card" style="padding:10px;">
        <img src="${e(img.url)}" alt="${e(img.alt)}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;">
        <div class="form-group" style="margin:8px 0 6px;">
          <label for="alt-${img.id}" style="font-size:.85rem;">Texto alternativo</label>
          <input type="text" id="alt-${img.id}" value="${e(img.alt)}" maxlength="300">
          <div class="form-error"></div>
        </div>
        <div class="row-actions">
          <button type="button" class="btn btn-outline btn-sm" data-salvar-alt="${img.id}">Salvar texto</button>
          <button type="button" class="btn btn-danger-outline btn-sm" data-retirar="${img.id}">Retirar do site</button>
        </div>
      </div>`).join('')
      || '<p class="cell-muted">Nenhuma imagem. Elas são opcionais: a página funciona só com os textos.</p>';
  }

  $('img-lista').addEventListener('click', async (ev) => {
    const salvar = ev.target.closest('[data-salvar-alt]');
    const retirar = ev.target.closest('[data-retirar]');
    try {
      if (salvar) {
        const id = salvar.dataset.salvarAlt;
        const campo = $(`alt-${id}`);
        Utils.clearAllErrors(campo.closest('.card'));
        if (!campo.value.trim()) {
          Utils.setFieldError(campo.closest('.form-group'), 'Descreva a imagem para quem não enxerga.');
          return;
        }
        await Api.put(`/api/admin/institucional/imagens/${id}`, { alt: campo.value });
        Utils.toast('Texto alternativo salvo.');
        carregar();
      }
      if (retirar && confirm('Tirar esta imagem do site? O arquivo não é apagado.')) {
        await Api.post(`/api/admin/institucional/imagens/${retirar.dataset.retirar}/desativar`);
        Utils.toast('Imagem retirada do site.');
        carregar();
      }
    } catch (erro) { Utils.toast(erro.message, 'danger'); }
  });

  formI.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    Utils.clearAllErrors(formI);
    const arquivo = $('nova-imagem').files[0];
    const alt = $('nova-alt').value.trim();
    let ok = true;
    if (!arquivo) { Utils.setFieldError($('nova-imagem').closest('.form-group'), 'Escolha uma imagem.'); ok = false; }
    else if (arquivo.size > 2 * 1024 * 1024) { Utils.setFieldError($('nova-imagem').closest('.form-group'), 'A imagem é grande demais. Envie uma de até 2 MB.'); ok = false; }
    if (!alt) { Utils.setFieldError($('nova-alt').closest('.form-group'), 'Descreva a imagem para quem não enxerga.'); ok = false; }
    if (!ok) return;

    const dados = new FormData();
    dados.set('imagem', arquivo);
    dados.set('imagemAlt', alt);
    const botao = formI.querySelector('button[type="submit"]');
    botao.disabled = true;
    try {
      await Api.enviarFormulario('/api/admin/institucional/imagens', dados, { form: formI });
      Utils.toast('Imagem incluída. Ela já aparece no site.');
      formI.reset();
      carregar();
    } catch (erro) {
      if (!erro.campos.length) Utils.toast(erro.message, 'danger');
    } finally {
      botao.disabled = false;
    }
  });

  /* ---------- Textos ---------- */
  formT.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    Utils.clearAllErrors(formT);
    const vazias = Object.keys(SECOES).filter((s) => !$(`t-${s}`).value.trim() && pagina[s].trim());
    if (vazias.length && !confirm(`Estas seções vão ficar em branco e sumir do site: ${vazias.map((s) => SECOES[s]).join(', ')}. Continuar?`)) return;
    try {
      const corpo = Object.fromEntries(Object.keys(SECOES).map((s) => [s, $(`t-${s}`).value]));
      const r = await Api.put('/api/admin/institucional', corpo, { form: formT });
      Utils.toast(r.alteradas.length ? 'Salvo. O site já mostra o texto novo.' : 'Nada mudou.');
      carregar();
    } catch (erro) {
      if (!erro.campos.length) Utils.toast(erro.message, 'danger');
    }
  });

  /* ---------- Versões anteriores (Princípio III) ---------- */
  function renderVersoes() {
    $('versoes').innerHTML = pagina.historico.map((h) => `
      <details style="margin-bottom:8px;">
        <summary style="cursor:pointer;">Versão substituída em ${Utils.formatDateTime(h.alteradoEm)} por ${e(h.alteradoPor)}</summary>
        <dl style="margin:8px 0 0 12px;font-size:.9rem;">
          ${Object.entries(SECOES).map(([s, rotulo]) => `<dt style="font-weight:700;margin-top:6px;">${rotulo}</dt><dd style="white-space:pre-wrap;">${e(h.versao[s] || '—')}</dd>`).join('')}
        </dl>
      </details>`).join('')
      || '<p class="cell-muted">Nenhuma versão anterior ainda.</p>';
  }

  carregar();
});
