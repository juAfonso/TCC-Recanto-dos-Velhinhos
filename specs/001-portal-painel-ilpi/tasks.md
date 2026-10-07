---
description: "Lista de tarefas da feature 001 — Portal Público e Painel Administrativo"
---

# Tasks: Portal Público e Painel Administrativo do Recanto dos Velhinhos

**Input**: Design documents from `/specs/001-portal-painel-ilpi/` — [plan.md](./plan.md),
[spec.md](./spec.md), [research.md](./research.md) (D1–D18), [data-model.md](./data-model.md),
[contracts/api.md](./contracts/api.md), [quickstart.md](./quickstart.md). Gerado em 2026-10-05;
ajustado em 2026-10-06 com as correções do `/speckit-analyze` aprovadas pelo grupo (tarefas renumeradas).

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md — todos
presentes.

**Tests**: automatizados **só nas quatro regras críticas** escolhidas pelo grupo em 2026-09-04
(research D8): FR-047 (T036), FR-043/FR-044a (T037, T117), FR-050 (T047) e FR-055 (T090). Todo o
resto é validado pelos cenários V1–V12 e pelos portões da constituição em `quickstart.md`.

**Organization**: tarefas agrupadas por história do spec (US1–US11), na ordem de prioridade
P1 → P2 → P3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência de tarefa incompleta)
- **[Story]**: história do spec à qual a tarefa pertence (US1…US11)

## Path Conventions

**Desde 2026-10-06, todo arquivo citado aqui como `api/...` fica em `rotas/...`** (mesma estrutura); só
`api/index.js` é função na Vercel, por causa do limite de 12 funções do plano gratuito (research D1).

Estrutura do plan.md: `public/` (front estático, protótipo já no repositório), `api/` (funções
Vercel, formato Web `export function GET/POST(request)` — research D1), `api/_lib/` (módulos
compartilhados), `db/` (migrações e seed), `tests/` (`node:test`). Rotas dinâmicas usam a
convenção de arquivos da Vercel: `api/admin/doacoes/[id]/confirmar.js`.

## Regras que valem para TODA tarefa

Releia antes de começar qualquer uma. Elas vêm da constituição 3.0.0 e do spec, e a revisão
reprova a entrega que as quebrar.

1. **Nunca** escrever `DELETE` sobre tabela de negócio nem rota `DELETE` (Princípio III). A única
   exceção é a limpeza de `limite_tentativa` no cron (T066).
2. Toda rota `/api/admin/*` começa com `exigirAdmin(request)`; toda `/api/me/*`, com
   `exigirDoador(request)` (T020). No autoatendimento, o id da pessoa vem **da sessão**, nunca da
   URL ou do corpo.
3. Toda mudança de status grava autor e data na linha **e** chama `registrarAuditoria` (T019). O
   `detalhe` da auditoria **nunca** leva dado pessoal.
4. Toda edição de registro existente chama `registrarAlteracao` (T021) com o estado anterior.
5. Erros seguem o formato `{ erro: { codigo, mensagem, campos? } }` (T015); mensagens em
   português do Brasil, sem jargão.
6. Nenhuma resposta de `/api/public/*` leva CPF, RG, endereço, telefone, e-mail, nome de pessoa
   física ou URL de currículo.
7. Toda tela nova ou alterada passa pelos portões de acessibilidade (II) e, se pública,
   responsividade (V) descritos em `quickstart.md` antes de ser marcada como concluída.
8. Valores editáveis (30 dias, 6 meses, contato) vêm de `configuracao`, nunca de constante.
9. Ao terminar a integração de uma tela, remover dela a dependência de `assets/js/data.js` e de
   `localStorage` para dados de negócio.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: inicializar o projeto Node e a configuração da Vercel.

- [X] T001 Criar `package.json` na raiz com `"type": "module"`, `"engines": { "node": ">=24" }`, scripts `migrate` (`node db/migrate.js`), `seed` (`node db/seed.js`) e `test` (`node --test tests/`), e **apenas** as dependências `@neondatabase/serverless`, `@vercel/blob` e `nodemailer` (plan.md → Complexity Tracking); rodar `npm install` e commitar `package-lock.json` — *feito em 2026-10-06: o script `test` ficou `node --test "tests/**/*.test.js"`, porque `node --test tests/` trata a pasta como arquivo e falha*
- [X] T002 [P] Criar `vercel.json` na raiz com `"crons": [{ "path": "/api/cron/diario", "schedule": "0 4 * * *" }]` (01:00 em Brasília — research D12)
- [X] T003 [P] Criar `.env.example` na raiz com as variáveis de `quickstart.md` → "Variáveis de ambiente" (valores vazios) e garantir em `.gitignore` as linhas `.env*` (exceto `.env.example`), `node_modules/` e `.vercel/`
- [X] T004 [P] Criar as pastas `api/_lib/`, `api/public/`, `api/auth/`, `api/me/`, `api/admin/`, `api/cron/`, `db/migrations/` e `tests/` conforme plan.md → Source Code — *pastas vazias levam `.gitkeep`, senão o Git não as versiona*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: banco, módulos compartilhados, sessão, controle de acesso e login do Painel.

**⚠️ CRITICAL**: nenhuma história começa antes desta fase terminar.

### Banco de dados

- [X] T005 Criar `db/migrate.js`: lê `DATABASE_URL` (ou `DATABASE_URL_TESTE` com `--teste`), cria `schema_migrations` se não existir, aplica em ordem os arquivos `db/migrations/*.sql` ainda não aplicados, cada um em transação, e registra nome e data (research D7) — *feito: `npm run migrate -- --teste` aplica na branch de teste*
- [X] T006 [P] Criar `db/migrations/001_pessoas_acesso.sql` com `pessoa`, `papel` (com o índice único parcial de exclusividade funcionário/voluntário ativo — research D14), `conta_institucional` (sem campo de nível) e `token_senha`, exatamente como em data-model.md → "Pessoas, papéis e acesso"; habilitar `pgcrypto` para `gen_random_uuid()` — *CPF único parcial (só não anonimizados), como o e-mail — senão a segunda anonimização colidiria*
- [X] T007 [P] Criar `db/migrations/002_operacao.sql` com `registro_auditoria` (incluir `REVOKE UPDATE, DELETE` para o papel da aplicação), `historico_alteracao`, `falha_email`, `configuracao` (com `atualizado_por/em`, inserindo `item_sem_atualizacao_dias = 30` e `retencao_meses = 6`), `limite_tentativa` e `arquivo` (com `enviado_por/em`), conforme data-model.md → "Operação" e "arquivo" — *além do `REVOKE`, um gatilho barra UPDATE/DELETE na auditoria (o dono da tabela poderia devolver a permissão); `falha_email` ganhou `modelo` para permitir o reenvio*
- [X] T008 [P] Criar `db/migrations/003_submissoes_lgpd.sql` com `aviso_privacidade`, `cadastro_voluntario` (com `origem` `portal|painel`), `candidatura`, `solicitacao_externa` (sem as FKs para evento/campanha, que vêm em T010) e `consentimento` com as quatro FKs opcionais e o `CHECK` de exatamente uma preenchida (Restrição 4 do DER), conforme data-model.md
- [X] T009 [P] Criar `db/migrations/004_doacao.sql` com `chave_pix_institucional` e `doacao` (com `CHECK ((tipo = 'espontanea') = (pessoa_id IS NULL))`, `CHECK (valor >= 1)` e índice `(status, declarada_em)`), conforme data-model.md → "Doação"
- [X] T010 [P] Criar `db/migrations/005_conteudo.sql` com `item_necessario` (prioridade `alta|media|baixa`), `evento`, `campanha`, `recurso` (com `ativo`), `noticia` (com `CHECK` de `imagem_alt` obrigatório quando houver imagem), `conteudo_institucional` (inserindo a linha única) e `conteudo_institucional_imagem` (com `ativo`) — todas com `criado_por/em` e os campos de autoria de data-model.md → regra 2 e "Conteúdo"; e o `ALTER TABLE solicitacao_externa` adicionando as FKs `evento_id` e `campanha_id`
- [X] T011 Criar `db/seed.js`: sem argumento, cria só a configuração inicial, a versão `2026-10-v1` do aviso com texto provisório marcado "RASCUNHO — substituir pelo texto aprovado" e a conta institucional com **senha gerada aleatoriamente e impressa uma única vez**; com `--demo`, recusa rodar se `VERCEL_ENV === 'production'` e popula dados fictícios (itens das três prioridades, um evento, uma campanha com meta, uma notícia, chave Pix fictícia em domínio `.invalid`, uma doadora associada com senha definida). Depende de T005–T010 — *conta = Gmail institucional (2026-10-06); `--demo` usa senha fixa `DEMO.senhaPainel`; `configuracao.ambiente` impede misturar banco demo e produção; o contato inicial do Recanto entra aqui*

### Módulos compartilhados (`api/_lib/`)

- [X] T012 [P] Criar `api/_lib/db.js` exportando `sql` (cliente `neon()` HTTP) e `transacao(fn)` (usa `Pool` e faz `BEGIN/COMMIT/ROLLBACK`) — research D2
- [X] T013 [P] Criar `api/_lib/datas.js` com `hojeBrasilia()` (data no fuso `America/Sao_Paulo`), `ehMenorDeIdade(dataNascimento)` (18 anos), `somarMeses(data, n)` e `formatarDataBR`
- [X] T014 [P] Criar `api/_lib/validacao.js` com validadores puros: CPF (dígitos verificadores, só números), telefone brasileiro (DDD + 8 ou 9 dígitos — FR-037a), e-mail, CEP, UF, valor monetário (`>= 1.00`), data não passada; cada um devolve a mensagem em português para `campos[]`
- [X] T015 [P] Criar `api/_lib/http.js` com `json(dados, status)` (toda resposta com `Cache-Control: no-store` — SC-002, contracts/api.md → Cache), `erro(status, codigo, mensagem, campos)`, `lerJson(request)` (devolve `400 JSON_INVALIDO`) e `lerFormulario(request)` (`request.formData()`), seguindo contracts/api.md → "Formato de erro" — *mais `rota(handler)` e `falhar(...)`: erros viram a resposta no formato do contrato e erro inesperado vira 500 sem detalhe técnico*
- [X] T016 [P] Criar `api/_lib/senha.js` com `gerarHash(senha)` e `conferir(senha, hash)` usando `scrypt` com salt aleatório por senha, e `gerarToken()` (32 bytes) + `hashToken(token)` (SHA-256) — research D4, D11
- [X] T017 [P] Criar `api/_lib/sessao.js`: `criarCookie({ ctx, id })` assinado com HMAC-SHA256 e `SESSION_SECRET`, `HttpOnly; Secure; SameSite=Lax; Path=/`, validade 8 h; `lerSessao(request)` que confere assinatura e validade; `cookieDeSaida()` — research D4
- [X] T018 [P] Criar `api/_lib/limite.js` com `verificarLimite(escopo, chaveBruta, maximo, janelaMin)` que grava/incrementa em `limite_tentativa` usando o SHA-256 de `escopo + chaveBruta` (nunca o IP em claro) e devolve se pode seguir; e `ipDe(request)` lendo `x-forwarded-for` — research D13
- [X] T019 Criar `api/_lib/auditoria.js` com `registrarAuditoria({ autorTipo, autorId, acao, entidadeTipo, entidadeId, detalhe })`, aceitando `autorTipo` em `conta_institucional|doador|sistema|anonimo` e recusando (lançando erro) chaves de `detalhe` que pareçam dado pessoal (`cpf`, `email`, `telefone`, `nome`, `rg`, `endereco`). Depende de T012
- [X] T020 Criar `api/_lib/acesso.js` com `exigirAdmin(request)` (sessão `ctx=admin` e conta institucional ativa) e `exigirDoador(request)` (sessão `ctx=doador`, pessoa ativa, papel `doador_associado` ativo e `senha_definida_em` preenchida); em falha, registra `acesso.negado` com `autorTipo` da sessão ou `anonimo` e devolve `403` com corpo `{ erro: { codigo: "ACESSO_NEGADO", mensagem: "Você não tem acesso a esta área." } }`, sem detalhe do motivo (FR-047). Depende de T017, T019 — *`exigirDoador` também recusa sessão emitida antes da última definição/redefinição de senha (D11)*
- [X] T021 [P] Criar `api/_lib/historico.js` com `registrarAlteracao({ entidadeTipo, entidadeId, estadoAnterior, autor })` gravando em `historico_alteracao` (research D16). Depende de T012
- [X] T022 [P] Criar `api/_lib/protocolo.js` com `gerarProtocolo(prefixo)` (`VOL`, `CAN` ou `SOL` + `-` + 10 caracteres Crockford Base32 de `crypto.randomBytes`, sem I/L/O/U) e `formatoValido(texto)` — research D6
- [X] T023 [P] Criar `api/_lib/email-modelos.js` com os textos (assunto + corpo em texto simples, português cotidiano) de: confirmação de submissão com protocolo e "a análise pode levar alguns dias" (FR-049); chamado para entrevista; solicitação aprovada — aguardando contato; aprovado; não aprovado com e sem motivo (FR-049b); link para definir senha (validade 7 dias); link para redefinir senha (validade 1 hora). Cada texto enfatiza **guardar o protocolo**, não confiar no e-mail
- [X] T024 Criar `api/_lib/email.js` com `enviarEmail({ para, modelo, dados, motivo, entidadeTipo, entidadeId })` via `nodemailer` (SMTP do Gmail, `GMAIL_USER`/`GMAIL_APP_PASSWORD`): tentativa com tempo-limite de 8 s; se falhar, espera 3 s e tenta de novo; se falhar outra vez, grava em `falha_email` e devolve `false` sem lançar erro (research D5, FR-049a). Depende de T012, T023 — *com `EMAIL_MODO=teste` nada sai (os testes usam isso)*
- [X] T025 [P] Criar `api/_lib/blob.js` com `salvarArquivo(file, { categoria, acesso })` validando tipo e tamanho (currículo: PDF/DOC/DOCX/ODT até 4 MB, privado; imagem: JPEG/PNG/WebP até 2 MB, pública — senão `413 ARQUIVO_GRANDE_DEMAIS` ou `400 TIPO_DE_ARQUIVO_NAO_ACEITO`), gravando a linha em `arquivo`; ~~`urlAssinada(arquivoId)`~~ `respostaArquivoPrivado(arquivoId)` para os privados (2026-10-06); `removerArquivo(arquivoId)` que apaga o objeto no Blob e preenche `removido_em` — research D3 — *ainda não exercitado: falta criar o Blob na Vercel (`BLOB_READ_WRITE_TOKEN`); conferir se o currículo privado e as imagens públicas cabem no mesmo store* — *não cabem: o acesso é por store; dois stores (research D3, ajuste de 2026-10-06)*
- [X] T026 [P] Criar `api/_lib/papeis.js` com `encontrarOuCriarPessoa(dados)` (pelo CPF), `adicionarPapel(pessoaId, tipo, origemId, autor)`, `encerrarPapel` e `inativarPapel`, convertendo a violação do índice de exclusividade em `422 FUNCIONARIO_NAO_PODE_SER_VOLUNTARIO` (FR-048, research D14). Depende de T012
- [X] T027 [P] Criar `api/_lib/consentimento.js` com `avisoVigente()`, `validarAceite(corpo)` (sem aceite ou versão diferente da vigente → `422 CONSENTIMENTO_OBRIGATORIO`) e `registrarConsentimento({ alvo, alvoId, finalidade })` (FR-051, FR-052). Depende de T012
- [X] T028 [P] Criar `api/_lib/triagem.js` com a tabela de transições permitidas de `cadastro_voluntario`, `candidatura` e `solicitacao_externa` (data-model.md → transições), `conferirTransicao(tipo, de, para)` → `409 TRANSICAO_INVALIDA`, com a exceção do voluntário de `origem = painel` (`pendente → aprovado` sem entrevista, FR-023), e `decidir({ tabela, id, para, motivo, conta })` que grava status, `triado_por/em`, `concluido_em` quando terminal, auditoria e dispara o e-mail do FR-049b sem deixar a falha de envio reverter a decisão. Depende de T019, T024

### Rotas e front compartilhados

- [X] T029 Criar `api/admin/login.js` (`POST`, limite de 5 falhas por IP+identificador em 15 min → `429`; mensagem igual para usuário ou senha errados), `api/admin/logout.js` (`POST`) e `api/admin/sessao.js` (`GET`, devolve `{ identificador }` ou `401`); acrescentar `GET /api/admin/sessao` em contracts/api.md → Autenticação → Painel. Depende de T016, T017, T018, T020 — *`/api/admin/sessao` responde 401 sem auditoria — registrado em contracts/api.md*
- [X] T030 [P] Criar `api/public/aviso-privacidade.js` (`GET`, texto e versão vigentes — FR-053)
- [X] T031 [P] Criar `public/assets/js/api.js`: `Api.get/post/put(url, corpo)` e `Api.enviarFormulario(url, formData)` com `credentials: 'same-origin'`, tratando `401` (redireciona ao login no Painel), `429` ("muitas tentativas, aguarde alguns minutos") e erros com `campos[]` (marca cada campo com `Utils.setFieldError`)
- [X] T032 [P] Criar `public/assets/js/mascaras.js` com máscaras de telefone brasileiro, CPF e CEP aplicáveis por atributo `data-mascara` (FR-037a)
- [X] T033 [P] Criar `public/assets/js/consentimento.js` que injeta, em formulários com `data-consentimento`, a caixa de aceite com link para `aviso-privacidade.html`, busca a versão em `/api/public/aviso-privacidade` e anexa `{ avisoVersao, aceito }` ao envio (FR-051)
- [X] T034 Reescrever `public/assets/js/auth.js` e `public/assets/js/admin-guard.js` para usar o cookie do servidor: o guard chama `GET /api/admin/sessao` e redireciona a `../login.html` em `401`; logout chama `POST /api/admin/logout`; e trocar a aba "Painel" de `public/assets/js/page-login.js` para `POST /api/admin/login`. Remover a validação local de usuário/senha do protótipo. Depende de T029, T031 — *o login do doador continua simulado sobre o `data.js` até a US9; as credenciais `admin/admin123` saíram da tela de login*

### Testes das regras críticas (fundação)

- [X] T035 [P] Criar `tests/_apoio.js`: aplica as migrações em `DATABASE_URL_TESTE` (recusa rodar se a URL for igual a `DATABASE_URL`), limpa o schema de teste entre arquivos e oferece `chamar(rota, { metodo, corpo, cookie })` que importa o handler de `api/` e o executa com um `Request` — *a busca da função por rota fica em `scripts/rotas.js`, usada também pelo `npm run dev` (`scripts/dev.js`), que substitui o `vercel dev`*
- [X] T036 Criar `tests/acesso.test.js` (FR-047): para `/api/admin/dashboard`, `/api/admin/doacoes` e `/api/admin/pessoas`, chamar sem cookie e com cookie de doador; esperar `403`, corpo só com `erro`, e uma linha `acesso.negado` nova em `registro_auditoria`. Depende de T020, T035 (as rotas citadas podem ser stubs até as histórias existirem) — *as três rotas são stubs que já exigem a sessão e respondem 501 até as histórias*
- [X] T037 [P] Criar `tests/protocolo.test.js` (FR-043, parte 1): gerar 10 000 protocolos de cada prefixo e verificar unicidade, formato `^(VOL|CAN|SOL)-[0-9A-HJKMNP-TV-Z]{10}$` e ausência de sequência crescente. Depende de T022

**Checkpoint**: `npm run migrate`, `npm run seed -- --demo`, `npm run dev` e login no Painel funcionando; `npm test` passa.

---

## Phase 3: User Story 1 — Portal Público Informativo (Priority: P1) 🎯 MVP

**Goal**: visitante vê página institucional, eventos e campanhas vigentes, itens necessários por
prioridade e notícias, sem login (FR-001–FR-004).

**Independent Test**: com `db/seed.js --demo`, abrir `index.html`, `institucional.html`,
`campanhas.html`, `noticias.html` e a lista de itens de `doacoes.html` em celular e desktop, sem
login, e conferir que refletem o banco (quickstart V1, passos 1 e 4).

- [X] T038 [P] [US1] Criar `api/public/institucional.js` (`GET`): história, missão, equipe, acolhimento, bazar e só as imagens `ativo = true`, com `texto_alternativo` e URL pública (FR-001)
- [X] T039 [P] [US1] Criar `api/public/eventos-campanhas.js` (`GET`): eventos `ativo` com `data >= hojeBrasilia()` e campanhas `ativo` com hoje dentro do período, com os recursos `ativo = true`; campanha sem meta sai sem `meta` e `arrecadado` (FR-002, FR-029b, research D12)
- [X] T040 [P] [US1] Criar `api/public/itens-necessarios.js` (`GET`): itens `ativo` ordenados alta → média → baixa, com nome, quantidade, unidade e prioridade (FR-003, FR-026)
- [X] T041 [P] [US1] Criar `api/public/noticias.js` (`GET`): só `publicada`, mais recentes primeiro, com imagem pública e `imagem_alt`
- [X] T042 [P] [US1] Atualizar `public/assets/js/page-home.js` para buscar itens e eventos/campanhas da API, trocando a ordenação por `urgente` pela prioridade e o texto "Necessidade imediata" por um rótulo por prioridade — *também as notícias da home vêm da API; o título virou "Campanhas em Andamento", porque a meta é opcional; cartões compartilhados em `assets/js/portal-cards.js`, com todo texto escapado*
- [X] T043 [P] [US1] Criar `public/assets/js/page-institucional.js` e ligá-lo em `public/institucional.html`, trocando o texto fixo pelo conteúdo de `/api/public/institucional` com `alt` em cada imagem — *sem texto, a seção fica escondida; o seed preenche história e missão com o texto do protótipo, se a página estiver vazia — a equipe fictícia do protótipo saiu*
- [X] T044 [P] [US1] Atualizar `public/assets/js/page-campanhas.js` e `public/campanhas.html` para distinguir evento (data, recursos em texto) de campanha (período, recursos, barra de progresso **só** com meta — FR-029b)
- [X] T045 [P] [US1] Criar `public/assets/js/page-noticias.js` e ligá-lo em `public/noticias.html`, listando notícias da API — *o selo "Também no Instagram" saiu (FR-033 removido)*
- [X] T046 [US1] Atualizar a seção de itens necessários de `public/assets/js/page-doacoes.js` para usar `/api/public/itens-necessarios` com rótulo de prioridade (sem mexer ainda no fluxo Pix, que é da US2)

**Checkpoint**: Portal informativo funcionando sobre o banco real — MVP demonstrável.

---

## Phase 4: User Story 2 — Doação Financeira via Pix (Priority: P1)

**Goal**: QR Pix estático com o valor escolhido, declaração pelo clique em "Já fiz o Pix" sem
protocolo, conferência humana no Painel e criação da conta do doador associado (FR-005–FR-010a,
FR-050).

**Independent Test**: quickstart V2, V3 (passos 1, 2, 4 e 5) e V4. O passo 3 de V3 (ver a doação
no autoatendimento) depende da US9.

### Teste da regra crítica

- [X] T047 [US2] Criar `tests/doacao-confirmacao.test.js` (FR-050): criar doação `pendente`, chamar `POST /api/admin/doacoes/:id/confirmar` duas vezes com sessão admin; esperar `200` e depois `409 DOACAO_JA_CONFERIDA`, com `status`, `conferido_em` e contagem de auditoria inalterados após a segunda; repetir com duas chamadas simultâneas (`Promise.all`) e verificar uma única confirmação. Escrever antes de T054 e ver falhar — *visto falhando antes da T054; também cobre "não localizada não confirma depois" e id inexistente*

### Implementação

- [X] T048 [P] [US2] Criar `api/public/pix.js` (`GET`): chave ativa ou `{ disponivel: false, contato }` com o contato de `configuracao` (FR-007, FR-007a)
- [X] T049 [P] [US2] Criar `api/admin/pix.js` (`GET`/`PUT`): validar tipo e chave (CNPJ com dígitos), avisar no `PUT` quando o tipo for CPF ou telefone (dado pessoal — decisão de 2026-09-05), nova linha ativa desativando a anterior, auditoria
- [X] T050 [US2] Criar `api/_lib/conta-doador.js` com `prepararDoador({ nome, cpf, email, telefone })` aplicando research D15 (associado existente → bloqueia com a mensagem neutra; pessoa existente sem papel de doador → adiciona papel; pessoa nova → cria) e `emitirLink(pessoaId, finalidade)` (invalida tokens anteriores, grava hash, validade 7 dias ou 1 hora, envia ao e-mail **do cadastro** — research D11). Depende de T016, T024, T026 — *bloqueia também CPF novo com e-mail de outra pessoa (research D15, quarto caso); o link leva o token depois do "#", que o navegador não envia a servidor nenhum*
- [X] T051 [US2] Criar `api/public/doacoes/verificar-associativa.js` (`POST`): limite de 10 por IP em 15 min; resposta `{ podeSeguir }` ou a mensagem neutra, sem dizer qual campo bateu (FR-006b). Depende de T050
- [X] T052 [US2] Criar `api/public/doacoes/index.js` (`POST`): espontânea com só valor; associativa com sessão de doador (vínculo pela sessão) ou com `doador` + consentimento (repete a verificação, prepara doador, registra consentimento e envia link de definição); `declarada_em = now()` do banco; resposta `201` sem protocolo; nunca produz `confirmada` (contracts/api.md → Doação). Depende de T027, T050 — *a falha do e-mail do link não desfaz a declaração (como no FR-049a)*
- [X] T053 [US2] Criar `api/admin/doacoes/index.js` (`GET ?status=`): valor, `declarada_em`, nome do doador se associativa, e `possivelDuplicata` quando outra `pendente` tem o mesmo valor a até 30 min (research D18) — *inclui `resumo` (pendentes, confirmadas, total confirmado) para os cartões da tela*
- [X] T054 [US2] Criar `api/admin/doacoes/[id]/confirmar.js` (`POST`): `UPDATE … SET status='confirmada' … WHERE id=$1 AND status='pendente' RETURNING`; sem linha afetada → `409 DOACAO_JA_CONFERIDA`; auditoria `doacao.confirmar` (FR-008, FR-050)
- [X] T055 [P] [US2] Criar `api/admin/doacoes/[id]/nao-localizar.js` (`POST`): motivo opcional; `motivoPadrao: true` grava o texto exato do FR-008a; mesma guarda de `status='pendente'`. **Não criar** rota que edite valor, tipo, data ou doador de uma declaração (FR-037, exceção de 2026-10-06)
- [X] T056 [P] [US2] Criar `api/auth/link-senha.js` (`POST { email }`): limite de 3 por e-mail por hora; se for doador associado sem senha → link `definir`, com senha → `redefinir`; resposta `200` idêntica em todos os casos, inclusive e-mail desconhecido (FR-046, research D11). Depende de T050
- [X] T057 [P] [US2] Criar `api/auth/definir-senha.js` (`POST { token, senha }`): confere hash, validade e uso; grava `senha_hash` e `senha_definida_em`; marca o token como usado; invalida sessões abertas; senão `400 LINK_INVALIDO_OU_EXPIRADO`
- [X] T058 [P] [US2] Criar `public/definir-senha.html` e `public/assets/js/page-definir-senha.js`: lê o token da URL, pede a senha duas vezes, mostra o erro de link expirado com botão "pedir outro link" que chama `/api/auth/link-senha` — *sem token, a página já oferece "pedir outro link"; o botão "Esqueci minha senha" do login passou a abrir esta página*
- [X] T059 [US2] Reescrever o fluxo Pix de `public/doacoes.html` e `public/assets/js/page-doacoes.js`: valores R$ 10/20/50/100 e campo livre com mínimo R$ 1; escolha espontânea/associativa; na associativa sem login, campos nome/CPF/e-mail/telefone com máscaras e consentimento, chamando `verificar-associativa` antes de gerar o QR; QR e copia e cola por `pix.js`; botão "Já fiz o Pix" chamando `POST /api/public/doacoes`; textos do FR-010a (pagamento no banco, clique não confirma, sem clique não registra, clicar logo após pagar, espontânea não é acompanhada); FR-007a sem chave. **Remover** protocolo, data digitada, anexo de comprovante e o botão que simula confirmação (pendências 2 e 6 do CLAUDE.md) — *o fluxo saiu do `data.js`: chave pela API, declaração pela API; a espontânea pula o passo de dados*
- [X] T060 [US2] Reescrever `public/admin/doacoes.html` e `public/assets/js/admin-doacoes.js`: fila de pendentes com valor, data/hora do clique e nome; selo de possível duplicata; confirmar; "não localizada" com motivo opcional e a opção pronta do FR-008a; ajuda contextual na própria tela explicando a conferência contra o extrato (FR-061); rótulo de total deixando claro que não é a arrecadação da instituição (FR-060a)
- [X] T061 [US2] Atualizar `public/assets/js/admin-pix.js` e `public/admin/pix.html` para `GET/PUT /api/admin/pix`, mantendo o QR de teste de R$ 10 e o aviso para CPF/telefone, e removendo o armazenamento em `localStorage` — *a tela confirma o aviso de CPF/telefone pelo 409 do servidor*

**Checkpoint**: doação de ponta a ponta com conferência no Painel (quickstart V2 e V4).

---

## Phase 5: User Story 3 — Itens Necessários e Campanhas/Eventos (Priority: P2)

**Goal**: equipe mantém itens com prioridade e eventos/campanhas na mesma tela; conflito de data
de evento é aviso; vencidos são encerrados sozinhos (FR-026–FR-031, FR-029c).

**Independent Test**: quickstart V1 (passos 1 a 4) e V8.

- [X] T062 [P] [US3] Criar `api/admin/itens/index.js` (`GET ?busca=`, `POST`): nome, quantidade ≥ 0, unidade, prioridade `alta|media|baixa`; `GET` marca `semAtualizacao` com o prazo de `configuracao` (FR-026, FR-028) — *em `rotas/`; validação comum em `rotas/_lib/itens.js`*
- [X] T063 [P] [US3] Criar `api/admin/itens/[id].js` (`PUT`, renova `quantidade_atualizada_em` quando a quantidade muda; histórico) e `api/admin/itens/[id]/baixa.js` (`POST`, `ativo → suprido`, FR-027) — *só mudar a quantidade renova a data do alerta; item com baixa não se edita (409); dar baixa de novo não muda nada*
- [X] T064 [US3] Criar `api/admin/eventos-campanhas/index.js` (`GET`, `POST` com `tipo`): evento com nome, data, descrição e recursos em texto; campanha com nome, período, descrição, `recursos[]` (≥ 1, gravados em `recurso`) e meta opcional; data passada → `400`; evento em data de outro evento ativo → `409 CONFLITO_DE_DATA` com a lista, gravando só com `confirmarAviso: true` (FR-029, FR-030)
- [X] T065 [US3] Criar `api/admin/eventos-campanhas/[id].js` (`PUT`, mesmas validações e aviso, histórico; editar os recursos de uma campanha **desativa** os que saíram e cria os novos, nunca apaga), `api/admin/eventos-campanhas/[id]/encerrar.js` (`POST`, a qualquer momento; já encerrado → `200` sem alteração — FR-029a) e `api/admin/campanhas/[id]/arrecadado.js` (`PUT`, só se houver meta — FR-029b) — *evento ou campanha encerrado não se edita (409); na campanha, o início já gravado pode ficar no passado se não mudar; tirar a meta zera o arrecadado (o valor antigo fica no histórico)*
- [X] T066 [US3] Criar `api/cron/diario.js` (`GET`): exige `Authorization: Bearer ${CRON_SECRET}` (senão `401`); encerra eventos com `data < hojeBrasilia()` e campanhas com `periodo_fim < hojeBrasilia()` ainda ativos, com `encerrado_por = 'sistema'` e auditoria `evento.encerrar_auto`/`campanha.encerrar_auto`; apaga janelas expiradas de `limite_tentativa` (única remoção física permitida — research D13); idempotente (FR-029c) — *limpa janelas de `limite_tentativa` com mais de 1 dia*
- [X] T067 [US3] Reescrever `public/admin/itens.html` e `public/assets/js/admin-itens.js`: trocar a caixa "urgente" por seleção de prioridade e acrescentar unidade; ordenar por prioridade; busca por nome; sinal de "sem atualização"; dar baixa — *a resposta de erro ganhou `mensagens` por campo (contracts/api.md), para cada campo mostrar a própria mensagem*
- [X] T068 [US3] Reescrever `public/admin/campanhas.html` e `public/assets/js/admin-campanhas.js`: escolha evento/campanha na mesma tela com os campos de cada tipo; lista de recursos da campanha; meta opcional; atualizar arrecadado; encerrar; diálogo de conflito de data com "alterar data" ou "prosseguir mesmo assim" — *o tipo não muda depois de cadastrado; "já passou" aparece para o que venceu e espera o cron*

**Checkpoint**: conteúdo do Portal mantido pela equipe sem planilha (SC-010).

---

## Phase 6: User Story 4 — Cadastro de Voluntários com Triagem (Priority: P2)

**Goal**: cadastro com os campos do termo de adesão, protocolo, triagem com entrevista e
autorização em papel para menor (FR-011–FR-015, FR-012, FR-048).

**Independent Test**: quickstart V5 (para voluntário), V6 e V7 passo 2.

- [X] T069 [US4] Criar `api/public/voluntarios.js` (`POST`): valida todos os campos do FR-011 (nenhum a mais), CPF, telefone, CEP, UF; calcula `menor_de_idade` e `autorizacao_status`; consentimento obrigatório; gera protocolo `VOL-`; grava, registra consentimento e só então envia o e-mail do FR-049; resposta `{ protocolo, status, autorizacaoStatus, emailEnviado }` — *obrigatórios, lista de serviços e ausência de idade mínima: Session 2026-10-06 (3) do spec; validação em `rotas/_lib/voluntarios.js`*
- [X] T070 [P] [US4] Criar `api/admin/voluntarios/index.js` (`GET ?status=`) e `api/admin/voluntarios/[id].js` (`GET`, todos os campos coletados — FR-037a)
- [X] T071 [US4] Criar `api/admin/voluntarios/[id]/entrevista.js`, `[id]/rejeitar.js` (motivo opcional) e `[id]/aprovar.js` usando `triagem.decidir`; aprovar exige autorização não pendente (`422 AUTORIZACAO_PENDENTE`) e cria/reaproveita a pessoa pelo CPF com papel `voluntario`, em transação, respeitando a exclusividade (`422 FUNCIONARIO_NAO_PODE_SER_VOLUNTARIO`). Depende de T026, T028 — *quem já é voluntário ativo não ganha um segundo papel: o cadastro novo só é ligado à pessoa*
- [X] T072 [US4] Acrescentar `PUT` a `api/admin/voluntarios/[id].js`: corrige os dados do cadastro sem mudar o status, com as validações de T069, estado anterior em `historico_alteracao`, `409 REGISTRO_ANONIMIZADO` se anonimizado e, se aprovado, propaga nome, e-mail e telefone para a `pessoa` (FR-037, 2026-10-06) — *o CPF de quem já foi aprovado não muda por aqui (identifica a pessoa — 422 CPF_NAO_ALTERAVEL); data de nascimento corrigida durante a triagem refaz a regra do menor*
- [X] T073 [P] [US4] Criar `api/admin/voluntarios/[id]/autorizacao-recebida.js` (`POST`, `pendente → recebida` com conta e data) e `api/admin/voluntarios/[id]/autorizacao.js` (`GET`, dados para reimprimir — research D17)
- [X] T074 [US4] Reescrever `public/voluntariado.html` e `public/assets/js/page-voluntariado.js`: campos do FR-011 com máscaras e consentimento; após o envio, protocolo em destaque com "anote este código"; se menor, botão para a página de autorização passando os dados por `sessionStorage` (sem servidor) — *o CSS ganhou `[hidden]{display:none !important}`: classes com display (como `.alert`) não escondiam elementos com hidden*
- [X] T075 [P] [US4] Criar `public/autorizacao-menor.html` e `public/assets/js/page-autorizacao-menor.js`: monta o termo com os dados do `sessionStorage`, campos de assinatura do responsável, instrução de entregar na sede, botão `window.print()`; apaga o `sessionStorage` ao sair — *a página apaga o sessionStorage ao sair (pagehide); o Painel reimprime abrindo a mesma página numa aba nova, que herda o sessionStorage*
- [X] T076 [US4] Reescrever `public/admin/triagem-voluntarios.html` e `public/assets/js/admin-triagem-voluntarios.js`: filas por status, detalhe com todos os campos, ações chamar para entrevista / aprovar / rejeitar (motivo opcional) / marcar autorização recebida / reimprimir autorização / **corrigir dados**; selo de origem (Portal ou Painel); ajuda contextual da triagem e da autorização (FR-061) — *a aprovação direta sem entrevista (origem Painel) já aparece na tela, para quando a US7 criar esse cadastro*
- [X] T076a [US4] Termo de adesão para imprimir (FR-012a, acrescentado em 2026-10-06): `public/termo-adesao.html` + `page-termo-adesao.js`, botões na tela de sucesso do voluntariado (todos; o menor também a autorização) e no detalhe do Painel (`GET /api/admin/voluntarios/:id/impressao`, que substituiu `/autorizacao`); dados por `sessionStorage` (`assets/js/impressao-voluntario.js`) — *não são apagados ao trocar de página, porque navegadores de celular e de apps abrem o documento na mesma aba; somem quando a aba fecha*

**Checkpoint**: voluntariado de ponta a ponta, com menor bloqueado até a autorização.

---

## Phase 7: User Story 5 — Candidatura a Vaga com Triagem (Priority: P2)

**Goal**: candidatura com cargo fixo, CPF, data de nascimento e currículo em arquivo ou texto;
triagem com entrevista; aprovação efetiva o funcionário encerrando o papel de voluntário
(FR-016–FR-019, FR-040, FR-048).

**Independent Test**: quickstart V5 (para candidatura) e V7 passo 1.

- [X] T077 [US5] Criar `api/public/candidaturas.js` (`POST` multipart): cargo em `limpeza|cuidador|enfermagem|cozinha`; nome, CPF, data de nascimento (maior de idade), telefone, e-mail; arquivo **ou** texto (`422 CURRICULO_OBRIGATORIO`); salva o currículo privado só depois de validar os demais campos; consentimento; protocolo `CAN-`; e-mail FR-049. Depende de T025 — *em `rotas/public/candidaturas.js` (função única, fase 4). O arquivo sobe antes da transação e é removido se ela falhar*
- [X] T078 [P] [US5] Criar `api/admin/candidaturas/index.js` (`GET`), `[id].js` (`GET`, todos os campos e se há arquivo, sem URL) e `[id]/curriculo.js` (`GET`, redireciona para `urlAssinada` — research D3) — *mudou em 2026-10-06: a função repassa o arquivo em vez de redirecionar (D3, ajuste); abertura registrada na auditoria*
- [X] T079 [US5] Criar `api/admin/candidaturas/[id]/entrevista.js`, `[id]/rejeitar.js` e `[id]/aprovar.js`; aprovar, em uma transação: encontra ou cria pessoa pelo CPF, encerra papel `voluntario` ativo, cria papel `funcionario` com `origem_id`, preenche `efetivado_em` (FR-019, FR-048, research D14). Depende de T026, T028
- [X] T080 [US5] Acrescentar `PUT` a `api/admin/candidaturas/[id].js`: corrige os dados sem mudar o status nem o currículo, com as validações de T077, histórico, `409 REGISTRO_ANONIMIZADO` e, se aprovada, propagação para a `pessoa` (FR-037)
- [X] T081 [US5] Reescrever `public/vagas.html` e `public/assets/js/page-vagas.js`: cargo, nome, CPF, data de nascimento, telefone, e-mail com máscaras; arquivo (aviso de 4 MB) ou descrição; consentimento; envio `multipart` por `Api.enviarFormulario`; protocolo em destaque
- [X] T082 [US5] Reescrever `public/admin/triagem-vagas.html` e `public/assets/js/admin-triagem-vagas.js`: filas, detalhe com CPF e data de nascimento reais, abrir currículo, entrevista / aprovar / rejeitar / **corrigir dados**, aviso quando a pessoa já é voluntária (o papel será encerrado); ajuda contextual na própria tela explicando a etapa de entrevista, a rejeição com motivo opcional e o efeito de efetivar quem já é voluntário (FR-061) — *testado no navegador em 2026-10-06; envio com arquivo testado na produção no mesmo dia (Blob privado por OIDC)*

**Checkpoint**: candidatura de ponta a ponta, sem registro duplicado de pessoa.

---

## Phase 8: User Story 6 — Solicitação Externa de Evento ou Campanha (Priority: P2)

**Goal**: proposta externa com tipo, contato e nome da iniciativa; aprovação só avisa que haverá
contato; confirmação cria e publica o evento ou a campanha (FR-020–FR-022, FR-030).

**Independent Test**: quickstart V5 passo 5.

- [X] T083 [US6] Criar `api/public/solicitacoes.js` (`POST`): tipo obrigatório; nome da pessoa/organização, e-mail, telefone; nome da iniciativa; objetivo; data (evento) ou período (campanha); recursos esperados; consentimento; protocolo `SOL-`; e-mail FR-049 — *em `rotas/public/solicitacoes.js`; e-mail e telefone obrigatórios, data a partir de amanhã, recursos esperados opcionais (Session 2026-10-06 (5))*
- [X] T084 [P] [US6] Criar `api/admin/solicitacoes/index.js` (`GET`) e `api/admin/solicitacoes/[id].js` (`GET`, todos os campos)
- [X] T085 [US6] Criar `api/admin/solicitacoes/[id]/aprovar.js` (`em_analise → aguardando_contato`, nada publicado; para evento em data ocupada, `409 CONFLITO_DE_DATA` + `confirmarAviso`) e `[id]/rejeitar.js` (de `em_analise` ou `aguardando_contato`, motivo opcional). Depende de T028
- [X] T086 [US6] Criar `api/admin/solicitacoes/[id]/confirmar.js`: recebe os dados combinados (e, na campanha, `recursos[]` e meta opcional), cria o evento ou a campanha com `solicitacao_origem_id`, grava o vínculo e `status = confirmada`, numa transação; mesmo aviso de conflito (FR-022, FR-030, FR-031). Depende de T064 — *a criação do evento/campanha saiu de `eventos-campanhas/index.js` para `criarEvento`/`criarCampanha` em `_lib/eventos-campanhas.js`, usada pelos dois caminhos*
- [X] T087 [US6] Acrescentar `PUT` a `api/admin/solicitacoes/[id].js`: corrige os dados sem mudar o status, com as validações de T083, histórico e `409 REGISTRO_ANONIMIZADO` (FR-037)
- [X] T088 [US6] Reescrever `public/solicitar-evento.html` e `public/assets/js/page-solicitar-evento.js`: escolha evento/campanha alternando data ↔ período, nome da iniciativa, telefone com máscara, consentimento, protocolo em destaque
- [X] T089 [US6] Reescrever `public/admin/triagem-eventos.html` e `public/assets/js/admin-triagem-eventos.js`: filas por status, detalhe com telefone visível fora da edição, aprovar (com diálogo de conflito), confirmar com formulário dos dados combinados, rejeitar, **corrigir dados**; ajuda contextual na própria tela explicando que aprovar não publica, a confirmação depois do contato e a rejeição (FR-061) — *testado no navegador em 2026-10-06 (evento com conflito, campanha com recurso e meta, correção com tipo travado depois de confirmada)*

**Checkpoint**: as três triagens funcionando, nenhuma publicação antes da confirmação.

---

## Phase 9: User Story 11 — Proteção de Dados e Direitos do Titular (Priority: P2)

**Goal**: aviso de privacidade público e versionado; revogação com efeito por papel; anonimização
completa; fila de retenção (FR-051–FR-058). O aceite nos formulários já foi feito nas US2, US4–US6.

**Independent Test**: quickstart V9.

### Teste da regra crítica

- [ ] T090 [US11] Criar `tests/anonimizacao.test.js` (FR-055, SC-016): criar doador associado com doações confirmadas, uma correção de telefone (gera `historico_alteracao`), uma `falha_email` e consentimento; chamar `POST /api/admin/anonimizacoes` com `alvo: "pessoa"`; verificar que nome, CPF, e-mail e telefone não aparecem em `pessoa`, `historico_alteracao.estado_anterior`, `falha_email.destinatario`; que as doações mantêm valor, `declarada_em`, tipo e status; e que a contagem de linhas de cada tabela e de `registro_auditoria` (exceto a linha nova da anonimização) não mudou. Escrever antes de T091 e ver falhar

### Implementação

- [ ] T091 [US11] Criar `api/_lib/anonimizacao.js` com `anonimizar({ alvo, id, justificativaRetencao, conta })` para `pessoa`, `cadastro_voluntario`, `candidatura`, `curriculo` e `solicitacao`, em uma transação: campos pessoais → `[anonimizado]`/`NULL`, `anonimizado_em`, `removerArquivo` do currículo, e as linhas ligadas de `historico_alteracao`, `falha_email` e `consentimento`; pessoa anonimizada fica inativa e com papéis inativos; doações intactas (research D16, FR-055)
- [ ] T092 [US11] Criar `api/admin/anonimizacoes.js` (`POST`) e `api/admin/retencao.js` (`GET`, listando os casos da tabela "Retenção" de data-model.md com `retencao_meses` da configuração; doador inativo nunca entra — FR-056). Depende de T091
- [ ] T093 [US11] Criar `api/admin/consentimentos/[id]/revogar.js` (`POST`): marca `revogado_em/por` e aplica o efeito do FR-057 conforme a FK preenchida — submissão em triagem → `encerrada_titular` com `concluido_em`; voluntário ativo → papel `inativo`; doador → papel `doador_associado` `encerrado`; sem anonimizar
- [ ] T094 [P] [US11] Criar `api/admin/aviso-privacidade.js` (`GET` lista versões; `POST` publica nova versão — nunca edita uma publicada)
- [ ] T095 [P] [US11] Criar `public/aviso-privacidade.html` e `public/assets/js/page-aviso-privacidade.js` exibindo o texto e a versão vigentes, com o contato para exercício de direitos (FR-053)
- [ ] T096 [US11] Criar `public/admin/lgpd.html` e `public/assets/js/admin-lgpd.js`: busca do titular, lista de consentimentos com "registrar revogação", "anonimizar" com confirmação explícita e explicação de que é irreversível, fila de retenção; ajuda contextual da anonimização na própria tela (FR-061)
- [ ] T097 [P] [US11] Redigir `docs/aviso-privacidade-rascunho.md`: dados coletados por formulário, finalidades, retenção de 6 meses dos não aprovados (contados da conclusão da triagem) e do currículo do aprovado, doador sem prazo automático, canal de contato para pedidos do titular — rascunho do grupo para a instituição aprovar (decisão de 2026-09-30)

**Checkpoint**: LGPD aplicada no que depende do sistema (SC-014, SC-016).

---

## Phase 10: User Story 7 — Gestão de Usuários e Visão Consolidada (Priority: P3)

**Goal**: buscar, cadastrar, corrigir, inativar e reativar pessoas sem exclusão; visão consolidada
com alertas; auditoria e falhas de e-mail consultáveis (FR-023–FR-025, FR-035, FR-036).

**Independent Test**: spec → User Story 7 → Independent Test; quickstart V10 e V11.

- [ ] T098 [US7] Criar `api/admin/pessoas/index.js`: `GET ?busca=&situacao=` por nome, CPF ou e-mail, `situacao` `todos` (padrão) | `ativos` | `inativos`, cada resultado com `ativo` (constituição, Princípio III); `POST` de **funcionário** com nome, CPF, data de nascimento, e-mail e telefone, ou de **voluntário** com os mesmos campos e validações do FR-011 (reaproveitar a validação de T069), criando `cadastro_voluntario` com `origem = painel` — maior de idade já aprovado com pessoa e papel, menor pendente com autorização pendente (FR-023, 2026-10-06); `409 CPF_JA_CADASTRADO` com o id. Depende de T069, T071
- [ ] T099 [US7] Criar `api/admin/pessoas/[id].js` (`GET` com papéis, submissões, consentimentos e histórico; `PUT` com histórico — FR-037) e `api/admin/pessoas/[id]/papeis.js` (`POST`, respeitando exclusividade). Depende de T026
- [ ] T100 [US7] Criar `api/admin/pessoas/[id]/inativar.js` e `[id]/reativar.js`: inativar com submissão em triagem → `409` + `confirmarAviso` (FR-023a); nunca apaga nem oculta dados (FR-024)
- [ ] T101 [P] [US7] Criar `api/admin/dashboard.js` (`GET`): contagens de itens de prioridade alta, itens sem atualização, pendências das três filas, doações pendentes, falhas de e-mail não tratadas e registros na fila de retenção; resposta "sem alertas" quando tudo é zero (FR-036, SC-007)
- [ ] T102 [P] [US7] Criar `api/admin/auditoria.js` (`GET`, mais recentes primeiro, paginado) e `api/admin/falhas-email/index.js`, `[id]/reenviar.js`, `[id]/tratada.js`
- [ ] T103 [P] [US7] Criar `api/admin/configuracao.js` (`GET`/`PUT` de `item_sem_atualizacao_dias`, `retencao_meses` e `contato_instituicao`, com auditoria)
- [ ] T104 [US7] Reescrever `public/admin/usuarios.html` e `public/assets/js/admin-usuarios.js`: busca com filtro de situação (todos, ativos, inativos) e selo "inativo" na lista e no detalhe; detalhe com todos os dados e telefone visível fora da edição; cadastrar funcionário ou voluntário (formulário de voluntário com os campos do termo de adesão e aviso de autorização pendente para menor); corrigir, adicionar papel, inativar/reativar; **sem** botão de excluir (FR-024)
- [ ] T105 [US7] Reescrever `public/admin/dashboard.html` e `public/assets/js/admin-dashboard.js` com os indicadores de T101 e links para cada fila
- [ ] T106 [P] [US7] Criar `public/admin/auditoria.html` + `public/assets/js/admin-auditoria.js` e `public/admin/configuracoes.html` + `public/assets/js/admin-configuracoes.js` (prazos, contato e publicação de nova versão do aviso via T094)

**Checkpoint**: operação diária do Painel completa.

---

## Phase 11: User Story 8 — Divulgação Institucional (Priority: P3)

**Goal**: notícias com editar, despublicar e uma imagem com texto alternativo; página
institucional editável (FR-032, FR-032a, FR-032b, FR-001a).

**Independent Test**: quickstart V12 e spec → User Story 8 → Independent Test.

- [ ] T107 [P] [US8] Criar `api/admin/noticias/index.js` (`GET`, `POST` multipart: título, corpo, imagem opcional com `imagemAlt` obrigatório) e `api/admin/noticias/[id].js` (`PUT` multipart, com histórico)
- [ ] T108 [P] [US8] Criar `api/admin/noticias/[id]/despublicar.js` e `[id]/publicar.js` (FR-032a)
- [ ] T109 [P] [US8] Criar `api/admin/institucional.js` (`GET`/`PUT` multipart: história, missão, equipe, acolhimento, bazar, imagens com texto alternativo obrigatório; imagem retirada é **desativada**, nunca apagada; estado anterior em `historico_alteracao` — FR-001a)
- [ ] T110 [US8] Reescrever `public/admin/noticias.html` e `public/assets/js/admin-noticias.js`: criar, editar, despublicar, publicar de novo, imagem com campo de texto alternativo obrigatório
- [ ] T111 [P] [US8] Criar `public/admin/institucional.html` e `public/assets/js/admin-institucional.js`: edição dos três textos e das imagens com texto alternativo

**Checkpoint**: a instituição publica e mantém o próprio conteúdo depois da entrega.

---

## Phase 12: User Story 9 — Autoatendimento do Doador Associado (Priority: P3)

**Goal**: login do doador, dados próprios, histórico só de doações confirmadas, doar logado sem
redigitar, redefinição de senha (FR-041, FR-042, FR-046).

**Independent Test**: quickstart V3 passos 2, 3 e 6 e V10.

- [ ] T112 [US9] Criar `api/auth/login.js` (`POST { email, senha }`: nega com a mesma mensagem se senha errada, senha não definida, pessoa inativa ou papel de doador não ativo; limite de 5 falhas em 15 min) e `api/auth/logout.js`
- [ ] T113 [P] [US9] Criar `api/me/index.js` (`GET`, dados cadastrais da pessoa da sessão) e `api/me/doacoes.js` (`GET`, **só** `confirmada`, valor e data)
- [ ] T114 [US9] Atualizar a aba de doador de `public/login.html` e `public/assets/js/page-login.js` para `/api/auth/login`, com o link "esqueci minha senha / não recebi o link" chamando `/api/auth/link-senha`
- [ ] T115 [US9] Reescrever `public/autoatendimento.html` e `public/assets/js/page-autoatendimento.js`: só doador associado; dados cadastrais; histórico de confirmadas; aviso de que pagamentos na sede ou por depósito não aparecem; botão "doar de novo" levando a `doacoes.html` já logado; **remover** a parte de voluntário

**Checkpoint**: doador acompanha as próprias contribuições sem falar com a equipe (SC-012).

---

## Phase 13: User Story 10 — Consulta Pública de Status (Priority: P3)

**Goal**: autor de submissão consulta tipo, status e data pelo protocolo, sem dado pessoal e com
limite de tentativas (FR-044, FR-044a).

**Independent Test**: quickstart V5 passo 6.

- [ ] T116 [US10] Criar `api/public/status/[protocolo].js` (`GET`): procura nas três tabelas pelo prefixo; devolve `tipo`, `status`, `rotuloStatus` em português (incluindo "Chamado para entrevista", "Aprovada — aguardando contato" e "Encerrada a pedido do titular") e data; inexistente e mal formado → mesma resposta `404 NAO_ENCONTRADO`; limite de 10 por IP em 15 min
- [ ] T117 [US10] Estender `tests/protocolo.test.js` (FR-044a, parte 2): resposta para protocolo inexistente bem formado e para texto mal formado com mesmo status, mesmo corpo e mesmos cabeçalhos relevantes; 11ª consulta do mesmo IP em 15 min → `429`. Depende de T037, T116
- [ ] T118 [US10] Atualizar `public/consultar-status.html` e `public/assets/js/page-consultar-status.js`: remover doação como tipo consultável, mostrar só tipo, status e data, explicar o limite de tentativas

**Checkpoint**: todas as histórias implementadas.

---

## Phase 14: Polish & Cross-Cutting Concerns

**Purpose**: o que atravessa várias histórias e o que só pode ser feito com as telas prontas.

- [ ] T119 Atualizar `public/assets/js/nav.js`: link para `aviso-privacidade.html` no rodapé de todas as páginas públicas; menu do Painel com Institucional, LGPD, Auditoria, Configurações e Ajuda; remover links para funcionalidades que saíram (autoatendimento de voluntário, solicitação de titular)
- [ ] T120 Escrever `public/admin/ajuda.html` contra as telas prontas (FR-060), em linguagem cotidiana, cobrindo as três triagens com entrevista e autorização do menor, a conferência de doação, a chave Pix, itens, eventos e campanhas, notícias, página institucional, usuários e o atendimento dos pedidos do titular; com a seção "O que o sistema não faz" do FR-060a
- [ ] T121 Confirmar que nenhum arquivo em `public/` referencia `assets/js/data.js` e então remover `public/assets/js/data.js`; remover de `public/README.md` as credenciais de demonstração (`admin`/`admin123` e as do autoatendimento) e descrever o setup real com link para `quickstart.md` (pendência 4 do CLAUDE.md)
- [ ] T122 [P] Revisão do Princípio III: buscar em `api/` e `db/` por `DELETE` e confirmar que a única ocorrência é a limpeza de `limite_tentativa` em `api/cron/diario.js`; confirmar que nenhum arquivo de `api/` exporta função `DELETE` (quickstart V11)
- [ ] T123 [P] Revisão do Princípio IV: conferir que toda rota em `api/admin/` chama `exigirAdmin` e toda rota em `api/me/` chama `exigirDoador` como primeira instrução, e que nenhuma resposta de `api/public/` contém campos pessoais
- [ ] T124 Portão de acessibilidade (Princípio II) em todas as telas novas e alteradas: contraste, zoom de 200%, navegação por teclado com foco visível, rótulos, texto alternativo, mensagens de erro junto ao campo — registrar o resultado por tela em `specs/001-portal-painel-ilpi/checklists/portoes.md`
- [ ] T125 Portão de responsividade (Princípio V) em todas as telas públicas, em uma resolução móvel e uma desktop, nos quatro navegadores — registrar em `specs/001-portal-painel-ilpi/checklists/portoes.md`
- [ ] T126 Executar os cenários V1–V12 de `quickstart.md` em ambiente de preview da Vercel e registrar o resultado em `specs/001-portal-painel-ilpi/checklists/portoes.md`
- [ ] T127 Testar o QR Pix com a **chave real** da instituição em pelo menos três aplicativos de banco diferentes antes de operar (research D9) e registrar o resultado em `specs/001-portal-painel-ilpi/checklists/portoes.md`
- [ ] T128 Atualizar `CLAUDE.md` → Pendências: fechar 2, 4 e 6 conforme o que foi entregue, e registrar o que ficou (por exemplo, fotos reais do Recanto e aprovação do aviso de privacidade pela instituição)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências.
- **Foundational (Phase 2)**: depende do Setup — **bloqueia todas as histórias**.
- **Histórias (Phases 3–13)**: todas dependem da Fase 2.
- **Polish (Phase 14)**: depois das histórias desejadas; T120 (ajuda) só com todas as telas prontas.

### User Story Dependencies

| História | Depende de | Observação |
|---|---|---|
| US1 (P1) | Fase 2 | Validada com `seed --demo`, sem depender da US3 |
| US2 (P1) | Fase 2 | O passo "ver no autoatendimento" só fecha com a US9 |
| US3 (P2) | Fase 2 | Alimenta a US1 com dados reais |
| US4 (P2) | Fase 2 | |
| US5 (P2) | Fase 2 | V7 completo pede a US4 (voluntário que vira funcionário) |
| US6 (P2) | Fase 2 e **T064 da US3** | A confirmação cria evento/campanha |
| US11 (P2) | Fase 2 | Revogação e anonimização ficam mais úteis com US2 e US4–US6 prontas |
| US7 (P3) | Fase 2 e **T069/T071 da US4** | O cadastro direto de voluntário reaproveita a validação e a aprovação da US4 (FR-023); o dashboard funciona com zero |
| US8 (P3) | Fase 2 | |
| US9 (P3) | Fase 2 e **T050–T057 da US2** | A conta do doador nasce na doação |
| US10 (P3) | Fase 2 | Útil depois de US4–US6 gerarem protocolos |

### Within Each User Story

- Teste da regra crítica (quando houver) escrito antes e visto falhando.
- `api/_lib/` antes das rotas; rotas antes das telas.
- Fechar o checkpoint antes de passar para a próxima prioridade, se o time for sequencial.

### Parallel Opportunities

- Fase 1: T002, T003 e T004 juntos.
- Fase 2: as cinco migrações (T006–T010) juntas depois de T005; os módulos marcados [P]
  (T012–T018, T021–T023, T025–T027) juntos; T030–T033 juntos.
- Depois da Fase 2, com 6 pessoas: US1, US2, US3, US4, US5 e US11 podem começar ao mesmo tempo.
- Dentro de cada história, rotas marcadas [P] em arquivos diferentes.

---

## Parallel Example: User Story 1

```bash
# As quatro rotas públicas, em paralelo:
Task: "Criar api/public/institucional.js"
Task: "Criar api/public/eventos-campanhas.js"
Task: "Criar api/public/itens-necessarios.js"
Task: "Criar api/public/noticias.js"

# Depois, as telas, em paralelo:
Task: "Atualizar public/assets/js/page-home.js"
Task: "Criar public/assets/js/page-institucional.js"
Task: "Atualizar public/assets/js/page-campanhas.js"
Task: "Criar public/assets/js/page-noticias.js"
```

## Parallel Example: User Story 2

```bash
# Depois de T047 (teste) e T050 (conta-doador):
Task: "Criar api/public/pix.js"
Task: "Criar api/admin/pix.js"
Task: "Criar api/admin/doacoes/[id]/nao-localizar.js"
Task: "Criar api/auth/link-senha.js"
Task: "Criar api/auth/definir-senha.js"
Task: "Criar public/definir-senha.html e page-definir-senha.js"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Fase 1 (Setup) e Fase 2 (Foundational).
2. Fase 3 (US1): Portal informativo sobre o banco real.
3. **Parar e validar** com quickstart V1 em celular e desktop.
4. Publicar em preview da Vercel e mostrar ao Recanto.

### Incremental Delivery

1. Fundação → US1 (MVP) → **US2** (a doação é P1 e a razão prática para o visitante voltar).
2. US3 → o Portal passa a ser mantido pela equipe.
3. US4, US5, US6 → as três triagens.
4. US11 → LGPD completa. **Não entrar em operação real antes desta fase**: o consentimento já é
   coletado desde a US2, mas revogação, anonimização e retenção só existem aqui.
5. US7, US8, US9, US10 → refinamentos do dia a dia.
6. Fase 14 → ajuda, portões e testes com a chave real.

### Parallel Team Strategy (6 pessoas)

1. Todo o grupo na Fase 2 (é onde mora o que todas as histórias usam).
2. Depois:
   - Pessoa A: US1 → US8
   - Pessoa B: US2 → US9
   - Pessoa C: US3 → US6
   - Pessoa D: US4 → US10
   - Pessoa E: US5 → US7
   - Pessoa F: US11 → Fase 14
3. Cada história fecha no seu checkpoint antes de integrar.

---

## Notes

- [P] = arquivos diferentes, sem dependência pendente.
- [USn] = rastreabilidade até a história do spec.
- Commit ao fim de cada tarefa ou grupo lógico, com mensagem citando os FRs.
- Antes de implementar qualquer coisa fora destas tarefas, conferir o CLAUDE.md → "Inegociável":
  nada fora dos 11 CSUs sem atualizar o PRD e o CLAUDE.md.
- Tarefa que esbarrar em decisão não registrada no spec ou no CLAUDE.md: parar e levar ao grupo,
  não decidir no código.
