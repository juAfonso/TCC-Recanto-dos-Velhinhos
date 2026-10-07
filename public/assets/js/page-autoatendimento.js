/* Área do doador associado (US9 — FR-041, FR-042): dados próprios (só consulta) e histórico
   das doações CONFIRMADAS. Quem decide o acesso é o servidor; sem sessão, vai para o login.
   Voluntário não tem autoatendimento (decisão de 2026-10-03). */
document.addEventListener('DOMContentLoaded', async () => {
  const $ = (id) => document.getElementById(id);

  $('btn-logout').addEventListener('click', async () => {
    await Auth.logoutDoador();
    window.location.href = 'index.html';
  });

  const sessao = await Auth.requireAutoatendimento();
  if (!sessao) return; // redirecionado para o login

  try {
    const [eu, historico] = await Promise.all([Api.get('/api/me'), Api.get('/api/me/doacoes')]);

    $('avatar-iniciais').textContent = eu.nome.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    $('perfil-nome').textContent = eu.nome;
    $('dado-nome').textContent = eu.nome;
    $('dado-cpf').textContent = Utils.maskCPF(eu.cpf);
    $('dado-email').textContent = eu.email || '—';
    $('dado-telefone').textContent = (eu.telefone || '').replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3') || '—';
    $('dado-desde').textContent = eu.associadoDesde ? Utils.formatDate(eu.associadoDesde) : '—';
    $('aviso-novo').hidden = !eu.avisoPendente;

    $('doador-total').textContent = Utils.formatCurrency(historico.total);
    $('doador-confirmadas').textContent = historico.doacoes.length;
    $('doador-historico').innerHTML = historico.doacoes.map((d) => `
      <tr><td>${Utils.formatDate(d.data)}</td><td>${Utils.formatCurrency(d.valor)}</td></tr>`).join('')
      || '<tr><td colspan="2" class="cell-muted">Nenhuma doação confirmada ainda. Depois que você doa, a equipe confere no extrato e a doação aparece aqui.</td></tr>';
  } catch (erro) {
    if (erro.status === 403) { window.location.href = Auth.computeLoginPath(); return; }
    Utils.toast(erro.message, 'danger');
  }

  // Contato da secretaria, o mesmo do aviso de privacidade (editável no Painel).
  Api.get('/api/public/aviso-privacidade')
    .then((a) => { if (a.contato) $('contato-recanto').textContent = a.contato; })
    .catch(() => { /* fica o texto padrão */ });
});
