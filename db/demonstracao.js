// Monta o banco do site de DEMONSTRAÇÃO (banca do TCC, decidido em 2026-11-27).
//
//   node --env-file=.env.local db/demonstracao.js             → só confere o destino
//   node --env-file=.env.local db/demonstracao.js --confirmo  → APAGA o banco de destino e o recria
//   node --env-file=.env.local db/demonstracao.js --so-senhas → troca só as senhas, sem apagar nada
//
// Senhas: DEMONSTRACAO_SENHA_PAINEL e DEMONSTRACAO_SENHA_DOADORA no .env.local, se o grupo
// quiser senhas fáceis para a apresentação; sem elas, aleatórias.
//
// Destino: DATABASE_URL_DEMONSTRACAO (a branch "apresentacao" do Neon). O script recusa se
// ela for igual à DATABASE_URL_PRODUCAO ou à DATABASE_URL (dev compartilhada), ou se o banco
// estiver marcado como produção. Pode ser rodado de novo para voltar ao cenário limpo, por
// exemplo na véspera da apresentação.
//
// O que entra:
//   - Real, copiado do site do Recanto pela API PÚBLICA (nenhuma credencial da produção):
//     página institucional com as fotos, aviso de privacidade vigente e contato.
//   - Fictício: pessoas, voluntários, candidatos, solicitações, doações, campanhas, eventos,
//     notícias e itens. Os cadastros passam pela própria API do sistema (como no site), para
//     protocolo, consentimento e auditoria saírem iguais ao uso real.
//   - Chave Pix FICTÍCIA (.invalid): quem ler o QR na banca não paga ninguém.
//   - Senha do Painel e da doadora: as do .env.local ou aleatórias, mostradas só no fim.
// O banco fica marcado como 'demo': o site mostra a faixa "Site de demonstração".

import { randomBytes, randomInt } from 'node:crypto';
import { Pool } from '@neondatabase/serverless';
import { aplicarMigracoes } from './migrate.js';

const SITE_RECANTO = 'https://recantodosvelhinhos.vercel.app';
const destino = process.env.DATABASE_URL_DEMONSTRACAO;

function parar(mensagem) { console.error(mensagem); process.exit(1); }
if (!destino) parar('DATABASE_URL_DEMONSTRACAO não definida no .env.local (connection string da branch "apresentacao").');
if (destino === process.env.DATABASE_URL_PRODUCAO) parar('DATABASE_URL_DEMONSTRACAO é a da produção. Nada foi feito.');
if (destino === process.env.DATABASE_URL) parar('DATABASE_URL_DEMONSTRACAO é a mesma da dev, que o grupo usa. Use a branch "apresentacao".');

// Marca do banco antes de apagar: produção nunca.
{
  const pool = new Pool({ connectionString: destino });
  try {
    const { rows } = await pool.query(`SELECT valor FROM configuracao WHERE chave = 'ambiente'`).catch(() => ({ rows: [] }));
    if (rows[0]?.valor === 'producao') parar('O banco de destino está marcado como PRODUÇÃO. Nada foi feito.');
    console.log(`Destino conferido (marca atual: ${rows[0]?.valor ?? 'sem marca'}).`);
  } finally { await pool.end(); }
}
// Senhas escolhidas pelo grupo para a apresentação (2026-11-27): ficam no .env.local, nunca no
// repositório. Sem elas, o script gera senhas aleatórias. Como o banco só tem dados fictícios,
// senha fácil não expõe ninguém; o pior caso é alguém mexer no cenário, e rodar o script de
// novo o restaura.
function senhaEscolhida(variavel) {
  const valor = process.env[variavel];
  if (!valor) return null;
  if (valor.length < 6) parar(`${variavel} precisa ter pelo menos 6 caracteres.`);
  return valor;
}
const escolhidaPainel = senhaEscolhida('DEMONSTRACAO_SENHA_PAINEL');
const escolhidaDoadora = senhaEscolhida('DEMONSTRACAO_SENHA_DOADORA');

// --so-senhas: troca só as duas senhas, sem apagar o cenário.
if (process.argv.includes('--so-senhas')) {
  const { gerarHash, gerarSenhaAleatoria } = await import('../rotas/_lib/senha.js');
  const { CONTA_INSTITUCIONAL } = await import('./seed.js');
  const pool = new Pool({ connectionString: destino });
  try {
    const { rows: [marca] } = await pool.query(`SELECT valor FROM configuracao WHERE chave = 'ambiente'`);
    if (marca?.valor !== 'demo') parar('O banco de destino não está marcado como demonstração. Rode antes com --confirmo.');
    const painel = escolhidaPainel ?? gerarSenhaAleatoria();
    const doadora = escolhidaDoadora ?? gerarSenhaAleatoria();
    await pool.query('UPDATE conta_institucional SET senha_hash = $1 WHERE identificador = $2',
      [await gerarHash(painel), CONTA_INSTITUCIONAL]);
    await pool.query(`UPDATE pessoa SET senha_hash = $1, senha_definida_em = now() WHERE email = 'helena.demo@exemplo.invalid'`,
      [await gerarHash(doadora)]);
    await pool.query('DELETE FROM limite_tentativa'); // libera quem errou a senha antes
    console.log(`Senhas trocadas.
  Painel   — usuário: ${CONTA_INSTITUCIONAL}
             senha:   ${escolhidaPainel ? '(a de DEMONSTRACAO_SENHA_PAINEL no .env.local)' : painel}
  Doadora  — e-mail:  helena.demo@exemplo.invalid
             senha:   ${escolhidaDoadora ? '(a de DEMONSTRACAO_SENHA_DOADORA no .env.local)' : doadora}`);
  } finally { await pool.end(); }
  process.exit(0);
}

if (!process.argv.includes('--confirmo')) {
  console.log('Nada foi apagado. Para recriar o banco de demonstração, rode de novo com --confirmo.');
  console.log('Para trocar só as senhas, sem apagar nada, use --so-senhas.');
  process.exit(0);
}

// Os módulos da API leem estas variáveis ao carregar: trocar antes de importar.
process.env.DATABASE_URL = destino;
process.env.EMAIL_MODO = 'teste';
process.env.SESSION_SECRET ||= randomBytes(32).toString('hex');

// 1. Banco do zero, marcado como demonstração.
{
  const pool = new Pool({ connectionString: destino });
  try { await pool.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;'); } finally { await pool.end(); }
}
await aplicarMigracoes(destino, { silencioso: true });
console.log('Tabelas criadas.');

const { sql } = await import('../rotas/_lib/db.js');
const { gerarHash, gerarSenhaAleatoria } = await import('../rotas/_lib/senha.js');
const { criarCookie } = await import('../rotas/_lib/sessao.js');
const { CONTA_INSTITUCIONAL, CONTATO_INICIAL } = await import('./seed.js');
const api = await import('../api/index.js');

// ---------- apoio ----------
let ip = 0;
async function chamar(caminho, { metodo = 'POST', corpo, cookie } = {}) {
  ip += 1; // um endereço por envio, para o limite de tentativas não barrar o cenário
  const headers = new Headers({ 'x-forwarded-for': `198.51.100.${ip % 250}` });
  if (cookie) headers.set('cookie', cookie);
  const multipart = corpo instanceof FormData;
  if (corpo !== undefined && !multipart) headers.set('content-type', 'application/json');
  const resposta = await api[metodo](new Request(new URL(caminho, 'http://demonstracao.local'), {
    method: metodo, headers,
    body: corpo === undefined ? undefined : multipart ? corpo : JSON.stringify(corpo),
  }));
  const texto = await resposta.text();
  const dados = texto ? JSON.parse(texto) : null;
  if (resposta.status >= 300) {
    throw new Error(`${metodo} ${caminho} → ${resposta.status}: ${dados?.erro?.mensagem ?? texto}`);
  }
  return dados;
}
const hojeBR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const dia = (deslocamento) => {
  const d = new Date(`${hojeBR()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deslocamento);
  return d.toISOString().slice(0, 10);
};
// CPF fictício, mas com dígitos verificadores válidos (o sistema confere).
function cpf() {
  const n = Array.from({ length: 9 }, () => randomInt(10));
  for (const tam of [9, 10]) {
    const soma = n.reduce((s, x, i) => s + x * (tam + 1 - i), 0);
    const dv = (soma * 10) % 11 % 10;
    n.push(dv);
  }
  return n.join('');
}
const telefone = () => `2499${String(randomInt(1e6, 1e7))}`.slice(0, 11);

// ---------- 2. Conteúdo público real do Recanto ----------
async function publico(caminho) {
  const r = await fetch(`${SITE_RECANTO}${caminho}`);
  if (!r.ok) throw new Error(`${caminho} respondeu ${r.status}`);
  return r.json();
}
const institucional = await publico('/api/public/institucional');
const aviso = await publico('/api/public/aviso-privacidade');

await sql`INSERT INTO configuracao (chave, valor, atualizado_por) VALUES ('ambiente', 'demo', 'sistema')
          ON CONFLICT (chave) DO UPDATE SET valor = 'demo'`;
await sql`INSERT INTO configuracao (chave, valor, atualizado_por) VALUES ('contato_instituicao', ${aviso.contato || CONTATO_INICIAL}, 'sistema')
          ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor`;
await sql`INSERT INTO aviso_privacidade (versao, texto, publicado_por, publicado_em)
          VALUES (${aviso.versao}, ${aviso.texto}, 'sistema', ${aviso.publicadoEm})`;
await sql`UPDATE conteudo_institucional
          SET historia = ${institucional.historia}, missao = ${institucional.missao}, equipe = ${institucional.equipe},
              acolhimento = ${institucional.acolhimento}, bazar = ${institucional.bazar}, atualizado_por = 'sistema'
          WHERE id = 1`;
// As fotos continuam no Blob público do Recanto: aqui só o registro que aponta para elas.
for (const [ordem, imagem] of institucional.imagens.entries()) {
  const url = new URL(imagem.url);
  const cabeca = await fetch(imagem.url, { method: 'HEAD' });
  const [arquivo] = await sql`
    INSERT INTO arquivo (blob_url, blob_pathname, acesso, categoria, nome_original, mime_type, tamanho_bytes, enviado_por)
    VALUES (${imagem.url}, ${url.pathname.slice(1)}, 'publico', 'imagem_institucional', ${url.pathname.split('/').pop()},
            ${cabeca.headers.get('content-type') || 'image/jpeg'}, ${Number(cabeca.headers.get('content-length')) || 1}, 'sistema')
    RETURNING id`;
  await sql`INSERT INTO conteudo_institucional_imagem (arquivo_id, texto_alternativo, ordem, criado_por)
            VALUES (${arquivo.id}, ${imagem.alt}, ${ordem + 1}, 'sistema')`;
}
await sql`INSERT INTO chave_pix_institucional (chave, tipo_chave, nome_recebedor, cidade, criado_por, atualizado_por)
          VALUES ('pix-de-demonstracao@exemplo.invalid', 'email', 'Recanto dos Velhinhos', 'Pinheiral', 'sistema', 'sistema')`;
console.log(`Conteúdo público do Recanto copiado (${institucional.imagens.length} fotos, aviso ${aviso.versao}).`);

// ---------- 3. Conta do Painel ----------
const senhaPainel = escolhidaPainel ?? gerarSenhaAleatoria();
const [conta] = await sql`
  INSERT INTO conta_institucional (identificador, senha_hash, criado_por)
  VALUES (${CONTA_INSTITUCIONAL}, ${await gerarHash(senhaPainel)}, 'sistema') RETURNING id`;
const painel = criarCookie({ ctx: 'admin', id: conta.id }).split(';')[0];
const admin = (caminho, corpo = {}, metodo = 'POST') => chamar(caminho, { metodo, corpo, cookie: painel });
const consentimento = { avisoVersao: aviso.versao, aceito: true };

// ---------- 4. Itens necessários ----------
const itens = [
  ['Fraldas geriátricas G', 60, 'pacotes', 'alta'],
  ['Fraldas geriátricas M', 40, 'pacotes', 'alta'],
  ['Suplemento alimentar', 20, 'latas', 'media'],
  ['Leite integral', 80, 'litros', 'media'],
  ['Sabonete neutro', 50, 'unidades', 'baixa'],
  ['Lençóis de solteiro', 15, 'unidades', 'baixa'],
  ['Álcool 70%', 24, 'litros', 'media'],
];
const idsItens = [];
for (const [nome, quantidade, unidade, prioridade] of itens) {
  const r = await admin('/api/admin/itens', { nome, quantidade, unidade, prioridade });
  idsItens.push(r.id ?? r.item?.id);
}
await admin(`/api/admin/itens/${idsItens.at(-1)}/baixa`);
console.log(`${itens.length} itens necessários (1 já suprido).`);

// ---------- 5. Campanhas e eventos ----------
const criar = (corpo) => admin('/api/admin/eventos-campanhas', corpo);
const idDe = (r) => r.id ?? r.campanha?.id ?? r.evento?.id;

const natalSolidario = idDe(await criar({
  tipo: 'campanha', nome: 'Natal Solidário 2026',
  objetivo: 'Presentear cada residente no Natal e reforçar o estoque de higiene para o início do ano.',
  periodoInicio: dia(1), periodoFim: dia(45), meta: '1500',
  recursos: [
    { tipo: 'item', descricao: 'Kits de higiene pessoal' },
    { tipo: 'item', descricao: 'Pijamas e chinelos (tamanhos P a GG)' },
    { tipo: 'dinheiro', descricao: 'Doações via Pix para a ceia de Natal' },
  ],
}));
const fraldas = idDe(await criar({
  tipo: 'campanha', nome: 'Mutirão das Fraldas',
  objetivo: 'Garantir o estoque de fraldas geriátricas para três meses.',
  periodoInicio: dia(1), periodoFim: dia(20),
  recursos: [{ tipo: 'item', descricao: 'Fraldas geriátricas G' }, { tipo: 'item', descricao: 'Fraldas geriátricas M' }],
}));
const natal = idDe(await criar({
  tipo: 'evento', nome: 'Ceia de Natal do Recanto', data: dia(26),
  objetivo: 'Confraternização de fim de ano com residentes, familiares e voluntários.',
  recursos: 'Mesas, toalhas, ajuda na decoração e na cozinha',
}));
const musica = idDe(await criar({
  tipo: 'evento', nome: 'Tarde de música com o coral', data: dia(1),
  objetivo: 'Apresentação de um coral da cidade para os residentes.', recursos: 'Cadeiras extras e lanche',
}));

// Os passados: datas ajustadas no banco (a tela não aceita criar no passado) e encerrados pela API.
await sql`UPDATE campanha SET periodo_inicio = ${dia(-75)}, periodo_fim = ${dia(-15)}, criado_em = now() - interval '80 days'
          WHERE id = ${fraldas}`;
await sql`UPDATE campanha SET periodo_inicio = ${dia(-10)}, criado_em = now() - interval '12 days' WHERE id = ${natalSolidario}`;
await sql`UPDATE evento SET data = ${dia(-20)}, criado_em = now() - interval '40 days' WHERE id = ${musica}`;
await admin(`/api/admin/eventos-campanhas/${fraldas}/encerrar`);
await admin(`/api/admin/eventos-campanhas/${musica}/encerrar`);

// Arrecadação registrada à mão, como a equipe faz.
const recursosDe = async (id) => sql`SELECT id, tipo FROM recurso WHERE campanha_id = ${id} ORDER BY criado_em, id`;
const [rf1, rf2] = await recursosDe(fraldas);
await admin(`/api/admin/campanhas/${fraldas}/arrecadado`, {
  recursos: [{ id: rf1.id, quantidade: '84', unidade: 'pacotes' }, { id: rf2.id, quantidade: '57', unidade: 'pacotes' }],
}, 'PUT');
const ra = await recursosDe(natalSolidario);
await admin(`/api/admin/campanhas/${natalSolidario}/arrecadado`, {
  valor: '620',
  recursos: ra.map((r) => (r.tipo === 'dinheiro'
    ? { id: r.id, quantidade: '620' }
    : { id: r.id, quantidade: r === ra[0] ? '18' : '35', unidade: 'unidades' })),
}, 'PUT');
console.log('2 campanhas (1 ativa, 1 encerrada com relatório) e 2 eventos (1 futuro, 1 encerrado).');

// ---------- 6. Notícias ----------
const noticias = [
  ['Mutirão das Fraldas supera a meta',
    'Graças à comunidade de Pinheiral, o Mutirão das Fraldas arrecadou 141 pacotes, estoque suficiente para cerca de três meses. Obrigado a todos que doaram!'],
  ['Começa o Natal Solidário 2026',
    'Até o início de janeiro, recebemos kits de higiene, pijamas e chinelos na sede, de segunda a sexta, das 8h às 17h. Também é possível contribuir via Pix pela página de doações.'],
  ['Bazar de dezembro com novidades',
    'No primeiro sábado de dezembro o bazar terá roupas de festa, utensílios de cozinha e brinquedos. Toda a renda é revertida para o cuidado dos residentes.'],
];
for (const [titulo, corpo] of noticias) {
  const form = new FormData();
  form.set('titulo', titulo);
  form.set('corpo', corpo);
  const r = await chamar('/api/admin/noticias', { corpo: form, cookie: painel });
  const id = r.id ?? r.noticia?.id;
  const [{ status }] = await sql`SELECT status FROM noticia WHERE id = ${id}`;
  if (status !== 'publicada') await admin(`/api/admin/noticias/${id}/publicar`);
}
console.log(`${noticias.length} notícias publicadas.`);

// ---------- 7. Voluntários (pelo formulário público) ----------
const endereco = { endereco: 'Rua das Acácias, 120', bairro: 'Centro', cep: '27197000', cidade: 'Pinheiral', uf: 'RJ' };
async function voluntario(nome, nascimento, tipoServico, extra = {}) {
  const r = await chamar('/api/public/voluntarios', {
    corpo: {
      nome, dataNascimento: nascimento, cpf: cpf(), rg: `${randomInt(10, 99)}.${randomInt(100, 999)}.${randomInt(100, 999)}-${randomInt(0, 9)}`,
      ...endereco, telefone: telefone(), email: `${nome.split(' ')[0].toLowerCase()}.${randomInt(100, 999)}@exemplo.invalid`,
      tipoServico, objetivos: 'Quero ajudar no dia a dia do Recanto.', condicoes: 'Sábados pela manhã.', consentimento, ...extra,
    },
  });
  const [{ id }] = await sql`SELECT id FROM cand_voluntario WHERE protocolo = ${r.protocolo}`;
  return id;
}
const v1 = await voluntario('Mariana Albuquerque', '1994-03-12', 'Atividades recreativas');
const v2 = await voluntario('Pedro Henrique Costa', '2009-08-30', 'Leitura e contação de histórias'); // menor
await voluntario('Carla Mendes Rocha', '1988-11-02', 'Oficinas de artesanato');
const v4 = await voluntario('João Victor Lima', '1999-05-21', 'Apoio em eventos e campanhas');
const v5 = await voluntario('Beatriz Fontes', '1976-01-17', 'Acompanhamento aos idosos');
const v6 = await voluntario('Rafael Duarte', '2001-07-09', 'Manutenção predial');
await admin(`/api/admin/voluntarios/${v1}/entrevista`);
for (const id of [v4, v5]) {
  await admin(`/api/admin/voluntarios/${id}/entrevista`);
  await admin(`/api/admin/voluntarios/${id}/aprovar`);
}
await admin(`/api/admin/voluntarios/${v6}/rejeitar`, { motivo: 'Sem disponibilidade nos horários de que o Recanto precisa.' });
void v2; // fica pendente, com a autorização do responsável pendente
console.log('6 voluntários: 2 pendentes (1 menor), 1 em entrevista, 2 aprovados, 1 rejeitado.');

// ---------- 8. Candidatos a vaga ----------
async function candidato(nome, cargo, nascimento, curriculoTexto) {
  const form = new FormData();
  for (const [k, val] of Object.entries({
    cargo, nome, cpf: cpf(), dataNascimento: nascimento, telefone: telefone(),
    email: `${nome.split(' ')[0].toLowerCase()}.${randomInt(100, 999)}@exemplo.invalid`, curriculoTexto,
    avisoVersao: aviso.versao, aceito: 'true',
  })) form.set(k, val);
  const r = await chamar('/api/public/candidaturas', { corpo: form });
  const [{ id }] = await sql`SELECT id FROM cand_funcionario WHERE protocolo = ${r.protocolo}`;
  return id;
}
await candidato('Luciana Prado', 'cuidador', '1985-04-10',
  'Técnica de enfermagem, 6 anos de experiência como cuidadora em ILPI de Volta Redonda.');
const c2 = await candidato('Anderson Silva', 'cozinha', '1980-09-25',
  'Cozinheiro há 10 anos, com curso de manipulação de alimentos e experiência em refeitório.');
const c3 = await candidato('Juliana Teixeira', 'limpeza', '1992-12-03',
  'Auxiliar de serviços gerais em escola municipal por 4 anos.');
const c4 = await candidato('Marcos Antunes', 'cuidador', '1997-02-14',
  'Cuidou do avô por dois anos; sem experiência profissional na área.');
await admin(`/api/admin/candidaturas/${c2}/entrevista`);
await admin(`/api/admin/candidaturas/${c3}/entrevista`);
await admin(`/api/admin/candidaturas/${c3}/aprovar`);
await admin(`/api/admin/candidaturas/${c4}/rejeitar`, {});
console.log('4 candidaturas: 1 pendente, 1 em entrevista, 1 aprovada (virou funcionária), 1 rejeitada.');

// ---------- 9. Solicitações externas ----------
async function solicitacao(corpo) {
  const r = await chamar('/api/public/solicitacoes', {
    corpo: { telefone: telefone(), consentimento, ...corpo },
  });
  const [{ id }] = await sql`SELECT id FROM solicitacao_externa WHERE protocolo = ${r.protocolo}`;
  return id;
}
await solicitacao({
  tipo: 'evento', nomeContato: 'Escola Estadual Pinheiral', email: 'direcao.escola@exemplo.invalid',
  nomeIniciativa: 'Visita dos alunos do 9º ano', objetivo: 'Tarde de jogos e conversa entre alunos e residentes.',
  dataPretendida: dia(18), recursosEsperados: 'Espaço do pátio por duas horas.',
});
const s2 = await solicitacao({
  tipo: 'campanha', nomeContato: 'Igreja Comunidade da Paz', email: 'pastoral@exemplo.invalid',
  nomeIniciativa: 'Campanha de produtos de higiene', objetivo: 'Arrecadar itens de higiene pessoal entre os fiéis.',
  periodoInicio: dia(10), periodoFim: dia(40), itensArrecadar: ['Sabonete neutro', 'Creme dental', 'Xampu infantil'],
});
const s3 = await solicitacao({
  tipo: 'evento', nomeContato: 'Grupo de Dança Raízes', email: 'raizes.danca@exemplo.invalid',
  nomeIniciativa: 'Apresentação de dança folclórica', objetivo: 'Apresentação de 40 minutos para os residentes.',
  dataPretendida: dia(12), recursosEsperados: 'Tomada para a caixa de som.',
});
const s4 = await solicitacao({
  tipo: 'evento', nomeContato: 'Loja Bom Preço', email: 'marketing@exemplo.invalid',
  nomeIniciativa: 'Ação promocional da loja', objetivo: 'Distribuir panfletos da loja na festa do Recanto.',
  dataPretendida: dia(26),
});
await admin(`/api/admin/solicitacoes/${s2}/aprovar`, {});
await admin(`/api/admin/solicitacoes/${s3}/aprovar`, {});
await admin(`/api/admin/solicitacoes/${s3}/confirmar`, {
  nome: 'Apresentação de dança folclórica', data: dia(12),
  objetivo: 'Apresentação de 40 minutos do Grupo de Dança Raízes para os residentes.', recursos: 'Tomada para a caixa de som.',
  confirmarAviso: true,
});
await admin(`/api/admin/solicitacoes/${s4}/rejeitar`, { motivo: 'A proposta tem fim comercial.' });
console.log('4 solicitações: 1 pendente, 1 aguardando contato, 1 confirmada (evento publicado), 1 rejeitada.');

// ---------- 10. Doadores associados e doações (últimos 4 meses) ----------
const senhaDoadora = escolhidaDoadora ?? gerarSenhaAleatoria();
const doadores = [];
for (const [nome, email, comSenha] of [
  ['Helena Vasconcelos', 'helena.demo@exemplo.invalid', true],
  ['Roberto Nogueira', 'roberto.demo@exemplo.invalid', false],
  ['Sônia Almeida', 'sonia.demo@exemplo.invalid', false],
]) {
  const [p] = await sql`
    INSERT INTO pessoa (cpf, nome, email, telefone, senha_hash, senha_definida_em, criado_por)
    VALUES (${cpf()}, ${nome}, ${email}, ${telefone()}, ${comSenha ? await gerarHash(senhaDoadora) : null},
            ${comSenha ? new Date() : null}, 'publico')
    RETURNING id`;
  await sql`INSERT INTO papel (pessoa_id, tipo, criado_por) VALUES (${p.id}, 'doador_associado', 'publico')`;
  await sql`INSERT INTO consentimento (pessoa_id, aviso_versao, finalidade) VALUES (${p.id}, ${aviso.versao}, 'doacao_associativa')`;
  doadores.push({ id: p.id, email, comSenha });
}
const valores = [10, 20, 20, 25, 30, 50, 50, 50, 100, 100, 150, 200];
const doacoes = [];
for (let i = 0; i < 34; i += 1) {
  const diasAtras = randomInt(1, 120);
  const associativa = i % 3 === 0;
  doacoes.push({
    tipo: associativa ? 'associativa' : 'espontanea',
    valor: valores[randomInt(valores.length)],
    pessoa: associativa ? doadores[i % doadores.length].id : null,
    quando: diasAtras,
    status: diasAtras < 9 ? 'pendente' : i % 11 === 5 ? 'nao_localizada' : 'confirmada',
  });
}
doacoes.push({ tipo: 'espontanea', valor: 50, pessoa: null, quando: 0, status: 'pendente' });
for (const d of doacoes) {
  await sql`
    INSERT INTO doacao (tipo, valor, pessoa_id, status, declarada_em, motivo_nao_localizada, conferido_por, conferido_em, criado_por)
    VALUES (${d.tipo}, ${d.valor}, ${d.pessoa}, ${d.status},
            now() - make_interval(days => ${d.quando}, hours => ${randomInt(0, 10)}),
            ${d.status === 'nao_localizada' ? 'Entrada no extrato foi depósito/TED, não Pix.' : null},
            ${d.status === 'pendente' ? null : CONTA_INSTITUCIONAL},
            ${d.status === 'pendente' ? null : new Date(Date.now() - Math.max(d.quando - 2, 0) * 86400e3)},
            ${d.pessoa ? 'doador' : 'publico'})`;
}
const resumo = doacoes.reduce((a, d) => ({ ...a, [d.status]: (a[d.status] ?? 0) + 1 }), {});
console.log(`3 doadores associados e ${doacoes.length} doações (${Object.entries(resumo).map(([k, n]) => `${n} ${k}`).join(', ')}).`);

const doadora = doadores.find((d) => d.comSenha);
console.log(`
Pronto. O banco de demonstração está montado e marcado como 'demo'.

Anote agora (não aparecem de novo; para trocar, rode o script outra vez):
  Painel   — usuário: ${CONTA_INSTITUCIONAL}
             senha:   ${escolhidaPainel ? "(a de DEMONSTRACAO_SENHA_PAINEL no .env.local)" : senhaPainel}
  Doadora  — e-mail:  ${doadora.email}
             senha:   ${escolhidaDoadora ? "(a de DEMONSTRACAO_SENHA_DOADORA no .env.local)" : senhaDoadora}
`);
process.exit(0);
