/* Triagem de candidaturas (US5, FR-018, FR-019, FR-037, FR-048, FR-061).
   em análise → entrevista → aprovada | rejeitada. Aprovar efetiva o funcionário. */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const e = (t) => Utils.escapeHtml(t);
  const tbody = $('candidaturas-tbody');
  const CARGOS = { limpeza: 'Limpeza', cuidador: 'Cuidador(a)', enfermagem: 'Enfermagem', cozinha: 'Cozinha' };
  const SITUACAO = {
    em_analise: ['badge-warning', 'Em análise'],
    entrevista: ['badge-info', 'Em entrevista'],
    aprovada: ['badge-success', 'Aprovada'],
    rejeitada: ['badge-danger', 'Rejeitada'],
    encerrada_titular: ['badge-neutral', 'Encerrada a pedido'],
  };
  const selo = (s) => `<span class="badge ${SITUACAO[s][0]}">${SITUACAO[s][1]}</span>`;
  let filtro = 'em_analise';
  let atual = null;

  async function carregar() {
    tbody.innerHTML = '<tr><td colspan="8" class="cell-muted">Carregando…</td></tr>';
    try {
      const r = await Api.get(`/api/admin/candidaturas?status=${filtro}`);
      $('cont-em_analise').textContent = r.contagem.em_analise ? `(${r.contagem.em_analise})` : '';
      $('cont-entrevista').textContent = r.contagem.entrevista ? `(${r.contagem.entrevista})` : '';
      tbody.innerHTML = r.candidaturas.map((c) => `
        <tr>
          <td class="cell-muted">${e(c.protocolo)}</td>
          <td>${e(c.nome)}</td>
          <td>${e(CARGOS[c.cargo] || c.cargo)}</td>
          <td>${c.idade ?? '—'}</td>
          <td>${c.temArquivo ? 'Arquivo' : 'Texto'}</td>
          <td class="cell-muted">${Utils.formatDate(c.criadoEm)}</td>
          <td>${selo(c.status)}</td>
          <td><button class="btn btn-outline btn-sm" data-abrir="${c.id}">Ver e decidir</button></td>
        </tr>`).join('')
        || '<tr><td colspan="8"><div class="empty-state"><span class="icon" aria-hidden="true">📄</span><p>Nenhuma candidatura nesta lista.</p></div></td></tr>';
    } catch (erro) {
      tbody.innerHTML = `<tr><td colspan="8">${e(erro.message)}</td></tr>`;
    }
  }

  document.querySelectorAll('.tabs-nav .tab-btn').forEach((btn) => btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs-nav .tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    filtro = btn.dataset.filtro;
    carregar();
  }));
  tbody.addEventListener('click', (ev) => { const b = ev.target.closest('[data-abrir]'); if (b) abrir(b.dataset.abrir); });

  async function abrir(id) {
    try { atual = await Api.get(`/api/admin/candidaturas/${id}`); } catch (erro) { Utils.toast(erro.message, 'danger'); return; }
    $('form-corrigir').hidden = true;
    $('cand-detalhe').hidden = false;
    render();
    openModal('modal-candidatura');
  }

  function render() {
    const c = atual;
    $('modal-cand-titulo').textContent = `${c.nome} — ${c.protocolo}`;
    $('cand-situacao').innerHTML = `${selo(c.status)}
      ${c.triadoEm ? `<span class="cell-muted" style="font-size:.8rem;"> · última decisão por ${e(c.triadoPor)} em ${Utils.formatDateTime(c.triadoEm)}</span>` : ''}
      ${c.efetivadoEm ? `<p class="form-hint" style="margin-top:6px;">Efetivada como funcionária em ${Utils.formatDateTime(c.efetivadoEm)}.</p>` : ''}
      ${c.motivoRejeicao ? `<p class="form-hint" style="margin-top:6px;">Motivo da rejeição: ${e(c.motivoRejeicao)}</p>` : ''}`;
    $('cand-aviso-voluntario').hidden = !(c.jaVoluntario && ['em_analise', 'entrevista'].includes(c.status));

    const cpf = (c.cpf || '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    const tel = (c.telefone || '').replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
    const curriculo = c.curriculoAnonimizado ? 'Removido (prazo de retenção)'
      : c.arquivo ? `<button type="button" class="link-btn" data-acao="abrir-curriculo">Abrir ${e(c.arquivo.nome)}</button>` : 'Sem arquivo';
    const linhas = [
      ['Cargo', e(CARGOS[c.cargo] || c.cargo)], ['Nome', e(c.nome)], ['CPF', e(cpf)],
      ['Nascimento', `${Utils.formatDay(c.dataNascimento)} (${c.idade} anos)`], ['Telefone', e(tel)], ['E-mail', e(c.email)],
      ['Currículo em arquivo', curriculo], ['Experiência (texto)', c.curriculoTexto ? Utils.paragrafos(c.curriculoTexto) : '—'],
      ['Recebida em', Utils.formatDateTime(c.criadoEm)],
      ['Consentimento (LGPD)', c.consentimento ? `aviso ${e(c.consentimento.avisoVersao)}, aceito em ${Utils.formatDateTime(c.consentimento.aceitoEm)}` : '—'],
    ];
    $('cand-dados').innerHTML = linhas.map(([r, v]) => `<dt style="font-weight:700;">${e(r)}</dt><dd>${v || '—'}</dd>`).join('');

    const acoes = [];
    if (!c.anonimizado) {
      if (c.status === 'em_analise') acoes.push(['entrevista', 'btn-viridian', 'Chamar para entrevista']);
      if (c.status === 'entrevista') acoes.push(['aprovar', 'btn-viridian', 'Aprovar e efetivar']);
      if (['em_analise', 'entrevista'].includes(c.status)) acoes.push(['rejeitar', 'btn-danger-outline', 'Rejeitar']);
      acoes.push(['corrigir', 'btn-outline', 'Corrigir dados']);
    }
    $('cand-acoes').innerHTML = acoes.map(([a, cls, r]) => `<button type="button" class="btn ${cls} btn-sm" data-acao="${a}">${r}</button>`).join('')
      || '<span class="cell-muted">Candidatura anonimizada: só consulta.</span>';
  }

  async function decidir(acao, corpo = {}) {
    try {
      const r = await Api.post(`/api/admin/candidaturas/${atual.id}/${acao}`, corpo);
      const falhou = r.emailEnviado === false;
      Utils.toast(falhou ? 'Feito. O e-mail para a pessoa falhou e ficou registrado para reenvio.' : 'Feito.', falhou ? 'warning' : 'success');
      await abrir(atual.id);
      carregar();
    } catch (erro) { Utils.toast(erro.message, 'danger'); }
  }

  $('cand-detalhe').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-acao]');
    if (!b) return;
    const acao = b.dataset.acao;
    if (acao === 'abrir-curriculo') window.open(`/api/admin/candidaturas/${atual.id}/curriculo`, '_blank');
    if (acao === 'entrevista' && confirm(`Chamar ${atual.nome} para entrevista? A pessoa recebe um e-mail.`)) decidir('entrevista');
    if (acao === 'aprovar') {
      const extra = atual.jaVoluntario ? '\n\nEla é voluntária ativa: esse vínculo será encerrado.' : '';
      if (confirm(`Aprovar ${atual.nome} e efetivar como funcionária?${extra}`)) decidir('aprovar');
    }
    if (acao === 'rejeitar') { $('rej-motivo').value = ''; openModal('modal-rejeitar'); $('rej-motivo').focus(); }
    if (acao === 'corrigir') abrirCorrecao();
  });

  $('form-rejeitar').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    closeModal('modal-rejeitar');
    await decidir('rejeitar', { motivo: $('rej-motivo').value.trim() });
  });

  const formC = $('form-corrigir');
  function abrirCorrecao() {
    const c = atual;
    Utils.clearAllErrors(formC);
    $('c-cargo').value = c.cargo; $('c-nome').value = c.nome; $('c-nascimento').value = c.dataNascimento;
    $('c-cpf').value = c.cpf; $('c-telefone').value = c.telefone; $('c-email').value = c.email; $('c-texto').value = c.curriculoTexto || '';
    Mascaras.aplicarEm(formC);
    ['c-cpf', 'c-telefone'].forEach((id) => $(id).dispatchEvent(new Event('input')));
    $('cand-detalhe').hidden = true;
    formC.hidden = false;
    $('c-nome').focus();
  }
  $('btn-cancelar-correcao').addEventListener('click', () => { formC.hidden = true; $('cand-detalhe').hidden = false; });
  formC.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    Utils.clearAllErrors(formC);
    const corpo = {
      cargo: $('c-cargo').value, nome: $('c-nome').value.trim(), dataNascimento: $('c-nascimento').value,
      cpf: $('c-cpf').value, telefone: $('c-telefone').value, email: $('c-email').value.trim(), curriculoTexto: $('c-texto').value.trim(),
    };
    try {
      await Api.put(`/api/admin/candidaturas/${atual.id}`, corpo, { form: formC });
      Utils.toast('Dados corrigidos. A versão anterior ficou no histórico.');
      await abrir(atual.id);
      carregar();
    } catch (erro) { if (!erro.campos.length) Utils.toast(erro.message, 'danger'); }
  });

  carregar();
});
