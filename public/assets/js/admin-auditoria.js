/* Registros e e-mails (US7): falhas de envio com reenvio/tratada (FR-049a) e histórico de
   auditoria, mais recentes primeiro, paginado (FR-035). A auditoria é só leitura. */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const e = (t) => Utils.escapeHtml(t);
  const MODELO = {
    confirmacao_submissao: 'Confirmação de envio',
    entrevista: 'Chamado para entrevista',
    solicitacao_aguardando_contato: 'Solicitação aprovada',
    aprovado: 'Resultado: aprovado',
    nao_aprovado: 'Resultado: não aprovado',
    definir_senha: 'Link para criar senha',
    redefinir_senha: 'Link para trocar senha',
  };
  const telFmt = (t) => (t || '').replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');

  /* ---------- Falhas de e-mail ---------- */
  async function carregarFalhas() {
    const tbody = $('falhas-tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="cell-muted">Carregando…</td></tr>';
    try {
      const r = await Api.get(`/api/admin/falhas-email?situacao=${$('falhas-todas').checked ? 'todas' : 'pendentes'}`);
      tbody.innerHTML = r.falhas.map((f) => `
        <tr>
          <td class="cell-muted">${Utils.formatDateTime(f.falhouEm)}</td>
          <td>${e(f.destinatario)}</td>
          <td>${e(MODELO[f.modelo] || f.modelo)}</td>
          <td class="cell-muted">${e(f.protocolo || '—')}</td>
          <td class="cell-muted">${telFmt(f.telefone) || '—'}</td>
          <td>${f.tratadaEm
            ? `<span class="cell-muted" style="font-size:.85rem;">Resolvido por ${e(f.tratadaPor)} em ${Utils.formatDateTime(f.tratadaEm)}</span>`
            : `<div class="row-actions">
                ${f.podeReenviar ? `<button class="btn btn-outline btn-sm" data-reenviar="${f.id}">Reenviar</button>` : ''}
                <button class="btn btn-outline btn-sm" data-tratada="${f.id}">Já resolvi</button>
              </div>`}</td>
        </tr>`).join('')
        || '<tr><td colspan="6"><div class="empty-state"><span class="icon" aria-hidden="true">✅</span><p>Nenhum e-mail pendente.</p></div></td></tr>';
    } catch (erro) {
      tbody.innerHTML = `<tr><td colspan="6">${e(erro.message)}</td></tr>`;
    }
  }

  $('falhas-todas').addEventListener('change', carregarFalhas);
  $('falhas-tbody').addEventListener('click', async (ev) => {
    const re = ev.target.closest('[data-reenviar]');
    const tr = ev.target.closest('[data-tratada]');
    try {
      if (re) {
        re.disabled = true;
        re.textContent = 'Enviando…';
        const r = await Api.post(`/api/admin/falhas-email/${re.dataset.reenviar}/reenviar`);
        Utils.toast(r.enviado ? 'E-mail reenviado.' : 'O reenvio também falhou. Tente ligar para a pessoa.', r.enviado ? 'success' : 'warning');
      }
      if (tr) {
        if (!confirm('Marcar como resolvido? Use quando já tiver avisado a pessoa por outro meio.')) return;
        await Api.post(`/api/admin/falhas-email/${tr.dataset.tratada}/tratada`);
        Utils.toast('Marcado como resolvido.');
      }
    } catch (erro) {
      Utils.toast(erro.message, 'danger');
    }
    if (re || tr) { carregarFalhas(); carregarAuditoria(); }
  });

  /* ---------- Auditoria ---------- */
  let pagina = 1;
  async function carregarAuditoria() {
    const tbody = $('auditoria-tbody');
    tbody.innerHTML = '<tr><td colspan="3" class="cell-muted">Carregando…</td></tr>';
    try {
      const r = await Api.get(`/api/admin/auditoria?pagina=${pagina}&acao=${encodeURIComponent($('filtro-acao').value)}`);
      tbody.innerHTML = r.registros.map((a) => `
        <tr>
          <td class="cell-muted" style="white-space:nowrap;">${Utils.formatDateTime(a.ocorridoEm)}</td>
          <td>${e(AcoesAuditoria.nome(a.acao))}</td>
          <td class="cell-muted">${e(AcoesAuditoria.autor(a))}</td>
        </tr>`).join('')
        || '<tr><td colspan="3" class="cell-muted">Nenhum registro.</td></tr>';
      $('pag-atual').textContent = `Página ${r.pagina}`;
      $('pag-anterior').disabled = r.pagina <= 1;
      $('pag-proxima').disabled = !r.temMais;
    } catch (erro) {
      tbody.innerHTML = `<tr><td colspan="3">${e(erro.message)}</td></tr>`;
    }
  }

  $('filtro-acao').addEventListener('change', () => { pagina = 1; carregarAuditoria(); });
  $('pag-anterior').addEventListener('click', () => { pagina = Math.max(1, pagina - 1); carregarAuditoria(); });
  $('pag-proxima').addEventListener('click', () => { pagina += 1; carregarAuditoria(); });

  carregarFalhas();
  carregarAuditoria();
});
