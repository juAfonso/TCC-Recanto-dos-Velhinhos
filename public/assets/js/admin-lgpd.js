/* Privacidade (LGPD) no Painel (US11, FR-053 a FR-057, FR-061).
   Busca do titular, revogação de consentimento, anonimização (irreversível, com retenção
   justificada), fila de retenção e publicação de nova versão do aviso. */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const e = (t) => Utils.escapeHtml(t);
  const ROTULO = {
    pessoa: 'Pessoa cadastrada', cadastro_voluntario: 'Cadastro de voluntário', candidatura: 'Candidatura a vaga',
    solicitacao: 'Proposta externa', curriculo: 'Currículo',
  };
  const PAPEL = { funcionario: 'funcionário', voluntario: 'voluntário', doador_associado: 'doador associado' };
  const RETEM = new Set(['pessoa', 'cadastro_voluntario', 'candidatura']);
  const SITUACAO = {
    pendente: 'em análise', em_analise: 'em análise', entrevista: 'em entrevista', aguardando_contato: 'aguardando contato',
    aprovado: 'aprovado', aprovada: 'aprovada', confirmada: 'confirmada', rejeitado: 'rejeitado', rejeitada: 'rejeitada',
    encerrado_titular: 'encerrado a pedido do titular', encerrada_titular: 'encerrada a pedido do titular',
  };
  const cpfFmt = (c) => (c && /^\d{11}$/.test(c) ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : c || '');
  let ultimaBusca = '';

  // ---- Busca do titular ----
  async function buscar(q) {
    const caixa = $('resultados');
    caixa.innerHTML = '<p class="cell-muted">Buscando…</p>';
    try {
      const r = await Api.get(`/api/admin/lgpd/titulares?q=${encodeURIComponent(q)}`, { form: $('form-busca') });
      ultimaBusca = q;
      caixa.innerHTML = r.registros.map(cartao).join('')
        || '<p class="cell-muted" style="margin-top:10px;">Nada encontrado. Confira a grafia do nome (sem abreviar), o CPF com os 11 números ou o e-mail completo.</p>';
    } catch (erro) {
      caixa.innerHTML = erro.campos.length ? '' : `<p>${e(erro.message)}</p>`;
    }
  }

  function cartao(x) {
    const papeis = x.papeis.map((p) => `${PAPEL[p.tipo] || p.tipo} (${p.status})`).join(', ');
    const anon = x.anonimizadoEm
      ? `<p class="form-hint">Anonimizado em ${Utils.formatDateTime(x.anonimizadoEm)}${x.anonimizacao?.camposRetidos.length
        ? ` — retidos: ${e(x.anonimizacao.camposRetidos.join(', '))}. Justificativa: ${e(x.anonimizacao.justificativa.replace(/\.$/, ''))}` : ''}.</p>` : '';
    const consentimentos = x.consentimentos.map((c) => `
      <li style="margin:4px 0;">Aceitou o aviso ${e(c.avisoVersao)} em ${Utils.formatDateTime(c.aceitoEm)}
        ${c.revogadoEm ? `<span class="badge badge-neutral">revogado em ${Utils.formatDate(c.revogadoEm)}</span>`
          : `<button type="button" class="link-btn" data-revogar="${c.id}" data-alvo="${x.alvo}">Registrar revogação</button>`}
      </li>`).join('') || '<li class="cell-muted">Nenhum consentimento registrado.</li>';
    return `
      <div class="panel" style="margin-top:12px;padding:14px 16px;">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div>
            <b>${e(ROTULO[x.alvo])}</b>${x.protocolo ? ` · ${e(x.protocolo)}` : ''}${x.status ? ` · ${e(SITUACAO[x.status] || x.status)}` : ''}
            <div>${e(x.nome)}${x.cpf ? ` · CPF ${e(cpfFmt(x.cpf))}` : ''}${x.email ? ` · ${e(x.email)}` : ''}</div>
            ${papeis ? `<div class="form-hint">Papéis: ${e(papeis)}</div>` : ''}
            ${anon}
          </div>
          ${x.anonimizadoEm ? '' : `<div><button type="button" class="btn btn-danger-outline btn-sm" data-anonimizar="${x.id}" data-alvo="${x.alvo}" data-nome="${e(x.nome)}">Anonimizar…</button></div>`}
        </div>
        <ul style="margin:8px 0 0 18px;font-size:.9rem;">${consentimentos}</ul>
      </div>`;
  }

  $('form-busca').addEventListener('submit', (ev) => {
    ev.preventDefault();
    Utils.clearAllErrors($('form-busca'));
    buscar($('busca-q').value.trim());
  });

  const EFEITO = {
    pessoa: 'O doador associado perde o acesso ao autoatendimento e todos os aceites dele são revogados.',
    cadastro_voluntario: 'Se o cadastro estiver em triagem, sai da fila. Se o voluntário estiver ativo, é inativado.',
    candidatura: 'Se a candidatura estiver em triagem, sai da fila.',
    solicitacao: 'Se a proposta estiver em triagem, sai da fila.',
  };
  const RESULTADO = {
    submissao_encerrada: 'Revogação registrada. O cadastro saiu da fila de triagem.',
    voluntario_inativado: 'Revogação registrada. O voluntário foi inativado.',
    doador_encerrado: 'Revogação registrada. O doador perdeu o acesso ao autoatendimento.',
    nenhum: 'Revogação registrada.',
  };

  $('resultados').addEventListener('click', async (ev) => {
    const rev = ev.target.closest('[data-revogar]');
    if (rev) {
      if (!confirm(`Registrar a revogação do consentimento?\n\n${EFEITO[rev.dataset.alvo]}\n\nOs dados NÃO são apagados (isso é outro pedido). Confira antes a identidade de quem pediu.`)) return;
      try {
        const r = await Api.post(`/api/admin/consentimentos/${rev.dataset.revogar}/revogar`, {});
        Utils.toast(RESULTADO[r.efeito]);
        buscar(ultimaBusca);
        carregarRetencao();
      } catch (erro) { Utils.toast(erro.message, 'danger'); }
    }
    const an = ev.target.closest('[data-anonimizar]');
    if (an) abrirAnonimizacao({ alvo: an.dataset.alvo, id: an.dataset.anonimizar, nome: an.dataset.nome });
  });

  // ---- Anonimização ----
  const formA = $('form-anonimizar');
  let alvoAtual = null;
  const O_QUE = {
    pessoa: 'Nome, CPF, contatos e data de nascimento da pessoa viram "[anonimizado]", e o mesmo vale para os cadastros e candidaturas dela. O acesso é desligado. As doações continuam, sem o nome de quem doou.',
    cadastro_voluntario: 'Nome, CPF, RG, endereço e contatos do cadastro viram "[anonimizado]".',
    candidatura: 'Nome, CPF e contatos viram "[anonimizado]" e o currículo é apagado do armazenamento.',
    curriculo: 'Só o currículo (arquivo e texto) é apagado. O resto da candidatura continua.',
    solicitacao: 'Nome, contatos e objetivo da proposta viram "[anonimizado]". O nome do evento e as datas continuam.',
  };

  function abrirAnonimizacao(x) {
    alvoAtual = x;
    Utils.clearAllErrors(formA);
    formA.reset();
    $('modal-anon-titulo').textContent = `Anonimizar: ${x.nome || ROTULO[x.alvo]}`;
    $('anon-o-que').textContent = O_QUE[x.alvo];
    $('anon-reter-grupo').hidden = !RETEM.has(x.alvo);
    $('anon-justificativa-grupo').hidden = true;
    openModal('modal-anonimizar');
  }

  const retidos = () => [...formA.querySelectorAll('input[name=reter]:checked')].map((c) => c.value);
  formA.querySelectorAll('input[name=reter]').forEach((c) => c.addEventListener('change', () => {
    $('anon-justificativa-grupo').hidden = retidos().length === 0;
  }));

  formA.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    Utils.clearAllErrors(formA);
    if (!$('anon-confirmo').checked) {
      Utils.setFieldError($('anon-confirmo').closest('.form-group'), 'Marque para confirmar.');
      return;
    }
    const corpo = { alvo: alvoAtual.alvo, id: alvoAtual.id };
    if (RETEM.has(alvoAtual.alvo) && retidos().length) {
      corpo.reter = retidos();
      corpo.justificativaRetencao = $('anon-justificativa').value.trim();
    }
    try {
      const r = await Api.post('/api/admin/anonimizacoes', corpo, { form: formA });
      closeModal('modal-anonimizar');
      Utils.toast(r.alcancados ? `Anonimizado, junto com ${r.alcancados} cadastro(s) ligado(s).` : 'Anonimizado.');
      if (ultimaBusca) buscar(ultimaBusca);
      carregarRetencao();
    } catch (erro) { if (!erro.campos.length) Utils.toast(erro.message, 'danger'); }
  });

  // ---- Fila de retenção ----
  async function carregarRetencao() {
    const tbody = $('retencao-tbody');
    try {
      const r = await Api.get('/api/admin/retencao');
      $('retencao-resumo').textContent = `Prazo atual: ${r.meses} meses depois do fim da triagem (ou da contratação, para o currículo). Anonimize um por um.`;
      tbody.innerHTML = r.itens.map((i) => `
        <tr>
          <td class="cell-muted">${e(i.protocolo)}</td>
          <td>${e(i.nome)}</td>
          <td>${e(i.descricao)}</td>
          <td class="cell-muted">${Utils.formatDate(i.desde)}</td>
          <td><button class="btn btn-danger-outline btn-sm" data-anonimizar="${i.id}" data-alvo="${i.alvo}" data-nome="${e(i.nome)}">Anonimizar…</button></td>
        </tr>`).join('')
        || '<tr><td colspan="5"><div class="empty-state"><p>Nenhum registro com prazo vencido.</p></div></td></tr>';
    } catch (erro) {
      tbody.innerHTML = `<tr><td colspan="5">${e(erro.message)}</td></tr>`;
    }
  }
  $('retencao-tbody').addEventListener('click', (ev) => {
    const an = ev.target.closest('[data-anonimizar]');
    if (an) abrirAnonimizacao({ alvo: an.dataset.alvo, id: an.dataset.anonimizar, nome: an.dataset.nome });
  });

  // ---- Aviso de privacidade ----
  async function carregarAviso() {
    try {
      const r = await Api.get('/api/admin/aviso-privacidade');
      const [vigente, ...antigas] = r.versoes;
      $('aviso-vigente').innerHTML = vigente ? `
        <p><b>Vigente:</b> versão ${e(vigente.versao)}, publicada em ${Utils.formatDateTime(vigente.publicadoEm)} por ${e(vigente.publicadoPor)} · ${vigente.aceites} aceite(s).</p>
        ${/^RASCUNHO/.test(vigente.texto) ? '<div class="alert alert-warning" style="margin-top:8px;"><span aria-hidden="true">⚠️</span><div>O aviso no site ainda é o <b>rascunho provisório</b>. Publique o texto aprovado pela instituição.</div></div>' : ''}` : '';
      if (vigente && !$('aviso-texto').value) $('aviso-texto').value = vigente.texto;
      $('aviso-versoes').innerHTML = antigas.map((v) => `
        <p style="margin-top:8px;">Versão ${e(v.versao)} — ${Utils.formatDateTime(v.publicadoEm)} · ${v.aceites} aceite(s)</p>`).join('')
        || '<p class="cell-muted" style="margin-top:8px;">Nenhuma versão anterior.</p>';
    } catch (erro) { $('aviso-vigente').textContent = erro.message; }
  }

  $('form-aviso').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    Utils.clearAllErrors($('form-aviso'));
    if (!confirm('Publicar esta nova versão do aviso de privacidade?\n\nEla passa a valer no site agora, e os próximos envios de formulário vão registrar o aceite desta versão.')) return;
    try {
      const r = await Api.post('/api/admin/aviso-privacidade', { texto: $('aviso-texto').value }, { form: $('form-aviso') });
      Utils.toast(`Versão ${r.versao} publicada.`);
      carregarAviso();
    } catch (erro) { if (!erro.campos.length) Utils.toast(erro.message, 'danger'); }
  });

  carregarRetencao();
  carregarAviso();
});
