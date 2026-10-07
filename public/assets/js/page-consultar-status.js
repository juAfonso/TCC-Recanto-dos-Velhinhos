/* Consultar status pelo protocolo (US10 — FR-044, FR-044a): mostra só tipo, situação e data
   do envio. Doação não tem protocolo (2026-10-04). Protocolo inexistente e mal formado recebem
   a mesma resposta do servidor; a tela também não diferencia. */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-consulta');
  const resultado = document.getElementById('resultado');
  if (!form) return;
  const e = (t) => Utils.escapeHtml(t);

  const TIPOS = {
    voluntario: 'Cadastro de voluntário',
    candidatura: 'Candidatura a vaga',
    solicitacao_externa: 'Solicitação de evento ou campanha',
  };
  // Cor do selo pela situação: em andamento, positivo ou encerrado.
  const SELO = {
    pendente: 'badge-warning', em_analise: 'badge-warning', entrevista: 'badge-info', aguardando_contato: 'badge-info',
    aprovado: 'badge-success', aprovada: 'badge-success', confirmada: 'badge-success',
    rejeitado: 'badge-neutral', rejeitada: 'badge-neutral', encerrado_titular: 'badge-neutral', encerrada_titular: 'badge-neutral',
  };

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    Utils.clearAllErrors(form);
    const input = document.getElementById('protocolo-input');
    const protocolo = input.value.trim().toUpperCase().replace(/\s+/g, '');
    if (!protocolo) {
      Utils.setFieldError(input.closest('.form-group'), 'Informe o código de protocolo.');
      input.focus();
      return;
    }

    const botao = form.querySelector('[type="submit"]');
    botao.disabled = true;
    resultado.innerHTML = '<p class="cell-muted" style="text-align:center;">Consultando…</p>';
    try {
      const r = await Api.get(`/api/public/status/${encodeURIComponent(protocolo)}`);
      resultado.innerHTML = `
        <div class="form-shell narrow">
          <div style="text-align:center;margin-bottom:20px;">
            <h3>${e(TIPOS[r.tipo] || r.tipo)}</h3>
            <p class="cell-muted">Protocolo ${e(protocolo)}</p>
          </div>
          <div class="info-grid">
            <div class="info-field"><div class="info-label">Situação atual</div><div class="info-value"><span class="badge ${SELO[r.status] || 'badge-info'}">${e(r.rotuloStatus)}</span></div></div>
            <div class="info-field"><div class="info-label">Enviado em</div><div class="info-value">${Utils.formatDay(r.data)}</div></div>
          </div>
          <p class="form-hint" style="margin-top:14px;">Os detalhes de cada etapa chegam por e-mail. Se o e-mail não chegar, confira a caixa de spam ou fale com a secretaria do Recanto.</p>
        </div>`;
    } catch (erro) {
      const texto = erro.status === 404 || erro.status === 429 ? erro.message : 'Não foi possível consultar agora. Tente de novo em alguns minutos.';
      resultado.innerHTML = `
        <div class="alert alert-warning" role="alert"><span aria-hidden="true">🔍</span><div>${e(texto)}</div></div>`;
    } finally {
      botao.disabled = false;
    }
  });
});
