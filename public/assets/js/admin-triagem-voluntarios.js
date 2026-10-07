/* Triagem de voluntários (US4, FR-012 a FR-015, FR-037, FR-037a, FR-061).
   pendente → entrevista → aprovado | rejeitado. Menor só é aprovado com a autorização recebida. */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const e = (t) => Utils.escapeHtml(t);
  const tbody = $('voluntarios-tbody');
  const TIPOS = ['Atividades recreativas', 'Oficinas de artesanato', 'Leitura e contação de histórias',
    'Acompanhamento aos idosos', 'Apoio em eventos e campanhas', 'Manutenção predial', 'Apoio administrativo'];
  let filtro = 'pendente';
  let atual = null; // cadastro aberto no detalhe

  const SITUACAO = {
    pendente: ['badge-warning', 'Pendente'],
    entrevista: ['badge-info', 'Em entrevista'],
    aprovado: ['badge-success', 'Aprovado'],
    rejeitado: ['badge-danger', 'Rejeitado'],
    encerrado_titular: ['badge-neutral', 'Encerrado a pedido'],
  };
  const selo = (status) => `<span class="badge ${SITUACAO[status][0]}">${SITUACAO[status][1]}</span>`;
  const seloAutorizacao = (v) => (v.menorDeIdade
    ? (v.autorizacaoStatus === 'recebida'
      ? ' <span class="badge badge-success" title="Autorização do responsável recebida">Autorização ok</span>'
      : ' <span class="badge badge-warning" title="Autorização do responsável ainda não entregue">Autorização pendente</span>')
    : '');

  /* ---------- Lista ---------- */
  async function carregar() {
    tbody.innerHTML = '<tr><td colspan="7" class="cell-muted">Carregando…</td></tr>';
    try {
      const r = await Api.get(`/api/admin/voluntarios?status=${filtro}`);
      $('cont-pendente').textContent = r.contagem.pendente ? `(${r.contagem.pendente})` : '';
      $('cont-entrevista').textContent = r.contagem.entrevista ? `(${r.contagem.entrevista})` : '';
      tbody.innerHTML = r.voluntarios.map((v) => `
        <tr>
          <td class="cell-muted">${e(v.protocolo)}</td>
          <td>${e(v.nome)}${v.origem === 'painel' ? ' <span class="badge badge-neutral">Cadastrado no Painel</span>' : ''}</td>
          <td>${v.idade ?? '—'}${v.menorDeIdade ? ' <span class="badge badge-warning">Menor</span>' : ''}</td>
          <td>${e(v.tipoServico)}</td>
          <td class="cell-muted">${Utils.formatDate(v.criadoEm)}</td>
          <td>${selo(v.status)}${seloAutorizacao(v)}</td>
          <td><button class="btn btn-outline btn-sm" data-abrir="${v.id}">Ver e decidir</button></td>
        </tr>`).join('')
        || '<tr><td colspan="7"><div class="empty-state"><p>Nenhum cadastro nesta lista.</p></div></td></tr>';
    } catch (erro) {
      tbody.innerHTML = `<tr><td colspan="7">${e(erro.message)}</td></tr>`;
    }
  }

  document.querySelectorAll('.tabs-nav .tab-btn').forEach((btn) => btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs-nav .tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    filtro = btn.dataset.filtro;
    carregar();
  }));

  tbody.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-abrir]');
    if (b) abrir(b.dataset.abrir);
  });

  /* ---------- Detalhe ---------- */
  async function abrir(id) {
    try {
      atual = await Api.get(`/api/admin/voluntarios/${id}`);
    } catch (erro) { Utils.toast(erro.message, 'danger'); return; }
    $('form-corrigir').hidden = true;
    $('vol-detalhe').hidden = false;
    renderDetalhe();
    openModal('modal-voluntario');
  }

  function renderDetalhe() {
    const v = atual;
    $('modal-vol-titulo').textContent = `${v.nome} — ${v.protocolo}`;
    const autorizacao = v.menorDeIdade
      ? (v.autorizacaoStatus === 'recebida'
        ? `Recebida por ${e(v.autorizacaoRecebidaPor)} em ${Utils.formatDateTime(v.autorizacaoRecebidaEm)}`
        : '<b>Pendente</b> — o responsável ainda não entregou a autorização assinada')
      : 'Não se aplica (maior de idade)';
    $('vol-situacao').innerHTML = `${selo(v.status)} ${v.origem === 'painel' ? '<span class="badge badge-neutral">Cadastrado no Painel</span>' : '<span class="badge badge-neutral">Enviado pelo site</span>'}
      ${v.triadoEm ? `<span class="cell-muted" style="font-size:.8rem;"> · última decisão por ${e(v.triadoPor)} em ${Utils.formatDateTime(v.triadoEm)}</span>` : ''}
      ${v.motivoRejeicao ? `<p class="form-hint" style="margin-top:6px;">Motivo da rejeição: ${e(v.motivoRejeicao)}</p>` : ''}`;

    const cpf = (v.cpf || '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    const tel = (v.telefone || '').replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
    const linhas = [
      ['Nome', v.nome], ['Nascimento', `${Utils.formatDay(v.dataNascimento)} (${v.idade} anos)`], ['CPF', cpf], ['RG', v.rg],
      ['Escolaridade', v.escolaridade], ['Profissão', v.profissao],
      ['Endereço', `${v.endereco}, ${v.bairro} — ${v.cidade}/${v.uf}, CEP ${(v.cep || '').replace(/(\d{5})(\d{3})/, '$1-$2')}`],
      ['Telefone', tel], ['E-mail', v.email], ['Tipo de serviço', v.tipoServico],
      ['Objetivos', v.objetivos], ['Dias e horários', v.condicoes],
      ['Autorização do responsável', null, autorizacao],
      ['Recebido em', Utils.formatDateTime(v.criadoEm)],
      ['Consentimento (LGPD)', v.consentimento ? `aviso ${v.consentimento.avisoVersao}, aceito em ${Utils.formatDateTime(v.consentimento.aceitoEm)}` : '—'],
    ];
    $('vol-dados').innerHTML = linhas.map(([rotulo, valor, html]) =>
      `<dt style="font-weight:700;">${e(rotulo)}</dt><dd>${html ?? e(valor || '—')}</dd>`).join('');

    const acoes = [];
    if (!v.anonimizado) {
      if (v.status === 'pendente' && v.origem !== 'painel') acoes.push(['entrevista', 'btn-viridian', 'Chamar para entrevista']);
      const podeAprovar = v.status === 'entrevista' || (v.status === 'pendente' && v.origem === 'painel');
      if (podeAprovar) acoes.push(['aprovar', 'btn-viridian', 'Aprovar']);
      if (['pendente', 'entrevista'].includes(v.status)) acoes.push(['rejeitar', 'btn-danger-outline', 'Rejeitar']);
      if (v.menorDeIdade && v.autorizacaoStatus === 'pendente' && ['pendente', 'entrevista'].includes(v.status)) {
        acoes.push(['autorizacao-recebida', 'btn-outline', 'Marcar autorização como recebida']);
      }
      acoes.push(['imprimir-termo', 'btn-outline', 'Imprimir termo de adesão']);
      if (v.menorDeIdade) acoes.push(['imprimir-autorizacao', 'btn-outline', 'Imprimir autorização do responsável']);
      acoes.push(['corrigir', 'btn-outline', 'Corrigir dados']);
    }
    $('vol-acoes').innerHTML = acoes.map(([acao, cls, rotulo]) => `<button type="button" class="btn ${cls} btn-sm" data-acao="${acao}">${rotulo}</button>`).join('')
      || '<span class="cell-muted">Cadastro anonimizado: só consulta.</span>';
  }

  async function decidir(acao, corpo = {}) {
    try {
      const r = await Api.post(`/api/admin/voluntarios/${atual.id}/${acao}`, corpo);
      const avisoEmail = r.emailEnviado === false ? ' O e-mail para a pessoa falhou e ficou registrado para reenvio.' : '';
      Utils.toast(`Feito.${avisoEmail}`, avisoEmail ? 'warning' : 'success');
      await abrir(atual.id);
      carregar();
    } catch (erro) {
      Utils.toast(erro.message, 'danger');
    }
  }

  $('vol-acoes').addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-acao]');
    if (!b) return;
    const acao = b.dataset.acao;
    if (acao === 'entrevista' && confirm(`Chamar ${atual.nome} para entrevista? A pessoa recebe um e-mail avisando que a equipe vai entrar em contato.`)) decidir('entrevista');
    if (acao === 'aprovar' && confirm(`Aprovar ${atual.nome} como voluntário(a)? A pessoa recebe um e-mail com o resultado.`)) decidir('aprovar');
    if (acao === 'autorizacao-recebida' && confirm('Confirmar que a autorização assinada pelo responsável foi entregue na sede?')) decidir('autorizacao-recebida');
    if (acao === 'rejeitar') {
      $('rej-motivo').value = '';
      openModal('modal-rejeitar');
      $('rej-motivo').focus();
    }
    if (acao === 'imprimir-termo') imprimir('termo-adesao.html');
    if (acao === 'imprimir-autorizacao') imprimir('autorizacao-menor.html');
    if (acao === 'corrigir') abrirCorrecao();
  });

  $('form-rejeitar').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    closeModal('modal-rejeitar');
    await decidir('rejeitar', { motivo: $('rej-motivo').value.trim() });
  });

  // Documentos para imprimir (termo de adesão e autorização): os dados vêm do Painel e vão para a
  // página de impressão pelo sessionStorage, que a aba nova aberta por window.open herda (D17).
  async function imprimir(pagina) {
    try {
      const d = await Api.get(`/api/admin/voluntarios/${atual.id}/impressao`);
      // Grava ANTES de abrir: a aba nova copia o sessionStorage no momento em que é criada.
      ImpressaoVoluntario.guardar(d);
      const aba = window.open(`../${pagina}`, '_blank');
      if (!aba) Utils.toast('O navegador bloqueou a janela. Permita pop-ups para este site e tente de novo.', 'warning');
      setTimeout(() => { try { sessionStorage.removeItem(ImpressaoVoluntario.CHAVE); } catch (e) { /* nada */ } }, 5000);
    } catch (erro) {
      Utils.toast(erro.message, 'danger');
    }
  }

  /* ---------- Correção de dados ---------- */
  const formC = $('form-corrigir');
  function abrirCorrecao() {
    const v = atual;
    Utils.clearAllErrors(formC);
    $('c-nome').value = v.nome; $('c-nascimento').value = v.dataNascimento; $('c-cpf').value = v.cpf;
    $('c-rg').value = v.rg; $('c-escolaridade').value = v.escolaridade || ''; $('c-profissao').value = v.profissao || '';
    $('c-endereco').value = v.endereco; $('c-bairro').value = v.bairro; $('c-cep').value = v.cep;
    $('c-cidade').value = v.cidade; $('c-uf').value = v.uf; $('c-telefone').value = v.telefone; $('c-email').value = v.email;
    $('c-servico').value = v.tipoServico; $('c-objetivos').value = v.objetivos || ''; $('c-condicoes').value = v.condicoes || '';
    Mascaras.aplicarEm(formC);
    ['c-cpf', 'c-cep', 'c-telefone'].forEach((id) => $(id).dispatchEvent(new Event('input')));
    $('vol-detalhe').hidden = true;
    formC.hidden = false;
    $('c-nome').focus();
  }
  $('btn-cancelar-correcao').addEventListener('click', () => { formC.hidden = true; $('vol-detalhe').hidden = false; });

  formC.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    Utils.clearAllErrors(formC);
    const servico = $('c-servico').value.trim();
    const corpo = {
      nome: $('c-nome').value.trim(), dataNascimento: $('c-nascimento').value, cpf: $('c-cpf').value,
      rg: $('c-rg').value.trim(), escolaridade: $('c-escolaridade').value.trim(), profissao: $('c-profissao').value.trim(),
      endereco: $('c-endereco').value.trim(), bairro: $('c-bairro').value.trim(), cep: $('c-cep').value,
      cidade: $('c-cidade').value.trim(), uf: $('c-uf').value, telefone: $('c-telefone').value, email: $('c-email').value.trim(),
      tipoServico: TIPOS.includes(servico) ? servico : 'Outro', tipoServicoOutro: TIPOS.includes(servico) ? '' : servico,
      objetivos: $('c-objetivos').value.trim(), condicoes: $('c-condicoes').value.trim(),
    };
    try {
      await Api.put(`/api/admin/voluntarios/${atual.id}`, corpo, { form: formC });
      Utils.toast('Dados corrigidos. A versão anterior ficou no histórico.');
      await abrir(atual.id);
      carregar();
    } catch (erro) {
      if (!erro.campos.length) Utils.toast(erro.message, 'danger');
    }
  });

  carregar();
});
