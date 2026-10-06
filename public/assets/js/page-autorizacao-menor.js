/* Autorização do responsável para o voluntário menor (FR-012, research D17).
   Os dados vêm do sessionStorage do próprio navegador — gravados pelo formulário de voluntariado
   ou pelo Painel, ao reimprimir. Nenhuma rota pública devolve dados de menor. Ao sair, apaga. */
(function () {
  const CHAVE = 'sage_autorizacao_menor';
  let dados = null;
  try { dados = JSON.parse(sessionStorage.getItem(CHAVE) || 'null'); } catch (e) { dados = null; }

  document.addEventListener('DOMContentLoaded', () => {
    const $ = (id) => document.getElementById(id);
    if (!dados) {
      $('sem-dados').hidden = false;
      $('btn-imprimir').hidden = true;
      return;
    }
    const e = (t) => Utils.escapeHtml(t || '—');
    const cpf = (dados.cpf || '').replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    const servico = dados.tipoServico === 'Outro' ? dados.tipoServicoOutro : dados.tipoServico;
    const linhas = [
      ['Nome', dados.nome],
      ['Data de nascimento', Utils.formatDay(dados.dataNascimento)],
      ['RG', dados.rg],
      ['CPF', cpf],
      ['Endereço', `${dados.endereco || ''}, ${dados.bairro || ''} — ${dados.cidade || ''}/${dados.uf || ''}, CEP ${dados.cep || ''}`],
      ['Telefone', dados.telefone],
      ['E-mail', dados.email],
      ['Tipo de serviço', servico],
      ['Dias e horários', dados.condicoes],
    ];
    $('t-protocolo').textContent = dados.protocolo || '';
    $('t-dados').innerHTML = linhas.map(([rotulo, valor]) => `<dt>${e(rotulo)}</dt><dd>${e(valor)}</dd>`).join('');
    $('conteudo').hidden = false;
    $('btn-imprimir').addEventListener('click', () => window.print());
  });

  // Coleta mínima: os dados do menor não ficam guardados no navegador depois que a pessoa sai.
  window.addEventListener('pagehide', () => { try { sessionStorage.removeItem(CHAVE); } catch (e) { /* nada */ } });
})();
