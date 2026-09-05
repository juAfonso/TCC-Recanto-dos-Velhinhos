/* =========================================================
   auth.js — autenticação simulada (sem backend)

   - Painel Administrativo: conta administrativa compartilhada
     (FR-040), sem login individual por funcionário.
   - Autoatendimento: login próprio de voluntários aprovados
     e doadores associados (FR-041), restrito aos próprios dados.
   ========================================================= */

const SESSION_KEY = 'sage_session_v1';

const ADMIN_ACCOUNT = { usuario: 'admin', senha: 'admin123', nome: 'Conta Administrativa' };

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

  function loginAdmin(usuario, senha) {
    if (usuario === ADMIN_ACCOUNT.usuario && senha === ADMIN_ACCOUNT.senha) {
      setSession({ tipo: 'admin', nome: ADMIN_ACCOUNT.nome, usuario });
      return true;
    }
    return false;
  }

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

  /* Protege páginas do Painel Administrativo */
  function requireAdmin() {
    const s = getSession();
    if (!s || s.tipo !== 'admin') {
      window.location.href = computeLoginPath();
      return null;
    }
    return s;
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

  return { getSession, setSession, logout, loginAdmin, loginAutoatendimento, requireAdmin, requireAutoatendimento, computeLoginPath };
})();
