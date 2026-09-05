document.addEventListener('DOMContentLoaded', () => {
  const db = DB.load();

  const itensUrgentes = db.itens.filter(i => i.status === 'ativo' && i.urgente);
  const itensSemAtualizacao = db.itens.filter(i => i.status === 'ativo' && Utils.daysSince(i.atualizadoEm) > 30);
  const pendVoluntarios = db.voluntarios.filter(v => v.status === 'pendente');
  const pendCandidaturas = db.candidaturas.filter(c => c.status === 'em_analise');
  const pendSolicitacoes = db.solicitacoesExternas.filter(s => s.status === 'em_analise');
  const totalTriagem = pendVoluntarios.length + pendCandidaturas.length + pendSolicitacoes.length;

  const hoje = new Date();
  const doacoesMes = db.doacoes.filter(d => {
    const dt = new Date(d.criadoEm);
    return dt.getMonth() === hoje.getMonth() && dt.getFullYear() === hoje.getFullYear() && d.status === 'confirmada';
  });
  const totalDoacoesMes = doacoesMes.reduce((s, d) => s + d.valor, 0);
  const doacoesPendentes = db.doacoes.filter(d => d.status === 'pendente').length;

  const campanhasAtivas = db.campanhas.filter(c => c.status === 'ativo');

  document.getElementById('stat-grid').innerHTML = `
    <div class="stat-card ${itensUrgentes.length ? 'alert-card' : ''}">
      <div class="stat-top"><span class="stat-icon" style="background:var(--warning-bg);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-seam-fill" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M15.528 2.973a.75.75 0 0 1 .472.696v8.662a.75.75 0 0 1-.472.696l-7.25 2.9a.75.75 0 0 1-.557 0l-7.25-2.9A.75.75 0 0 1 0 12.331V3.669a.75.75 0 0 1 .471-.696L7.443.184l.01-.003.268-.108a.75.75 0 0 1 .558 0l.269.108.01.003zM10.404 2 4.25 4.461 1.846 3.5 1 3.839v.4l6.5 2.6v7.922l.5.2.5-.2V6.84l6.5-2.6v-.4l-.846-.339L8 5.961 5.596 5l6.154-2.461z"/>
</svg></span></div>
      <span class="stat-value">${itensUrgentes.length}</span>
      <span class="stat-label">Itens necessários urgentes</span>
    </div>
    <div class="stat-card ${totalTriagem ? 'alert-card' : ''}">
      <div class="stat-top"><span class="stat-icon" style="background:var(--info-bg);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-folder2" viewBox="0 0 16 16">
  <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5zM2.5 3a.5.5 0 0 0-.5.5V6h12v-.5a.5.5 0 0 0-.5-.5H9c-.964 0-1.71-.629-2.174-1.154C6.374 3.334 5.82 3 5.264 3zM14 7H2v5.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5z"/>
</svg></span></div>
      <span class="stat-value">${totalTriagem}</span>
      <span class="stat-label">Cadastros pendentes de triagem</span>
    </div>
    <div class="stat-card">
      <div class="stat-top"><span class="stat-icon" style="background:var(--success-bg);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cash-stack" viewBox="0 0 16 16">
  <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/>
  <path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2z"/>
</svg></span></div>
      <span class="stat-value">${Utils.formatCurrency(totalDoacoesMes)}</span>
      <span class="stat-label">Doações confirmadas este mês</span>
    </div>
    <div class="stat-card">
      <div class="stat-top"><span class="stat-icon" style="background:var(--fairy);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bullseye" viewBox="0 0 16 16">
  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
  <path d="M8 13A5 5 0 1 1 8 3a5 5 0 0 1 0 10m0 1A6 6 0 1 0 8 2a6 6 0 0 0 0 12"/>
  <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8"/>
  <path d="M9.5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
</svg></span></div>
      <span class="stat-value">${campanhasAtivas.length}</span>
      <span class="stat-label">Campanhas/eventos ativos</span>
    </div>
  `;

  const alertas = [];
  itensUrgentes.forEach(i => alertas.push({
    icon: '', texto: `<strong>${i.nome}</strong> está com necessidade urgente (${i.quantidade} ${i.unidade}).`,
    link: 'itens.html'
  }));
  itensSemAtualizacao.forEach(i => alertas.push({
    icon: '', texto: `<strong>${i.nome}</strong> está há ${Utils.daysSince(i.atualizadoEm)} dias sem atualização de quantidade.`,
    link: 'itens.html'
  }));
  if (pendVoluntarios.length) alertas.push({ icon: '', texto: `${pendVoluntarios.length} cadastro(s) de voluntário aguardando triagem.`, link: 'triagem-voluntarios.html' });
  if (pendCandidaturas.length) alertas.push({ icon: '', texto: `${pendCandidaturas.length} candidatura(s) a vaga em análise.`, link: 'triagem-vagas.html' });
  if (pendSolicitacoes.length) alertas.push({ icon: '', texto: `${pendSolicitacoes.length} solicitação(ões) externa(s) de evento/campanha em análise.`, link: 'triagem-eventos.html' });
  if (doacoesPendentes) alertas.push({ icon: '', texto: `${doacoesPendentes} doação(ões) Pix com confirmação de pagamento pendente.`, link: 'doacoes.html' });

  document.getElementById('alertas-lista').innerHTML = alertas.length
    ? alertas.map(a => `
        <div class="activity-item">
          <span class="dot" style="background:var(--warning);"></span>
          <div>${a.icon} ${a.texto} <a href="${a.link}" style="color:var(--viridian);font-weight:700;text-decoration:none;">Ver →</a></div>
        </div>
      `).join('')
    : `<div class="empty-state"><span class="icon">✅</span><p>Nenhum alerta no momento. Tudo em dia!</p></div>`;

  const atividades = [...db.auditLog].sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora)).slice(0, 8);
  document.getElementById('atividade-lista').innerHTML = atividades.map(a => `
    <div class="activity-item">
      <span class="dot"></span>
      <div>
        <strong>${a.acao}</strong> — ${a.detalhe}<br>
        <span class="time">${a.autor} · ${Utils.formatDateTime(a.dataHora)}</span>
      </div>
    </div>
  `).join('') || '<p class="cell-muted">Nenhuma atividade registrada ainda.</p>';
});
