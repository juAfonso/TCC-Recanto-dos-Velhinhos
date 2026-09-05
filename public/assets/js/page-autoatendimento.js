document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.requireAutoatendimento();
  if (!session) return; // redirecionado para login

  const db = DB.load();
  const usuario = db.usuarios.find(u => u.id === session.usuarioId);
  if (!usuario) { Auth.logout(); window.location.href = 'login.html'; return; }

  const iniciais = usuario.nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  document.getElementById('avatar-iniciais').textContent = iniciais;
  document.getElementById('perfil-nome').textContent = usuario.nome;

  if (usuario.perfil === 'voluntario') {
    document.getElementById('area-titulo').textContent = 'Minha Área — Voluntário(a)';
    document.getElementById('perfil-tipo-badge').textContent = 'Voluntário(a) Ativo(a)';
    document.getElementById('painel-voluntario').style.display = 'block';

    const cadastro = db.voluntarios.find(v => v.usuarioId === usuario.id);

    document.getElementById('vol-nome').textContent = usuario.nome;
    document.getElementById('vol-telefone').textContent = usuario.telefone;
    document.getElementById('vol-area').textContent = (cadastro && cadastro.areaInteresse) || usuario.areaInteresse || '—';
    document.getElementById('vol-status').innerHTML = Utils.statusBadge('aprovado');
    document.getElementById('vol-desde').textContent = Utils.formatDate(usuario.criadoEm);

  } else if (usuario.perfil === 'doador') {
    document.getElementById('area-titulo').textContent = 'Minha Área — Doador(a) Associado(a)';
    document.getElementById('perfil-tipo-badge').textContent = 'Doador(a) Associado(a)';
    document.getElementById('painel-doador').style.display = 'block';

    // FR-042: só as doações do próprio doador, nunca de terceiros
    const doacoes = db.doacoes.filter(d => d.doadorId === usuario.id)
      .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

    const total = doacoes.filter(d => d.status === 'confirmada').reduce((s, d) => s + d.valor, 0);
    document.getElementById('doador-total').textContent = Utils.formatCurrency(total);
    document.getElementById('doador-confirmadas').textContent = doacoes.filter(d => d.status === 'confirmada').length;
    document.getElementById('doador-pendentes').textContent = doacoes.filter(d => d.status === 'pendente').length;

    const tbody = document.getElementById('doador-historico');
    tbody.innerHTML = doacoes.map(d => `
      <tr>
        <td>${Utils.formatDateTime(d.criadoEm)}</td>
        <td>${Utils.formatCurrency(d.valor)}</td>
        <td>${Utils.statusBadge(d.status)}</td>
      </tr>
    `).join('') || `<tr><td colspan="3" class="cell-muted">Você ainda não fez nenhuma doação associativa.</td></tr>`;
  }

  document.getElementById('btn-logout').addEventListener('click', () => {
    Auth.logout();
    window.location.href = 'login.html';
  });
});
