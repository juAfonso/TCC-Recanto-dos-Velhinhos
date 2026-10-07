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
      : 'Nenhuma chave cadastrada ainda. Sem chave, o site não oferece a doação via Pix.';
  }

  // A chave vem do servidor (GET /api/admin/pix); nada fica guardado no navegador.
  async function carregar() {
    let pix = null;
    try { pix = await Api.get('/api/admin/pix'); } catch (e) { Utils.toast(e.message, 'danger'); }
    if (pix) {
      tipoEl.value = pix.tipoChave;
      chaveEl.value = pix.chave;
      nomeEl.value = pix.nomeRecebedor;
      cidadeEl.value = pix.cidade;
    }
    renderUltimaAtualizacao(pix);
    document.getElementById('btn-desativar-pix').hidden = !pix;
    syncTipo();
    renderPreview();
  }

  // Tira a chave do site (FR-007a): o Portal passa a mostrar só o contato da secretaria.
  document.getElementById('btn-desativar-pix').addEventListener('click', async () => {
    if (!confirm('Tirar a chave do site? A doação por Pix deixa de aparecer para o público até uma chave ser salva de novo. Nada é apagado.')) return;
    try {
      await Api.post('/api/admin/pix/desativar');
      Utils.toast('Chave retirada. O site agora mostra que a doação está indisponível.');
      form.reset();
      carregar();
    } catch (erro) { Utils.toast(erro.message, 'danger'); }
  });

  tipoEl.addEventListener('change', () => { syncTipo(); renderPreview(); });
  [chaveEl, nomeEl, cidadeEl].forEach(el => el.addEventListener('input', renderPreview));

  async function salvar(dados, confirmarAviso = false) {
    try {
      await Api.put('/api/admin/pix', { ...dados, confirmarAviso }, { form });
      Utils.toast('Chave Pix salva. Confira o QR code de teste abaixo.');
      carregar();
    } catch (erro) {
      // Chave de pessoa física (CPF/telefone): o servidor pede confirmação explícita.
      if (erro.codigo === 'AVISO_CHAVE_PESSOAL') {
        if (confirm(erro.message)) return salvar(dados, true);
      } else if (!erro.campos.length) {
        Utils.toast(erro.message, 'danger');
      }
    }
  }

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

    salvar(d);
  });

  carregar();
});
