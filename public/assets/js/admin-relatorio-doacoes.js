/* Relatório de doações para imprimir ou salvar em PDF (2026-11-10).
   Filtra por período e por valor, com espontânea e associativa separadas nos totais.
   Os filtros ficam na URL, então o relatório pode ser reaberto ou salvo nos favoritos. */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const e = (t) => Utils.escapeHtml(t);
  const form = $('form-relatorio');
  const moeda = Utils.formatCurrency;

  const TIPO = { todas: 'Espontânea e associativa', espontanea: 'Só espontânea', associativa: 'Só associativa' };
  const TIPO_LINHA = { espontanea: 'Espontânea', associativa: 'Associativa' };
  const SITUACAO = { confirmada: 'Confirmadas no extrato', pendente: 'Pendentes de conferência', nao_localizada: 'Não localizadas', todas: 'Todas' };
  const SITUACAO_LINHA = { confirmada: 'Confirmada', pendente: 'Pendente', nao_localizada: 'Não localizada' };
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  // 'AAAA-MM-DD' de hoje no fuso de Brasília.
  const hoje = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  const ultimoDia = (ano, mes) => new Date(Date.UTC(ano, mes, 0)).getUTCDate(); // mes de 1 a 12
  const doisDigitos = (n) => String(n).padStart(2, '0');

  function periodo(atalho) {
    const [ano, mes] = hoje().split('-').map(Number);
    if (atalho === 'mes') return [`${ano}-${doisDigitos(mes)}-01`, hoje()];
    if (atalho === 'mes-anterior') {
      const a = mes === 1 ? ano - 1 : ano;
      const m = mes === 1 ? 12 : mes - 1;
      return [`${a}-${doisDigitos(m)}-01`, `${a}-${doisDigitos(m)}-${ultimoDia(a, m)}`];
    }
    if (atalho === 'ano') return [`${ano}-01-01`, hoje()];
    return [`${ano - 1}-01-01`, `${ano - 1}-12-31`];
  }

  // Preenche o formulário com o que está na URL (ou o mês corrente).
  const url = new URLSearchParams(window.location.search);
  const [deMes, ateMes] = periodo('mes');
  form.de.value = url.get('de') || deMes;
  form.ate.value = url.get('ate') || ateMes;
  form.valorMin.value = url.get('valorMin') || '';
  form.valorMax.value = url.get('valorMax') || '';
  ['tipo', 'situacao', 'ordem'].forEach((campo) => { if (url.get(campo)) form[campo].value = url.get(campo); });

  document.querySelectorAll('[data-periodo]').forEach((btn) => btn.addEventListener('click', () => {
    [form.de.value, form.ate.value] = periodo(btn.dataset.periodo);
    form.requestSubmit();
  }));

  // Marca o atalho cujo período é o que está nos campos (2026-11-11). Mudar a data à mão
  // desmarca, porque o período deixa de ser o do atalho.
  function marcarAtalho() {
    document.querySelectorAll('[data-periodo]').forEach((btn) => {
      const [de, ate] = periodo(btn.dataset.periodo);
      btn.setAttribute('aria-pressed', String(form.de.value === de && form.ate.value === ate));
    });
  }
  ['de', 'ate'].forEach((campo) => form[campo].addEventListener('input', marcarAtalho));

  // Nome do período para o relatório: "novembro de 2026", "ano de 2025"… quando o período
  // é um mês ou um ano (inteiro, ou do dia 1º até hoje); senão, nada.
  function nomePeriodo(de, ate) {
    const [a1, m1, d1] = de.split('-').map(Number);
    const [a2, m2, d2] = ate.split('-').map(Number);
    if (d1 !== 1 || a1 !== a2) return '';
    const fimOuHoje = (dia, ultimo) => dia === ultimo || ate === hoje();
    if (m1 === m2 && fimOuHoje(d2, ultimoDia(a2, m2))) {
      const nome = `${MESES[m1 - 1]} de ${a1}`;
      return ate === hoje() && d2 !== ultimoDia(a2, m2) ? `${nome} (até hoje)` : nome;
    }
    if (m1 === 1 && (m2 === 12 && d2 === 31)) return `ano de ${a1}`;
    if (m1 === 1 && ate === hoje()) return `ano de ${a1} (até hoje)`;
    return '';
  }

  const textoMes = (aaaaMm) => {
    const [a, m] = aaaaMm.split('-').map(Number);
    return `${MESES[m - 1]}/${a}`;
  };
  const textoValor = (min, max) => {
    if (min === null && max === null) return 'Qualquer valor';
    if (max === null) return `A partir de ${moeda(min)}`;
    if (min === null) return `Até ${moeda(max)}`;
    return `De ${moeda(min)} a ${moeda(max)}`;
  };
  const somaCelula = (s) => (s.quantidade ? `${moeda(s.total)} <span class="rotulo">(${s.quantidade})</span>` : '—');

  function render(r) {
    const { filtros: f, resumo, doacoes } = r;
    const nome = nomePeriodo(f.de, f.ate);
    const datas = `${Utils.formatDay(f.de)} a ${Utils.formatDay(f.ate)}`;
    $('r-periodo').textContent = nome ? `${nome.charAt(0).toUpperCase()}${nome.slice(1)} — ${datas}` : datas;
    $('r-valor').textContent = textoValor(f.valorMin, f.valorMax);
    $('r-tipo').textContent = TIPO[f.tipo];
    $('r-situacao').textContent = SITUACAO[f.situacao];
    $('r-ordem').textContent = f.ordem === 'valor' ? '(do maior para o menor valor)' : '(da mais antiga para a mais recente)';

    const tipos = f.tipo === 'todas' ? ['espontanea', 'associativa'] : [f.tipo];
    $('r-resumo').innerHTML = tipos.map((t) => `
      <tr><td>${TIPO_LINHA[t]}</td><td class="num">${resumo.porTipo[t].quantidade}</td><td class="num">${moeda(resumo.porTipo[t].total)}</td></tr>`).join('')
      + `<tr class="linha-total"><th scope="row">Total</th><td class="num">${resumo.quantidade}</td><td class="num">${moeda(resumo.total)}</td></tr>`;
    $('r-estatisticas').textContent = resumo.quantidade
      ? `Média por doação: ${moeda(resumo.media)} · Menor: ${moeda(resumo.menor)} · Maior: ${moeda(resumo.maior)}`
      : '';

    // A tabela por mês só ajuda quando o período passa de um mês.
    $('bloco-meses').hidden = resumo.porMes.length < 2;
    $('r-meses').innerHTML = resumo.porMes.map((m) => `
      <tr><td>${textoMes(m.mes)}</td><td class="num">${somaCelula(m.espontanea)}</td><td class="num">${somaCelula(m.associativa)}</td><td class="num"><b>${moeda(m.total.total)}</b> <span class="rotulo">(${m.total.quantidade})</span></td></tr>`).join('');

    $('r-lista').innerHTML = doacoes.map((d, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${Utils.formatDateTime(d.declaradaEm)}</td>
        <td>${TIPO_LINHA[d.tipo]}</td>
        <td>${d.tipo === 'associativa' ? e(d.doador || '—') : '<span class="rotulo">Anônimo</span>'}</td>
        <td>${SITUACAO_LINHA[d.status]}</td>
        <td class="num">${moeda(d.valor)}</td>
      </tr>`).join('')
      || '<tr><td colspan="6" class="rotulo">Nenhuma doação com esses filtros.</td></tr>';
    $('r-total').textContent = moeda(resumo.total);

    const emitido = new Date(r.emitidoEm);
    const [ano, mes, dia] = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(emitido).split('-').map(Number);
    $('r-local-data').textContent = `Pinheiral, ${dia} de ${MESES[mes - 1]} de ${ano}.`;
    $('r-emitido').textContent = Utils.formatDateTime(emitido);
    // Nome do arquivo sugerido ao salvar em PDF.
    document.title = `Relatório de doações ${f.de} a ${f.ate} — Recanto dos Velhinhos`;
  }

  async function carregar() {
    Utils.clearAllErrors(form);
    const params = new URLSearchParams();
    ['de', 'ate', 'valorMin', 'valorMax', 'tipo', 'situacao', 'ordem'].forEach((campo) => {
      const valor = form[campo].value.trim();
      if (valor) params.set(campo, valor);
    });
    history.replaceState(null, '', `?${params}`);
    marcarAtalho();
    $('btn-imprimir').disabled = true;
    $('estado').hidden = false;
    $('estado').textContent = 'Carregando…';
    $('conteudo').hidden = true;
    try {
      const r = await Api.get(`/api/admin/doacoes/relatorio?${params}`, { form });
      render(r);
      $('estado').hidden = true;
      $('conteudo').hidden = false;
      $('btn-imprimir').disabled = false;
    } catch (erro) {
      $('estado').textContent = erro.message;
    }
  }

  form.addEventListener('submit', (ev) => { ev.preventDefault(); carregar(); });
  $('btn-imprimir').addEventListener('click', () => window.print());
  carregar();
});
