/* =========================================================
   utils.js — helpers compartilhados por todas as páginas
   ========================================================= */

const Utils = (() => {

  /* ---------- Toasts ---------- */
  function ensureToastContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function toast(message, type = 'success', timeout = 4200) {
    const container = ensureToastContainer();
    const el = document.createElement('div');
    el.className = `toast ${type === 'danger' ? 'toast-danger' : type === 'warning' ? 'toast-warning' : ''}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .3s ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }, timeout);
  }

  /* ---------- Formatação ---------- */
  function formatCurrency(value) {
    const n = Number(value) || 0;
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatDate(isoOrDate) {
    if (!isoOrDate) return '—';
    const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR');
  }

  function formatDateTime(isoOrDate) {
    if (!isoOrDate) return '—';
    const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function daysSince(isoDate) {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return 0;
    const diff = Date.now() - d.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  function maskCPF(cpf) {
    const digits = (cpf || '').replace(/\D/g, '').padEnd(11, '0').slice(0, 11);
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /* ---------- Protocolo único (não sequencial, não previsível) ---------- */
  function generateProtocol(prefix = 'REC') {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 8; i++) rand += chars[Math.floor(Math.random() * chars.length)];
    return `${prefix}-${rand.slice(0, 4)}-${rand.slice(4)}`;
  }

  function generateId(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
  }

  /* ---------- Validação simples ---------- */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
  }

  function isValidCPF(cpf) {
    return (cpf || '').replace(/\D/g, '').length === 11;
  }

  /* ---------- Badge de status (HTML) ---------- */
  const STATUS_MAP = {
    pendente:        { label: 'Pendente',        cls: 'badge-warning' },
    em_analise:      { label: 'Em análise',       cls: 'badge-warning' },
    aprovado:        { label: 'Aprovado',         cls: 'badge-success' },
    aprovada:        { label: 'Aprovada',         cls: 'badge-success' },
    confirmada:      { label: 'Confirmada',       cls: 'badge-success' },
    ativo:           { label: 'Ativo',            cls: 'badge-success' },
    rejeitado:       { label: 'Rejeitado',        cls: 'badge-danger' },
    rejeitada:       { label: 'Rejeitada',        cls: 'badge-danger' },
    inativo:         { label: 'Inativo',          cls: 'badge-neutral' },
    suprido:         { label: 'Suprido',          cls: 'badge-neutral' },
    encerrado:       { label: 'Encerrado',        cls: 'badge-neutral' },
    nao_sincronizado:{ label: 'Sem sincronização',cls: 'badge-warning' },
    sincronizado:    { label: 'Sincronizado',     cls: 'badge-success' }
  };

  function statusBadge(status) {
    const info = STATUS_MAP[status] || { label: status, cls: 'badge-neutral' };
    return `<span class="badge ${info.cls}">${info.label}</span>`;
  }

  /* ---------- Query string helper ---------- */
  function qs(param) {
    return new URLSearchParams(window.location.search).get(param);
  }

  /* ---------- Form error helper ---------- */
  function setFieldError(groupEl, message) {
    if (!groupEl) return;
    groupEl.classList.add('has-error');
    const errEl = groupEl.querySelector('.form-error');
    if (errEl) errEl.textContent = message;
  }
  function clearFieldError(groupEl) {
    if (!groupEl) return;
    groupEl.classList.remove('has-error');
  }
  function clearAllErrors(formEl) {
    formEl.querySelectorAll('.form-group.has-error').forEach(g => g.classList.remove('has-error'));
  }

  return {
    toast, formatCurrency, formatDate, formatDateTime, daysSince, maskCPF,
    generateProtocol, generateId, isValidEmail, isValidCPF, statusBadge,
    qs, setFieldError, clearFieldError, clearAllErrors
  };
})();
