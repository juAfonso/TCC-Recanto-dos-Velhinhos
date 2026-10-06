/* Itens necessários no Painel (US3, FR-026 a FR-028).
   Prioridade alta/média/baixa (2026-10-05); dar baixa tira do Portal sem apagar. */
document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('itens-tbody');
  const buscaInput = document.getElementById('busca-item');
  const form = document.getElementById('form-item');
  const $ = (id) => document.getElementById(id);
  const e = (t) => Utils.escapeHtml(t);
  let itens = [];
  let espera;

  const quantidade = (n) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

  function linha(i) {
    const p = Utils.prioridade(i.prioridade);
    const alerta = i.semAtualizacao
      ? '<span class="cell-flag" title="Quantidade sem atualização há muitos dias" aria-label="Sem atualização recente">●</span> ' : '';
    const situacao = i.status === 'ativo'
      ? '<span class="badge badge-success">No site</span>'
      : `<span class="badge badge-neutral">Suprido</span><div class="cell-muted" style="font-size:.75rem;">baixa em ${Utils.formatDate(i.baixaEm)}</div>`;
    const acoes = i.status === 'ativo'
      ? `<button class="btn btn-outline btn-sm" data-editar="${i.id}">Editar</button>
         <button class="btn btn-danger-outline btn-sm" data-baixa="${i.id}">Dar baixa</button>`
      : '<span class="cell-muted">Histórico</span>';
    return `
      <tr>
        <td>${alerta}${e(i.nome)}</td>
        <td>${quantidade(i.quantidade)} ${e(i.unidade)}</td>
        <td><span class="badge ${p.cls}">${p.rotulo.replace('Prioridade ', '')}</span></td>
        <td>${situacao}</td>
        <td class="cell-muted">${Utils.formatDate(i.quantidadeAtualizadaEm)}</td>
        <td><div class="row-actions">${acoes}</div></td>
      </tr>`;
  }

  async function carregar() {
    try {
      const r = await Api.get(`/api/admin/itens?busca=${encodeURIComponent(buscaInput.value.trim())}`);
      itens = r.itens;
      $('dias-sem-atualizacao').textContent = r.diasSemAtualizacao;
      tbody.innerHTML = itens.map(linha).join('')
        || '<tr><td colspan="6"><div class="empty-state"><span class="icon" aria-hidden="true">📦</span><p>Nenhum item encontrado.</p></div></td></tr>';
    } catch (erro) {
      tbody.innerHTML = `<tr><td colspan="6">${e(erro.message)}</td></tr>`;
    }
  }

  buscaInput.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(carregar, 300); });

  function abrir(item) {
    form.reset();
    Utils.clearAllErrors(form);
    $('modal-item-titulo').textContent = item ? 'Editar item necessário' : 'Novo item necessário';
    $('item-id').value = item ? item.id : '';
    if (item) {
      $('item-nome').value = item.nome;
      $('item-quantidade').value = String(item.quantidade).replace('.', ',');
      $('item-unidade').value = item.unidade;
      $('item-prioridade').value = item.prioridade;
    }
    openModal('modal-item');
    $('item-nome').focus();
  }
  $('btn-novo-item').addEventListener('click', () => abrir(null));

  tbody.addEventListener('click', async (ev) => {
    const editar = ev.target.closest('[data-editar]');
    const baixa = ev.target.closest('[data-baixa]');
    if (editar) abrir(itens.find((i) => i.id === editar.dataset.editar));
    if (baixa) {
      const item = itens.find((i) => i.id === baixa.dataset.baixa);
      if (!confirm(`Dar baixa em "${item.nome}"? Ele sai do site, mas continua no histórico do Painel.`)) return;
      try {
        await Api.post(`/api/admin/itens/${item.id}/baixa`);
        Utils.toast(`"${item.nome}" foi marcado como suprido.`);
      } catch (erro) { Utils.toast(erro.message, 'danger'); }
      carregar();
    }
  });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    Utils.clearAllErrors(form);
    const id = $('item-id').value;
    const corpo = {
      nome: $('item-nome').value.trim(),
      quantidade: $('item-quantidade').value.trim(),
      unidade: $('item-unidade').value.trim(),
      prioridade: $('item-prioridade').value,
    };
    const botao = form.querySelector('[type=submit]');
    botao.disabled = true;
    try {
      if (id) await Api.put(`/api/admin/itens/${id}`, corpo, { form });
      else await Api.post('/api/admin/itens', corpo, { form });
      closeModal('modal-item');
      Utils.toast(id ? 'Item atualizado.' : 'Item cadastrado e publicado no site.');
      carregar();
    } catch (erro) {
      if (!erro.campos.length) Utils.toast(erro.message, 'danger');
    } finally {
      botao.disabled = false;
    }
  });

  carregar();
});
