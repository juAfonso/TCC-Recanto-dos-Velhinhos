// Registra em todos os documentos as duas seções novas da página institucional (2026-10-06).
const fs = require('fs');

function editar(arquivo, trocas) {
  let s = fs.readFileSync(arquivo, 'utf8');
  const eol = s.includes('\r\n') ? '\r\n' : '\n';
  for (const [de, para, todas] of trocas) {
    if (!s.includes(de)) throw new Error(`${arquivo}: não achei «${de.slice(0, 70)}»`);
    s = todas ? s.split(de).join(para) : s.replace(de, para);
  }
  fs.writeFileSync(arquivo, s.replace(/\r?\n/g, eol));
}

const SPEC = 'specs/001-portal-painel-ilpi/spec.md';
editar(SPEC, [
  ['(história, missão e equipe)', '(história, missão, equipe, acolhimento de residentes e bazar)', true],
  ['textos de história, missão e equipe e imagens opcionais', 'textos de história, missão, equipe, acolhimento de residentes e bazar e imagens opcionais'],
  ['Possui textos de história, missão e equipe,', 'Possui textos de história, missão, equipe, acolhimento de residentes e bazar,'],
  ['(história, missão, equipe) e a própria equipe', '(história, missão, equipe, acolhimento de residentes e bazar) e a própria equipe'],
  ['Given a instituição publicou seu histórico, missão e equipe,', 'Given a instituição publicou seu histórico, missão, equipe, acolhimento de residentes e bazar,'],
  ['\n## User Scenarios & Testing (mandatory)',
    '\n### Session 2026-10-06 (2) — Texto institucional entregue pelo Recanto\n\n' +
    '- Q: O texto institucional entregue pelo Recanto tem, além de história, missão e equipe, as seções "Acolhimento de residentes" (quem é acolhido e como saber de vaga) e "Nosso bazar" (dia, horário e o que se doa). Onde ficam? (FR-001, FR-001a) → A: **Duas seções novas da página institucional, editáveis pela equipe como as outras.** O dia do bazar e a situação de vagas mudam, e texto fixo no HTML obrigaria a mexer no código. Descartado: juntar no texto da história (página desorganizada) e fixar no HTML (a equipe não conseguiria editar). A seção de acolhimento é **só texto informativo**: não cria cadastro de residentes, que continua fora do escopo. A "equipe" passa a mostrar quem conduz a instituição (diretoria voluntária), conforme o texto entregue.\n' +
    '\n## User Scenarios & Testing (mandatory)'],
]);

editar('specs/001-portal-painel-ilpi/data-model.md', [
  ['| `historia`, `missao`, `equipe` | `text` | |',
    '| `historia`, `missao`, `equipe`, `acolhimento`, `bazar` | `text` | `acolhimento` e `bazar` desde 2026-10-06 (migração 006, Session 2026-10-06 (2) do spec) |'],
]);

editar('specs/001-portal-painel-ilpi/contracts/api.md', [
  ['| história, missão, equipe e imagens com texto alternativo (FR-001) |',
    '| história, missão, equipe, acolhimento, bazar e imagens com texto alternativo (FR-001) |'],
]);

editar('specs/001-portal-painel-ilpi/tasks.md', [
  ['(`GET`): história, missão, equipe e só as imagens', '(`GET`): história, missão, equipe, acolhimento, bazar e só as imagens'],
  ['(`GET`/`PUT` multipart: história, missão, equipe, imagens', '(`GET`/`PUT` multipart: história, missão, equipe, acolhimento, bazar, imagens'],
]);

editar('docs/casos-de-uso-tcc.md', [
  ['(história, missão e equipe)', '(história, missão, equipe, acolhimento de residentes e bazar)', true],
  ['textos atuais de história, missão e equipe e as imagens', 'textos atuais de história, missão, equipe, acolhimento de residentes e bazar e as imagens'],
]);

editar('public/README.md', [
  ['História, missão e equipe (FR-001)', 'História, missão, equipe, acolhimento e bazar (FR-001)'],
]);

editar('CLAUDE.md', [
  ['  equipe edita história, missão e equipe numa tela própria (FR-001a), com',
    '  equipe edita história, missão, equipe, acolhimento de residentes e bazar\n  numa tela própria (FR-001a), com'],
  ['  notícia — não se publica nem despublica. O protótipo ainda não tem a tela.\n',
    '  notícia — não se publica nem despublica. O protótipo ainda não tem a tela.\n' +
    '- **Texto institucional do Recanto e duas seções novas (2026-10-06).** O\n' +
    '  Recanto entregou o texto da página (fundação em 7/1/1983, 22 residentes,\n' +
    '  diretoria voluntária presidida pela Sra. Eliege de Faria Barbosa). Além de\n' +
    '  história, missão e equipe, ele tem **"Acolhimento de residentes"** e\n' +
    '  **"Nosso bazar"**, que viraram seções **editáveis** (migração 006), porque\n' +
    '  o dia do bazar e a situação de vagas mudam. A seção de acolhimento é só\n' +
    '  texto informativo — **cadastro de residentes continua fora do escopo**. O\n' +
    '  texto entra pelo `db/seed.js`; números como "22 residentes" envelhecem e a\n' +
    '  equipe atualiza pelo Painel. Session 2026-10-06 (2) do spec.md.\n'],
]);

console.log('documentos atualizados');
