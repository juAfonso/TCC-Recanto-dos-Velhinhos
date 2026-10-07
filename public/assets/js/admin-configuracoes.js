/* Configurações (US7, research D10): prazos e contato da instituição, editáveis sem código.
   O aviso de privacidade fica na tela de Privacidade (LGPD), porque tem versões. */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const form = $('form-config');

  async function carregar() {
    try {
      const c = await Api.get('/api/admin/configuracao');
      $('cf-dias').value = c.itemSemAtualizacaoDias.valor;
      $('cf-retencao').value = c.retencaoMeses.valor;
      $('cf-contato').value = c.contatoInstituicao.valor;
      const ultima = [c.itemSemAtualizacaoDias, c.retencaoMeses, c.contatoInstituicao]
        .filter((x) => x.atualizadoEm)
        .sort((a, b) => new Date(b.atualizadoEm) - new Date(a.atualizadoEm))[0];
      $('cf-ultima').textContent = ultima ? `Última alteração por ${ultima.atualizadoPor} em ${Utils.formatDateTime(ultima.atualizadoEm)}.` : '';
    } catch (erro) {
      Utils.toast(erro.message, 'danger');
    }
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    Utils.clearAllErrors(form);
    try {
      const r = await Api.put('/api/admin/configuracao', {
        itemSemAtualizacaoDias: $('cf-dias').value,
        retencaoMeses: $('cf-retencao').value,
        contatoInstituicao: $('cf-contato').value,
      }, { form });
      Utils.toast(r.alteradas.length ? 'Configurações salvas.' : 'Nada mudou.');
      carregar();
    } catch (erro) {
      if (!erro.campos.length) Utils.toast(erro.message, 'danger');
    }
  });

  carregar();
});
