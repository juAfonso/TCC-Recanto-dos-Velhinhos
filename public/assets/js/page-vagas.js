document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-vaga');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    Utils.clearAllErrors(form);
    document.getElementById('cv-experiencia-erro').textContent = '';

    const cargo = document.getElementById('cv-cargo').value;
    const nome = document.getElementById('cv-nome').value.trim();
    const cpf = document.getElementById('cv-cpf').value.trim();
    const email = document.getElementById('cv-email').value.trim();
    const telefone = document.getElementById('cv-telefone').value.trim();
    const arquivoInput = document.getElementById('cv-arquivo');
    const texto = document.getElementById('cv-texto').value.trim();
    const temArquivo = arquivoInput.files && arquivoInput.files.length > 0;

    let valid = true;
    const fail = (input, msg) => { Utils.setFieldError(input.closest('.form-group'), msg); valid = false; };

    if (!cargo) fail(document.getElementById('cv-cargo'), 'Selecione o cargo pretendido.');
    if (!nome) fail(document.getElementById('cv-nome'), 'Informe seu nome completo.');
    if (!Utils.isValidCPF(cpf)) fail(document.getElementById('cv-cpf'), 'Informe um CPF válido.');
    if (!Utils.isValidEmail(email)) fail(document.getElementById('cv-email'), 'Informe um e-mail válido.');
    if (!telefone) fail(document.getElementById('cv-telefone'), 'Informe um telefone de contato.');

    // FR-017: exige currículo em arquivo OU descrição textual da experiência
    if (!temArquivo && !texto) {
      document.getElementById('cv-experiencia-erro').textContent =
        'Anexe um currículo em arquivo ou descreva sua experiência em texto — ao menos uma das duas formas é obrigatória.';
      document.getElementById('cv-experiencia-erro').style.display = 'block';
      valid = false;
    }

    if (!valid) {
      Utils.toast('Verifique os campos destacados no formulário.', 'danger');
      return;
    }

    const db = DB.load();
    const protocolo = Utils.generateProtocol();

    db.candidaturas.push({
      id: Utils.generateId('cv'),
      protocolo,
      cargo, nome, cpf, email, telefone,
      curriculoNome: temArquivo ? arquivoInput.files[0].name : '',
      descricaoExperiencia: texto,
      status: 'em_analise',
      criadoEm: new Date().toISOString()
    });

    DB.save(db);

    document.getElementById('form-wrap').style.display = 'none';
    document.getElementById('result-wrap').style.display = 'block';
    document.getElementById('protocolo-gerado').textContent = protocolo;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    Utils.toast('Candidatura enviada com sucesso!');
  });
});
