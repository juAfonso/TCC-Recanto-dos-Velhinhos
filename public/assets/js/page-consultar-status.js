document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-consulta');
  const resultado = document.getElementById('resultado');
  if (!form) return;

  const TIPOS = {
    voluntarios: { label: 'Cadastro de Voluntário', icon: '🤝' },
    candidaturas: { label: 'Candidatura a Vaga', icon: '💼' },
    solicitacoesExternas: { label: 'Solicitação de Evento/Campanha', icon: '📅' }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    Utils.clearAllErrors(form);

    const input = document.getElementById('protocolo-input');
    const protocolo = input.value.trim().toUpperCase();

    if (!protocolo) {
      Utils.setFieldError(input.closest('.form-group'), 'Informe o código de protocolo.');
      return;
    }

    const db = DB.load();
    let achado = null;
    let categoria = null;

    for (const key of Object.keys(TIPOS)) {
      const item = db[key].find(r => r.protocolo === protocolo);
      if (item) { achado = item; categoria = key; break; }
    }

    if (!achado) {
      // FR-044: não revela dados de outras submissões, apenas informa que não encontrou
      resultado.innerHTML = `
        <div class="alert alert-warning">
          <span>🔍</span>
          <div><strong>Nenhum registro encontrado</strong>Verifique se o código de protocolo foi digitado corretamente, sem espaços extras.</div>
        </div>`;
      return;
    }

    const info = TIPOS[categoria];
    let extra = '';
    if (achado.status === 'rejeitado' || achado.status === 'rejeitada') {
      extra = achado.motivo ? `<div class="info-field" style="grid-column:1/-1;"><div class="info-label">Motivo</div><div class="info-value">${achado.motivo}</div></div>` : '';
    }

    resultado.innerHTML = `
      <div class="form-shell narrow">
        <div style="text-align:center;margin-bottom:20px;">
          <span style="font-size:2rem;">${info.icon}</span>
          <h3 style="margin-top:8px;">${info.label}</h3>
          <p class="cell-muted">Protocolo ${achado.protocolo}</p>
        </div>
        <div class="info-grid">
          <div class="info-field"><div class="info-label">Status atual</div><div class="info-value">${Utils.statusBadge(achado.status)}</div></div>
          <div class="info-field"><div class="info-label">Data de envio</div><div class="info-value">${Utils.formatDate(achado.criadoEm)}</div></div>
          ${extra}
        </div>
      </div>`;
  });
});
