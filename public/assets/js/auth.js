/* =========================================================
   auth.js — autenticação

   - Painel Administrativo: conta institucional compartilhada (FR-040),
     com sessão em cookie assinado pelo servidor. Quem decide se a pessoa
     está logada é sempre o servidor (/api/admin/sessao), nunca o navegador.
   - Autoatendimento do doador associado (FR-041): login próprio, com o
     mesmo cookie assinado (contexto "doador"). Também decidido no servidor.

   O sessionStorage guarda só uma "lembrança" para exibição (nome na tela,
   "Minha área" no menu). Não dá acesso a nada.
   ========================================================= */

const SESSION_KEY = 'sage_session_v1';

const Auth = (() => {

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setSession(session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  /* ---------- Painel (servidor) ---------- */

  // Lança ApiErro se usuário/senha estiverem errados (a tela mostra a mensagem).
  async function loginAdmin(identificador, senha, form) {
    const resposta = await Api.post('/api/admin/login', { identificador, senha }, { form });
    setSession({ tipo: 'admin', nome: resposta.identificador });
    return resposta;
  }

  async function logoutAdmin() {
    try { await Api.post('/api/admin/logout', {}, { semRedirecionar: true }); } catch (e) { /* sai mesmo assim */ }
    logout();
  }

  // Devolve o identificador da conta logada ou null.
  async function verificarAdmin() {
    try {
      const { identificador } = await Api.get('/api/admin/sessao', { semRedirecionar: true });
      setSession({ tipo: 'admin', nome: identificador });
      return identificador;
    } catch (e) {
      if (getSession()?.tipo === 'admin') logout();
      return null;
    }
  }

  /* ---------- Autoatendimento do doador associado (servidor — US9) ---------- */

  // Lança ApiErro se e-mail/senha estiverem errados (a tela mostra a mensagem).
  async function loginDoador(email, senha, form) {
    const resposta = await Api.post('/api/auth/login', { email, senha }, { form });
    setSession({ tipo: 'doador', nome: resposta.nome });
    return resposta;
  }

  async function logoutDoador() {
    try { await Api.post('/api/auth/logout', {}); } catch (e) { /* sai mesmo assim */ }
    logout();
  }

  // { logado, nome, avisoPendente } — pergunta ao servidor, sem registrar negação.
  async function verificarDoador() {
    try {
      const r = await Api.get('/api/auth/sessao');
      if (r.logado) setSession({ tipo: 'doador', nome: r.nome });
      else if (getSession()?.tipo === 'doador') logout();
      return r;
    } catch (e) {
      return { logado: false };
    }
  }

  /* Protege a área de autoatendimento: sem doador logado, vai para o login. */
  async function requireAutoatendimento() {
    const r = await verificarDoador();
    if (!r.logado) {
      window.location.href = computeLoginPath();
      return null;
    }
    return r;
  }

  function computeLoginPath() {
    // funciona tanto a partir da raiz quanto de /admin/
    const inAdmin = window.location.pathname.includes('/admin/');
    return inAdmin ? '../login.html' : 'login.html#doador';
  }

  return {
    getSession, setSession, logout,
    loginAdmin, logoutAdmin, verificarAdmin,
    loginDoador, logoutDoador, verificarDoador, requireAutoatendimento, computeLoginPath
  };
})();
