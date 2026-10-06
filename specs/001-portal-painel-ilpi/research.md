# Research — Portal Público e Painel Administrativo do Recanto dos Velhinhos

**Feature**: `001-portal-painel-ilpi` · **Data**: 2026-10-05 (refeito; versão anterior de 2026-09-04)
· **Fase**: 0 (Outline & Research)

Cada decisão abaixo foi tomada sob o Princípio I da constituição (simplicidade acima de
sofisticação), que exige justificativa escrita para toda nova dependência, abstração ou camada.
A pergunta aplicada a cada item foi: *qual é a menor peça que resolve o requisito?*

**O que mudou desde 2026-09-04**: o spec passou pelas sessões de 03, 04 e 05/10 e a constituição
chegou à 3.0.0. Saíram o protocolo e o anexo da doação, o anexo da autorização do menor, o
autoatendimento de voluntário, a solicitação de titular com protocolo e a sincronização com redes
sociais. Entraram a etapa de entrevista nas triagens, papéis exclusivos de funcionário e voluntário,
encerramento automático de evento/campanha, página institucional editável e as regras novas de
revogação, retenção e anonimização. As decisões D11 a D18 são novas; D3, D4, D5, D6, D8 e D10
foram revistas.

Limites da Vercel conferidos na documentação oficial em 2026-10-05: cron do plano Hobby roda
**no máximo uma vez por dia, com precisão de ±59 min**; corpo de requisição e de resposta de
função limitado a **4,5 MB**; duração máxima de função no Hobby de **300 s**.

---

## D1 — Arquitetura da aplicação

**Decisão**: páginas HTML/CSS/JS estáticas em `public/`, servidas pela Vercel, e funções serverless
em `api/` (Node.js 24 LTS), escritas no formato Web padrão — `export function GET(request)` /
`POST(request)`, recebendo `Request` e devolvendo `Response`. Sem framework, sem build step.

**Justificativa**: o protótipo já está no repositório (`public/`, desde 2026-09-04) com as telas e o
design system em HTML/CSS/JS puro. A integração é trocar a camada falsa `assets/js/data.js` por
chamadas `fetch`. O formato Web padrão é suportado pela Vercel sem configuração e dá
`request.formData()` nativo, o que dispensa biblioteca de upload (D3).

**Alternativas consideradas**:
- *Next.js + React*: componentização real, mas reescreveria as telas e imporia curva de
  aprendizado a 6 pessoas com prazo fixo. Rejeitado (decisão de 2026-09-04, Princípio I).
- *Handler `(req, res)` com helpers da Vercel*: funciona, mas não parseia `multipart/form-data`
  — exigiria biblioteca. Rejeitado em favor do formato Web.

**Custo aceito**: HTML de navbar/rodapé repetido entre páginas; `assets/js/nav.js` continua
injetando a navegação, como no protótipo.

**Revisto em 2026-10-06 — uma função só.** O plano Hobby da Vercel aceita no máximo **12 funções por
deploy**, e a fase 4 já somava 19 (o deploy de produção falhou). Agora só `api/index.js` é função: um
rewrite no `vercel.json` manda todo `/api/...` para ela, que acha o arquivo em **`rotas/`** (mesma
convenção de pastas e `[id].js`, via `rotas/_lib/roteador.js`) e o executa. Os endereços públicos não
mudaram. `npm run dev` e os testes passam pela mesma função. Alternativa descartada: plano Pro
(custo mensal para a instituição).

---

## D2 — Acesso ao banco a partir de funções serverless

**Decisão**: `@neondatabase/serverless` — `neon()` (HTTP) para consultas avulsas e `Pool` só onde
houver transação de vários comandos (aprovação de candidatura, anonimização, revogação).

**Justificativa**: pool TCP tradicional (`pg`) não sobrevive a instâncias efêmeras e esgota o
limite de conexões do plano gratuito do Neon. SQL escrito à mão, sem ORM, deixa auditável a
proibição de `DELETE` (Princípio III).

**Alternativas consideradas**: `pg` puro (esgota conexões); Prisma/Drizzle (schema DSL e build
step para ~20 tabelas — Princípio I).

**Consequência**: o Neon gratuito hiberna após inatividade; a primeira requisição depois disso é
lenta. Já previsto nas Assumptions do spec.

---

## D3 — Arquivos enviados (revista)

**Decisão**: Vercel Blob, com dois níveis de acesso:

| Arquivo | Acesso | Limite |
|---|---|---|
| Currículo (FR-017) | **privado** — só abre por função do Painel que verifica a sessão e repassa o arquivo (ver ajuste de 2026-10-06) | 4 MB · PDF, DOC, DOCX, ODT |
| Imagem de notícia (FR-032b) e da página institucional (FR-001a) | **pública** — é conteúdo do Portal | 2 MB · JPEG, PNG, WebP |

O arquivo viaja **no mesmo envio do formulário** (`multipart/form-data`, lido com
`request.formData()`), não em upload separado.

**Justificativa**:
- Saíram do Blob o comprovante bancário (2026-10-04) e a autorização do menor (2026-10-03). O
  único arquivo pessoal que resta é o currículo.
- O limite de 4,5 MB do corpo de requisição na Vercel define os tetos: 4 MB de currículo deixam
  folga para os demais campos.
- Upload no mesmo envio evita arquivos órfãos no Blob quando a pessoa desiste do formulário — o
  desenho anterior (`POST /uploads` devolvendo um id) deixava lixo sem dono, com dado pessoal.

**Alternativas consideradas**:
- *Upload direto do navegador ao Blob com token* (`@vercel/blob/client`): contorna os 4,5 MB, mas
  traz um fluxo de duas etapas e token temporário, sem necessidade para currículos de poucas
  páginas. Rejeitado.
- *Binário no PostgreSQL*: consome a cota do Neon gratuito. Rejeitado.

**Regra derivada**: nenhuma URL de currículo aparece em resposta da zona pública nem em HTML do
Portal.

**Ajuste de 2026-10-06 (fase 7):**
- **Dois stores no Blob, um por nível de acesso.** Na Vercel o acesso (público ou privado) é
  escolhido ao **criar o store**, não por arquivo. Currículos vão para um store privado e
  imagens do Portal, a partir da fase 11, para um público.
- **Credenciais por OIDC na Vercel.** Ao conectar um store ao projeto, a Vercel cria só
  `BLOB_STORE_ID` (não cria mais token); a função se autentica pelo token OIDC do próprio
  deploy, sem segredo guardado. O privado usa `BLOB_PRIVADO_STORE_ID` ou, por ter sido o primeiro
  conectado, o `BLOB_STORE_ID` padrão; o público usará `BLOB_PUBLICO_STORE_ID` (fase 11). No
  `npm run dev` não há OIDC: para testar arquivo localmente, `BLOB_PRIVADO_READ_WRITE_TOKEN` /
  `BLOB_PUBLICO_READ_WRITE_TOKEN` no `.env.local`. Sem credencial, o envio de arquivo responde
  `503 ARQUIVOS_INDISPONIVEIS` e nada é gravado; a candidatura só com texto continua funcionando.
- **Sem URL assinada: a função repassa o arquivo.** `GET /api/admin/candidaturas/:id/curriculo`
  confere a sessão, busca o arquivo no store privado com o token e o devolve ao navegador
  (`Cache-Control: private, no-store`), registrando a abertura na auditoria. Motivo: a URL nunca sai
  do servidor — um link assinado, mesmo de vida curta, pode ser copiado e repassado. Custo aceito:
  o arquivo passa pela função (até 4 MB, dentro do limite).

---

## D4 — Autenticação e sessão (revista)

**Decisão**: cookie de sessão assinado com HMAC-SHA256 (`node:crypto`), `HttpOnly`, `Secure`,
`SameSite=Lax`, validade de 8 horas. Senhas com `scrypt` e salt por senha. Zero dependências.
**Ajuste de 2026-10-06:** o cookie é de sessão do navegador (sem `Max-Age`): fechar o navegador
encerra o login, porque o computador da secretaria é compartilhado. As 8 horas continuam valendo
pelo prazo assinado dentro do cookie, conferido no servidor.

**Dois contextos de login, e só dois** (Princípio IV, constituição 3.0.0):

| Contexto | Quem | Cookie carrega |
|---|---|---|
| Painel | conta institucional compartilhada (FR-040) | `{ ctx: "admin", contaId }` |
| Autoatendimento | doador associado (FR-041) | `{ ctx: "doador", pessoaId }` |

Funcionários e voluntários não têm login. Não existe "nível de permissão" dentro do Painel
(FR-025): a autorização é o contexto do cookie, verificado no servidor a cada requisição.

**Regra de acesso do doador**: o login só é aceito se a pessoa estiver ativa **e** o papel de
doador associado estiver ativo **e** a senha já tiver sido definida pelo link (FR-006a). A
revogação do consentimento do doador encerra o papel (FR-057), o que derruba o login sem afetar
outros papéis da mesma pessoa.

**Alternativas consideradas**: `bcryptjs` (dependência a mais para o que `scrypt` faz); auth como
serviço (tira o cadastro do sistema, conflita com FR-024 e FR-048, e traz vínculo contratual).

---

## D5 — E-mail transacional (revista)

**Decisão**: SMTP do Gmail institucional via `nodemailer`, senha de aplicativo em variável de
ambiente. Terceira dependência npm, justificada em 2026-09-23 (sem domínio próprio, é a única rota
que autentica no DMARC). A justificativa e os riscos dessa escolha seguem válidos e estão no
CLAUDE.md; não são repetidos aqui.

**Política de reenvio (FR-049a, FR-049b) — nova**:
1. O registro é gravado e confirmado no banco **antes** de qualquer tentativa de envio.
2. Primeira tentativa com tempo-limite de 8 s.
3. Se falhar, espera 3 s e tenta uma segunda vez, na mesma requisição.
4. Se falhar de novo, grava uma linha em `falha_email` (sinalizada no Painel) e a resposta ao
   usuário segue normal: o protocolo já está na tela.

**Justificativa**: o spec pede "reenviar uma vez após um intervalo". Fazer o reenvio na mesma
requisição é o desenho mais simples que existe em serverless: não exige fila nem cron, e o pior
caso (~20 s) está muito abaixo dos 300 s de limite. A espera é aceitável porque o volume é de
dezenas de envios por mês e a interface mostra "enviando…".

**Alternativas consideradas**: reenvio pelo cron diário (D12) — atrasaria o reenvio em até 24 h e
quebraria o SC-013; fila externa (Upstash, QStash) — dependência e serviço novos sem necessidade.

---

## D6 — Código de protocolo (revista)

**Decisão**: 10 caracteres Crockford Base32 sorteados por `crypto.randomBytes`, com prefixo por
tipo: `VOL-` (voluntário), `CAN-` (candidatura), `SOL-` (solicitação externa). Exemplo:
`VOL-7K2M9XQ4RT`. **Doação não tem protocolo** (2026-10-04) e não existe mais protocolo de
solicitação de titular (2026-10-03).

**Justificativa**: ~50 bits de entropia, curto o bastante para anotar num papel ou ditar por
telefone, sem I, L, O e U para evitar confusão de leitura. A consulta pública depende só do
protocolo, que por isso não pode ser previsível (FR-043, FR-044a).

**Alternativas consideradas**: sequencial (adivinhável); UUID (longo demais para o público idoso).

---

## D7 — Migrações de banco

**Decisão**: arquivos `.sql` numerados em `db/migrations/`, aplicados por `db/migrate.js`, que
registra o que já rodou em `schema_migrations`.

**Alternativas consideradas**: aplicar pelo console do Neon (sem histórico versionado, contra o
Princípio III); ferramenta de migração (mais do que o problema pede).

---

## D8 — Testes automatizados (revista)

**Decisão**: `node:test` sobre as quatro regras críticas escolhidas pelo grupo em 2026-09-04, com
os números de requisito atualizados:

1. **FR-050** — confirmação de doação não duplica.
2. **FR-043 / FR-044a** — protocolo único, imprevisível, e consulta com resposta idêntica para
   inexistente e mal formado. (Era FR-045, que agora é número reservado.)
3. **FR-055** — anonimização torna dados ilegíveis, preserva linha, histórico e auditoria, e mantém
   as doações do doador anonimizado com valor, data, tipo e status.
4. **FR-047** — rota do Painel com sessão de doador ou sem sessão responde `403` e registra a
   tentativa.

Os testes rodam contra um banco Neon separado (branch de teste do próprio Neon, gratuita), nunca
contra o de produção. O restante é verificado pelos portões da constituição (`quickstart.md`).

---

## D9 — Doação com Pix estático (revista)

**Decisão**: a chave Pix, o nome do recebedor e a cidade são conteúdo institucional cadastrado no
Painel (FR-007). O navegador monta o BR Code de um Pix **estático** com o valor escolhido e desenha
o QR (`public/assets/js/pix.js` + `public/assets/vendor/qrcode.js`, `qrcode-generator` MIT, sem
npm). A declaração é **só o clique em "Já fiz o Pix"**: o servidor grava valor e data/hora do
clique, sem protocolo e sem anexo (2026-10-04).

**Justificativa**: a de 2026-09-04 (Princípio VII): eliminar a **dependência de conta PJ em
gateway** — nunca "custo zero", argumento já derrubado pelo orientador.

**Data/hora do clique**: gravada pelo **servidor** (`now()` do banco), não enviada pelo navegador
— relógio do celular errado não pode desalinhar a conferência com o extrato.

**Risco registrado (mantido)**: cada app de banco é exigente com o formato do BR Code. Testar com a
chave real em vários bancos antes de operar.

---

## D10 — Configuração editável (revista)

Todos os valores que o spec manda manter fora do código ficam na tabela `configuracao`, editável
pela equipe no Painel, sem redeploy:

| Chave | Valor inicial | Origem |
|---|---|---|
| `item_sem_atualizacao_dias` | 30 | FR-028 (2026-09-23) |
| `retencao_meses` | 6 | FR-056 (2026-09-30, ampliado em 2026-10-05) |
| `contato_instituicao` | definido pela instituição | FR-007a, FR-053 |

O aviso de privacidade não é configuração: tem tabela própria e versionada (`aviso_privacidade`),
porque cada consentimento aponta para a versão aceita (FR-052).

**Pendência fechada**: a versão anterior deste documento marcava o FR-056 como "NEEDS
CLARIFICATION". Está resolvido desde 2026-09-30 (6 meses) e ampliado em 2026-10-05.

**Anonimização por prazo**: o sistema **sinaliza** registros vencidos na fila de retenção, e a
equipe executa. Não há anonimização automática: o spec (FR-056) fala em sinalizar, e uma ação
irreversível sobre dado pessoal sem ninguém olhar seria o tipo de efeito silencioso que o
Princípio VIII evita nas triagens.

---

## D11 — Links de definição e redefinição de senha (nova)

Resolve a pendência deixada pelo clarify de 2026-10-05.

**Decisão**:

| | Definir senha (conta nova, FR-006a) | Redefinir senha (FR-046) |
|---|---|---|
| Validade | **7 dias** | **1 hora** |
| Uso | único | único |
| Pedido de novo link | pela mesma tela "Esqueci minha senha / não recebi o link" | idem |

- Um único endpoint (`POST /api/auth/link-senha`) atende os dois casos: se o e-mail é de doador
  associado **sem senha definida**, envia link de definição; se tem senha, envia link de
  redefinição. Para e-mail desconhecido, a resposta é **idêntica** e nada é enviado (FR-046).
- O token tem 32 bytes aleatórios e vai na URL; o banco guarda só o **hash SHA-256** dele.
  Vazamento do banco não entrega links válidos.
- Gerar um link novo **invalida** os anteriores da mesma pessoa e finalidade.
- No máximo **3 links por e-mail por hora** (D13); acima disso, a resposta continua idêntica, mas
  nada é enviado.
- Definir ou redefinir a senha encerra as sessões de autoatendimento abertas daquela pessoa.

**Justificativa**: 1 hora é o padrão recomendado (OWASP) para redefinição, porque o link equivale
a uma senha. A definição tem prazo maior porque o doador pode só olhar o e-mail dias depois de
doar — e, se perder o prazo, pede outro link pela mesma tela, sem depender da equipe. Um endpoint
para os dois casos é menos código e uma tela a menos para o público idoso entender.

**Alternativas consideradas**: link de definição sem validade (fica utilizável para sempre se o
e-mail vazar); validade de 24 h na definição (curta para quem não abre e-mail todo dia); tela
separada de "reenviar ativação" (duas telas para a mesma necessidade).

---

## D12 — Encerramento automático de evento e campanha (nova, FR-029c)

**Decisão**: duas camadas.

1. **Leitura**: toda consulta pública de eventos e campanhas filtra pela data — evento só aparece
   se `data >= hoje`; campanha, se `hoje` estiver dentro do período —, sempre no fuso
   `America/Sao_Paulo`. É isso que garante o FR-002.
2. **Cron diário** (`vercel.json`, `0 4 * * *` = 01:00 em Brasília): `GET /api/cron/diario` muda
   para `encerrado` o que venceu, com autor `sistema` na auditoria. Protegido por `CRON_SECRET`
   (cabeçalho `Authorization: Bearer`), que a Vercel envia sozinha.

**Justificativa**: no plano Hobby o cron roda uma vez por dia e pode atrasar até 59 min. Se o
Portal dependesse só do cron, um evento de ontem poderia aparecer até ~02:00 de hoje. Com o filtro
na leitura, o Portal nunca mostra o que venceu, e o cron só acerta o status no banco para o Painel
e a auditoria. O UPDATE do cron é idempotente: rodar duas vezes não muda nada.

**Alternativas consideradas**: só o filtro na leitura, sem cron (o status no banco ficaria
"ativo" para sempre, contrariando o FR-029c); encerrar "preguiçosamente" quando alguém abre o
Painel (mistura escrita em rota de leitura e deixa a auditoria com a hora errada).

---

## D13 — Limite de tentativas (nova)

**Decisão**: tabela `limite_tentativa` no próprio PostgreSQL, com contagem por chave e janela de
tempo. A chave é o **hash SHA-256 do IP** (mais o escopo), nunca o IP em claro (coleta mínima).

| Escopo | Limite | Requisito |
|---|---|---|
| Consulta de protocolo | 10 por IP a cada 15 min | FR-044a |
| Login do Painel e do autoatendimento | 5 falhas por IP+conta a cada 15 min | segurança mínima da constituição |
| Pedido de link de senha | 3 por e-mail por hora | D11 |
| Verificação de doador associado | 10 por IP a cada 15 min | D15 |

**Justificativa**: funções serverless não guardam memória entre chamadas, então o contador precisa
de armazenamento externo. O banco já existe; o volume é baixo.

**Alternativas consideradas**: Upstash Redis / Vercel KV (serviço e dependência novos para um
contador); só limitar no front (não é controle — Princípio IV).

**Limpeza**: o cron diário (D12) apaga linhas de janelas expiradas. É a **única** remoção física
do sistema, e não fere o Princípio III: são contadores técnicos efêmeros, não dado de negócio,
e não contêm dado pessoal.

---

## D14 — Papéis exclusivos de funcionário e voluntário (nova, FR-048)

**Decisão**: uma linha por pessoa em `pessoa` (CPF único) e uma linha por papel em `papel`, com
status `ativo` | `inativo` | `encerrado`. A exclusividade é garantida **no banco** por índice único
parcial: no máximo um papel `funcionario` ou `voluntario` com status `ativo` por pessoa.

- Efetivar candidato que já é voluntário: na mesma transação, o papel `voluntario` passa a
  `encerrado` e nasce o papel `funcionario`. Nada é apagado.
- Aprovar voluntário que é funcionário ativo: o índice rejeita, e a API responde
  `422 FUNCIONARIO_NAO_PODE_SER_VOLUNTARIO`.
- `doador_associado` fica fora do índice e convive com qualquer papel.

**Justificativa**: regra de negócio sustentada só por código pode ser furada por um caminho
esquecido (cadastro direto no Painel, efetivação, reativação). O índice fecha todos de uma vez.

---

## D15 — Doação associativa: quem já tem cadastro (nova, FR-006b)

**Decisão**: antes de gerar o QR da doação associativa, o front chama
`POST /api/public/doacoes/verificar-associativa` com CPF e e-mail.

| Situação | Resposta |
|---|---|
| CPF e e-mail não existem | segue para o QR |
| CPF ou e-mail pertencem a um doador associado | **mensagem neutra**: "Se você já é associado, entre no autoatendimento para doar. Se não, faça a doação espontânea." O QR não é gerado. |
| CPF pertence a pessoa já cadastrada **sem** papel de doador (ex.: voluntária) | segue para o QR; no "Já fiz o Pix", o papel de doador é **adicionado ao cadastro existente** (FR-048, sem duplicar) e o link de definição de senha vai para o **e-mail que já está no cadastro**, não o digitado |

**Quarto caso (2026-10-06):** CPF novo com e-mail que já pertence a **outra** pessoa cadastrada
recebe a mesma mensagem neutra — senão o cadastro novo colidiria com o e-mail único, e quem
digitou o e-mail alheio poderia tentar receber o acesso. O risco de descoberta é o mesmo, já aceito.

No "Já fiz o Pix", a mesma verificação roda de novo no servidor — a do passo anterior é só para
não deixar a pessoa pagar à toa.

**Justificativa do terceiro caso**: sem essa regra, alguém digitaria o CPF de uma voluntária com o
próprio e-mail e ganharia acesso ao autoatendimento com os dados dela. Mandando o link ao e-mail já
cadastrado, quem digitou não ganha nada. A mensagem ao visitante é a mesma do caso de conta nova
("Se os dados estiverem corretos, você receberá um link por e-mail para criar sua senha"), então
também não revela que a pessoa já existia.

**⚠ Limitação a levar ao grupo**: a decisão do clarify (FR-006b, opção A) promete não revelar se o
cadastro existe. A **mensagem** é neutra, mas o **comportamento** não é: quem informa um CPF novo
segue para o QR, quem informa o de um associado é barrado. Comparando os dois resultados, dá para
descobrir se um CPF ou e-mail é de associado. O plano reduz o risco — limite de 10 verificações por
IP a cada 15 min (D13), sem dizer qual dos dois campos bateu —, mas não o elimina. A única forma de
eliminar é não barrar ninguém, o que foi a opção C do clarify (registrar como espontânea sem
vínculo), descartada pelo grupo. **Risco residual aceito pelo grupo em 2026-10-05**, com a mitigação acima.

---

## D16 — Histórico de alterações e alcance da anonimização (nova)

**Decisão**: tabela `historico_alteracao` guarda, a cada edição (FR-037, FR-001a, FR-032a), o
estado anterior do registro em `jsonb`, com conta e data. É diferente de `registro_auditoria`:
a auditoria diz **quem fez o quê** e nunca leva dado pessoal; o histórico guarda **o valor antigo**
e por isso pode conter dado pessoal.

**Consequência obrigatória**: a anonimização (FR-055, FR-056) precisa alcançar, na mesma
transação, o registro principal, suas linhas de `historico_alteracao`, as de `falha_email` e os
consentimentos ligados. Se esquecer o histórico, o endereço antigo continua legível, e o SC-016
falha. O teste D8-3 verifica exatamente isso.

---

## D17 — Página de autorização do menor para impressão (nova, FR-012)

**Decisão**: depois do envio do cadastro de menor, o navegador monta a página de autorização com os
dados **que já estão no formulário**, e o responsável usa `window.print()` (imprimir ou salvar em
PDF). Nenhum endpoint público devolve dados pessoais a partir do protocolo. Se a família perder a
página, a equipe a reimprime pelo Painel (desde 2026-10-06, `GET /api/admin/voluntarios/:id/impressao`, que também serve ao termo de adesão — FR-012a; antes `GET /api/admin/voluntarios/:id/autorizacao`).

**Justificativa**: a consulta pública por protocolo só pode mostrar tipo, status e data (FR-044).
Uma rota pública "reimprimir autorização por protocolo" exporia nome, RG e endereço de um menor a
quem tivesse o código.

---

## D18 — Janela de possível duplicata na conferência (nova, FR-050)

**Decisão**: na tela de conferência, uma declaração pendente é sinalizada como possível duplicata
quando há outra pendente com o **mesmo valor** e clique a **até 30 minutos** de distância. Constante
no código, não configuração.

**Justificativa**: o spec não fixa número. Trinta minutos cobrem o caso real de alguém clicar duas
vezes ou voltar à página. É sinalização, nunca bloqueio, então um número errado custa no máximo um
aviso a mais ou a menos. Tornar isso configurável seria "configurabilidade especulativa", que o
Princípio I proíbe.

---

## Riscos técnicos registrados

| Risco | Impacto | Mitigação |
|---|---|---|
| Cold start do Neon após hibernação | Primeira requisição lenta | Previsto nas Assumptions; nenhuma meta depende de tempo de máquina após hibernação |
| E-mail sem domínio próprio cai em spam | Autor não recebe confirmação | Protocolo é o canal primário ("anote este código"); FR-049a registra falhas de envio |
| Google bloqueia envio automatizado | E-mails param | Plano B: Brevo/SendGrid em subdomínio do provedor (D5) |
| Cron do Hobby atrasa até 59 min | Status "ativo" por algumas horas após o vencimento | Filtro de data na leitura pública (D12) |
| Enumeração de associados pela verificação | Descobrir se um CPF/e-mail é de associado | Limite de tentativas; risco residual aceito pelo grupo em 2026-10-05 (D15) |
| Doação real sem clique em "Já fiz o Pix" | Não aparece no sistema | Consequência aceita (CSU01, exceção 08); a página avisa |
| BR Code recusado por algum banco | Doador não consegue pagar pelo QR | Código copia e cola continua disponível; testar em vários bancos antes de operar (D9) |
| Anonimização esquecer o histórico | Dado pessoal continua legível | Transação única (D16) + teste automatizado (D8) |
| Conta institucional compartilhada | Auditoria não identifica o funcionário | Aceito conscientemente (FR-035) |
