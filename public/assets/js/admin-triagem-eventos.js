/* Triagem de propostas externas (US6, FR-021, FR-022, FR-030, FR-031, FR-037, FR-061).
   em análise → aguardando contato (nada publicado) → confirmada (cria e publica) | rejeitada. */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const e = (t) => Utils.escapeHtml(t);
  const tbody = $('solicitacoes-tbody');
  const SITUACAO = {
    em_analise: ['badge-warning', 'Em análise'],
    aguardando_contato: ['badge-info', 'Aguardando contato'],
    confirmada: ['badge-success', 'Confirmada'],
    rejeitada: ['badge-danger', 'Rejeitada'],
    encerrada_titular: ['badge-neutral', 'Encerrada a pedido'],
  };
  const selo = (s) => `<span class="badge ${SITUACAO[s][0]}">${SITUACAO[s][1]}</span>`;
  const TIPO = { evento: 'Evento', campanha: 'Campanha' };
  const periodo = (ini, fim) => (fim ? `${Utils.formatDay(ini)} a ${Utils.formatDay(fim)}` : Utils.formatDay(ini));
  let filtro = 'em_analise';
  let atual = null;

  async function carregar() {
    tbody.innerHTML = '<tr><td colspan="8" class="cell-muted">Carregando…</td></tr>';
    try {
      const r = await Api.get(`/api/admin/solicitacoes?status=${filtro}`);
      ['em_analise', 'aguardando_contato'].forEach((s) => { $(`cont-${s}`).textContent = r.contagem[s] ? `(${r.contagem[s]})` : ''; });
      tbody.innerHTML = r.solicitacoes.map((s) => `
        <tr>
          <td class="cell-muted">${e(s.protocolo)}</td>
          <td>${e(s.nomeIniciativa)}</td>
          <td>${TIPO[s.tipo]}</td>
          <td>${e(s.nomeContato)}</td>
          <td>${s.dataInicio ? periodo(s.dataInicio, s.dataFim) : '—'}</td>
          <td class="cell-muted">${Utils.formatDate(s.criadoEm)}</td>
          <td>${selo(s.status)}</td>
          <td><button class="btn btn-outline btn-sm" data-abrir="${s.id}">Ver e decidir</button></td>
        </tr>`).join('')
        || '<tr><td colspan="8"><div class="empty-state"><p>Nenhuma proposta nesta lista.</p></div></td></tr>';
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

  // Só uma das três vistas do modal aparece por vez: detalhe, confirmar ou corrigir.
  function mostrar(vista) {
    $('sol-detalhe').hidden = vista !== 'detalhe';
    $('form-confirmar').hidden = vista !== 'confirmar';
    $('form-corrigir').hidden = vista !== 'corrigir';
  }
  document.querySelectorAll('#modal-solicitacao [data-voltar]').forEach((b) => b.addEventListener('click', () => mostrar('detalhe')));

  async function abrir(id) {
    try { atual = await Api.get(`/api/admin/solicitacoes/${id}`); } catch (erro) { Utils.toast(erro.message, 'danger'); return; }
    mostrar('detalhe');
    render();
    openModal('modal-solicitacao');
  }

  function render() {
    const s = atual;
    $('modal-sol-titulo').textContent = `${s.nomeIniciativa} — ${s.protocolo}`;
    $('sol-situacao').innerHTML = `${selo(s.status)}
      ${s.triadoEm ? `<span class="cell-muted" style="font-size:.8rem;"> · última decisão por ${e(s.triadoPor)} em ${Utils.formatDateTime(s.triadoEm)}</span>` : ''}
      ${s.criado ? `<p class="form-hint" style="margin-top:6px;">Publicado no site como “${e(s.criado.nome)}”${s.criado.status === 'encerrado' ? ' (já encerrado)' : ''}. Para mudar, use a tela Campanhas &amp; Eventos.</p>` : ''}
      ${s.motivoRejeicao ? `<p class="form-hint" style="margin-top:6px;">Motivo da rejeição: ${e(s.motivoRejeicao)}</p>` : ''}`;
    $('sol-aviso-conflito').hidden = !s.conflitos.length;
    $('sol-aviso-conflito-texto').textContent = s.conflitos.length
      ? `Já existe evento marcado nesta data: ${s.conflitos.join(', ')}. É só um aviso — a equipe decide.` : '';

    const tel = (s.telefone || '').replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
    const quando = s.tipo === 'evento' ? ['Data pretendida', Utils.formatDay(s.dataPretendida)] : ['Período pretendido', periodo(s.periodoInicio, s.periodoFim)];
    const linhas = [
      ['Tipo', TIPO[s.tipo]], ['Nome da proposta', e(s.nomeIniciativa)], quando,
      ['Objetivo', Utils.paragrafos(s.objetivo)], ['O que pede ao Recanto', s.recursosEsperados ? Utils.paragrafos(s.recursosEsperados) : '—'],
      ['Quem propõe', e(s.nomeContato)], ['Telefone', tel ? `<a href="tel:+55${e(s.telefone)}">${e(tel)}</a>` : '—'],
      ['E-mail', s.email ? `<a href="mailto:${e(s.email)}">${e(s.email)}</a>` : '—'],
      ['Recebida em', Utils.formatDateTime(s.criadoEm)],
      ['Consentimento (LGPD)', s.consentimento ? `aviso ${e(s.consentimento.avisoVersao)}, aceito em ${Utils.formatDateTime(s.consentimento.aceitoEm)}` : '—'],
    ];
    $('sol-dados').innerHTML = linhas.map(([r, v]) => `<dt style="font-weight:700;">${e(r)}</dt><dd>${v || '—'}</dd>`).join('');

    const acoes = [];
    if (!s.anonimizado) {
      if (s.status === 'em_analise') acoes.push(['aprovar', 'btn-viridian', 'Aprovar (avisar que vamos entrar em contato)']);
      if (s.status === 'aguardando_contato') acoes.push(['confirmar', 'btn-viridian', 'Confirmar e publicar']);
      if (['em_analise', 'aguardando_contato'].includes(s.status)) acoes.push(['rejeitar', 'btn-danger-outline', 'Rejeitar']);
      acoes.push(['corrigir', 'btn-outline', 'Corrigir dados']);
    }
    $('sol-acoes').innerHTML = acoes.map(([a, cls, r]) => `<button type="button" class="btn ${cls} btn-sm" data-acao="${a}">${r}</button>`).join('')
      || '<span class="cell-muted">Proposta anonimizada: só consulta.</span>';
  }

  async function depoisDeDecidir(r, texto) {
    const falhou = r.emailEnviado === false;
    Utils.toast(falhou ? `${texto} O e-mail para a pessoa falhou e ficou registrado para reenvio.` : texto, falhou ? 'warning' : 'success');
    await abrir(atual.id);
    carregar();
  }

  // Conflito de data é aviso (FR-030): pergunta e, se a equipe quiser, repete com confirmarAviso.
  async function comAvisoDeConflito(enviar, campoData) {
    try {
      return await enviar(false);
    } catch (erro) {
      if (erro.codigo !== 'CONFLITO_DE_DATA') throw erro;
      if (confirm(`${erro.message}\n\nOK = prosseguir mesmo assim\nCancelar = voltar`)) return enviar(true);
      if (campoData) campoData.focus();
      return null;
    }
  }

  $('sol-detalhe').addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-acao]');
    if (!b) return;
    const acao = b.dataset.acao;
    if (acao === 'aprovar') {
      if (!confirm(`Aprovar "${atual.nomeIniciativa}"?\n\nNada é publicado agora: a pessoa recebe um e-mail dizendo que a equipe vai entrar em contato.`)) return;
      try {
        const r = await comAvisoDeConflito((confirmarAviso) => Api.post(`/api/admin/solicitacoes/${atual.id}/aprovar`, { confirmarAviso }));
        if (r) await depoisDeDecidir(r, 'Aprovada. Agora combine os detalhes com a pessoa.');
      } catch (erro) { Utils.toast(erro.message, 'danger'); }
    }
    if (acao === 'confirmar') abrirConfirmacao();
    if (acao === 'rejeitar') { $('rej-motivo').value = ''; openModal('modal-rejeitar'); $('rej-motivo').focus(); }
    if (acao === 'corrigir') abrirCorrecao();
  });

  $('form-rejeitar').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    closeModal('modal-rejeitar');
    try {
      const r = await Api.post(`/api/admin/solicitacoes/${atual.id}/rejeitar`, { motivo: $('rej-motivo').value.trim() });
      await depoisDeDecidir(r, 'Proposta rejeitada.');
    } catch (erro) { Utils.toast(erro.message, 'danger'); }
  });

  // ---- Confirmar com os dados combinados ----
  const formConf = $('form-confirmar');
  const listaRecursos = $('lista-recursos');
  function adicionarRecurso(r = { tipo: 'item', descricao: '' }) {
    const n = listaRecursos.children.length + 1;
    const div = document.createElement('div');
    div.className = 'form-row recurso-linha';
    div.style.alignItems = 'flex-end';
    div.innerHTML = `
      <div class="form-group" style="flex:0 0 140px;">
        <label for="rec-tipo-${n}">Tipo</label>
        <select id="rec-tipo-${n}" class="rec-tipo">
          <option value="item"${r.tipo === 'item' ? ' selected' : ''}>Item</option>
          <option value="dinheiro"${r.tipo === 'dinheiro' ? ' selected' : ''}>Dinheiro</option>
        </select>
      </div>
      <div class="form-group" style="flex:1;">
        <label for="rec-desc-${n}">Descrição</label>
        <input type="text" id="rec-desc-${n}" class="rec-desc" maxlength="300" value="${e(r.descricao)}" placeholder="ex.: cobertores de casal">
      </div>
      <div class="form-group" style="flex:0 0 auto;">
        <button type="button" class="btn btn-outline btn-sm rec-remover" aria-label="Remover este recurso">Remover</button>
      </div>`;
    div.querySelector('.rec-remover').addEventListener('click', () => div.remove());
    listaRecursos.appendChild(div);
    return div;
  }
  $('btn-add-recurso').addEventListener('click', () => adicionarRecurso().querySelector('.rec-desc').focus());

  function abrirConfirmacao() {
    const s = atual;
    Utils.clearAllErrors(formConf);
    const evento = s.tipo === 'evento';
    $('conf-tipo-texto').textContent = evento ? 'o evento' : 'a campanha';
    $('conf-evento').hidden = !evento;
    $('conf-campanha').hidden = evento;
    // Ponto de partida: o que foi pedido. A equipe ajusta para o que foi combinado.
    $('conf-nome').value = s.nomeIniciativa;
    $('conf-descricao').value = s.objetivo;
    $('conf-data').value = s.dataPretendida || '';
    $('conf-recursos-texto').value = '';
    $('conf-inicio').value = s.periodoInicio || '';
    $('conf-fim').value = s.periodoFim || '';
    $('conf-meta').value = '';
    listaRecursos.innerHTML = '';
    if (!evento) adicionarRecurso();
    mostrar('confirmar');
    $('conf-nome').focus();
  }

  formConf.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    Utils.clearAllErrors(formConf);
    const comum = { nome: $('conf-nome').value.trim(), descricao: $('conf-descricao').value.trim() };
    const corpo = atual.tipo === 'evento'
      ? { ...comum, data: $('conf-data').value, recursos: $('conf-recursos-texto').value.trim() }
      : {
        ...comum, periodoInicio: $('conf-inicio').value, periodoFim: $('conf-fim').value, meta: $('conf-meta').value.trim(),
        recursos: [...listaRecursos.querySelectorAll('.recurso-linha')].map((l) => ({
          tipo: l.querySelector('.rec-tipo').value, descricao: l.querySelector('.rec-desc').value.trim(),
        })),
      };
    const botao = formConf.querySelector('[type=submit]');
    botao.disabled = true;
    try {
      const r = await comAvisoDeConflito(
        (confirmarAviso) => Api.post(`/api/admin/solicitacoes/${atual.id}/confirmar`, { ...corpo, confirmarAviso }, { form: formConf }),
        $('conf-data'));
      if (r) await depoisDeDecidir(r, atual.tipo === 'evento' ? 'Evento confirmado e publicado no site.' : 'Campanha confirmada e publicada no site.');
    } catch (erro) {
      if (!erro.campos.length) Utils.toast(erro.message, 'danger');
    } finally { botao.disabled = false; }
  });

  // ---- Corrigir os dados da proposta ----
  const formC = $('form-corrigir');
  const tipoC = () => formC.querySelector('input[name=c-tipo]:checked')?.value;
  function alternarTipoC() {
    $('c-grupo-data').hidden = tipoC() !== 'evento';
    $('c-grupo-periodo').hidden = tipoC() !== 'campanha';
  }
  formC.querySelectorAll('input[name=c-tipo]').forEach((r) => r.addEventListener('change', alternarTipoC));

  function abrirCorrecao() {
    const s = atual;
    Utils.clearAllErrors(formC);
    formC.querySelectorAll('input[name=c-tipo]').forEach((r) => {
      r.checked = r.value === s.tipo;
      // Depois de confirmada, a proposta já virou evento ou campanha: o tipo não muda mais.
      r.disabled = s.status === 'confirmada';
    });
    alternarTipoC();
    $('c-iniciativa').value = s.nomeIniciativa; $('c-data').value = s.dataPretendida || '';
    $('c-inicio').value = s.periodoInicio || ''; $('c-fim').value = s.periodoFim || '';
    $('c-objetivo').value = s.objetivo; $('c-recursos').value = s.recursosEsperados || '';
    $('c-nome').value = s.nomeContato; $('c-email').value = s.email || ''; $('c-telefone').value = s.telefone || '';
    Mascaras.aplicarEm(formC);
    $('c-telefone').dispatchEvent(new Event('input'));
    mostrar('corrigir');
    $('c-iniciativa').focus();
  }

  formC.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    Utils.clearAllErrors(formC);
    const corpo = {
      tipo: tipoC(), nomeIniciativa: $('c-iniciativa').value.trim(), dataPretendida: $('c-data').value,
      periodoInicio: $('c-inicio').value, periodoFim: $('c-fim').value, objetivo: $('c-objetivo').value.trim(),
      recursosEsperados: $('c-recursos').value.trim(), nomeContato: $('c-nome').value.trim(),
      email: $('c-email').value.trim(), telefone: $('c-telefone').value,
    };
    try {
      await Api.put(`/api/admin/solicitacoes/${atual.id}`, corpo, { form: formC });
      Utils.toast('Dados corrigidos. A versão anterior ficou no histórico.');
      await abrir(atual.id);
      carregar();
    } catch (erro) { if (!erro.campos.length) Utils.toast(erro.message, 'danger'); }
  });

  carregar();
});
