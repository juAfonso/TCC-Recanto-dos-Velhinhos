/* Termo de adesão ao serviço voluntário (Lei 9.608/1998), pronto para imprimir.
   É o texto do termo que o Recanto já usa (2026-10-16): um só documento para maior e
   menor, com o campo de assinatura do responsável. Campo vazio fica para preencher à mão. */
(function () {
  const dados = ImpressaoVoluntario.ler();

  document.addEventListener('DOMContentLoaded', () => {
    const $ = (id) => document.getElementById(id);
    if (!dados) {
      $('sem-dados').hidden = false;
      $('btn-imprimir').hidden = true;
      return;
    }
    const f = ImpressaoVoluntario;
    const campos = {
      't-nome': dados.nome,
      't-escolaridade': dados.escolaridade,
      't-profissao': dados.profissao,
      't-rg': dados.rg,
      't-cpf': f.cpf(dados.cpf),
      't-endereco': dados.endereco,
      't-bairro': dados.bairro,
      't-cep': f.cep(dados.cep),
      't-telefone': f.telefone(dados.telefone),
      't-cidade': dados.cidade,
      't-uf': dados.uf,
      't-email': dados.email,
      't-servico': f.servico(dados),
      't-objetivos': dados.objetivos,
      't-condicoes': dados.condicoes,
      't-protocolo': dados.protocolo,
    };
    Object.entries(campos).forEach(([id, valor]) => { $(id).textContent = valor || ''; });
    // Informado pelo servidor (resposta do envio ou dados do Painel), nunca calculado aqui.
    $('aviso-menor').hidden = dados.menorDeIdade !== true;
    $('conteudo').hidden = false;
    $('btn-imprimir').addEventListener('click', () => window.print());
  });
})();
