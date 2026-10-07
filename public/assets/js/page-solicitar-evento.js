/* Proposta externa de evento ou campanha (US6, FR-020, FR-021, FR-049).
   Evento pede uma data; campanha, um período. Aprovar não publica: a equipe entra em contato antes. */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const form = $('form-solicitacao');

  // Datas a partir de amanhã (fuso de Brasília), como a API confere.
  const amanha = new Date(Date.now() + 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  ['se-data', 'se-inicio', 'se-fim'].forEach((id) => { $(id).min = amanha; });
  $('se-inicio').addEventListener('change', () => { $('se-fim').min = $('se-inicio').value || amanha; });

  const tipo = () => form.querySelector('input[name=tipo]:checked')?.value || '';
  form.querySelectorAll('input[name=tipo]').forEach((r) => r.addEventListener('change', () => {
    $('grupo-data').hidden = tipo() !== 'evento';
    $('grupo-periodo').hidden = tipo() !== 'campanha';
    $('se-iniciativa-rotulo').firstChild.textContent = tipo() === 'campanha' ? 'Nome da campanha ' : 'Nome do evento ';
    Utils.clearFieldError(r.closest('.form-group'));
  }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    Utils.clearAllErrors(form);
    const aceite = form.querySelector('input[name=aceito]');
    if (!Consentimento.dados(form).aceito) {
      Utils.setFieldError(aceite.closest('.form-group'), 'Para enviar, marque que concorda com o aviso de privacidade.');
      aceite.focus();
      return;
    }

    const corpo = {
      tipo: tipo(),
      nomeIniciativa: $('se-iniciativa').value.trim(),
      dataPretendida: $('se-data').value,
      periodoInicio: $('se-inicio').value,
      periodoFim: $('se-fim').value,
      objetivo: $('se-objetivo').value.trim(),
      recursosEsperados: $('se-recursos').value.trim(),
      nomeContato: $('se-nome').value.trim(),
      email: $('se-email').value.trim(),
      telefone: $('se-telefone').value,
      consentimento: Consentimento.dados(form),
    };

    const botao = form.querySelector('[type=submit]');
    botao.disabled = true;
    botao.textContent = 'Enviando…';
    try {
      const r = await Api.post('/api/public/solicitacoes', corpo, { form });
      $('form-wrap').hidden = true;
      $('sucesso').hidden = false;
      $('protocolo-gerado').textContent = r.protocolo;
      $('aviso-email').textContent = r.emailEnviado
        ? 'Também mandamos o código para o seu e-mail (confira a caixa de spam).'
        : 'Não conseguimos enviar o e-mail agora, mas a proposta foi registrada. Anote o código acima.';
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
      botao.textContent = 'Enviar proposta';
    }
  });
});
