// GET /api/admin/pessoas?busca=&situacao=&papel= — busca por nome, CPF ou e-mail (FR-023).
//   situacao: todos (padrão) | ativos | inativos — inativos sempre consultáveis (Princípio III).
//   Pessoa "ativa" = tem ao menos um papel ativo (inativação é papel por papel, 2026-10-07).
//   Anonimizados não entram: são consultados na tela de Privacidade (LGPD).
// POST /api/admin/pessoas — cadastro direto, sem triagem (FR-023, FR-034):
//   { perfil: 'funcionario', nome, cpf, dataNascimento, email, telefone }
//   { perfil: 'voluntario', ...campos do termo de adesão (FR-011) }
//   CPF já cadastrado → 409 CPF_JA_CADASTRADO com o `id` para abrir o registro existente.
//   Doador associado não é cadastrado aqui: nasce com a primeira doação associativa (2026-10-04).

import { sql, transacao } from '../../_lib/db.js';
import { exigirAdmin } from '../../_lib/acesso.js';
import { registrarAuditoria } from '../../_lib/auditoria.js';
import { validarCadastro } from '../../_lib/voluntarios.js';
import { validarPessoa, cadastrarVoluntarioPainel, traduzirEmailEmUso, PAPEIS } from '../../_lib/pessoas.js';
import { soDigitos } from '../../_lib/validacao.js';
import { json, lerJson, falhar, rota } from '../../_lib/http.js';

const LIMITE = 200;

export const GET = rota(async (request) => {
  await exigirAdmin(request);
  const params = new URL(request.url).searchParams;
  const busca = String(params.get('busca') ?? '').trim().slice(0, 100);
  const situacao = ['ativos', 'inativos'].includes(params.get('situacao')) ? params.get('situacao') : 'todos';
  const papel = PAPEIS.includes(params.get('papel')) ? params.get('papel') : null;
  const digitos = soDigitos(busca);

  const linhas = await sql`
    SELECT * FROM (
      SELECT p.id, p.nome, p.cpf, p.email, p.telefone,
             (p.ativo AND EXISTS (SELECT 1 FROM papel WHERE pessoa_id = p.id AND status = 'ativo')) AS ativo,
             COALESCE((SELECT json_agg(json_build_object('tipo', tipo, 'status', status) ORDER BY inicio_em)
                       FROM papel WHERE pessoa_id = p.id), '[]') AS papeis
      FROM pessoa p
      WHERE p.anonimizado_em IS NULL
        AND (${busca} = ''
             OR p.nome ILIKE '%' || ${busca} || '%'
             OR p.email ILIKE '%' || ${busca} || '%'
             OR (${digitos} <> '' AND p.cpf LIKE '%' || ${digitos} || '%'))
        AND (${papel}::text IS NULL OR EXISTS (SELECT 1 FROM papel WHERE pessoa_id = p.id AND tipo = ${papel}))
    ) achadas
    WHERE ${situacao} = 'todos' OR ativo = (${situacao} = 'ativos')
    ORDER BY nome
    LIMIT ${LIMITE + 1}`;

  const pessoas = linhas
    .slice(0, LIMITE)
    .map((p) => ({ id: p.id, nome: p.nome, cpf: p.cpf, email: p.email, telefone: p.telefone, ativo: p.ativo, papeis: p.papeis }));
  return json({ pessoas, maisResultados: linhas.length > LIMITE });
});

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const corpo = await lerJson(request);
  const autor = conta.identificador;
  const perfil = corpo.perfil;
  if (!['funcionario', 'voluntario'].includes(perfil)) {
    falhar(400, 'DADOS_INVALIDOS', 'Escolha se o cadastro é de funcionário ou de voluntário.', ['perfil']);
  }
  const dados = perfil === 'voluntario' ? validarCadastro(corpo) : validarPessoa(corpo);

  const resultado = await transacao(async (tx) => {
    const [existente] = await tx.query(
      'SELECT id FROM pessoa WHERE cpf = $1 AND anonimizado_em IS NULL', [dados.cpf]);
    if (existente) {
      falhar(409, 'CPF_JA_CADASTRADO', 'Já existe uma pessoa com este CPF. Abra o cadastro dela para consultar ou adicionar um papel.',
        ['cpf'], null, { id: existente.id });
    }

    if (perfil === 'voluntario') {
      const [emTriagem] = await tx.query(
        `SELECT protocolo FROM cadastro_voluntario
         WHERE cpf = $1 AND status IN ('pendente', 'entrevista') AND anonimizado_em IS NULL`, [dados.cpf]);
      if (emTriagem) {
        falhar(409, 'VOLUNTARIO_EM_TRIAGEM',
          `Esta pessoa já tem um cadastro de voluntário em triagem (protocolo ${emTriagem.protocolo}). Decida por ele em Triagem › Voluntários.`, ['cpf']);
      }
      const r = await cadastrarVoluntarioPainel(tx, dados, autor);
      await registrarAuditoria({
        autorTipo: 'conta_institucional', autorId: conta.id, acao: 'voluntario.cadastrar_painel',
        entidadeTipo: 'cadastro_voluntario', entidadeId: r.cadastroVoluntarioId,
        detalhe: { menorDeIdade: dados.menor_de_idade },
      }, tx);
      return { perfil, id: r.pessoaId, ...r };
    }

    let pessoa;
    try {
      [pessoa] = await tx.query(
        `INSERT INTO pessoa (cpf, nome, email, telefone, data_nascimento, criado_por)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [dados.cpf, dados.nome, dados.email, dados.telefone, dados.data_nascimento, autor]);
    } catch (e) { traduzirEmailEmUso(e); }
    await tx.query(`INSERT INTO papel (pessoa_id, tipo, criado_por) VALUES ($1, 'funcionario', $2)`, [pessoa.id, autor]);
    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id, acao: 'pessoa.cadastrar',
      entidadeTipo: 'pessoa', entidadeId: pessoa.id, detalhe: { papel: 'funcionario' },
    }, tx);
    return { perfil, id: pessoa.id };
  });
  return json(resultado, 201);
});
