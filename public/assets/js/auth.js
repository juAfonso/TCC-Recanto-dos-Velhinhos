/* =========================================================
   auth.js — autenticação

   - Painel Administrativo: conta institucional compartilhada (FR-040),
     com sessão em cookie assinado pelo servidor. Quem decide se a pessoa
     está logada é sempre o servidor (/api/admin/sessao), nunca o navegador.
   - Autoatendimento do doador associado (FR-041): AINDA SIMULADO sobre o
     data.js, até a história US9 ligar estas funções à API.

   O sessionStorage guarda só uma "lembrança" para exibição (nome na tela,
   autor no histórico simulado do data.js). Não dá acesso a nada.
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

  /* ---------- Autoatendimento (simulado — US9) ---------- */

  function loginAutoatendimento(email, senha) {
    const db = DB.load();
    const usuario = db.usuarios.find(u =>
      u.email.toLowerCase() === (email || '').toLowerCase() &&
      u.senha === senha &&
      (u.perfil === 'voluntario' || u.perfil === 'doador') &&
      u.status === 'ativo'
    );
    if (usuario) {
      setSession({ tipo: usuario.perfil, nome: usuario.nome, email: usuario.email, usuarioId: usuario.id });
      return usuario;
    }
    return null;
  }

  /* Protege a área de autoatendimento */
  function requireAutoatendimento() {
    const s = getSession();
    if (!s || (s.tipo !== 'voluntario' && s.tipo !== 'doador')) {
      window.location.href = computeLoginPath();
      return null;
    }
    return s;
  }

  function computeLoginPath() {
    // funciona tanto a partir da raiz quanto de /admin/
    const inAdmin = window.location.pathname.includes('/admin/');
    return inAdmin ? '../login.html' : 'login.html';
  }

  return {
    getSession, setSession, logout,
    loginAdmin, logoutAdmin, verificarAdmin,
    loginAutoatendimento, requireAutoatendimento, computeLoginPath
  };
})();
