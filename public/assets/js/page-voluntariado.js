/* Cadastro de voluntário (US4, FR-011 a FR-013, FR-012, FR-049).
   Depois do envio, o protocolo aparece em destaque. Se for menor, os dados vão para a página
   de autorização pelo sessionStorage do próprio navegador — nunca por uma rota pública (D17). */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const form = $('form-voluntario');

  $('v-nascimento').max = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

  $('v-servico').addEventListener('change', () => {
    const outro = $('v-servico').value === 'Outro';
    $('grupo-servico-outro').hidden = !outro;
    if (outro) $('v-servico-outro').focus();
  });

  function dados() {
    return {
      nome: $('v-nome').value.trim(),
      dataNascimento: $('v-nascimento').value,
      cpf: $('v-cpf').value,
      rg: $('v-rg').value.trim(),
      escolaridade: $('v-escolaridade').value.trim(),
      profissao: $('v-profissao').value.trim(),
      endereco: $('v-endereco').value.trim(),
      bairro: $('v-bairro').value.trim(),
      cep: $('v-cep').value,
      cidade: $('v-cidade').value.trim(),
      uf: $('v-uf').value,
      telefone: $('v-telefone').value,
      email: $('v-email').value.trim(),
      tipoServico: $('v-servico').value,
      tipoServicoOutro: $('v-servico-outro').value.trim(),
      objetivos: $('v-objetivos').value.trim(),
      condicoes: $('v-condicoes').value.trim(),
    };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    Utils.clearAllErrors(form);
    const corpo = dados();
    if (!Consentimento.dados(form).aceito) {
      const caixa = form.querySelector('input[name=aceito]');
      Utils.setFieldError(caixa.closest('.form-group'), 'Para enviar, marque que concorda com o aviso de privacidade.');
      caixa.focus();
      return;
    }
    const botao = form.querySelector('[type=submit]');
    botao.disabled = true;
    botao.textContent = 'Enviando…';
    try {
      const r = await Api.post('/api/public/voluntarios', { ...corpo, consentimento: Consentimento.dados(form) }, { form });
      mostrarSucesso(r);
    } catch (erro) {
      if (erro.campos.length) {
        const primeiro = form.querySelector('.has-error input, .has-error select, .has-error textarea');
        if (primeiro) primeiro.focus();
      } else if (erro.status !== 429) {
        Utils.toast(erro.message, 'danger');
      }
    } finally {
      botao.disabled = false;
      botao.textContent = 'Enviar cadastro';
    }
  });

  function mostrarSucesso(r) {
    $('form-wrap').hidden = true;
    $('sucesso').hidden = false;
    $('protocolo-gerado').textContent = r.protocolo;
    $('aviso-email').textContent = r.emailEnviado
      ? 'Também mandamos o código para o seu e-mail (confira a caixa de spam).'
      : 'Não conseguimos enviar o e-mail agora, mas o cadastro foi registrado. Anote o código acima.';
    // O termo de adesão é impresso só pela equipe, no Painel (2026-10-17).
    $('aviso-menor').hidden = r.autorizacaoStatus !== 'pendente';
    $('sucesso').scrollIntoView({ behavior: 'smooth' });
  }
});
