/* Termo de adesão ao serviço voluntário (Lei 9.608/1998), pronto para imprimir (2026-10-06).
   Vale para todo voluntário; no menor, ganha a linha de assinatura do responsável. */
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
    $('t-dados').innerHTML = ImpressaoVoluntario.dadosHtml(dados);
    $('t-servico').textContent = ImpressaoVoluntario.servico(dados) || '—';
    $('t-condicoes').textContent = dados.condicoes || '—';
    // Informado pelo servidor (resposta do envio ou dados do Painel), nunca calculado aqui.
    const menor = dados.menorDeIdade === true;
    $('t-aviso-menor').hidden = !menor;
    $('t-assinatura-responsavel').hidden = !menor;
    $('conteudo').hidden = false;
    $('btn-imprimir').addEventListener('click', () => window.print());
  });
})();
