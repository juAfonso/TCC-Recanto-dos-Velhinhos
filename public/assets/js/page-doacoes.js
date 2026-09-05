document.addEventListener('DOMContentLoaded', () => {
  const db = DB.load();

  /* ---------- Lista de itens necessários (físicos) ---------- */
  const itensLista = document.getElementById('itens-lista');
  if (itensLista) {
    const itens = db.itens.filter(i => i.status === 'ativo');
    itensLista.innerHTML = itens.map(i => `
      <div class="card item-card">
        <div>
          <h3>${i.nome}</h3>
          <p>${i.urgente ? 'Necessidade imediata.' : 'Contribuição sempre bem-vinda.'}</p>
          <p class="card-meta">Atualizado em ${Utils.formatDate(i.atualizadoEm)}</p>
        </div>
        <span class="qtd">${i.quantidade} ${i.unidade}</span>
      </div>
    `).join('') || '<p class="cell-muted">Nenhuma necessidade cadastrada no momento.</p>';
  }

  /* ---------- Fluxo de doação Pix ---------- */
  const stepperEl = document.getElementById('donation-stepper');
  if (!stepperEl) return;

  let currentStep = 1;
  let donationDraft = { tipo: 'espontanea', valor: null, doador: null, id: null };

  const steps = document.querySelectorAll('.donation-step');
  const stepperItems = document.querySelectorAll('#donation-stepper .step');

  function goToStep(n) {
    currentStep = n;
    steps.forEach(s => s.style.display = Number(s.dataset.step) === n ? 'block' : 'none');
    stepperItems.forEach(s => {
      const num = Number(s.dataset.step);
      s.classList.toggle('active', num === n);
      s.classList.toggle('done', num < n);
    });
  }

  /* valores predefinidos */
  document.querySelectorAll('.valor-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('valorDoacao').value = btn.dataset.valor;
    });
  });

  /* seleção visual dos radio cards */
  function syncRadioCards() {
    const tipo = document.querySelector('input[name="tipoDoacao"]:checked').value;
    document.getElementById('card-espontanea').classList.toggle('selected', tipo === 'espontanea');
    document.getElementById('card-associativa').classList.toggle('selected', tipo === 'associativa');
  }
  document.querySelectorAll('input[name="tipoDoacao"]').forEach(r => r.addEventListener('change', syncRadioCards));
  syncRadioCards();

  /* STEP 1 -> 2 */
  document.getElementById('btn-step1-next').addEventListener('click', () => {
    const valorGroup = document.getElementById('valorDoacao').closest('.form-group');
    const valor = Number(document.getElementById('valorDoacao').value);
    Utils.clearFieldError(valorGroup);

    if (!valor || valor < 5) {
      Utils.setFieldError(valorGroup, 'Informe um valor válido (mínimo R$ 5).');
      return;
    }

    donationDraft.tipo = document.querySelector('input[name="tipoDoacao"]:checked').value;
    donationDraft.valor = valor;

    const associativa = donationDraft.tipo === 'associativa';
    document.getElementById('dados-associativos').style.display = associativa ? 'block' : 'none';
    document.getElementById('dados-espontanea-info').style.display = associativa ? 'none' : 'block';

    goToStep(2);
  });

  /* STEP 2 -> 3 */
  document.getElementById('btn-step2-back').addEventListener('click', () => goToStep(1));

  document.getElementById('btn-step2-next').addEventListener('click', () => {
    if (donationDraft.tipo === 'associativa') {
      const nomeG = document.getElementById('doadorNome').closest('.form-group');
      const cpfG = document.getElementById('doadorCpf').closest('.form-group');
      const emailG = document.getElementById('doadorEmail').closest('.form-group');
      const telG = document.getElementById('doadorTelefone').closest('.form-group');
      [nomeG, cpfG, emailG, telG].forEach(Utils.clearFieldError);

      const nome = document.getElementById('doadorNome').value.trim();
      const cpf = document.getElementById('doadorCpf').value.trim();
      const email = document.getElementById('doadorEmail').value.trim();
      const telefone = document.getElementById('doadorTelefone').value.trim();

      let valid = true;
      if (!nome) { Utils.setFieldError(nomeG, 'Informe seu nome completo.'); valid = false; }
      if (!Utils.isValidCPF(cpf)) { Utils.setFieldError(cpfG, 'Informe um CPF válido.'); valid = false; }
      if (!Utils.isValidEmail(email)) { Utils.setFieldError(emailG, 'Informe um e-mail válido.'); valid = false; }
      if (!telefone) { Utils.setFieldError(telG, 'Informe um telefone de contato.'); valid = false; }
      if (!valid) return;

      donationDraft.doador = { nome, cpf, email, telefone };
    } else {
      donationDraft.doador = null;
    }

    generatePixStep();
    goToStep(3);
  });

  /* Gera QR simulado + registra doação como pendente (FR-007, FR-008) */
  function generatePixStep() {
    document.getElementById('valor-confirmacao').textContent = Utils.formatCurrency(donationDraft.valor);

    // QR "simulado": grade pseudo-aleatória determinística
    const qrBox = document.getElementById('qr-box');
    let seed = donationDraft.valor * 37 + Date.now();
    let html = '';
    for (let i = 0; i < 36; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      const on = (seed / 233280) > 0.42;
      html += `<span class="${on ? '' : 'off'}"></span>`;
    }
    qrBox.innerHTML = html;

    document.getElementById('pixCode').value =
      `00020126580014BR.GOV.BCB.PIX0136recanto-${Utils.generateId('pix')}5204000053039865406${donationDraft.valor.toFixed(2)}5802BR5920RECANTO VELHINHOS6009PINHEIRAL`;

    // Registra a doação com status pendente
    const freshDb = DB.load();
    const doacao = {
      id: Utils.generateId('d'),
      valor: donationDraft.valor,
      tipo: donationDraft.tipo,
      doadorId: null,
      doadorSnapshot: donationDraft.doador,
      status: 'pendente',
      criadoEm: new Date().toISOString()
    };

    // vincula ao cadastro de doador associado, se já existir usuário logado como doador
    const session = Auth.getSession();
    if (donationDraft.tipo === 'associativa' && session && session.tipo === 'doador') {
      doacao.doadorId = session.usuarioId;
    }

    freshDb.doacoes.push(doacao);
    DB.save(freshDb);
    donationDraft.id = doacao.id;
  }

  document.getElementById('btn-copy-pix').addEventListener('click', () => {
    const input = document.getElementById('pixCode');
    input.select();
    navigator.clipboard?.writeText(input.value).catch(() => {});
    Utils.toast('Código Pix copiado.');
  });

  /* Simula chegada da confirmação de pagamento via API (FR-008) */
  document.getElementById('btn-simular-pagamento').addEventListener('click', () => {
    const freshDb = DB.load();
    const doacao = freshDb.doacoes.find(d => d.id === donationDraft.id);
    if (doacao && doacao.status !== 'confirmada') {
      doacao.status = 'confirmada';
      DB.save(freshDb);
    }
    showComprovante(doacao);
    goToStep(4);
  });

  function showComprovante(doacao) {
    document.getElementById('comprovante-id').textContent = '#' + doacao.id.toUpperCase();
    document.getElementById('comp-valor').textContent = Utils.formatCurrency(doacao.valor);
    document.getElementById('comp-tipo').textContent = doacao.tipo === 'espontanea' ? 'Espontânea' : 'Associativa';
    document.getElementById('comp-data').textContent = Utils.formatDateTime(doacao.criadoEm);
    document.getElementById('comp-status').innerHTML = Utils.statusBadge(doacao.status);
    Utils.toast('Comprovante disponível — obrigado pela sua doação!');
  }

  document.getElementById('btn-nova-doacao').addEventListener('click', () => {
    donationDraft = { tipo: 'espontanea', valor: null, doador: null, id: null };
    document.getElementById('valorDoacao').value = '';
    document.querySelector('input[name="tipoDoacao"][value="espontanea"]').checked = true;
    syncRadioCards();
    document.getElementById('doadorNome').value = '';
    document.getElementById('doadorCpf').value = '';
    document.getElementById('doadorEmail').value = '';
    document.getElementById('doadorTelefone').value = '';
    goToStep(1);
  });

  goToStep(1);
});
