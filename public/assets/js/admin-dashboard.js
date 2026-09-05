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
      <div class="stat-top"><span class="stat-icon" style="background:var(--warning-bg);">📦</span></div>
      <span class="stat-value">${itensUrgentes.length}</span>
      <span class="stat-label">Itens necessários urgentes</span>
    </div>
    <div class="stat-card ${totalTriagem ? 'alert-card' : ''}">
      <div class="stat-top"><span class="stat-icon" style="background:var(--info-bg);">🗂️</span></div>
      <span class="stat-value">${totalTriagem}</span>
      <span class="stat-label">Cadastros pendentes de triagem</span>
    </div>
    <div class="stat-card">
      <div class="stat-top"><span class="stat-icon" style="background:var(--success-bg);">💸</span></div>
      <span class="stat-value">${Utils.formatCurrency(totalDoacoesMes)}</span>
      <span class="stat-label">Doações confirmadas este mês</span>
    </div>
    <div class="stat-card">
      <div class="stat-top"><span class="stat-icon" style="background:var(--fairy);">🎉</span></div>
      <span class="stat-value">${campanhasAtivas.length}</span>
      <span class="stat-label">Campanhas/eventos ativos</span>
    </div>
  `;

  const alertas = [];
  itensUrgentes.forEach(i => alertas.push({
    icon: '📦', texto: `<strong>${i.nome}</strong> está com necessidade urgente (${i.quantidade} ${i.unidade}).`,
    link: 'itens.html'
  }));
  itensSemAtualizacao.forEach(i => alertas.push({
    icon: '⏳', texto: `<strong>${i.nome}</strong> está há ${Utils.daysSince(i.atualizadoEm)} dias sem atualização de quantidade.`,
    link: 'itens.html'
  }));
  if (pendVoluntarios.length) alertas.push({ icon: '🤝', texto: `${pendVoluntarios.length} cadastro(s) de voluntário aguardando triagem.`, link: 'triagem-voluntarios.html' });
  if (pendCandidaturas.length) alertas.push({ icon: '💼', texto: `${pendCandidaturas.length} candidatura(s) a vaga em análise.`, link: 'triagem-vagas.html' });
  if (pendSolicitacoes.length) alertas.push({ icon: '📅', texto: `${pendSolicitacoes.length} solicitação(ões) externa(s) de evento/campanha em análise.`, link: 'triagem-eventos.html' });
  if (doacoesPendentes) alertas.push({ icon: '⏱️', texto: `${doacoesPendentes} doação(ões) Pix com confirmação de pagamento pendente.`, link: 'doacoes.html' });

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
