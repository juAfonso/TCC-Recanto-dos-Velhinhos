/* Mapa da seção de contato (2026-11-11).
   O cartão é um desenho do próprio site que leva ao Google Maps numa nova aba. O mapa do
   Google só é carregado na página se a pessoa clicar em "Mostrar o mapa aqui": até lá,
   nenhum pedido vai ao Google, como já acontece com as letras do site (LGPD). */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.contato-mapa').forEach((bloco) => {
    const endereco = bloco.dataset.endereco;
    const busca = encodeURIComponent(endereco);
    bloco.querySelector('.mapa-previa').href = `https://www.google.com/maps/search/?api=1&query=${busca}`;
    const botao = bloco.querySelector('[data-mostrar-mapa]');
    botao.addEventListener('click', () => {
      const quadro = document.createElement('iframe');
      quadro.className = 'mapa-quadro';
      quadro.src = `https://www.google.com/maps?q=${busca}&output=embed`;
      quadro.title = `Mapa do Google com a localização do Recanto: ${endereco}`;
      quadro.loading = 'lazy';
      quadro.referrerPolicy = 'no-referrer';
      bloco.querySelector('.mapa-previa').replaceWith(quadro);
      botao.remove();
      bloco.querySelector('.mapa-aviso').remove();
      quadro.focus();
    });
  });
});
