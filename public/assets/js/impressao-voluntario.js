/* =========================================================
   impressao-voluntario.js — dados do termo de adesão para imprimir
   (um só documento para maior e menor desde 2026-10-16)

   Os dados vêm do sessionStorage do navegador: gravados pelo
   formulário de voluntariado logo após o envio, ou pelo Painel.
   O sessionStorage existe só naquela aba e some quando ela é
   fechada; não vai a servidor nenhum. Não apagamos ao trocar de
   página porque alguns navegadores (celular, navegador dentro de
   apps) abrem o documento na MESMA aba, e ele chegaria vazio.
   Nenhuma rota pública devolve esses dados (research D17).
   ========================================================= */

const ImpressaoVoluntario = (() => {
  const CHAVE = 'sage_voluntario_impressao';

  function guardar(dados) {
    try { sessionStorage.setItem(CHAVE, JSON.stringify(dados)); return true; } catch (e) { return false; }
  }

  function ler() {
    try { return JSON.parse(sessionStorage.getItem(CHAVE) || 'null'); } catch (e) { return null; }
  }

  const cpf = (v) => String(v || '').replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  const cep = (v) => String(v || '').replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
  const telefone = (v) => String(v || '').replace(/\D/g, '').replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
  const servico = (d) => (d.tipoServico === 'Outro' ? d.tipoServicoOutro : d.tipoServico);

  return { CHAVE, guardar, ler, cpf, cep, telefone, servico };
})();
