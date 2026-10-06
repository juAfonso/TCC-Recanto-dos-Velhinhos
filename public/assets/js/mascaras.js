/* =========================================================
   mascaras.js — máscaras de digitação (FR-037a)

   Basta pôr o atributo no campo:
     <input data-mascara="telefone">   (24) 99999-9999 ou (24) 3016-4023
     <input data-mascara="cpf">        000.000.000-00
     <input data-mascara="cep">        00000-000
   A máscara é só ajuda visual: o servidor valida de novo e guarda só os números.
   ========================================================= */

(function () {
  const digitos = (v) => (v || '').replace(/\D/g, '');

  const MASCARAS = {
    telefone(v) {
      const d = digitos(v).slice(0, 11);
      if (d.length <= 2) return d.length ? `(${d}` : '';
      if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    },
    cpf(v) {
      const d = digitos(v).slice(0, 11);
      return d
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
    },
    cep(v) {
      const d = digitos(v).slice(0, 8);
      return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
    },
  };

  const TECLADO = { telefone: 'tel', cpf: 'numeric', cep: 'numeric' };

  function aplicar(campo) {
    const tipo = campo.dataset.mascara;
    const mascara = MASCARAS[tipo];
    if (!mascara || campo.dataset.mascaraAtiva) return;
    campo.dataset.mascaraAtiva = '1';
    if (!campo.getAttribute('inputmode')) campo.setAttribute('inputmode', TECLADO[tipo]);
    campo.addEventListener('input', () => { campo.value = mascara(campo.value); });
    if (campo.value) campo.value = mascara(campo.value);
  }

  window.Mascaras = {
    aplicarEm(raiz = document) { raiz.querySelectorAll('[data-mascara]').forEach(aplicar); },
    soDigitos: digitos,
  };

  document.addEventListener('DOMContentLoaded', () => window.Mascaras.aplicarEm());
})();
