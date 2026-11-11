/* Proposta externa de evento ou campanha (US6, FR-020, FR-021, FR-049).
   Evento pede uma data; campanha, um período. Aprovar não publica: a equipe entra em contato antes. */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const form = $('form-solicitacao');

  // Datas a partir de amanhã (fuso de Brasília), como a API confere.
  const amanha = new Date(Date.now() + 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  ['se-data', 'se-inicio', 'se-fim'].forEach((id) => { $(id).min = amanha; });
  $('se-inicio').addEventListener('change', () => { $('se-fim').min = $('se-inicio').value || amanha; });

  // Itens que a campanha vai arrecadar (2026-11-11): pelo menos um, só para campanha.
  const listaItens = $('lista-itens');
  function adicionarItem() {
    const n = listaItens.children.length + 1;
    const linha = document.createElement('div');
    linha.className = 'form-row item-linha';
    linha.style.alignItems = 'flex-end';
    linha.innerHTML = `
      <div style="flex:1;">
        <label for="se-item-${n}" class="sr-only">Item ${n}</label>
        <input type="text" id="se-item-${n}" class="se-item" maxlength="300" placeholder="Item ${n}">
      </div>
      ${n > 1 ? '<button type="button" class="btn btn-outline btn-sm item-remover">Remover<span class="sr-only"> este item</span></button>' : ''}`;
    linha.querySelector('.item-remover')?.addEventListener('click', () => { linha.remove(); listaItens.querySelector('input')?.focus(); });
    listaItens.appendChild(linha);
    return linha.querySelector('input');
  }
  adicionarItem();
  $('btn-add-item').addEventListener('click', () => adicionarItem().focus());

  const tipo = () => form.querySelector('input[name=tipo]:checked')?.value || '';
  form.querySelectorAll('input[name=tipo]').forEach((r) => r.addEventListener('change', () => {
    $('grupo-data').hidden = tipo() !== 'evento';
    $('grupo-periodo').hidden = tipo() !== 'campanha';
    $('grupo-itens').hidden = tipo() !== 'campanha';
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
      itensArrecadar: [...listaItens.querySelectorAll('.se-item')].map((i) => i.value.trim()).filter(Boolean),
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
