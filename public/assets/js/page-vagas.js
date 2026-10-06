/* Candidatura a vaga (US5, FR-016 a FR-018, FR-049). Envio com arquivo (multipart).
   Currículo em arquivo OU texto; o arquivo vai a um armazenamento privado (só a equipe abre). */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const form = $('form-vaga');
  const QUATRO_MB = 4 * 1024 * 1024;

  $('cv-nascimento').max = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

  // Aviso imediato de arquivo grande: evita esperar o envio para descobrir.
  $('cv-arquivo').addEventListener('change', () => {
    const grupo = $('cv-arquivo').closest('.form-group');
    Utils.clearFieldError(grupo);
    const arquivo = $('cv-arquivo').files[0];
    if (arquivo && arquivo.size > QUATRO_MB) {
      Utils.setFieldError(grupo, 'O arquivo tem mais de 4 MB. Envie um menor ou descreva sua experiência no campo de texto.');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    Utils.clearAllErrors(form);
    const aceite = form.querySelector('input[name=aceito]');
    if (!Consentimento.dados(form).aceito) {
      Utils.setFieldError(aceite.closest('.form-group'), 'Para enviar, marque que concorda com o aviso de privacidade.');
      aceite.focus();
      return;
    }
    const arquivo = $('cv-arquivo').files[0];
    if (!arquivo && !$('cv-texto').value.trim()) {
      Utils.setFieldError($('cv-texto').closest('.form-group'), 'Envie o arquivo do currículo ou descreva sua experiência aqui.');
      $('cv-texto').focus();
      return;
    }
    if (arquivo && arquivo.size > QUATRO_MB) { $('cv-arquivo').focus(); return; }

    const fd = new FormData();
    fd.set('cargo', $('cv-cargo').value);
    fd.set('nome', $('cv-nome').value.trim());
    fd.set('dataNascimento', $('cv-nascimento').value);
    fd.set('cpf', $('cv-cpf').value);
    fd.set('telefone', $('cv-telefone').value);
    fd.set('email', $('cv-email').value.trim());
    fd.set('curriculoTexto', $('cv-texto').value.trim());
    if (arquivo) fd.set('curriculo', arquivo);
    Consentimento.anexar(form, fd);

    const botao = form.querySelector('[type=submit]');
    botao.disabled = true;
    botao.textContent = 'Enviando…';
    try {
      const r = await Api.enviarFormulario('/api/public/candidaturas', fd, { form });
      $('form-wrap').hidden = true;
      $('sucesso').hidden = false;
      $('protocolo-gerado').textContent = r.protocolo;
      $('aviso-email').textContent = r.emailEnviado
        ? 'Também mandamos o código para o seu e-mail (confira a caixa de spam).'
        : 'Não conseguimos enviar o e-mail agora, mas a candidatura foi registrada. Anote o código acima.';
      $('sucesso').scrollIntoView({ behavior: 'smooth' });
    } catch (erro) {
      if (erro.campos.length) {
        const primeiro = form.querySelector('.has-error input, .has-error select, .has-error textarea');
        if (primeiro) primeiro.focus();
      } else if (erro.status !== 429) {
        Utils.toast(erro.message, 'danger');
      }
    } finally {
      botao.disabled = false;
      botao.textContent = 'Enviar candidatura';
    }
  });
});
