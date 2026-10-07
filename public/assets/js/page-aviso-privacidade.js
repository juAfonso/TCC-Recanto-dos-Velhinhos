/* Aviso de privacidade público (US11, FR-053): texto e versão vigentes, sem login,
   e o contato para o titular exercer seus direitos (FR-054). */
document.addEventListener('DOMContentLoaded', async () => {
  const caixa = document.getElementById('aviso');
  try {
    const aviso = await Api.get('/api/public/aviso-privacidade');
    caixa.innerHTML = `
      <p class="form-hint" style="margin-bottom:14px;">Versão ${Utils.escapeHtml(aviso.versao)}, publicada em ${Utils.formatDate(aviso.publicadoEm)}.</p>
      <div class="texto-aviso">${Utils.paragrafos(aviso.texto)}</div>`;
    document.getElementById('aviso-contato').textContent = aviso.contato || '';
  } catch (erro) {
    caixa.innerHTML = `<p>${Utils.escapeHtml(erro.message)}</p>`;
  }
});
