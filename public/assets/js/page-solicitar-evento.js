document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-solicitacao');
  if (!form) return;

  const dataInput = document.getElementById('se-data');
  const dataHint = document.getElementById('se-data-hint');

  function checkConflito() {
    const db = DB.load();
    const val = dataInput.value;
    if (!val) { dataHint.textContent = ''; return; }
    const conflita = db.campanhas.some(c => c.status === 'ativo' && c.data.slice(0, 10) === val);
    dataHint.textContent = conflita
      ? '⚠️ Já existe um evento/campanha confirmado nesta data. A equipe avaliará a possibilidade de conciliação.'
      : 'Data disponível, sem conflitos com eventos já confirmados.';
    dataHint.style.color = conflita ? 'var(--warning)' : 'var(--success)';
  }
  dataInput.addEventListener('change', checkConflito);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    Utils.clearAllErrors(form);

    const nome = document.getElementById('se-nome').value.trim();
    const tipo = document.getElementById('se-tipo').value;
    const email = document.getElementById('se-email').value.trim();
    const telefone = document.getElementById('se-telefone').value.trim();
    const data = dataInput.value;
    const objetivo = document.getElementById('se-objetivo').value.trim();
    const recursos = document.getElementById('se-recursos').value.trim();

    let valid = true;
    const fail = (input, msg) => { Utils.setFieldError(input.closest('.form-group'), msg); valid = false; };

    if (!nome) fail(document.getElementById('se-nome'), 'Informe seu nome ou o nome da organização.');
    if (!tipo) fail(document.getElementById('se-tipo'), 'Selecione o tipo de proposta.');
    if (!Utils.isValidEmail(email)) fail(document.getElementById('se-email'), 'Informe um e-mail válido.');
    if (!telefone) fail(document.getElementById('se-telefone'), 'Informe um telefone de contato.');
    if (!data) fail(dataInput, 'Informe a data pretendida.');
    if (!objetivo) fail(document.getElementById('se-objetivo'), 'Descreva o objetivo da proposta.');
    if (!recursos) fail(document.getElementById('se-recursos'), 'Descreva os recursos esperados.');

    if (!valid) {
      Utils.toast('Verifique os campos destacados no formulário.', 'danger');
      return;
    }

    const db = DB.load();
    const protocolo = Utils.generateProtocol();

    db.solicitacoesExternas.push({
      id: Utils.generateId('se'),
      protocolo,
      nomeContato: nome, email, telefone, tipo, objetivo,
      dataPretendida: new Date(data).toISOString(),
      recursos,
      status: 'em_analise',
      criadoEm: new Date().toISOString()
    });

    DB.save(db);

    document.getElementById('form-wrap').style.display = 'none';
    document.getElementById('result-wrap').style.display = 'block';
    document.getElementById('protocolo-gerado').textContent = protocolo;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    Utils.toast('Solicitação enviada com sucesso!');
  });
});
