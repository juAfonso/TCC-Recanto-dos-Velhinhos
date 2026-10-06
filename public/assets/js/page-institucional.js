/* Página institucional (US1, FR-001): texto editável pela equipe no Painel (FR-001a).
   Seção sem texto fica escondida; toda imagem leva o texto alternativo cadastrado.
   Em cada bloco (separado por linha em branco), uma primeira linha curta, sem ponto
   final, vira título — é assim que "Missão", "Visão" e "Valores" aparecem destacados. */
document.addEventListener('DOMContentLoaded', () => {
  const e = (t) => Utils.escapeHtml(t);

  function blocos(texto) {
    return String(texto || '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean).map((b) => {
      const [primeira, ...resto] = b.split('\n');
      const ehTitulo = resto.length && primeira.length <= 40 && !/[.!?:;]$/.test(primeira.trim());
      return ehTitulo
        ? { titulo: primeira.trim(), corpo: resto.join('\n').trim() }
        : { titulo: null, corpo: b };
    });
  }

  const paragrafo = (t) => `<p style="margin-bottom:16px;">${e(t).replace(/\n/g, '<br>')}</p>`;

  // Seções de texto corrido.
  function texto(secaoId, alvoId, conteudo) {
    const alvo = document.getElementById(alvoId);
    const lista = blocos(conteudo);
    if (!alvo || !lista.length) return;
    alvo.innerHTML = lista.map((b) => (b.titulo ? `<h3 style="margin:8px 0;">${e(b.titulo)}</h3>` : '') + paragrafo(b.corpo)).join('');
    alvo.hidden = false;
    if (secaoId) document.getElementById(secaoId).hidden = false;
  }

  // Missão, visão e valores: um cartão por bloco, como no protótipo.
  function cartoes(secaoId, alvoId, conteudo) {
    const alvo = document.getElementById(alvoId);
    const lista = blocos(conteudo);
    if (!alvo || !lista.length) return;
    alvo.innerHTML = lista.map((b) => `
      <div class="card">
        ${b.titulo ? `<h3>${e(b.titulo)}</h3>` : ''}
        <p>${e(b.corpo).replace(/\n/g, '<br>')}</p>
      </div>`).join('');
    document.getElementById(secaoId).hidden = false;
  }

  Api.get('/api/public/institucional')
    .then((c) => {
      texto('sec-historia', 'inst-historia', c.historia);
      cartoes('sec-missao', 'inst-missao', c.missao);
      texto(null, 'inst-equipe', c.equipe);
      texto('sec-acolhimento', 'inst-acolhimento', c.acolhimento);
      texto('sec-bazar', 'inst-bazar', c.bazar);

      const imagens = (c.imagens || []).filter((img) => /^https:\/\//.test(img.url));
      if (imagens.length) {
        document.getElementById('inst-imagens').innerHTML = imagens.map((img) => `
          <img src="${e(img.url)}" alt="${e(img.alt)}" loading="lazy"
               style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--radius-lg);">`).join('');
        document.getElementById('sec-imagens').hidden = false;
      }
    })
    .catch(() => {
      document.getElementById('inst-historia').innerHTML =
        '<p>Não foi possível carregar agora. Recarregue a página em alguns instantes.</p>';
      document.getElementById('sec-historia').hidden = false;
    });
});
