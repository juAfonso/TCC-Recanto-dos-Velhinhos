/* Página institucional (US1, FR-001): texto editável pela equipe no Painel (FR-001a).
   Seção sem texto fica escondida; toda imagem leva o texto alternativo cadastrado. */
document.addEventListener('DOMContentLoaded', () => {
  const mostrar = (secaoId, alvoId, texto) => {
    const secao = document.getElementById(secaoId);
    const alvo = document.getElementById(alvoId);
    if (!alvo || !texto || !texto.trim()) return;
    alvo.innerHTML = Utils.paragrafos(texto, ' style="margin-bottom:16px;"');
    alvo.hidden = false;
    if (secao) secao.hidden = false;
  };

  Api.get('/api/public/institucional')
    .then((c) => {
      mostrar('sec-historia', 'inst-historia', c.historia);
      mostrar('sec-missao', 'inst-missao', c.missao);
      mostrar(null, 'inst-equipe', c.equipe);

      const imagens = (c.imagens || []).filter((img) => /^https:\/\//.test(img.url));
      if (imagens.length) {
        document.getElementById('inst-imagens').innerHTML = imagens.map((img) => `
          <img src="${Utils.escapeHtml(img.url)}" alt="${Utils.escapeHtml(img.alt)}" loading="lazy"
               style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--radius-lg);">`).join('');
        document.getElementById('sec-imagens').hidden = false;
      }
    })
    .catch(() => {
      const historia = document.getElementById('inst-historia');
      historia.innerHTML = '<p>Não foi possível carregar agora. Recarregue a página em alguns instantes.</p>';
      document.getElementById('sec-historia').hidden = false;
    });
});
