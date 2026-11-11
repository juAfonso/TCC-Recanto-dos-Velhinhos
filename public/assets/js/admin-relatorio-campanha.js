/* Relatório de campanha para imprimir ou salvar em PDF (2026-11-11).
   A equipe escolhe uma campanha encerrada; a escolha fica na URL (?id=), então o relatório
   pode ser reaberto ou salvo nos favoritos. */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const e = (t) => Utils.escapeHtml(t);
  const moeda = Utils.formatCurrency;
  const numero = (n) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const select = $('f-campanha');

  function arrecadado(r) {
    if (r.quantidade === null) return '<span class="rotulo">Não informado</span>';
    return r.tipo === 'dinheiro' ? moeda(r.quantidade) : `${numero(r.quantidade)} ${e(r.unidade)}`;
  }

  function render({ campanha: c, recursos, emitidoEm }) {
    $('r-nome').textContent = c.nome;
    $('r-periodo').textContent = `${Utils.formatDay(c.periodoInicio)} a ${Utils.formatDay(c.periodoFim)}`;
    $('r-encerrada').textContent = `${Utils.formatDate(c.encerradoEm)}${c.encerradoPor === 'sistema' ? ' (automaticamente, no fim do período)' : ''}`;
    $('r-origem-campo').hidden = !c.origem;
    if (c.origem) $('r-origem').textContent = `${c.origem.protocolo} — ${c.origem.proponente}`;
    $('r-objetivo').innerHTML = Utils.paragrafos(c.objetivo);

    $('bloco-dinheiro').hidden = c.meta === null;
    if (c.meta !== null) {
      const valor = c.arrecadado ?? 0;
      $('r-dinheiro').innerHTML = `<tr><td>${moeda(c.meta)}</td><td class="num">${c.arrecadado === null ? '<span class="rotulo">Não informado</span>' : moeda(valor)}</td><td class="num">${Math.round((valor / c.meta) * 100)}%</td></tr>`;
    }

    $('r-recursos').innerHTML = recursos.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${e(r.descricao)}</td>
        <td>${r.tipo === 'dinheiro' ? 'Dinheiro' : 'Item'}</td>
        <td class="num">${arrecadado(r)}</td>
      </tr>`).join('')
      || '<tr><td colspan="4" class="rotulo">Esta campanha não tem recursos cadastrados.</td></tr>';
    const faltam = recursos.filter((r) => r.quantidade === null).length;
    $('r-nao-contados').textContent = faltam
      ? `${faltam} ${faltam === 1 ? 'recurso ainda sem quantidade informada' : 'recursos ainda sem quantidade informada'}. Registre em Campanhas & Eventos e gere o relatório de novo.`
      : '';

    const emitido = new Date(emitidoEm);
    const [ano, mes, dia] = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(emitido).split('-').map(Number);
    $('r-local-data').textContent = `Pinheiral, ${dia} de ${MESES[mes - 1]} de ${ano}.`;
    $('r-emitido').textContent = Utils.formatDateTime(emitido);
    // Nome do arquivo sugerido ao salvar em PDF.
    document.title = `Relatório da campanha ${c.nome} — Recanto dos Velhinhos`;
  }

  async function gerar() {
    const id = select.value;
    history.replaceState(null, '', id ? `?id=${encodeURIComponent(id)}` : window.location.pathname);
    $('btn-imprimir').disabled = true;
    $('conteudo').hidden = true;
    $('estado').hidden = false;
    if (!id) { $('estado').textContent = 'Escolha uma campanha.'; return; }
    $('estado').textContent = 'Carregando…';
    try {
      render(await Api.get(`/api/admin/campanhas/${encodeURIComponent(id)}/relatorio`));
      $('estado').hidden = true;
      $('conteudo').hidden = false;
      $('btn-imprimir').disabled = false;
    } catch (erro) {
      $('estado').textContent = erro.message;
    }
  }

  async function carregarLista() {
    try {
      const { itens } = await Api.get('/api/admin/eventos-campanhas');
      // Encerradas, da que terminou mais recentemente para a mais antiga.
      const encerradas = itens.filter((x) => x.tipo === 'campanha' && x.status === 'encerrado')
        .sort((a, b) => b.periodoFim.localeCompare(a.periodoFim));
      if (!encerradas.length) {
        select.innerHTML = '<option value="">Nenhuma campanha encerrada ainda</option>';
        select.disabled = true;
        $('estado').textContent = 'Nenhuma campanha encerrada ainda. O relatório fica disponível depois que a campanha é encerrada.';
        return;
      }
      select.innerHTML = '<option value="">Escolha…</option>' + encerradas.map((c) => `
        <option value="${e(c.id)}">${e(c.nome)} (${Utils.formatDay(c.periodoInicio)} a ${Utils.formatDay(c.periodoFim)})</option>`).join('');
      const pedida = new URLSearchParams(window.location.search).get('id');
      if (pedida && encerradas.some((c) => c.id === pedida)) select.value = pedida;
      gerar();
    } catch (erro) {
      select.innerHTML = '<option value="">Não foi possível carregar</option>';
      $('estado').textContent = erro.message;
    }
  }

  select.addEventListener('change', gerar);
  $('form-relatorio').addEventListener('submit', (ev) => { ev.preventDefault(); gerar(); });
  $('btn-imprimir').addEventListener('click', () => window.print());
  carregarLista();
});
