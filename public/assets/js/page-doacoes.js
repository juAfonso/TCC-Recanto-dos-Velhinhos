/* Página de doações: itens necessários (US1) e doação via Pix estático (US2).
   O pagamento acontece no app do banco; o site só registra a DECLARAÇÃO do doador
   ("Já fiz o Pix"), que nasce pendente até a equipe conferir no extrato (FR-008). */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Lista de itens necessários (físicos) — US1 ---------- */
  const itensLista = document.getElementById('itens-lista');
  if (itensLista) {
    Api.get('/api/public/itens-necessarios')
      .then(({ itens }) => {
        itensLista.innerHTML = itens.map(i => PortalCards.item(i, { comData: true })).join('')
          || '<p class="cell-muted">Nenhuma necessidade cadastrada no momento.</p>';
      })
      .catch(() => { itensLista.innerHTML = PortalCards.erro(); });
  }

  /* ---------- Fluxo de doação Pix — US2 ---------- */
  const stepperEl = document.getElementById('donation-stepper');
  if (!stepperEl) return;

  const $ = (id) => document.getElementById(id);
  const formDoador = $('form-doador');
  let chavePix = null;
  let rascunho = { tipo: 'espontanea', valor: null, doador: null };
  // Doador associado logado (US9): doa sem redigitar dados. Se houver aviso de privacidade novo,
  // aceita a versão nova aqui mesmo (decisão de 2026-10-07).
  let logado = null;

  const steps = document.querySelectorAll('.donation-step');
  const stepperItems = document.querySelectorAll('#donation-stepper .step');

  function irPara(n) {
    steps.forEach(s => { s.style.display = Number(s.dataset.step) === n ? 'block' : 'none'; });
    stepperItems.forEach(s => {
      const num = Number(s.dataset.step);
      s.classList.toggle('active', num === n);
      s.classList.toggle('done', num < n);
    });
    // Leva o foco para o passo novo (leitor de tela e teclado — Princípio II).
    const passo = document.querySelector(`.donation-step[data-step="${n}"]`);
    const alvo = passo.querySelector('input:not([type=hidden]), button, a');
    if (alvo) alvo.focus({ preventScroll: true });
    stepperEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* Sem chave Pix: nada de QR nem de botão (FR-007a) */
  Api.get('/api/public/pix')
    .then((pix) => {
      if (pix.disponivel) { chavePix = pix; return; }
      $('pix-fluxo').style.display = 'none';
      $('pix-contato').textContent = pix.contato || 'pelo telefone ou e-mail da página Institucional.';
      $('pix-indisponivel').style.display = 'flex';
    })
    .catch(() => {
      $('pix-fluxo').style.display = 'none';
      $('pix-contato').textContent = 'pelo telefone ou e-mail da página Institucional.';
      $('pix-indisponivel').style.display = 'flex';
    });

  /* Valores sugeridos */
  document.querySelectorAll('.valor-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      $('valorDoacao').value = btn.dataset.valor + ',00';
      Utils.clearFieldError($('valorDoacao').closest('.form-group'));
    });
  });

  /* Radio cards */
  function tipoEscolhido() {
    return document.querySelector('input[name="tipoDoacao"]:checked').value;
  }
  function syncRadioCards() {
    const tipo = tipoEscolhido();
    $('card-espontanea').classList.toggle('selected', tipo === 'espontanea');
    $('card-associativa').classList.toggle('selected', tipo === 'associativa');
  }
  document.querySelectorAll('input[name="tipoDoacao"]').forEach(r => r.addEventListener('change', () => { syncRadioCards(); mostrarAceiteNovo(); }));
  syncRadioCards();

  function mostrarAceiteNovo() {
    const caixa = $('aceite-aviso-novo');
    if (caixa) caixa.hidden = !(logado && logado.avisoPendente && tipoEscolhido() === 'associativa');
  }

  Auth.verificarDoador().then((r) => {
    if (!r.logado) return;
    logado = r;
    const primeiro = Utils.escapeHtml(r.nome.split(' ')[0]);
    $('card-associativa').querySelector('.desc').innerHTML =
      `Você entrou como <b>${primeiro}</b>: a doação vai para o seu histórico, sem precisar digitar seus dados.`;
    document.querySelector('input[name="tipoDoacao"][value="associativa"]').checked = true;
    syncRadioCards();
    $('donation-stepper').querySelector('.step[data-step="2"]').hidden = true;
    if (r.avisoPendente) {
      const caixa = document.createElement('div');
      caixa.className = 'form-group';
      caixa.id = 'aceite-aviso-novo';
      caixa.innerHTML = `
        <label class="checkbox-line" for="aceite-novo">
          <input type="checkbox" id="aceite-novo" data-campo="aceito">
          O Recanto atualizou o <a href="aviso-privacidade.html" target="_blank" rel="noopener">aviso de privacidade</a>.
          Li a nova versão e concordo com o uso dos meus dados para identificar minhas doações associativas.
        </label>
        <div class="form-error"></div>`;
      $('valorDoacao').closest('.form-group').after(caixa);
    }
    mostrarAceiteNovo();
  });

  /* Valor: aceita "25", "25,50" ou "25.50"; mínimo R$ 1 (FR-007) */
  function lerValor() {
    const texto = $('valorDoacao').value.trim().replace(/\s|R\$/g, '').replace(',', '.');
    if (!/^\d+(\.\d{1,2})?$/.test(texto)) return { erro: 'Digite um valor válido, por exemplo 25,00.' };
    const valor = Number(texto);
    if (valor < 1) return { erro: 'O valor mínimo é R$ 1,00.' };
    return { valor };
  }

  /* PASSO 1 → 2 (ou direto ao 3 na espontânea) */
  $('btn-step1-next').addEventListener('click', () => {
    const grupo = $('valorDoacao').closest('.form-group');
    Utils.clearFieldError(grupo);
    const { valor, erro } = lerValor();
    if (erro) { Utils.setFieldError(grupo, erro); $('valorDoacao').focus(); return; }

    rascunho = { tipo: tipoEscolhido(), valor, doador: null };
    if (rascunho.tipo === 'associativa' && logado) {
      const aceite = $('aceite-novo');
      if (aceite && !aceite.checked) {
        Utils.setFieldError(aceite.closest('.form-group'), 'Para continuar, marque que leu e concorda com a nova versão do aviso.');
        aceite.focus();
        return;
      }
      gerarPix();
      irPara(3);
    } else if (rascunho.tipo === 'espontanea') {
      gerarPix();
      irPara(3);
    } else {
      $('aviso-associado').style.display = 'none';
      irPara(2);
    }
  });

  /* PASSO 2: dados do doador associado, conferidos antes de gerar o QR (FR-006b) */
  $('btn-step2-back').addEventListener('click', () => irPara(1));

  formDoador.addEventListener('submit', async (e) => {
    e.preventDefault();
    Utils.clearAllErrors(formDoador);
    $('aviso-associado').style.display = 'none';

    const doador = {
      nome: $('doadorNome').value.trim(),
      cpf: $('doadorCpf').value.trim(),
      email: $('doadorEmail').value.trim(),
      telefone: $('doadorTelefone').value.trim(),
    };
    const erros = [];
    if (!doador.nome) erros.push(['doadorNome', 'Informe seu nome completo.']);
    if (Mascaras.soDigitos(doador.cpf).length !== 11) erros.push(['doadorCpf', 'Informe os 11 números do CPF.']);
    if (!Utils.isValidEmail(doador.email)) erros.push(['doadorEmail', 'Informe um e-mail válido.']);
    const tel = Mascaras.soDigitos(doador.telefone).length;
    if (tel !== 10 && tel !== 11) erros.push(['doadorTelefone', 'Informe o telefone com DDD.']);
    if (!Consentimento.dados(formDoador).aceito) erros.push([formDoador.querySelector('input[name=aceito]').id, 'Para continuar, marque que concorda com o aviso de privacidade.']);
    if (erros.length) {
      erros.forEach(([id, msg]) => Utils.setFieldError($(id).closest('.form-group'), msg));
      $(erros[0][0]).focus();
      return;
    }

    const botao = $('btn-step2-next');
    botao.disabled = true;
    try {
      const r = await Api.post('/api/public/doacoes/verificar-associativa', { cpf: doador.cpf, email: doador.email }, { form: formDoador });
      if (!r.podeSeguir) { mostrarAvisoAssociado(r.mensagem); return; }
      rascunho.doador = doador;
      gerarPix();
      irPara(3);
    } catch (erro) {
      if (erro.status !== 429 && !erro.campos.length) Utils.toast(erro.message, 'danger');
    } finally {
      botao.disabled = false;
    }
  });

  // Mensagem neutra: não diz se o CPF ou o e-mail está cadastrado (FR-006b).
  function mostrarAvisoAssociado(mensagem) {
    $('aviso-associado-texto').innerHTML = `${Utils.escapeHtml(mensagem)}
      <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;">
        <a class="btn btn-outline btn-sm" href="login.html#doador">Entrar na área do doador</a>
        <button type="button" class="btn btn-outline btn-sm" id="btn-trocar-espontanea">Fazer doação espontânea</button>
      </div>`;
    $('aviso-associado').style.display = 'flex';
    $('btn-trocar-espontanea').addEventListener('click', () => {
      document.querySelector('input[name="tipoDoacao"][value="espontanea"]').checked = true;
      syncRadioCards();
      rascunho = { tipo: 'espontanea', valor: rascunho.valor, doador: null };
      gerarPix();
      irPara(3);
    });
  }

  /* PASSO 3: QR estático com o valor escolhido, montado no navegador (FR-007) */
  function gerarPix() {
    const valorFmt = Utils.formatCurrency(rascunho.valor);
    $('valor-confirmacao').textContent = valorFmt;
    $('aviso-espontanea').style.display = rascunho.tipo === 'espontanea' ? '' : 'none';
    const codigo = Pix.payload({ ...chavePix, valor: rascunho.valor });
    Pix.renderQR($('qr-box'), codigo, `QR code Pix para doação de ${valorFmt}`);
    $('pixCode').value = codigo;
  }

  $('btn-copy-pix').addEventListener('click', () => {
    const input = $('pixCode');
    input.select();
    (navigator.clipboard ? navigator.clipboard.writeText(input.value) : Promise.reject())
      .then(() => Utils.toast('Código Pix copiado. Cole no app do seu banco.'))
      .catch(() => Utils.toast('Selecionamos o código: use Ctrl+C (ou "Copiar" no celular).', 'warning'));
  });

  $('btn-step3-back').addEventListener('click', () => irPara(rascunho.tipo === 'associativa' && !logado ? 2 : 1));

  /* "Já fiz o Pix": registra a declaração pendente (FR-008). Data/hora é a do servidor. */
  $('btn-ja-fiz-pix').addEventListener('click', async () => {
    const botao = $('btn-ja-fiz-pix');
    botao.disabled = true;
    botao.textContent = 'Registrando…';
    const corpo = { tipo: rascunho.tipo, valor: rascunho.valor };
    if (rascunho.tipo === 'associativa' && logado) {
      if (logado.avisoPendente) corpo.consentimento = { avisoVersao: logado.avisoPendente.versao, aceito: Boolean($('aceite-novo')?.checked) };
    } else if (rascunho.tipo === 'associativa') {
      corpo.doador = rascunho.doador;
      corpo.consentimento = Consentimento.dados(formDoador);
    }
    try {
      const r = await Api.post('/api/public/doacoes', corpo, { form: formDoador });
      $('mensagem-final').textContent = rascunho.tipo === 'espontanea'
        ? `${r.mensagem} Como é uma doação espontânea, ela não pode ser acompanhada depois.`
        : logado ? `${r.mensagem} Depois de conferida, ela aparece na sua área do doador.` : r.mensagem;
      if (logado && logado.avisoPendente) { logado.avisoPendente = null; $('aceite-aviso-novo')?.remove(); }
      irPara(4);
    } catch (erro) {
      if (erro.codigo === 'ASSOCIADO_DEVE_ENTRAR') { irPara(2); mostrarAvisoAssociado(erro.message); }
      else if (erro.campos.length) { irPara(rascunho.tipo === 'associativa' && !logado ? 2 : 1); }
      else if (erro.status !== 429) { Utils.toast(erro.message, 'danger'); }
    } finally {
      botao.disabled = false;
      botao.textContent = 'Já fiz o Pix';
    }
  });

  /* Recomeçar */
  $('btn-nova-doacao').addEventListener('click', () => {
    rascunho = { tipo: 'espontanea', valor: null, doador: null };
    $('valorDoacao').value = '';
    document.querySelector(`input[name="tipoDoacao"][value="${logado ? 'associativa' : 'espontanea'}"]`).checked = true;
    syncRadioCards();
    mostrarAceiteNovo();
    formDoador.reset();
    irPara(1);
  });
});
