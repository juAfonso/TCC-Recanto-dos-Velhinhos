/* Autorização do responsável para o voluntário menor (FR-012, research D17).
   Dados do sessionStorage desta aba (ver impressao-voluntario.js). */
(function () {
  const dados = ImpressaoVoluntario.ler();

  document.addEventListener('DOMContentLoaded', () => {
    const $ = (id) => document.getElementById(id);
    if (!dados) {
      $('sem-dados').hidden = false;
      $('btn-imprimir').hidden = true;
      return;
    }
    $('t-protocolo').textContent = dados.protocolo || '';
    $('t-dados').innerHTML = ImpressaoVoluntario.dadosHtml(dados, { completo: false })
      + `<dt>Tipo de serviço</dt><dd>${Utils.escapeHtml(ImpressaoVoluntario.servico(dados) || '—')}</dd>`
      + `<dt>Dias e horários</dt><dd>${Utils.escapeHtml(dados.condicoes || '—')}</dd>`;
    $('conteudo').hidden = false;
    $('btn-imprimir').addEventListener('click', () => window.print());
  });
})();
