/* =========================================================
   data.js — "banco de dados" simulado em localStorage
   Este arquivo representa apenas a camada de FRONT-END.
   Nenhuma chamada real de API/backend é feita aqui — tudo é
   mock, criado para permitir demonstrar todas as telas e
   fluxos do SAGE (Portal Público + Painel Administrativo)
   descritos no roteiro do TCC.
   ========================================================= */

const DB_KEY = 'sage_db_v1';

const DB = (() => {

  function seed() {
    const now = Date.now();
    const daysAgo = n => new Date(now - n * 86400000).toISOString();

    return {
      /* ---------------- USUÁRIOS ---------------- */
      usuarios: [
        { id: 'u1', nome: 'Maria Fernanda Souza', cpf: '11122233344', email: 'maria.funcionaria@recanto.org.br', telefone: '(24) 99999-0001', perfil: 'funcionario', cargo: 'Coordenadora Administrativa', status: 'ativo', criadoEm: daysAgo(400) },
        { id: 'u2', nome: 'João Batista Ramos', cpf: '22233344455', email: 'joao.cuidador@recanto.org.br', telefone: '(24) 99999-0002', perfil: 'funcionario', cargo: 'Cuidador', status: 'ativo', criadoEm: daysAgo(300) },
        { id: 'u3', nome: 'Isadora Camargo', cpf: '33344455566', email: 'isadora.voluntaria@gmail.com', telefone: '(24) 98888-1234', perfil: 'voluntario', areaInteresse: 'Atividades recreativas', idade: 24, status: 'ativo', senha: 'voluntario123', criadoEm: daysAgo(120) },
        { id: 'u4', nome: 'Ana Carolina Prado', cpf: '44455566677', email: 'ana.doadora@gmail.com', telefone: '(24) 97777-4321', perfil: 'doador', status: 'ativo', senha: 'doador123', criadoEm: daysAgo(200) },
        { id: 'u5', nome: 'Lara Vitória Nunes', cpf: '55566677788', email: 'lara.voluntaria@gmail.com', telefone: '(24) 96666-5678', perfil: 'voluntario', areaInteresse: 'Acompanhamento aos idosos', idade: 17, status: 'ativo', senha: 'voluntario123', criadoEm: daysAgo(60) },
        { id: 'u6', nome: 'Richelle Andrade', cpf: '66677788899', email: 'richelle.func@recanto.org.br', telefone: '(24) 99999-0003', perfil: 'funcionario', cargo: 'Enfermagem', status: 'inativo', criadoEm: daysAgo(500) }
      ],

      /* ---------------- ITENS NECESSÁRIOS ---------------- */
      itens: [
        { id: 'it1', nome: 'Fraldas geriátricas (tam. G)', quantidade: 40, unidade: 'pacotes', urgente: true, status: 'ativo', atualizadoEm: daysAgo(2) },
        { id: 'it2', nome: 'Leite em pó integral', quantidade: 25, unidade: 'latas', urgente: true, status: 'ativo', atualizadoEm: daysAgo(1) },
        { id: 'it3', nome: 'Produtos de higiene pessoal', quantidade: 15, unidade: 'kits', urgente: false, status: 'ativo', atualizadoEm: daysAgo(5) },
        { id: 'it4', nome: 'Medicamentos de uso contínuo (conforme prescrição)', quantidade: 10, unidade: 'caixas', urgente: true, status: 'ativo', atualizadoEm: daysAgo(45) },
        { id: 'it5', nome: 'Lençóis e forros impermeáveis', quantidade: 12, unidade: 'unidades', urgente: false, status: 'ativo', atualizadoEm: daysAgo(10) },
        { id: 'it6', nome: 'Cadeira de rodas', quantidade: 2, unidade: 'unidades', urgente: false, status: 'suprido', atualizadoEm: daysAgo(20) }
      ],

      /* ---------------- CAMPANHAS / EVENTOS ---------------- */
      campanhas: [
        { id: 'c1', titulo: 'Reforma da Área de Convivência', descricao: 'Arrecadação para reformar o espaço de convívio dos residentes, com pintura, mobiliário novo e acessibilidade.', data: daysAgo(-20), recursos: 'Tintas, mão de obra especializada, mobiliário', metaValor: 15000, arrecadado: 13800, origem: 'interna', status: 'ativo', criadoEm: daysAgo(50) },
        { id: 'c2', titulo: 'Compra de Novas Camas Hospitalares', descricao: 'Substituição de camas antigas por modelos com regulagem elétrica para maior conforto dos idosos acamados.', data: daysAgo(-40), recursos: '6 camas hospitalares, colchões', metaValor: 22000, arrecadado: 17160, origem: 'interna', status: 'ativo', criadoEm: daysAgo(70) },
        { id: 'c3', titulo: 'Bazar Beneficente de Inverno', descricao: 'Evento comunitário de venda de roupas e agasalhos doados, com renda revertida para a instituição.', data: daysAgo(-15), recursos: 'Espaço para bazar, voluntários, araras', metaValor: 5000, arrecadado: 2100, origem: 'externa', status: 'ativo', criadoEm: daysAgo(18) },
        { id: 'c4', titulo: 'Festa Junina Solidária 2026', descricao: 'Evento de confraternização com os residentes e a comunidade, arrecadando fundos via barraquinhas.', data: daysAgo(120), recursos: 'Decoração, comidas típicas, som', metaValor: 4000, arrecadado: 4000, origem: 'interna', status: 'encerrado', criadoEm: daysAgo(150) }
      ],

      /* ---------------- DOAÇÕES FINANCEIRAS (PIX) ---------------- */
      doacoes: [
        { id: 'd1', valor: 50, tipo: 'espontanea', doadorId: null, status: 'confirmada', criadoEm: daysAgo(3) },
        { id: 'd2', valor: 200, tipo: 'associativa', doadorId: 'u4', status: 'confirmada', criadoEm: daysAgo(10) },
        { id: 'd3', valor: 100, tipo: 'associativa', doadorId: 'u4', status: 'confirmada', criadoEm: daysAgo(35) },
        { id: 'd4', valor: 30, tipo: 'espontanea', doadorId: null, status: 'pendente', criadoEm: daysAgo(0.2) }
      ],

      /* ---------------- CADASTROS DE VOLUNTÁRIOS (triagem) ---------------- */
      voluntarios: [
        { id: 'v1', protocolo: 'REC-7F3K-8M2Q', nome: 'Pedro Henrique Alves', endereco: 'Rua das Palmeiras, 120 - Pinheiral/RJ', telefone: '(24) 99123-4567', idade: 29, areaInteresse: 'Oficinas de artesanato', menorIdade: false, anexoAutorizacao: null, status: 'pendente', criadoEm: daysAgo(2) },
        { id: 'v2', protocolo: 'REC-3D9L-5X1P', nome: 'Beatriz Lima Costa', endereco: 'Av. Central, 45 - Pinheiral/RJ', telefone: '(24) 98877-2211', idade: 16, areaInteresse: 'Leitura e contação de histórias', menorIdade: true, anexoAutorizacao: 'autorizacao_beatriz.pdf', status: 'pendente', criadoEm: daysAgo(1) },
        { id: 'v3', protocolo: 'REC-1A2B-9C3D', nome: 'Isadora Camargo', endereco: 'Rua Nove de Julho, 88 - Pinheiral/RJ', telefone: '(24) 98888-1234', idade: 24, areaInteresse: 'Atividades recreativas', menorIdade: false, anexoAutorizacao: null, status: 'aprovado', criadoEm: daysAgo(120), usuarioId: 'u3' },
        { id: 'v4', protocolo: 'REC-6Y7Z-2W4V', nome: 'Carlos Eduardo Mota', endereco: 'Rua do Rosário, 33 - Pinheiral/RJ', telefone: '(24) 99222-3344', idade: 40, areaInteresse: 'Manutenção predial', menorIdade: false, anexoAutorizacao: null, status: 'rejeitado', motivo: 'Disponibilidade de horário incompatível com a necessidade atual da instituição.', criadoEm: daysAgo(25) }
      ],

      /* ---------------- CANDIDATURAS A VAGA ---------------- */
      candidaturas: [
        { id: 'cv1', protocolo: 'REC-9K1M-4T7R', cargo: 'cuidador', nome: 'Fernanda Ribeiro Dias', cpf: '77788899900', email: 'fernanda.dias@email.com', telefone: '(24) 99333-1122', curriculoNome: 'curriculo_fernanda.pdf', descricaoExperiencia: '', status: 'em_analise', criadoEm: daysAgo(4) },
        { id: 'cv2', protocolo: 'REC-2Q8W-6E3T', cargo: 'cozinha', nome: 'Roberto Carlos Nascimento', cpf: '88899900011', email: 'roberto.nasc@email.com', telefone: '(24) 99444-5566', curriculoNome: '', descricaoExperiencia: '8 anos de experiência em cozinha institucional, tendo trabalhado em creche e hospital regional.', status: 'em_analise', criadoEm: daysAgo(1) },
        { id: 'cv3', protocolo: 'REC-5R4Y-1U9I', cargo: 'enfermagem', nome: 'Patrícia Gomes Farias', cpf: '99900011122', email: 'patricia.farias@email.com', telefone: '(24) 99555-7788', curriculoNome: 'curriculo_patricia.pdf', descricaoExperiencia: '', status: 'aprovada', criadoEm: daysAgo(80) },
        { id: 'cv4', protocolo: 'REC-8O7P-3A6S', cargo: 'limpeza', nome: 'Marcos Vinícius Teixeira', cpf: '00011122233', email: 'marcos.teixeira@email.com', telefone: '(24) 99666-9900', curriculoNome: '', descricaoExperiencia: 'Experiência de 2 anos em limpeza hospitalar.', status: 'rejeitada', motivo: 'Vaga já preenchida no período.', criadoEm: daysAgo(40) }
      ],

      /* ---------------- SOLICITAÇÕES EXTERNAS DE EVENTO/CAMPANHA ---------------- */
      solicitacoesExternas: [
        { id: 'se1', protocolo: 'REC-4G6H-7J2K', nomeContato: 'Comércio Local Unidos', email: 'contato@comerciolocalunidos.com.br', telefone: '(24) 3356-9988', tipo: 'campanha', objetivo: 'Arrecadação de agasalhos para o inverno', dataPretendida: daysAgo(-25), recursos: 'Espaço para pontos de coleta, divulgação', status: 'em_analise', criadoEm: daysAgo(3) },
        { id: 'se2', protocolo: 'REC-0N5B-8V1C', nomeContato: 'Escola Municipal Pinheiral', email: 'direcao@escolapinheiral.edu.br', telefone: '(24) 3356-1122', tipo: 'evento', objetivo: 'Visita de alunos com apresentação musical para os residentes', dataPretendida: daysAgo(-15), recursos: 'Instrumentos próprios, autorização de visita', status: 'aprovada', criadoEm: daysAgo(30) },
        { id: 'se3', protocolo: 'REC-3X2C-9D4F', nomeContato: 'Grupo Voluntário Esperança', email: 'grupoesperanca@email.com', telefone: '(24) 99777-3344', tipo: 'evento', objetivo: 'Tarde de música ao vivo para os residentes', dataPretendida: daysAgo(120), recursos: 'Equipamento de som próprio', status: 'rejeitada', motivo: 'Data conflita com evento institucional já confirmado.', criadoEm: daysAgo(125) }
      ],

      /* ---------------- NOTÍCIAS / DIVULGAÇÃO INSTITUCIONAL ---------------- */
      noticias: [
        { id: 'n1', titulo: 'Reforma da área de convivência ultrapassa 90% da meta', conteudo: 'Graças à generosidade de doadores e parceiros locais, a campanha para reforma da área de convivência já atingiu mais de 90% do valor necessário. Agradecemos a todos que contribuíram até aqui!', dataPublicacao: daysAgo(2), syncStatus: 'sincronizado' },
        { id: 'n2', titulo: 'Visita da Escola Municipal alegra tarde dos residentes', conteudo: 'Na última semana recebemos a visita de alunos da Escola Municipal Pinheiral, que trouxeram uma apresentação musical especial para nossos idosos. Um momento de muita alegria e troca de carinho.', dataPublicacao: daysAgo(9), syncStatus: 'sincronizado' },
        { id: 'n3', titulo: 'Precisamos de fraldas geriátricas com urgência', conteudo: 'Nosso estoque de fraldas geriátricas está criticamente baixo. Se puder ajudar com essa doação, entre em contato ou contribua através da nossa página de doações.', dataPublicacao: daysAgo(1), syncStatus: 'nao_sincronizado' }
      ],

      /* ---------------- AUDITORIA (FR-035) ---------------- */
      auditLog: [
        { id: 'a1', acao: 'Aprovação de cadastro de voluntário', autor: 'Conta Administrativa', detalhe: 'Isadora Camargo aprovada como voluntária.', dataHora: daysAgo(120) },
        { id: 'a2', acao: 'Aprovação de candidatura a vaga', autor: 'Conta Administrativa', detalhe: 'Patrícia Gomes Farias efetivada como funcionária (Enfermagem).', dataHora: daysAgo(80) },
        { id: 'a3', acao: 'Baixa de item necessário', autor: 'Conta Administrativa', detalhe: 'Cadeira de rodas marcada como suprida.', dataHora: daysAgo(20) },
        { id: 'a4', acao: 'Rejeição de solicitação externa', autor: 'Conta Administrativa', detalhe: 'Grupo Voluntário Esperança — motivo: conflito de data.', dataHora: daysAgo(125) }
      ]
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) {
        const initial = seed();
        localStorage.setItem(DB_KEY, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(raw);
    } catch (e) {
      console.error('Falha ao carregar banco simulado, recriando seed.', e);
      const initial = seed();
      localStorage.setItem(DB_KEY, JSON.stringify(initial));
      return initial;
    }
  }

  function save(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function reset() {
    const initial = seed();
    save(initial);
    return initial;
  }

  function addAudit(db, acao, detalhe) {
    const session = Auth ? Auth.getSession() : null;
    db.auditLog.unshift({
      id: Utils.generateId('a'),
      acao,
      detalhe,
      autor: (session && session.nome) ? session.nome : 'Conta Administrativa',
      dataHora: new Date().toISOString()
    });
  }

  return { load, save, reset, addAudit };
})();
