/* =========================================================
   mostrar-senha.js — botão "Mostrar senha" em todo campo de senha

   O olho do próprio navegador (Edge) some depois que o campo perde
   o foco, e nem todo navegador tem um. Este botão funciona sempre
   e é anunciado ao leitor de tela (Princípio II).
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input[type="password"]').forEach((campo) => {
    if (campo.dataset.mostrarSenha) return;
    campo.dataset.mostrarSenha = '1';

    const caixa = document.createElement('div');
    caixa.style.cssText = 'position:relative;';
    campo.parentNode.insertBefore(caixa, campo);
    caixa.appendChild(campo);
    campo.style.paddingRight = '92px';

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.textContent = 'Mostrar';
    botao.setAttribute('aria-pressed', 'false');
    botao.setAttribute('aria-label', 'Mostrar senha');
    botao.className = 'link-btn';
    botao.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:.8rem;font-weight:700;padding:4px 8px;';

    botao.addEventListener('click', () => {
      const mostrando = campo.type === 'text';
      campo.type = mostrando ? 'password' : 'text';
      botao.textContent = mostrando ? 'Mostrar' : 'Ocultar';
      botao.setAttribute('aria-pressed', String(!mostrando));
      botao.setAttribute('aria-label', mostrando ? 'Mostrar senha' : 'Ocultar senha');
      campo.focus();
    });
    caixa.appendChild(botao);
  });
});
