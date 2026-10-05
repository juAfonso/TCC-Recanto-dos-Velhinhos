document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-pix');
  const tipoEl = document.getElementById('pix-tipo');
  const chaveEl = document.getElementById('pix-chave');
  const nomeEl = document.getElementById('pix-nome');
  const cidadeEl = document.getElementById('pix-cidade');
  const previewEl = document.getElementById('pix-preview-qr');

  const PLACEHOLDERS = {
    cnpj: '00.000.000/0000-00',
    email: 'doacoes@exemplo.com',
    aleatoria: '123e4567-e89b-12d3-a456-426614174000',
    cpf: '000.000.000-00',
    telefone: '(24) 99999-0000'
  };

  // Confere os dois dígitos verificadores do CNPJ
  function isValidCNPJ(valor) {
    const d = valor.replace(/\D/g, '');
    if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
    const digito = (base) => {
      const pesos = base.length === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2];
      const soma = pesos.reduce((s, p, i) => s + p * Number(base[i]), 0);
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };
    return digito(d.slice(0, 12)) === Number(d[12]) && digito(d.slice(0, 13)) === Number(d[13]);
  }

  function erroDaChave(tipo, chave) {
    if (!chave) return 'Informe a chave Pix.';
    if (tipo === 'cnpj' && !isValidCNPJ(chave)) return 'CNPJ inválido. Confira os números.';
    if (tipo === 'cpf' && !Utils.isValidCPF(chave)) return 'CPF inválido.';
    if (tipo === 'email' && !Utils.isValidEmail(chave)) return 'E-mail inválido.';
    if (tipo === 'telefone' && !/^\d{10,13}$/.test(chave.replace(/\D/g, ''))) return 'Telefone inválido. Inclua o DDD.';
    if (tipo === 'aleatoria' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chave)) return 'Chave aleatória inválida. Ela tem 36 caracteres, com hífens.';
    return null;
  }

  function dadosDoForm() {
    return {
      tipoChave: tipoEl.value,
      chave: chaveEl.value.trim(),
      nomeRecebedor: nomeEl.value.trim(),
      cidade: cidadeEl.value.trim()
    };
  }

  function syncTipo() {
    chaveEl.placeholder = PLACEHOLDERS[tipoEl.value];
    const pessoal = tipoEl.value === 'cpf' || tipoEl.value === 'telefone';
    document.getElementById('pix-aviso-pessoal').style.display = pessoal ? 'flex' : 'none';
  }

  // Só desenha o QR de teste quando os dados estão válidos, para não conferirem um QR errado
  function renderPreview() {
    const d = dadosDoForm();
    if (erroDaChave(d.tipoChave, d.chave) || !d.nomeRecebedor || !d.cidade) {
      previewEl.innerHTML = '<p class="cell-muted" style="padding:40px 8px;font-size:.85rem;">Preencha os dados para ver o QR code de teste.</p>';
      return;
    }
    Pix.renderQR(previewEl, Pix.payload({ ...d, valor: 10 }), 'QR code Pix de teste no valor de R$ 10,00');
  }

  function renderUltimaAtualizacao(pix) {
    document.getElementById('pix-ultima-atualizacao').textContent = pix && pix.atualizadoEm
      ? `Última atualização em ${Utils.formatDateTime(pix.atualizadoEm)} por ${pix.atualizadoPor}`
      : 'Nenhuma alteração registrada pela equipe ainda.';
  }

  function carregar() {
    const pix = DB.load().pix;
    if (pix) {
      tipoEl.value = pix.tipoChave;
      chaveEl.value = pix.chave;
      nomeEl.value = pix.nomeRecebedor;
      cidadeEl.value = pix.cidade;
    }
    renderUltimaAtualizacao(pix);
    syncTipo();
    renderPreview();
  }

  tipoEl.addEventListener('change', () => { syncTipo(); renderPreview(); });
  [chaveEl, nomeEl, cidadeEl].forEach(el => el.addEventListener('input', renderPreview));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    Utils.clearAllErrors(form);
    const d = dadosDoForm();

    let valid = true;
    const erroChave = erroDaChave(d.tipoChave, d.chave);
    if (erroChave) { Utils.setFieldError(chaveEl.closest('.form-group'), erroChave); valid = false; }
    if (!d.nomeRecebedor) { Utils.setFieldError(nomeEl.closest('.form-group'), 'Informe o nome do recebedor.'); valid = false; }
    if (!d.cidade) { Utils.setFieldError(cidadeEl.closest('.form-group'), 'Informe a cidade.'); valid = false; }
    if (!valid) return;

    if (!confirm('Salvar esta chave? A partir de agora, todas as doações pelo site serão geradas para ela.')) return;

    const db = DB.load();
    const session = Auth.getSession();
    db.pix = { ...d, atualizadoEm: new Date().toISOString(), atualizadoPor: (session && session.nome) || 'Conta Administrativa' };
    DB.addAudit(db, 'Atualização da chave Pix', `Chave do tipo ${d.tipoChave} cadastrada para "${d.nomeRecebedor}".`);
    DB.save(db);
    renderUltimaAtualizacao(db.pix);
    Utils.toast('Chave Pix salva. Confira o QR code de teste abaixo.');
  });

  carregar();
});
