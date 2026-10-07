/* Conferência de doações (US2, FR-008, FR-008a, FR-050, FR-061).
   A equipe confere cada declaração no extrato do banco e confirma ou marca como não localizada.
   Nada aqui edita valor, tipo, data ou doador (FR-037, exceção de 2026-10-06). */
document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('doacoes-tbody');
  const e = (t) => Utils.escapeHtml(t);
  let filtro = 'pendente';
  let doacoes = [];

  const SITUACAO = {
    pendente: '<span class="badge badge-warning">Pendente</span>',
    confirmada: '<span class="badge badge-success">Confirmada</span>',
    nao_localizada: '<span class="badge badge-neutral">Não localizada</span>',
  };

  function renderStats(resumo) {
    // Só Pix declarado no site e confirmado: não é a arrecadação da instituição (FR-060a).
    document.getElementById('doacoes-stats').innerHTML = `
      <div class="stat-card ${resumo.pendentes ? 'alert-card' : ''}">
        <span class="stat-label">Aguardando conferência</span>
        <span class="stat-value">${resumo.pendentes}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Doações confirmadas</span>
        <span class="stat-value">${resumo.confirmadas}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Pix declarado no site e confirmado</span>
        <span class="stat-value">${Utils.formatCurrency(resumo.totalConfirmado)}</span>
        <span class="form-hint">Não é a arrecadação do Recanto: não inclui o que é pago na sede, em dinheiro ou por depósito.</span>
      </div>`;
  }

  function linha(d) {
    const doador = d.tipo === 'associativa' ? e(d.doador || '—') : '<span class="cell-muted">Anônimo (espontânea)</span>';
    const duplicata = d.possivelDuplicata
      ? ' <span class="badge badge-danger" title="Outra pendente com o mesmo valor a até 30 minutos">Possível duplicata</span>' : '';
    const conferencia = d.status !== 'pendente'
      ? `<div class="cell-muted" style="font-size:.78rem;">por ${e(d.conferidoPor)} em ${Utils.formatDateTime(d.conferidoEm)}${d.motivoNaoLocalizada ? `<br>Motivo: ${e(d.motivoNaoLocalizada)}` : ''}</div>` : '';
    const acoes = d.status === 'pendente'
      ? `<button class="btn btn-viridian btn-sm" data-confirmar="${d.id}">Confirmar</button>
         <button class="btn btn-outline btn-sm" data-nao-localizar="${d.id}">Não localizada</button>` : '';
    return `
      <tr>
        <td>${Utils.formatDateTime(d.declaradaEm)}</td>
        <td>${d.tipo === 'espontanea' ? 'Espontânea' : 'Associativa'}</td>
        <td>${doador}</td>
        <td><strong>${Utils.formatCurrency(d.valor)}</strong></td>
        <td>${SITUACAO[d.status]}${duplicata}${conferencia}</td>
        <td style="white-space:nowrap;">${acoes}</td>
      </tr>`;
  }

  async function carregar() {
    tbody.innerHTML = '<tr><td colspan="6" class="cell-muted">Carregando…</td></tr>';
    try {
      const r = await Api.get(`/api/admin/doacoes?status=${filtro}`);
      doacoes = r.doacoes;
      renderStats(r.resumo);
      tbody.innerHTML = doacoes.map(linha).join('')
        || `<tr><td colspan="6"><div class="empty-state"><p>${filtro === 'pendente' ? 'Nenhuma doação aguardando conferência.' : 'Nenhuma doação nesta lista.'}</p></div></td></tr>`;
    } catch (erro) {
      tbody.innerHTML = `<tr><td colspan="6">${e(erro.message)}</td></tr>`;
    }
  }

  const resumoDe = (id) => {
    const d = doacoes.find((x) => x.id === id);
    return d ? `${Utils.formatCurrency(d.valor)} — clique em ${Utils.formatDateTime(d.declaradaEm)}` : '';
  };

  tbody.addEventListener('click', async (ev) => {
    const confirmar = ev.target.closest('[data-confirmar]');
    const naoLocalizar = ev.target.closest('[data-nao-localizar]');
    if (confirmar) {
      const id = confirmar.dataset.confirmar;
      if (!confirm(`Confirmar a doação de ${resumoDe(id)}?\n\nSó confirme se encontrou a entrada PIX no extrato.`)) return;
      confirmar.disabled = true;
      try {
        await Api.post(`/api/admin/doacoes/${id}/confirmar`);
        Utils.toast('Doação confirmada.');
      } catch (erro) {
        Utils.toast(erro.message, erro.codigo === 'DOACAO_JA_CONFERIDA' ? 'warning' : 'danger');
      }
      carregar();
    }
    if (naoLocalizar) abrirNaoLocalizada(naoLocalizar.dataset.naoLocalizar);
  });

  /* Não localizada: motivo opcional, com a opção pronta do FR-008a */
  const formNL = document.getElementById('form-nao-localizada');
  let idNaoLocalizar = null;
  function abrirNaoLocalizada(id) {
    idNaoLocalizar = id;
    formNL.reset();
    document.getElementById('grupo-motivo-livre').style.display = 'none';
    document.getElementById('modal-nl-resumo').textContent = `Doação de ${resumoDe(id)}.`;
    openModal('modal-nao-localizada');
    formNL.querySelector('input[name=motivoTipo]').focus();
  }
  formNL.querySelectorAll('input[name=motivoTipo]').forEach((r) => r.addEventListener('change', () => {
    document.getElementById('grupo-motivo-livre').style.display = formNL.motivoTipo.value === 'livre' ? 'block' : 'none';
  }));
  formNL.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const tipo = formNL.motivoTipo.value;
    const corpo = tipo === 'padrao' ? { motivoPadrao: true }
      : tipo === 'livre' ? { motivo: document.getElementById('motivo-livre').value.trim() } : {};
    const botao = formNL.querySelector('[type=submit]');
    botao.disabled = true;
    try {
      await Api.post(`/api/admin/doacoes/${idNaoLocalizar}/nao-localizar`, corpo);
      closeModal('modal-nao-localizada');
      Utils.toast('Doação marcada como não localizada.');
    } catch (erro) {
      Utils.toast(erro.message, 'danger');
    } finally {
      botao.disabled = false;
      carregar();
    }
  });

  document.querySelectorAll('.tabs-nav .tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabs-nav .tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      filtro = btn.dataset.filtro;
      carregar();
    });
  });

  carregar();
});
