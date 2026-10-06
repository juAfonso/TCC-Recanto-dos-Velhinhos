// Dados iniciais (T011).
//
//   npm run seed              → produção: configuração inicial, aviso RASCUNHO e a conta
//                               institucional com senha GERADA NA HORA e mostrada uma única vez.
//   npm run seed -- --demo    → desenvolvimento: o mesmo, com senha de demonstração fixa,
//                               mais dados fictícios para testar as telas.
//
// Proteções contra misturar os dois: --demo recusa rodar com VERCEL_ENV=production, e cada
// banco guarda em `configuracao.ambiente` se foi semeado como 'producao' ou 'demo' — o seed
// recusa trocar um pelo outro. Assim os dados fictícios nunca caem no banco do Recanto.
//
// As credenciais de demonstração abaixo só existem em bancos semeados com --demo
// (a do protótipo, admin/admin123, não existe em lugar nenhum).

import { fileURLToPath } from 'node:url';
import { Pool } from '@neondatabase/serverless';
import { gerarHash, gerarSenhaAleatoria } from '../api/_lib/senha.js';

export const CONTA_INSTITUCIONAL = 'recantodosvelhinhos.pinheiral@gmail.com';
export const CONTATO_INICIAL = 'Telefone (24) 3016-4023 · E-mail recantodosvelhinhos.pinheiral@gmail.com';
export const AVISO_VERSAO_INICIAL = '2026-10-v1';

// Só para bancos de desenvolvimento (--demo).
export const DEMO = {
  senhaPainel: 'demo-painel-2026',
  doadora: { nome: 'Doadora Demonstração', cpf: '52998224725', email: 'doadora.demo@exemplo.invalid', senha: 'demo-doadora-2026' },
};

const AVISO_RASCUNHO = `RASCUNHO — substituir pelo texto aprovado pela instituição.

Este é um texto provisório do aviso de privacidade do Recanto dos Velhinhos Francisco Gonçalves Barbosa. O texto definitivo é redigido pelo grupo e aprovado pela instituição (decisão de 2026-09-30) e publicado pelo Painel, em Configurações.

Pontos que o texto definitivo precisa cobrir: quais dados cada formulário coleta e para quê; que cadastros e candidaturas não aprovados são anonimizados 6 meses depois da conclusão da triagem; que o currículo de quem foi contratado é anonimizado 6 meses depois da efetivação; e o contato para pedir correção, anonimização ou revogação do consentimento.`;

async function semear(conexao, { demo }) {
  const q = (texto, parametros) => conexao.query(texto, parametros).then((r) => r.rows);

  const [marca] = await q(`SELECT valor FROM configuracao WHERE chave = 'ambiente'`);
  const ambiente = demo ? 'demo' : 'producao';
  if (marca && marca.valor !== ambiente) {
    throw new Error(
      `Este banco foi semeado como "${marca.valor}" e você pediu "${ambiente}". ` +
      'Confira se o DATABASE_URL do .env.local aponta para o banco certo (dev ou produção).');
  }

  await q(
    `INSERT INTO configuracao (chave, valor, atualizado_por) VALUES
       ('ambiente', $1, 'sistema'), ('contato_instituicao', $2, 'sistema')
     ON CONFLICT (chave) DO NOTHING`, [ambiente, CONTATO_INICIAL]);

  await q(
    `INSERT INTO aviso_privacidade (versao, texto, publicado_por) VALUES ($1, $2, 'sistema')
     ON CONFLICT (versao) DO NOTHING`, [AVISO_VERSAO_INICIAL, AVISO_RASCUNHO]);

  const [contaExistente] = await q('SELECT id FROM conta_institucional WHERE identificador = $1', [CONTA_INSTITUCIONAL]);
  let senhaGerada = null;
  if (!contaExistente) {
    const senha = demo ? DEMO.senhaPainel : gerarSenhaAleatoria();
    await q(
      `INSERT INTO conta_institucional (identificador, senha_hash, criado_por) VALUES ($1, $2, 'sistema')`,
      [CONTA_INSTITUCIONAL, await gerarHash(senha)]);
    if (!demo) senhaGerada = senha;
  }

  if (demo) await semearDemo(q);
  return { contaCriada: !contaExistente, senhaGerada };
}

async function semearDemo(q) {
  const [{ total }] = await q('SELECT count(*)::int AS total FROM item_necessario');
  if (total > 0) return; // já semeado

  await q(
    `INSERT INTO item_necessario (nome, quantidade, unidade, prioridade, criado_por) VALUES
       ('Fraldas geriátricas G', 40, 'pacotes', 'alta', 'sistema'),
       ('Leite integral', 60, 'litros', 'media', 'sistema'),
       ('Sabonete neutro', 30, 'unidades', 'baixa', 'sistema')`);

  await q(
    `INSERT INTO evento (nome, descricao, recursos_necessarios, data, criado_por) VALUES
       ('Tarde de música', 'Apresentação de um coral da cidade para os residentes.', 'Cadeiras extras e lanche',
        (now() AT TIME ZONE 'America/Sao_Paulo')::date + 15, 'sistema')`);

  const [campanha] = await q(
    `INSERT INTO campanha (nome, descricao, periodo_inicio, periodo_fim, meta_valor, arrecadado_valor, criado_por) VALUES
       ('Campanha do agasalho', 'Arrecadação de cobertores e agasalhos para o inverno.',
        (now() AT TIME ZONE 'America/Sao_Paulo')::date, (now() AT TIME ZONE 'America/Sao_Paulo')::date + 30,
        2000, 450, 'sistema')
     RETURNING id`);
  await q(
    `INSERT INTO recurso (campanha_id, tipo, descricao, criado_por) VALUES
       ($1, 'item', 'Cobertores de casal', 'sistema'), ($1, 'dinheiro', 'Doações em dinheiro via Pix', 'sistema')`,
    [campanha.id]);

  await q(
    `INSERT INTO noticia (titulo, corpo, criado_por) VALUES
       ('Notícia de demonstração', 'Texto fictício para testar a página de notícias.', 'sistema')`);

  // Chave FICTÍCIA: o domínio .invalid não existe, o app do banco diz "chave não encontrada".
  await q(
    `INSERT INTO chave_pix_institucional (chave, tipo_chave, nome_recebedor, cidade, criado_por, atualizado_por) VALUES
       ('pix-de-teste@exemplo.invalid', 'email', 'Recanto dos Velhinhos', 'Pinheiral', 'sistema', 'sistema')`);

  const { doadora } = DEMO;
  const [pessoa] = await q(
    `INSERT INTO pessoa (cpf, nome, email, senha_hash, senha_definida_em, criado_por)
     VALUES ($1, $2, $3, $4, now(), 'sistema') RETURNING id`,
    [doadora.cpf, doadora.nome, doadora.email, await gerarHash(doadora.senha)]);
  await q(`INSERT INTO papel (pessoa_id, tipo, criado_por) VALUES ($1, 'doador_associado', 'sistema')`, [pessoa.id]);
  await q(
    `INSERT INTO consentimento (pessoa_id, aviso_versao, finalidade) VALUES ($1, $2, 'doacao_associativa')`,
    [pessoa.id, AVISO_VERSAO_INICIAL]);
  await q(
    `INSERT INTO doacao (tipo, valor, pessoa_id, status, conferido_por, conferido_em, criado_por) VALUES
       ('associativa', 50, $1, 'confirmada', 'sistema', now(), 'doador'),
       ('associativa', 30, $1, 'pendente', NULL, NULL, 'doador'),
       ('espontanea', 20, NULL, 'pendente', NULL, NULL, 'publico')`, [pessoa.id]);
}

export async function rodarSeed(url, { demo = false } = {}) {
  const pool = new Pool({ connectionString: url });
  const conexao = await pool.connect();
  try {
    await conexao.query('BEGIN');
    const resultado = await semear(conexao, { demo });
    await conexao.query('COMMIT');
    return resultado;
  } catch (e) {
    await conexao.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    conexao.release();
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const demo = process.argv.includes('--demo');
  if (demo && process.env.VERCEL_ENV === 'production') {
    console.error('--demo não roda em produção.');
    process.exit(1);
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL não definida. Confira o .env.local (modelo em .env.example).');
    process.exit(1);
  }
  rodarSeed(url, { demo })
    .then(({ contaCriada, senhaGerada }) => {
      console.log(demo ? 'Seed de demonstração aplicado.' : 'Seed de produção aplicado.');
      if (!contaCriada) {
        console.log(`A conta ${CONTA_INSTITUCIONAL} já existia; a senha não foi alterada.`);
      } else if (senhaGerada) {
        console.log('\n================ ANOTE AGORA — NÃO SERÁ MOSTRADA DE NOVO ================');
        console.log(`Painel → usuário: ${CONTA_INSTITUCIONAL}`);
        console.log(`         senha:   ${senhaGerada}`);
        console.log('=========================================================================\n');
      } else {
        console.log(`Painel (demonstração) → usuário ${CONTA_INSTITUCIONAL}, senha em DEMO.senhaPainel no db/seed.js.`);
      }
    })
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
}
