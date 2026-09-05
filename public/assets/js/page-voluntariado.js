document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-voluntario');
  if (!form) return;

  const idadeInput = document.getElementById('v-idade');
  const grupoAutorizacao = document.getElementById('grupo-autorizacao');
  const autorizacaoInput = document.getElementById('v-autorizacao');

  function toggleAutorizacao() {
    const idade = Number(idadeInput.value);
    const menor = idade > 0 && idade < 18;
    grupoAutorizacao.style.display = menor ? 'block' : 'none';
    if (!menor) {
      autorizacaoInput.value = '';
      Utils.clearFieldError(grupoAutorizacao);
    }
  }
  idadeInput.addEventListener('input', toggleAutorizacao);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    Utils.clearAllErrors(form);

    const nome = document.getElementById('v-nome').value.trim();
    const idade = Number(idadeInput.value);
    const telefone = document.getElementById('v-telefone').value.trim();
    const endereco = document.getElementById('v-endereco').value.trim();
    const area = document.getElementById('v-area').value;
    const termos = document.getElementById('v-termos').checked;
    const menorIdade = idade > 0 && idade < 18;
    const temAnexo = autorizacaoInput.files && autorizacaoInput.files.length > 0;

    let valid = true;
    const fail = (input, msg) => { Utils.setFieldError(input.closest('.form-group'), msg); valid = false; };

    if (!nome) fail(document.getElementById('v-nome'), 'Informe seu nome completo.');
    if (!idade || idade < 14 || idade > 110) fail(idadeInput, 'Informe uma idade válida.');
    if (!telefone) fail(document.getElementById('v-telefone'), 'Informe um telefone de contato.');
    if (!endereco) fail(document.getElementById('v-endereco'), 'Informe seu endereço.');
    if (!area) fail(document.getElementById('v-area'), 'Selecione uma área de interesse.');

    // FR-012: exige anexo de autorização do responsável legal para menores de idade
    if (menorIdade && !temAnexo) {
      Utils.setFieldError(grupoAutorizacao, 'O anexo da autorização do responsável legal é obrigatório para menores de 18 anos.');
      valid = false;
    }

    if (!termos) fail(document.getElementById('v-termos'), 'É necessário aceitar os termos para continuar.');

    if (!valid) {
      Utils.toast('Verifique os campos destacados no formulário.', 'danger');
      return;
    }

    const db = DB.load();
    const protocolo = Utils.generateProtocol();

    db.voluntarios.push({
      id: Utils.generateId('v'),
      protocolo,
      nome, endereco, telefone, idade, areaInteresse: area,
      menorIdade,
      anexoAutorizacao: temAnexo ? autorizacaoInput.files[0].name : null,
      status: 'pendente',
      criadoEm: new Date().toISOString()
    });

    DB.save(db);

    document.getElementById('form-wrap').style.display = 'none';
    document.getElementById('result-wrap').style.display = 'block';
    document.getElementById('protocolo-gerado').textContent = protocolo;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    Utils.toast('Cadastro de voluntário enviado com sucesso!');
  });
});
