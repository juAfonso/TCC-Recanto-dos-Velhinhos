/* Usuários (US7, CSU04 — FR-023, FR-023a, FR-024, FR-037, FR-037a, FR-048).
   Uma pessoa por CPF, com papéis. Cadastro direto de funcionário ou voluntário, sem triagem.
   Inativar e reativar é papel por papel (2026-10-07). Não existe excluir (FR-024).
   O Painel não cria doador associado: a conta nasce com a primeira doação associativa. */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const e = (t) => Utils.escapeHtml(t);
  const tbody = $('usuarios-tbody');
  const TIPOS = ['Atividades recreativas', 'Oficinas de artesanato', 'Leitura e contação de histórias',
    'Acompanhamento aos idosos', 'Apoio em eventos e campanhas', 'Manutenção predial', 'Apoio administrativo'];
  const PAPEL = { funcionario: 'Funcionário', voluntario: 'Voluntário', doador_associado: 'Doador associado' };
  const SITUACAO_PAPEL = { ativo: ['badge-success', 'Ativo'], inativo: ['badge-neutral', 'Inativo'], encerrado: ['badge-neutral', 'Encerrado'] };
  const SUBMISSAO = {
    pendente: 'Pendente', entrevista: 'Em entrevista', aprovado: 'Aprovado', rejeitado: 'Rejeitado',
    encerrado_titular: 'Encerrado a pedido', em_analise: 'Em análise', aprovada: 'Aprovada', rejeitada: 'Rejeitada',
    encerrada_titular: 'Encerrada a pedido',
  };
  const CARGO = { limpeza: 'Limpeza', cuidador: 'Cuidador(a)', enfermagem: 'Enfermagem', cozinha: 'Cozinha' };
  const cpfFmt = (c) => (c || '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  const telFmt = (t) => (t || '').replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
  let atual = null; // pessoa aberta no detalhe
  let pessoaDoPapel = null; // pessoa que está ganhando o papel de voluntário (ou null = cadastro novo)
  let cadastroFeito = null; // cadastro de voluntário recém-criado, para imprimir

  /* ---------- Lista ---------- */
  let espera;
  async function carregar() {
    tbody.innerHTML = '<tr><td colspan="6" class="cell-muted">Carregando…</td></tr>';
    const busca = encodeURIComponent($('busca-usuario').value.trim());
    const situacao = $('filtro-situacao').value;
    const papel = $('filtro-papel').value;
    try {
      const r = await Api.get(`/api/admin/pessoas?busca=${busca}&situacao=${situacao}&papel=${papel}`);
      $('mais-resultados').hidden = !r.maisResultados;
      tbody.innerHTML = r.pessoas.map((p) => `
        <tr>
          <td><strong>${e(p.nome)}</strong>${p.ativo ? '' : ' <span class="badge badge-neutral">Inativo</span>'}</td>
          <td class="cell-muted">${cpfFmt(p.cpf)}</td>
          <td class="cell-muted">${e(p.email || '—')}</td>
          <td class="cell-muted">${telFmt(p.telefone) || '—'}</td>
          <td>${p.papeis.filter((x) => x.status !== 'encerrado').map((x) =>
            `<span class="badge ${x.status === 'ativo' ? 'badge-info' : 'badge-neutral'}">${PAPEL[x.tipo]}${x.status === 'inativo' ? ' (inativo)' : ''}</span>`).join(' ') || '—'}</td>
          <td><button class="btn btn-outline btn-sm" data-abrir="${p.id}">Abrir</button></td>
        </tr>`).join('')
        || '<tr><td colspan="6"><div class="empty-state"><p>Ninguém encontrado com essa busca.</p></div></td></tr>';
    } catch (erro) {
      tbody.innerHTML = `<tr><td colspan="6">${e(erro.message)}</td></tr>`;
    }
  }

  $('form-busca').addEventListener('submit', (ev) => { ev.preventDefault(); carregar(); });
  $('busca-usuario').addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(carregar, 350); });
  $('filtro-situacao').addEventListener('change', carregar);
  $('filtro-papel').addEventListener('change', carregar);
  tbody.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-abrir]');
    if (b) abrir(b.dataset.abrir);
  });

  /* ---------- Detalhe ---------- */
  async function abrir(id) {
    try {
      atual = await Api.get(`/api/admin/pessoas/${id}`);
    } catch (erro) { Utils.toast(erro.message, 'danger'); return; }
    $('form-corrigir').hidden = true;
    $('pessoa-detalhe').hidden = false;
    renderDetalhe();
    openModal('modal-pessoa');
  }

  function renderDetalhe() {
    const p = atual;
    $('modal-pessoa-titulo').textContent = p.nome;
    $('pessoa-situacao').innerHTML = (p.anonimizado ? '<span class="badge badge-neutral">Anonimizado</span>'
      : p.ativo ? '<span class="badge badge-success">Ativo</span>' : '<span class="badge badge-neutral">Inativo — nenhum papel ativo</span>')
      + `<span class="cell-muted" style="font-size:.8rem;"> · cadastrado por ${e(p.criadoPor)} em ${Utils.formatDateTime(p.criadoEm)}</span>`;

    const linhas = [
      ['Nome', p.nome], ['CPF', cpfFmt(p.cpf)],
      ['Nascimento', p.dataNascimento ? Utils.formatDay(p.dataNascimento) : '—'],
      ['Telefone', telFmt(p.telefone)], ['E-mail', p.email],
      ['Conta do autoatendimento', p.papeis.some((x) => x.tipo === 'doador_associado') ? (p.contaDoador ? 'Senha criada' : 'Senha ainda não criada') : 'Não tem'],
      ['Doações associativas', p.papeis.some((x) => x.tipo === 'doador_associado') ? `${p.doacoes.confirmadas} confirmada(s), ${p.doacoes.pendentes} pendente(s) de conferência` : '—'],
    ];
    $('pessoa-dados').innerHTML = linhas.map(([rotulo, valor]) =>
      `<dt style="font-weight:700;">${e(rotulo)}</dt><dd>${e(valor || '—')}</dd>`).join('');

    $('pessoa-papeis').innerHTML = p.papeis.map((x) => {
      const [cls, rotulo] = SITUACAO_PAPEL[x.status];
      let acao = '';
      if (!p.anonimizado && x.status === 'ativo') acao = `<button class="btn btn-danger-outline btn-sm" data-inativar="${x.tipo}">Inativar</button>`;
      if (!p.anonimizado && x.status === 'inativo') acao = `<button class="btn btn-outline btn-sm" data-reativar="${x.tipo}">Reativar</button>`;
      const fim = x.fimEm ? ` até ${Utils.formatDate(x.fimEm)}` : '';
      return `<tr><td>${PAPEL[x.tipo]}</td><td><span class="badge ${cls}">${rotulo}</span></td>
        <td class="cell-muted">${Utils.formatDate(x.inicioEm)}${fim}</td><td>${acao || '<span class="cell-muted">—</span>'}</td></tr>`;
    }).join('') || '<tr><td colspan="4" class="cell-muted">Nenhum papel.</td></tr>';

    const blocos = [];
    if (p.cadastrosVoluntario.length) {
      blocos.push(`<h4 style="margin:20px 0 8px;">Cadastros de voluntário</h4><ul style="margin-left:20px;line-height:1.7;">${p.cadastrosVoluntario.map((c) => `
        <li>${e(c.protocolo)} — ${SUBMISSAO[c.status]} (${c.origem === 'painel' ? 'cadastrado no Painel' : 'enviado pelo site'}, ${Utils.formatDate(c.criadoEm)})
          ${c.menorDeIdade && c.autorizacaoStatus === 'pendente' ? ' <span class="badge badge-warning">Autorização pendente</span>' : ''}
          <button class="btn btn-outline btn-sm" data-imprimir="${c.id}" data-menor="${c.menorDeIdade ? '1' : ''}">Imprimir termo</button></li>`).join('')}</ul>
        <p class="form-hint">Decisões sobre cadastros pendentes ficam em <a href="triagem-voluntarios.html">Triagem › Voluntários</a>.</p>`);
    }
    if (p.candidaturas.length) {
      blocos.push(`<h4 style="margin:20px 0 8px;">Candidaturas a vaga</h4><ul style="margin-left:20px;line-height:1.7;">${p.candidaturas.map((c) =>
        `<li>${e(c.protocolo)} — ${CARGO[c.cargo] || e(c.cargo)}, ${SUBMISSAO[c.status]} (${Utils.formatDate(c.criadoEm)})</li>`).join('')}</ul>`);
    }
    if (p.consentimentos.length) {
      blocos.push(`<h4 style="margin:20px 0 8px;">Consentimentos (LGPD)</h4><ul style="margin-left:20px;line-height:1.7;">${p.consentimentos.map((c) =>
        `<li>Aviso ${e(c.avisoVersao)}, aceito em ${Utils.formatDateTime(c.aceitoEm)}${c.revogadoEm ? ` — <b>revogado</b> em ${Utils.formatDateTime(c.revogadoEm)}` : ''}</li>`).join('')}</ul>`);
    }
    if (p.historico.length) {
      blocos.push(`<h4 style="margin:20px 0 8px;">Correções anteriores</h4><ul style="margin-left:20px;line-height:1.7;font-size:.9rem;">${p.historico.map((h) => {
        const a = h.anterior;
        const antes = [a.nome, a.email, telFmt(a.telefone), a.dataNascimento ? Utils.formatDay(a.dataNascimento) : ''].filter(Boolean).map(e).join(' · ');
        return `<li>${Utils.formatDateTime(h.alteradoEm)} por ${e(h.alteradoPor)} — antes: ${antes}</li>`;
      }).join('')}</ul>`);
    }
    $('pessoa-extras').innerHTML = blocos.join('');

    const acoes = [];
    if (!p.anonimizado) {
      acoes.push(['corrigir', 'btn-outline', 'Corrigir dados']);
      const tem = (tipo) => p.papeis.some((x) => x.tipo === tipo && x.status !== 'encerrado');
      if (!tem('funcionario')) acoes.push(['papel-funcionario', 'btn-outline', 'Tornar funcionário']);
      if (!tem('voluntario') && !tem('funcionario')) acoes.push(['papel-voluntario', 'btn-outline', 'Tornar voluntário']);
    }
    $('pessoa-acoes').innerHTML = acoes.map(([acao, cls, rotulo]) =>
      `<button type="button" class="btn ${cls} btn-sm" data-acao="${acao}">${rotulo}</button>`).join('')
      || '<span class="cell-muted">Cadastro anonimizado: só consulta.</span>';
  }

  // Ação que pode pedir confirmação (FR-023a): 409 com confirmarAviso → pergunta → repete com confirmar.
  async function comConfirmacao(url, corpo) {
    try {
      return await Api.post(url, corpo);
    } catch (erro) {
      if (erro.status === 409 && erro.dados.confirmarAviso) {
        if (!confirm(erro.message)) return null;
        return Api.post(url, { ...corpo, confirmar: true });
      }
      throw erro;
    }
  }

  async function depoisDeMudar(mensagem) {
    Utils.toast(mensagem);
    await abrir(atual.id);
    carregar();
  }

  $('pessoa-papeis').addEventListener('click', async (ev) => {
    const ina = ev.target.closest('[data-inativar]');
    const rea = ev.target.closest('[data-reativar]');
    try {
      if (ina) {
        const tipo = ina.dataset.inativar;
        const efeito = tipo === 'doador_associado' ? ' Ela perde o acesso ao autoatendimento.' : '';
        if (!confirm(`Inativar ${atual.nome} como ${PAPEL[tipo].toLowerCase()}?${efeito} Os dados ficam guardados e dá para reativar.`)) return;
        if (await comConfirmacao(`/api/admin/pessoas/${atual.id}/inativar`, { papel: tipo })) await depoisDeMudar('Papel inativado. Nada foi apagado.');
      }
      if (rea) {
        const tipo = rea.dataset.reativar;
        if (!confirm(`Reativar ${atual.nome} como ${PAPEL[tipo].toLowerCase()}?`)) return;
        await Api.post(`/api/admin/pessoas/${atual.id}/reativar`, { papel: tipo });
        await depoisDeMudar('Papel reativado.');
      }
    } catch (erro) { Utils.toast(erro.message, 'danger'); }
  });

  $('pessoa-extras').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-imprimir]');
    if (b) imprimir(b.dataset.imprimir, 'termo-adesao.html');
  });

  $('pessoa-acoes').addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-acao]');
    if (!b) return;
    if (b.dataset.acao === 'corrigir') abrirCorrecao();
    if (b.dataset.acao === 'papel-voluntario') abrirCadastro('voluntario', atual);
    if (b.dataset.acao === 'papel-funcionario') {
      if (!confirm(`Registrar ${atual.nome} como funcionário(a)?`)) return;
      try {
        if (await comConfirmacao(`/api/admin/pessoas/${atual.id}/papeis`, { tipo: 'funcionario' })) await depoisDeMudar('Papel de funcionário adicionado.');
      } catch (erro) { Utils.toast(erro.message, 'danger'); }
    }
  });

  /* ---------- Correção (FR-037) ---------- */
  const formC = $('form-corrigir');
  function abrirCorrecao() {
    Utils.clearAllErrors(formC);
    $('c-nome').value = atual.nome;
    $('c-nascimento').value = atual.dataNascimento || '';
    $('c-telefone').value = atual.telefone || '';
    $('c-email').value = atual.email || '';
    Mascaras.aplicarEm(formC);
    $('c-telefone').dispatchEvent(new Event('input'));
    $('pessoa-detalhe').hidden = true;
    formC.hidden = false;
    $('c-nome').focus();
  }
  $('btn-cancelar-correcao').addEventListener('click', () => { formC.hidden = true; $('pessoa-detalhe').hidden = false; });

  formC.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    Utils.clearAllErrors(formC);
    try {
      await Api.put(`/api/admin/pessoas/${atual.id}`, {
        nome: $('c-nome').value.trim(), dataNascimento: $('c-nascimento').value,
        telefone: $('c-telefone').value, email: $('c-email').value.trim(),
      }, { form: formC });
      await depoisDeMudar('Dados corrigidos. A versão anterior ficou no histórico.');
    } catch (erro) {
      if (!erro.campos.length) Utils.toast(erro.message, 'danger');
    }
  });

  /* ---------- Cadastro (FR-023) ---------- */
  const formN = $('form-cadastro');
  const perfil = () => formN.querySelector('input[name="perfil"]:checked').value;
  const menor = () => {
    const n = $('n-nascimento').value;
    if (!n) return false;
    const hoje = new Date();
    const [a, m, d] = n.split('-').map(Number);
    const idade = hoje.getFullYear() - a - ((hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) ? 1 : 0);
    return idade < 18;
  };

  function atualizarFormulario() {
    const vol = perfil() === 'voluntario';
    $('campos-voluntario').hidden = !vol;
    $('aviso-menor').hidden = !(vol && menor());
    $('grupo-servico-outro').hidden = $('n-servico').value !== 'Outro';
    $('dica-perfil').textContent = vol
      ? 'Os mesmos dados do termo de adesão do site (Lei 9.608/1998). Depois de salvar, imprima o termo para a pessoa assinar.'
      : 'Funcionário não tem acesso ao sistema: o cadastro é só o registro da pessoa.';
  }
  formN.addEventListener('change', atualizarFormulario);
  $('n-nascimento').addEventListener('input', atualizarFormulario);

  // `pessoa` preenchida = adicionar o papel de voluntário a quem já está cadastrado.
  function abrirCadastro(perfilInicial = 'funcionario', pessoa = null) {
    pessoaDoPapel = pessoa;
    formN.reset();
    Utils.clearAllErrors(formN);
    formN.hidden = false;
    $('cadastro-feito').hidden = true;
    formN.querySelector(`input[name="perfil"][value="${perfilInicial}"]`).checked = true;
    $('grupo-perfil').hidden = Boolean(pessoa);
    $('n-cpf').disabled = Boolean(pessoa);
    if (pessoa) {
      $('n-nome').value = pessoa.nome; $('n-cpf').value = pessoa.cpf; $('n-nascimento').value = pessoa.dataNascimento || '';
      $('n-telefone').value = pessoa.telefone || ''; $('n-email').value = pessoa.email || '';
    }
    $('modal-cadastro-titulo').textContent = pessoa ? `Tornar ${pessoa.nome} voluntário(a)` : 'Cadastrar pessoa';
    Mascaras.aplicarEm(formN);
    ['n-cpf', 'n-telefone'].forEach((id) => $(id).dispatchEvent(new Event('input')));
    atualizarFormulario();
    if (pessoa) closeModal('modal-pessoa');
    openModal('modal-cadastro');
    $('n-nome').focus();
  }
  $('btn-cadastrar').addEventListener('click', () => abrirCadastro());

  formN.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    Utils.clearAllErrors(formN);
    const corpo = {
      perfil: perfil(), nome: $('n-nome').value.trim(), cpf: $('n-cpf').value, dataNascimento: $('n-nascimento').value,
      telefone: $('n-telefone').value, email: $('n-email').value.trim(),
    };
    if (corpo.perfil === 'voluntario') {
      Object.assign(corpo, {
        rg: $('n-rg').value.trim(), escolaridade: $('n-escolaridade').value.trim(), profissao: $('n-profissao').value.trim(),
        endereco: $('n-endereco').value.trim(), bairro: $('n-bairro').value.trim(), cep: $('n-cep').value,
        cidade: $('n-cidade').value.trim(), uf: $('n-uf').value,
        tipoServico: $('n-servico').value, tipoServicoOutro: $('n-servico-outro').value.trim(),
        objetivos: $('n-objetivos').value.trim(), condicoes: $('n-condicoes').value.trim(),
      });
    }
    try {
      const r = pessoaDoPapel
        ? await Api.post(`/api/admin/pessoas/${pessoaDoPapel.id}/papeis`, { ...corpo, tipo: 'voluntario' }, { form: formN })
        : await Api.post('/api/admin/pessoas', corpo, { form: formN });
      carregar();
      if (corpo.perfil === 'funcionario') {
        closeModal('modal-cadastro');
        Utils.toast('Funcionário cadastrado.');
        abrir(r.id);
        return;
      }
      cadastroFeito = r;
      $('cadastro-feito-texto').innerHTML = r.status === 'aprovado'
        ? `<div>Voluntário(a) cadastrado(a) e já ativo(a). Protocolo <b>${e(r.protocolo)}</b>. Imprima o termo de adesão para a pessoa assinar.</div>`
        : `<div>Cadastro registrado como <b>pendente</b> (protocolo <b>${e(r.protocolo)}</b>): é menor de idade. Imprima o termo e a autorização; quando a autorização assinada chegar, marque como recebida e aprove em <a href="triagem-voluntarios.html">Triagem › Voluntários</a>.</div>`;
      $('btn-imprimir-autorizacao').hidden = r.autorizacaoStatus !== 'pendente';
      formN.hidden = true;
      $('cadastro-feito').hidden = false;
    } catch (erro) {
      if (erro.codigo === 'CPF_JA_CADASTRADO') {
        if (confirm(`${erro.message}\n\nAbrir o cadastro existente?`)) {
          closeModal('modal-cadastro');
          abrir(erro.dados.id);
        }
        return;
      }
      if (!erro.campos.length) Utils.toast(erro.message, 'danger');
    }
  });

  $('btn-imprimir-termo').addEventListener('click', () => imprimir(cadastroFeito.cadastroVoluntarioId, 'termo-adesao.html'));
  $('btn-imprimir-autorizacao').addEventListener('click', () => imprimir(cadastroFeito.cadastroVoluntarioId, 'autorizacao-menor.html'));

  // Mesmo caminho da triagem: dados do Painel → sessionStorage → aba de impressão (D17).
  async function imprimir(cadastroId, pagina) {
    try {
      const d = await Api.get(`/api/admin/voluntarios/${cadastroId}/impressao`);
      ImpressaoVoluntario.guardar(d);
      const aba = window.open(`../${pagina}`, '_blank');
      if (!aba) Utils.toast('O navegador bloqueou a janela. Permita pop-ups para este site e tente de novo.', 'warning');
      setTimeout(() => { try { sessionStorage.removeItem(ImpressaoVoluntario.CHAVE); } catch (err) { /* nada */ } }, 5000);
    } catch (erro) {
      Utils.toast(erro.message, 'danger');
    }
  }

  carregar();
});
