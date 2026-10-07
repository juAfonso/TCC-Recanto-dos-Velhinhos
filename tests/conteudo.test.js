// US8 — notícias e página institucional (FR-001a, FR-032a, FR-032b). Sem Blob nos testes:
// o envio de imagem em si é verificado à mão; aqui fica o que vale antes dele (texto alternativo
// obrigatório) e o ciclo publicar → editar → despublicar → publicar, que nunca apaga nada.

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { prepararBanco, chamar, criarConta, sql } from './_apoio.js';

let conta;
before(async () => {
  await prepararBanco();
  conta = await criarConta();
});

const formulario = (campos, imagem) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  if (imagem) f.set('imagem', new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], 'foto.jpg', { type: 'image/jpeg' }));
  return f;
};
const titulosNoPortal = async () => (await chamar('/api/public/noticias')).corpo.noticias.map((n) => n.titulo);

test('notícia: publicar, editar, despublicar e publicar de novo, sem apagar', async () => {
  const nova = await chamar('/api/admin/noticias', {
    metodo: 'POST', cookie: conta.cookie, corpo: formulario({ titulo: 'Festa junina', corpo: 'Venha participar.' }),
  });
  assert.equal(nova.status, 201);
  assert.deepEqual(await titulosNoPortal(), ['Festa junina']);

  const editada = await chamar(`/api/admin/noticias/${nova.corpo.id}`, {
    metodo: 'PUT', cookie: conta.cookie, corpo: formulario({ titulo: 'Festa junina 2026', corpo: 'Sábado, 14h.' }),
  });
  assert.equal(editada.status, 200);
  assert.deepEqual(await titulosNoPortal(), ['Festa junina 2026']);
  const [{ total }] = await sql`SELECT count(*)::int AS total FROM historico_alteracao WHERE entidade_id = ${nova.corpo.id}`;
  assert.equal(total, 1, 'a versão anterior fica no histórico');

  assert.equal((await chamar(`/api/admin/noticias/${nova.corpo.id}/despublicar`, { metodo: 'POST', cookie: conta.cookie })).status, 200);
  assert.deepEqual(await titulosNoPortal(), [], 'despublicada sai do Portal');
  const painel = await chamar('/api/admin/noticias', { cookie: conta.cookie });
  assert.equal(painel.corpo.noticias[0].status, 'despublicada', 'e continua no Painel');
  assert.equal((await chamar(`/api/admin/noticias/${nova.corpo.id}/despublicar`, { metodo: 'POST', cookie: conta.cookie })).status, 409);

  assert.equal((await chamar(`/api/admin/noticias/${nova.corpo.id}/publicar`, { metodo: 'POST', cookie: conta.cookie })).status, 200);
  assert.deepEqual(await titulosNoPortal(), ['Festa junina 2026']);
});

test('notícia com imagem sem texto alternativo é recusada antes de enviar o arquivo', async () => {
  const antes = (await sql`SELECT count(*)::int AS n FROM noticia`)[0].n;
  const r = await chamar('/api/admin/noticias', {
    metodo: 'POST', cookie: conta.cookie, corpo: formulario({ titulo: 'Com foto', corpo: 'Texto.', imagemAlt: '  ' }, true),
  });
  assert.equal(r.status, 400);
  assert.equal(r.corpo.erro.codigo, 'TEXTO_ALTERNATIVO_OBRIGATORIO');
  assert.equal((await sql`SELECT count(*)::int AS n FROM noticia`)[0].n, antes);
  assert.equal((await sql`SELECT count(*)::int AS n FROM arquivo`)[0].n, 0, 'nada foi enviado ao Blob');
});

test('página institucional: salvar publica no Portal e guarda a versão anterior', async () => {
  const atual = (await chamar('/api/admin/institucional', { cookie: conta.cookie })).corpo;
  const r = await chamar('/api/admin/institucional', {
    metodo: 'PUT', cookie: conta.cookie, corpo: { ...atual, missao: 'Acolher com dignidade.' },
  });
  assert.equal(r.status, 200);
  assert.deepEqual(r.corpo.alteradas, ['missao']);
  assert.equal((await chamar('/api/public/institucional')).corpo.missao, 'Acolher com dignidade.');
  const depois = (await chamar('/api/admin/institucional', { cookie: conta.cookie })).corpo;
  assert.equal(depois.historico.length, 1);
  assert.equal(depois.historico[0].versao.missao, atual.missao);
});

test('imagem institucional sem texto alternativo é recusada', async () => {
  const r = await chamar('/api/admin/institucional/imagens', {
    metodo: 'POST', cookie: conta.cookie, corpo: formulario({ imagemAlt: '' }, true),
  });
  assert.equal(r.status, 400);
  assert.equal(r.corpo.erro.codigo, 'TEXTO_ALTERNATIVO_OBRIGATORIO');
});
