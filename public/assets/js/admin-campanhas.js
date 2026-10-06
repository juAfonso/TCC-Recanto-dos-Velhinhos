/* Campanhas e eventos no Painel (US3, FR-029 a FR-031, FR-029b, FR-030).
   Tipos diferentes na mesma tela. Publicar no site é automático. Conflito de data
   entre eventos é AVISO: a equipe escolhe alterar a data ou prosseguir. */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const e = (t) => Utils.escapeHtml(t);
  const tbody = $('campanhas-tbody');
  const form = $('form-campanha');
  const listaRecursos = $('lista-recursos');
  let itens = [];
  let editando = null;

  /* ---------- Lista ---------- */
  function periodo(x) {
    return x.tipo === 'evento' ? Utils.formatDay(x.data) : `${Utils.formatDay(x.periodoInicio)} a ${Utils.formatDay(x.periodoFim)}`;
  }

  function arrecadacao(x) {
    if (x.tipo === 'evento') return '<span class="cell-muted">—</span>';
    if (x.meta === null) return '<span class="cell-muted">Sem meta</span>';
    const arrecadado = x.arrecadado ?? 0;
    const pct = Math.min(100, Math.round((arrecadado / x.meta) * 100));
    const botao = x.status === 'ativo'
      ? ` <button class="link-btn" data-arrecadado="${x.id}" style="font-size:.78rem;">Atualizar</button>` : '';
    return `${Utils.formatCurrency(arrecadado)} de ${Utils.formatCurrency(x.meta)} (${pct}%)${botao}`;
  }

  function situacao(x) {
    if (x.status === 'encerrado') {
      const quem = x.encerradoPor === 'sistema' ? 'automaticamente' : `por ${e(x.encerradoPor)}`;
      return `<span class="badge badge-neutral">Encerrado</span><div class="cell-muted" style="font-size:.75rem;">${quem} em ${Utils.formatDate(x.encerradoEm)}</div>`;
    }
    if (x.vencido) return '<span class="badge badge-warning">Já passou</span><div class="cell-muted" style="font-size:.75rem;">fora do site; será encerrado esta noite</div>';
    return '<span class="badge badge-success">No site</span>';
  }

  function linha(x) {
    const tipo = x.tipo === 'evento' ? '<span class="badge badge-info">Evento</span>' : '<span class="badge badge-success">Campanha</span>';
    const origem = x.externa ? '<div class="cell-muted" style="font-size:.75rem;">Parceria externa</div>' : '';
    const acoes = x.status === 'ativo'
      ? `<button class="btn btn-outline btn-sm" data-editar="${x.id}">Editar</button>
         <button class="btn btn-danger-outline btn-sm" data-encerrar="${x.id}">Encerrar</button>`
      : '<span class="cell-muted">Histórico</span>';
    return `
      <tr>
        <td>${e(x.nome)}${origem}</td>
        <td>${tipo}</td>
        <td>${periodo(x)}</td>
        <td>${arrecadacao(x)}</td>
        <td>${situacao(x)}</td>
        <td><div class="row-actions">${acoes}</div></td>
      </tr>`;
  }

  function render() {
    const busca = $('busca-campanha').value.trim().toLowerCase();
    const lista = itens.filter((x) => !busca || x.nome.toLowerCase().includes(busca));
    tbody.innerHTML = lista.map(linha).join('')
      || '<tr><td colspan="6"><div class="empty-state"><span class="icon" aria-hidden="true">📅</span><p>Nenhuma campanha ou evento encontrado.</p></div></td></tr>';
  }

  async function carregar() {
    try {
      const r = await Api.get('/api/admin/eventos-campanhas');
      // Ativos primeiro, pela data mais próxima; depois o histórico.
      const chave = (x) => (x.tipo === 'evento' ? x.data : x.periodoFim);
      itens = r.itens.sort((a, b) => (a.status === 'ativo' ? 0 : 1) - (b.status === 'ativo' ? 0 : 1) || chave(a).localeCompare(chave(b)));
      render();
    } catch (erro) {
      tbody.innerHTML = `<tr><td colspan="6">${e(erro.message)}</td></tr>`;
    }
  }
  $('busca-campanha').addEventListener('input', render);

  /* ---------- Formulário ---------- */
  const tipoEscolhido = () => form.querySelector('input[name=tipo]:checked').value;

  function mostrarCamposDoTipo() {
    const evento = tipoEscolhido() === 'evento';
    $('campos-evento').hidden = !evento;
    $('campos-campanha').hidden = evento;
    if (!evento && !listaRecursos.children.length) adicionarRecurso();
  }
  form.querySelectorAll('input[name=tipo]').forEach((r) => r.addEventListener('change', mostrarCamposDoTipo));

  // Cada recurso: tipo + descrição. O id volta ao servidor para os que não mudaram (os outros
  // são desativados lá, nunca apagados).
  function adicionarRecurso(r = { tipo: 'item', descricao: '' }) {
    const n = listaRecursos.children.length + 1;
    const div = document.createElement('div');
    div.className = 'form-row recurso-linha';
    div.style.alignItems = 'flex-end';
    if (r.id) div.dataset.id = r.id;
    div.innerHTML = `
      <div class="form-group" style="flex:0 0 140px;">
        <label for="rec-tipo-${n}">Tipo</label>
        <select id="rec-tipo-${n}" class="rec-tipo">
          <option value="item"${r.tipo === 'item' ? ' selected' : ''}>Item</option>
          <option value="dinheiro"${r.tipo === 'dinheiro' ? ' selected' : ''}>Dinheiro</option>
        </select>
      </div>
      <div class="form-group" style="flex:1;">
        <label for="rec-desc-${n}">Descrição</label>
        <input type="text" id="rec-desc-${n}" class="rec-desc" maxlength="300" value="${e(r.descricao)}" placeholder="ex.: cobertores de casal">
      </div>
      <div class="form-group" style="flex:0 0 auto;">
        <button type="button" class="btn btn-outline btn-sm rec-remover" aria-label="Remover este recurso">Remover</button>
      </div>`;
    div.querySelector('.rec-remover').addEventListener('click', () => div.remove());
    listaRecursos.appendChild(div);
    return div;
  }
  $('btn-add-recurso').addEventListener('click', () => adicionarRecurso().querySelector('.rec-desc').focus());

  function abrir(x) {
    editando = x;
    form.reset();
    Utils.clearAllErrors(form);
    listaRecursos.innerHTML = '';
    $('modal-campanha-titulo').textContent = x ? `Editar ${x.tipo}` : 'Nova campanha ou evento';
    $('grupo-tipo').hidden = Boolean(x); // o tipo não muda depois de cadastrado
    $('camp-id').value = x ? x.id : '';
    const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    ['camp-data', 'camp-inicio', 'camp-fim'].forEach((id) => { $(id).min = x ? '' : hoje; });
    if (x) {
      form.querySelector(`input[name=tipo][value=${x.tipo}]`).checked = true;
      $('camp-nome').value = x.nome;
      $('camp-descricao').value = x.descricao;
      if (x.tipo === 'evento') {
        $('camp-data').value = x.data;
        $('camp-recursos-texto').value = x.recursos || '';
      } else {
        $('camp-inicio').value = x.periodoInicio;
        $('camp-fim').value = x.periodoFim;
        $('camp-meta').value = x.meta === null ? '' : String(x.meta).replace('.', ',');
        x.recursos.forEach((r) => adicionarRecurso(r));
      }
    }
    mostrarCamposDoTipo();
    openModal('modal-campanha');
    $('camp-nome').focus();
  }
  $('btn-nova-campanha').addEventListener('click', () => abrir(null));

  function dadosDoForm() {
    const tipo = editando ? editando.tipo : tipoEscolhido();
    const comum = { tipo, nome: $('camp-nome').value.trim(), descricao: $('camp-descricao').value.trim() };
    if (tipo === 'evento') return { ...comum, data: $('camp-data').value, recursos: $('camp-recursos-texto').value.trim() };
    return {
      ...comum,
      periodoInicio: $('camp-inicio').value,
      periodoFim: $('camp-fim').value,
      meta: $('camp-meta').value.trim(),
      recursos: [...listaRecursos.querySelectorAll('.recurso-linha')].map((linhaR) => ({
        id: linhaR.dataset.id || null,
        tipo: linhaR.querySelector('.rec-tipo').value,
        descricao: linhaR.querySelector('.rec-desc').value.trim(),
      })),
    };
  }

  async function salvar(corpo, confirmarAviso = false) {
    const url = editando ? `/api/admin/eventos-campanhas/${editando.id}` : '/api/admin/eventos-campanhas';
    const enviar = { ...corpo, confirmarAviso };
    try {
      if (editando) await Api.put(url, enviar, { form });
      else await Api.post(url, enviar, { form });
      closeModal('modal-campanha');
      Utils.toast(editando ? 'Alterações salvas e publicadas.' : 'Cadastrado e publicado no site.');
      carregar();
    } catch (erro) {
      // Conflito de data é aviso (FR-030): a equipe decide.
      if (erro.codigo === 'CONFLITO_DE_DATA') {
        if (confirm(`${erro.message}\n\nOK = prosseguir mesmo assim\nCancelar = alterar a data`)) return salvar(corpo, true);
        $('camp-data').focus();
        return;
      }
      if (!erro.campos.length) Utils.toast(erro.message, 'danger');
    }
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    Utils.clearAllErrors(form);
    const botao = form.querySelector('[type=submit]');
    botao.disabled = true;
    await salvar(dadosDoForm());
    botao.disabled = false;
  });

  /* ---------- Encerrar e arrecadado ---------- */
  tbody.addEventListener('click', async (ev) => {
    const alvo = ev.target.closest('[data-editar], [data-encerrar], [data-arrecadado]');
    if (!alvo) return;
    const x = itens.find((i) => i.id === (alvo.dataset.editar || alvo.dataset.encerrar || alvo.dataset.arrecadado));
    if (alvo.dataset.editar) abrir(x);
    if (alvo.dataset.encerrar) {
      if (!confirm(`Encerrar "${x.nome}"? Sai do site agora e fica no histórico. Não dá para desfazer.`)) return;
      try {
        await Api.post(`/api/admin/eventos-campanhas/${x.id}/encerrar`);
        Utils.toast('Encerrado.');
      } catch (erro) { Utils.toast(erro.message, 'danger'); }
      carregar();
    }
    if (alvo.dataset.arrecadado) {
      editando = x;
      $('form-arrecadado').reset();
      Utils.clearAllErrors($('form-arrecadado'));
      $('arrecadado-resumo').textContent = `${x.nome} — meta de ${Utils.formatCurrency(x.meta)}.`;
      $('arrecadado-valor').value = x.arrecadado === null ? '' : String(x.arrecadado).replace('.', ',');
      openModal('modal-arrecadado');
      $('arrecadado-valor').focus();
    }
  });

  $('form-arrecadado').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = ev.currentTarget;
    Utils.clearAllErrors(f);
    try {
      await Api.put(`/api/admin/campanhas/${editando.id}/arrecadado`, { valor: $('arrecadado-valor').value.trim() }, { form: f });
      closeModal('modal-arrecadado');
      Utils.toast('Valor arrecadado atualizado no site.');
      carregar();
    } catch (erro) {
      if (!erro.campos.length) Utils.toast(erro.message, 'danger');
    }
  });

  carregar();
});
