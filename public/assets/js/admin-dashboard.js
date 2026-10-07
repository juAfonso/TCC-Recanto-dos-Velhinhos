/* Visão Geral (US7, FR-036, FR-014, SC-007): indicadores e alertas da API, com link para cada fila.
   Sem pendência nenhuma → "não há alertas" (cenário 8). Atividade recente vem da auditoria (FR-035). */
document.addEventListener('DOMContentLoaded', async () => {
  const $ = (id) => document.getElementById(id);
  const e = (t) => Utils.escapeHtml(t);
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

  try {
    const d = await Api.get('/api/admin/dashboard');
    const t = d.triagem;
    const triagem = t.voluntarios + t.candidaturas + t.solicitacoes;

    const cartoes = [
      [d.itensPrioridadeAlta, 'Itens de prioridade alta', 'itens.html'],
      [d.itensSemAtualizacao, `Itens sem atualização há ${d.diasSemAtualizacao}+ dias`, 'itens.html'],
      [triagem, 'Pendentes de triagem', '#alertas-lista'],
      [d.doacoesPendentes, 'Doações a conferir no extrato', 'doacoes.html'],
      [d.falhasEmail, 'E-mails que não chegaram', 'auditoria.html#falhas'],
      [d.retencaoVencida, 'Registros com prazo de retenção vencido', 'lgpd.html'],
    ];
    $('stat-grid').innerHTML = cartoes.map(([n, rotulo, link]) => `
      <a class="stat-card ${n ? 'alert-card' : ''}" href="${link}" style="text-decoration:none;color:inherit;">
        <span class="stat-value">${n}</span>
        <span class="stat-label">${e(rotulo)}</span>
      </a>`).join('');

    const alertas = [];
    d.itensPrioritarios.forEach((i) => alertas.push([`<strong>${e(i.nome)}</strong> está com prioridade alta (${e(String(i.quantidade).replace('.', ','))} ${e(i.unidade)}).`, 'itens.html']));
    if (d.itensSemAtualizacao) alertas.push([`${plural(d.itensSemAtualizacao, 'item está', 'itens estão')} há mais de ${d.diasSemAtualizacao} dias sem atualizar a quantidade.`, 'itens.html']);
    if (t.voluntarios) alertas.push([`${plural(t.voluntarios, 'cadastro de voluntário aguarda', 'cadastros de voluntário aguardam')} triagem.`, 'triagem-voluntarios.html']);
    if (t.candidaturas) alertas.push([`${plural(t.candidaturas, 'candidatura a vaga aguarda', 'candidaturas a vaga aguardam')} triagem.`, 'triagem-vagas.html']);
    if (t.solicitacoes) alertas.push([`${plural(t.solicitacoes, 'solicitação externa aguarda', 'solicitações externas aguardam')} decisão ou contato.`, 'triagem-eventos.html']);
    if (d.doacoesPendentes) alertas.push([`${plural(d.doacoesPendentes, 'declaração de doação Pix aguarda', 'declarações de doação Pix aguardam')} conferência no extrato.`, 'doacoes.html']);
    if (d.falhasEmail) alertas.push([`${plural(d.falhasEmail, 'e-mail não chegou', 'e-mails não chegaram')} à pessoa. Reenvie ou avise por telefone.`, 'auditoria.html#falhas']);
    if (d.retencaoVencida) alertas.push([`${plural(d.retencaoVencida, 'registro passou', 'registros passaram')} do prazo de retenção e deve ser anonimizado.`, 'lgpd.html']);

    $('alertas-lista').innerHTML = d.semAlertas
      ? '<div class="empty-state"><span class="icon" aria-hidden="true">✅</span><p>Não há alertas no momento.</p></div>'
      : alertas.map(([texto, link]) => `
        <div class="activity-item">
          <span class="dot" style="background:var(--warning);" aria-hidden="true"></span>
          <div>${texto} <a href="${link}" style="color:var(--viridian);font-weight:700;text-decoration:none;">Ver →</a></div>
        </div>`).join('');
  } catch (erro) {
    $('alertas-lista').textContent = erro.message;
  }

  try {
    const a = await Api.get('/api/admin/auditoria');
    $('atividade-lista').innerHTML = a.registros.slice(0, 8).map((r) => `
      <div class="activity-item">
        <span class="dot" aria-hidden="true"></span>
        <div>
          <strong>${e(AcoesAuditoria.nome(r.acao))}</strong><br>
          <span class="time">${e(AcoesAuditoria.autor(r))} · ${Utils.formatDateTime(r.ocorridoEm)}</span>
        </div>
      </div>`).join('') || '<p class="cell-muted">Nenhuma atividade registrada ainda.</p>';
  } catch (erro) {
    $('atividade-lista').textContent = erro.message;
  }
});
