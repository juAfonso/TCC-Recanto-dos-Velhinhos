/* Campanhas e eventos no Painel (US3, FR-029 a FR-031, FR-029b, FR-030).
   Tipos diferentes na mesma tela. Publicar no site é automático. Conflito de data
   entre eventos é AVISO: a equipe escolhe alterar a data ou prosseguir.
   2026-11-11: filtro por tipo, "objetivo" no lugar de "descrição", arrecadação por recurso
   (também depois de encerrada) e atalho para o relatório da campanha encerrada. */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const e = (t) => Utils.escapeHtml(t);
  const tbody = $('campanhas-tbody');
  const form = $('form-campanha');
  const listaRecursos = $('lista-recursos');
  const UNIDADES = ['unidades', 'kg', 'litros', 'pacotes', 'caixas', 'fardos'];
  let itens = [];
  let editando = null;
  let filtroTipo = 'todos';

  /* ---------- Lista ---------- */
  function periodo(x) {
    return x.tipo === 'evento' ? Utils.formatDay(x.data) : `${Utils.formatDay(x.periodoInicio)} a ${Utils.formatDay(x.periodoFim)}`;
  }

  // Quantos recursos já têm a quantidade arrecadada informada.
  function contados(x) {
    const n = x.recursos.filter((r) => r.quantidade !== null).length;
    return `${n} de ${x.recursos.length} ${x.recursos.length === 1 ? 'recurso contado' : 'recursos contados'}`;
  }

  function arrecadacao(x) {
    if (x.tipo === 'evento') return '<span class="cell-muted">—</span>';
    let barra = '<span class="cell-muted">Sem meta</span>';
    if (x.meta !== null) {
      const arrecadado = x.arrecadado ?? 0;
      const pct = Math.min(100, Math.round((arrecadado / x.meta) * 100));
      barra = `${Utils.formatCurrency(arrecadado)} de ${Utils.formatCurrency(x.meta)} (${pct}%)`;
    }
    return `<div class="celula-arrecadacao">
      <div>${barra}</div>
      <div class="cell-muted">${contados(x)}</div>
      <button class="link-btn" data-arrecadado="${x.id}">Registrar arrecadação</button>
    </div>`;
  }

  function situacao(x) {
    if (x.status === 'encerrado') {
      const quem = x.encerradoPor === 'sistema' ? 'automaticamente' : `por ${e(x.encerradoPor)}`;
      return `<span class="badge badge-neutral">Encerrado</span><div class="cell-muted" style="font-size:.86rem;">${quem} em ${Utils.formatDate(x.encerradoEm)}</div>`;
    }
    if (x.vencido) return '<span class="badge badge-warning">Já passou</span><div class="cell-muted" style="font-size:.86rem;">fora do site; será encerrado esta noite</div>';
    return '<span class="badge badge-success">No site</span>';
  }

  function linha(x) {
    const tipo = x.tipo === 'evento' ? '<span class="badge badge-info">Evento</span>' : '<span class="badge badge-success">Campanha</span>';
    const origem = x.externa ? '<div class="cell-muted" style="font-size:.86rem;">Parceria externa</div>' : '';
    // "Ver dados" em todos, como nas pessoas: é o único jeito de consultar o que já encerrou.
    const ver = `<button class="btn btn-outline btn-sm" data-ver="${x.id}">Ver dados</button>`;
    const acoes = x.status === 'ativo'
      ? `${ver}
         <button class="btn btn-outline btn-sm" data-editar="${x.id}">Editar</button>
         <button class="btn btn-danger-outline btn-sm" data-encerrar="${x.id}">Encerrar</button>`
      : x.tipo === 'campanha'
        ? `${ver} <a class="btn btn-outline btn-sm" href="relatorio-campanha.html?id=${encodeURIComponent(x.id)}">Relatório</a>`
        : ver;
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

  const NADA = {
    todos: 'Nenhuma campanha ou evento encontrado.',
    campanha: 'Nenhuma campanha encontrada.',
    evento: 'Nenhum evento encontrado.',
  };

  function render() {
    const busca = $('busca-campanha').value.trim().toLowerCase();
    const lista = itens.filter((x) => (filtroTipo === 'todos' || x.tipo === filtroTipo)
      && (!busca || x.nome.toLowerCase().includes(busca)));
    tbody.innerHTML = lista.map(linha).join('')
      || `<tr><td colspan="6"><div class="empty-state"><p>${NADA[filtroTipo]}</p></div></td></tr>`;
  }

  async function carregar() {
    tbody.innerHTML = '<tr><td colspan="6" class="cell-muted">Carregando…</td></tr>';
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

  // Filtro Todos / Campanhas / Eventos (2026-11-11).
  document.querySelector('.filtro-tipo').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-tipo]');
    if (!b) return;
    filtroTipo = b.dataset.tipo;
    document.querySelectorAll('.filtro-tipo [data-tipo]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    render();
  });

  /* ---------- Formulário ---------- */
  const tipoEscolhido = () => form.querySelector('input[name=tipo]:checked').value;
  // Campanha que veio de solicitação externa: só itens e sem meta em R$ (2026-11-11).
  const externa = () => Boolean(editando && editando.externa);

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
    const dinheiro = externa() && r.tipo !== 'dinheiro'
      ? '' : `<option value="dinheiro"${r.tipo === 'dinheiro' ? ' selected' : ''}>Dinheiro</option>`;
    div.innerHTML = `
      <div class="form-group" style="flex:0 0 140px;">
        <label for="rec-tipo-${n}">Tipo</label>
        <select id="rec-tipo-${n}" class="rec-tipo">
          <option value="item"${r.tipo === 'item' ? ' selected' : ''}>Item</option>
          ${dinheiro}
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
    // Meta em R$ só em campanha criada pela equipe (a externa só mostra, se já tinha).
    $('camp-meta').closest('.form-group').hidden = Boolean(x && x.externa && x.meta === null);
    $('camp-externa-aviso').hidden = !externa();
    if (x) {
      form.querySelector(`input[name=tipo][value=${x.tipo}]`).checked = true;
      $('camp-nome').value = x.nome;
      $('camp-objetivo').value = x.objetivo;
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
    const comum = { tipo, nome: $('camp-nome').value.trim(), objetivo: $('camp-objetivo').value.trim() };
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

  /* ---------- Encerrar e arrecadação ---------- */
  tbody.addEventListener('click', async (ev) => {
    const alvo = ev.target.closest('[data-ver], [data-editar], [data-encerrar], [data-arrecadado]');
    if (!alvo) return;
    const x = itens.find((i) => i.id === (alvo.dataset.ver || alvo.dataset.editar || alvo.dataset.encerrar || alvo.dataset.arrecadado));
    if (alvo.dataset.ver) verDados(x);
    if (alvo.dataset.editar) abrir(x);
    if (alvo.dataset.encerrar) {
      const extra = x.tipo === 'campanha' ? ' A arrecadação pode ser registrada depois.' : '';
      if (!confirm(`Encerrar "${x.nome}"? Sai do site agora e fica no histórico. Não dá para desfazer.${extra}`)) return;
      try {
        await Api.post(`/api/admin/eventos-campanhas/${x.id}/encerrar`);
        Utils.toast('Encerrado.');
      } catch (erro) { Utils.toast(erro.message, 'danger'); }
      carregar();
    }
    if (alvo.dataset.arrecadado) abrirArrecadacao(x);
  });

  /* ---------- Consultar dados (2026-11-11) ----------
     Só leitura, para ativos e encerrados. Encerrado não se edita, mas tudo continua consultável. */
  const quemQuando = (quem, quando) => (quando
    ? `${quem === 'sistema' ? 'automaticamente' : `por ${e(quem)}`} em ${Utils.formatDateTime(quando)}` : '—');
  const numero = (n) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

  function verDados(x) {
    const campanha = x.tipo === 'campanha';
    $('modal-ver-titulo').textContent = x.nome;
    $('ver-situacao').innerHTML = situacao(x);
    const linhas = [
      ['Tipo', campanha ? 'Campanha' : 'Evento'],
      ['Nome', e(x.nome)],
      campanha ? ['Período', periodo(x)] : ['Data', periodo(x)],
      ['Objetivo', Utils.paragrafos(x.objetivo)],
      ...(campanha ? [] : [['Do que o evento precisa', x.recursos ? Utils.paragrafos(x.recursos) : '—']]),
      ...(campanha ? [
        ['Meta em dinheiro', x.meta === null ? 'Sem meta' : Utils.formatCurrency(x.meta)],
        ...(x.meta === null ? [] : [['Valor arrecadado', `${x.arrecadado === null ? 'Não informado' : Utils.formatCurrency(x.arrecadado)}${x.arrecadadoEm ? ` <span class="cell-muted">(${quemQuando(x.arrecadadoPor, x.arrecadadoEm)})</span>` : ''}`]]),
      ] : []),
      ['Origem', x.externa ? `Proposta externa${x.protocoloOrigem ? ` — protocolo ${e(x.protocoloOrigem)}` : ''}` : 'Cadastrado pela equipe'],
      ['Cadastrado', quemQuando(x.criadoPor, x.criadoEm)],
      ['Última alteração', quemQuando(x.atualizadoPor, x.atualizadoEm)],
      ['Encerrado', quemQuando(x.encerradoPor, x.encerradoEm)],
    ];
    $('ver-dados').innerHTML = linhas.map(([r, v]) => `<dt>${e(r)}</dt><dd>${v || '—'}</dd>`).join('');

    $('ver-recursos-bloco').hidden = !campanha;
    if (campanha) {
      $('ver-recursos').innerHTML = x.recursos.map((r) => `
        <tr>
          <td>${e(r.descricao)}</td>
          <td>${r.tipo === 'dinheiro' ? 'Dinheiro' : 'Item'}</td>
          <td>${r.quantidade === null ? '<span class="cell-muted">Não informado</span>'
            : r.tipo === 'dinheiro' ? Utils.formatCurrency(r.quantidade) : `${numero(r.quantidade)} ${e(r.unidade)}`}</td>
          <td class="cell-muted">${r.arrecadadoEm ? quemQuando(r.arrecadadoPor, r.arrecadadoEm) : '—'}</td>
        </tr>`).join('') || '<tr><td colspan="4" class="cell-muted">Sem recursos cadastrados.</td></tr>';
    }

    const acoes = [];
    if (campanha) acoes.push(`<button type="button" class="btn btn-outline btn-sm" data-ver-arrecadado="${x.id}">Registrar arrecadação</button>`);
    if (campanha && x.status !== 'ativo') acoes.push(`<a class="btn btn-outline btn-sm" href="relatorio-campanha.html?id=${encodeURIComponent(x.id)}">Relatório</a>`);
    if (x.status === 'ativo') acoes.push(`<button type="button" class="btn btn-outline btn-sm" data-ver-editar="${x.id}">Editar</button>`);
    $('ver-acoes').innerHTML = acoes.join('');
    openModal('modal-ver');
  }

  $('ver-acoes').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-ver-arrecadado], [data-ver-editar]');
    if (!b) return;
    const x = itens.find((i) => i.id === (b.dataset.verArrecadado || b.dataset.verEditar));
    closeModal('modal-ver');
    if (b.dataset.verArrecadado) abrirArrecadacao(x);
    else abrir(x);
  });

  /* ---------- Arrecadação por recurso (2026-11-11) ----------
     Item: quantidade + unidade (lista ou outra). Dinheiro: valor em R$. Em branco = não contado. */
  const listaArrecadacao = $('lista-arrecadacao');

  function linhaArrecadacao(r, i) {
    const n = i + 1;
    const qtd = r.quantidade === null ? '' : String(r.quantidade).replace('.', ',');
    const quem = r.arrecadadoEm
      ? `<p class="form-hint">Informado por ${e(r.arrecadadoPor)} em ${Utils.formatDateTime(r.arrecadadoEm)}</p>` : '';
    // Cada recurso: o nome em cima e os campos lado a lado embaixo (2026-11-11).
    if (r.tipo === 'dinheiro') {
      return `
        <div class="arrecadacao-linha" data-id="${e(r.id)}">
          <p class="arrecadacao-nome">${e(r.descricao)} <span class="badge badge-neutral">Dinheiro</span></p>
          <div class="arrecadacao-campos">
            <div class="form-group">
              <label for="arr-qtd-${n}">Valor (R$)</label>
              <input type="text" id="arr-qtd-${n}" class="arr-qtd" inputmode="decimal" value="${e(qtd)}" placeholder="Não contado">
            </div>
          </div>
          ${quem}
        </div>`;
    }
    const outra = Boolean(r.unidade) && !UNIDADES.includes(r.unidade);
    const opcoes = UNIDADES.map((u) => `<option value="${u}"${r.unidade === u ? ' selected' : ''}>${u}</option>`).join('');
    return `
      <div class="arrecadacao-linha" data-id="${e(r.id)}">
        <p class="arrecadacao-nome">${e(r.descricao)}</p>
        <div class="arrecadacao-campos">
          <div class="form-group">
            <label for="arr-qtd-${n}">Quantidade</label>
            <input type="text" id="arr-qtd-${n}" class="arr-qtd" inputmode="decimal" value="${e(qtd)}" placeholder="Não contado">
          </div>
          <div class="form-group">
            <label for="arr-un-${n}">Unidade</label>
            <select id="arr-un-${n}" class="arr-un">
              <option value="">Escolha…</option>${opcoes}<option value="outra"${outra ? ' selected' : ''}>Outra…</option>
            </select>
          </div>
          <div class="form-group arr-outra-grupo"${outra ? '' : ' hidden'}>
            <label for="arr-outra-${n}">Qual unidade?</label>
            <input type="text" id="arr-outra-${n}" class="arr-outra" maxlength="40" value="${outra ? e(r.unidade) : ''}" placeholder="ex.: sacos de 5 kg">
          </div>
        </div>
        ${quem}
      </div>`;
  }

  listaArrecadacao.addEventListener('change', (ev) => {
    if (!ev.target.classList.contains('arr-un')) return;
    const grupo = ev.target.closest('.arrecadacao-linha').querySelector('.arr-outra-grupo');
    grupo.hidden = ev.target.value !== 'outra';
    if (!grupo.hidden) grupo.querySelector('input').focus();
  });

  function abrirArrecadacao(x) {
    editando = x;
    const f = $('form-arrecadado');
    f.reset();
    Utils.clearAllErrors(f);
    const quando = x.status === 'ativo' ? 'em andamento' : 'encerrada';
    $('arrecadado-resumo').textContent = x.meta === null
      ? `${x.nome} — campanha ${quando}.`
      : `${x.nome} — campanha ${quando}, meta de ${Utils.formatCurrency(x.meta)}.`;
    $('grupo-arrecadado-valor').hidden = x.meta === null;
    $('arrecadado-valor').value = x.arrecadado === null ? '' : String(x.arrecadado).replace('.', ',');
    listaArrecadacao.innerHTML = x.recursos.map(linhaArrecadacao).join('')
      || '<p class="cell-muted">Esta campanha não tem recursos cadastrados.</p>';
    openModal('modal-arrecadado');
    (x.meta === null ? listaArrecadacao.querySelector('input') : $('arrecadado-valor'))?.focus();
  }

  $('form-arrecadado').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = ev.currentTarget;
    Utils.clearAllErrors(f);
    const corpo = {
      recursos: [...listaArrecadacao.querySelectorAll('.arrecadacao-linha')].map((l) => {
        const un = l.querySelector('.arr-un');
        return {
          id: l.dataset.id,
          quantidade: l.querySelector('.arr-qtd').value.trim(),
          unidade: !un ? null : un.value === 'outra' ? l.querySelector('.arr-outra').value.trim() : un.value,
        };
      }),
    };
    if (editando.meta !== null) corpo.valor = $('arrecadado-valor').value.trim();
    const botao = f.querySelector('[type=submit]');
    botao.disabled = true;
    try {
      await Api.put(`/api/admin/campanhas/${editando.id}/arrecadado`, corpo, { form: f });
      closeModal('modal-arrecadado');
      Utils.toast('Arrecadação registrada.');
      carregar();
    } catch (erro) {
      if (!erro.campos.length) Utils.toast(erro.message, 'danger');
    } finally { botao.disabled = false; }
  });

  carregar();
});
