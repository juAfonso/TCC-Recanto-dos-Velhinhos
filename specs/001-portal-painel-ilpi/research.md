# Research — Portal Público e Painel Administrativo do Recanto dos Velhinhos

**Feature**: `001-portal-painel-ilpi` · **Data**: 2026-09-04 · **Fase**: 0 (Outline & Research)

Cada decisão abaixo foi tomada sob o Princípio I da constituição (simplicidade acima de
sofisticação), que exige justificativa escrita para toda nova dependência, abstração ou camada.
A pergunta aplicada a cada item foi: *qual é a menor peça que resolve o requisito?*

---

## D1 — Arquitetura da aplicação

**Decisão**: páginas HTML/CSS/JS estáticas servidas pela Vercel + funções serverless em `/api`
(Node.js 24 LTS). Sem framework de front-end, sem build step.

**Justificativa**: o protótipo `recanto-frontend` já entrega 21 telas e um design system de 1267
linhas de CSS em HTML/CSS/JS puro. Migrar para React/Next.js jogaria fora o HTML dessas telas e
imporia curva de aprendizado a um time de 6 pessoas com prazo fixo de TCC — exatamente o risco que
o Princípio VI (escopo fechado) identifica como principal ameaça à entrega. A integração se reduz a
substituir a camada mock `assets/js/data.js` por chamadas `fetch`.

**Alternativas consideradas**:
- *Next.js (App Router) + React*: mais idiomático na Vercel e traria componentização real,
  eliminando a repetição de navbar/rodapé entre as 21 páginas. Rejeitado pelo custo de reescrita e
  de aprendizado frente ao prazo.
- *Next.js só nas páginas novas*: rejeitado por criar dois modelos mentais no mesmo repositório,
  o pior dos dois mundos para manutenção pela instituição depois da entrega.

**Custo aceito**: sem componentização, o HTML de navbar/rodapé/`<head>` se repete entre páginas.
Mitigação: `assets/js/nav.js` já injeta a navegação no protótipo; manter esse padrão.

---

## D2 — Acesso ao banco a partir de funções serverless

**Decisão**: driver `@neondatabase/serverless`, usando o modo HTTP (`neon()`) para consultas
avulsas e `Pool` apenas onde houver transação de múltiplos comandos.

**Justificativa**: funções serverless são instâncias efêmeras — um pool TCP tradicional (`pg`) abre
conexões que não sobrevivem à invocação e esgotam o limite de conexões do plano gratuito do Neon.
O driver da Neon fala com o banco por HTTP/WebSocket, o que elimina o problema e é a rota
recomendada pela própria Neon para esse ambiente.

**Alternativas consideradas**:
- *`pg` puro*: rejeitado pelo esgotamento de conexões descrito acima.
- *Prisma/Drizzle (ORM)*: rejeitado pelo Princípio I. Um ORM adiciona schema DSL, geração de código
  e passo de build para um modelo de ~15 tabelas que SQL escrito à mão resolve. SQL explícito também
  torna auditável a proibição de `DELETE` (Princípio III), que ficaria escondida atrás do ORM.

**Consequência a registrar no spec**: o plano gratuito do Neon hiberna o banco após inatividade. A
primeira requisição depois da hibernação sofre atraso perceptível (cold start). Já previsto em
Assumptions do spec.md.

---

## D3 — Armazenamento de arquivos enviados

**Decisão**: Vercel Blob com acesso privado; o download passa sempre por uma função serverless que
verifica a autorização e então redireciona para uma URL assinada de vida curta.

**Justificativa**: a Vercel não tem disco persistente — arquivo salvo no sistema de arquivos da
função desaparece. Três tipos de arquivo aqui são dados pessoais sensíveis: currículos, autorização
de responsável legal de menor (FR-058) e comprovante bancário (FR-010b). O Princípio IV exige que a
autorização seja verificada **no servidor**; uma URL pública de Blob, mesmo com nome aleatório,
seria acesso sem verificação. Daí a indireção obrigatória pela função.

**Alternativas consideradas**:
- *Binário no PostgreSQL (`bytea`)*: backup junto do banco e nenhum serviço novo, mas consome
  rápido a cota do plano gratuito do Neon e pesa nas consultas. Rejeitado.
- *Blob com acesso público*: rejeitado por violar o Princípio IV e o FR-058.

**Regra derivada**: nenhuma URL de Blob pode ser gravada em HTML servido ao Portal Público.

---

## D4 — Autenticação e sessão

**Decisão**: cookie de sessão assinado com HMAC-SHA256 via `node:crypto`, com flags `HttpOnly`,
`Secure`, `SameSite=Lax`. Senhas com `scrypt` do `node:crypto`, salt por usuário. Zero dependências
externas.

**Justificativa**: o Princípio I pede a menor solução que atenda ao requisito. O Node 24 já traz
`scrypt` (função de derivação de chave resistente a força bruta, recomendada pelo OWASP) e HMAC.
Adicionar `bcrypt` (compilação nativa, problemática em serverless), `jsonwebtoken` ou uma biblioteca
de sessão inteira não resolveria nada que o runtime já não resolva.

**Alternativas consideradas**:
- *`bcryptjs`*: puro JS e popular, mas é dependência a mais para o que `scrypt` já faz.
- *Auth como serviço (Auth0, Clerk, Supabase Auth)*: rejeitado — traria cadastro de usuário para
  fora do sistema, conflitando com o acúmulo de perfis no mesmo CPF (FR-048) e com a proibição de
  exclusão física (FR-024), além de custo e vínculo contratual.

**Atenção**: são dois contextos de login distintos (Princípio IV) — conta institucional
compartilhada do Painel Administrativo (FR-040) e login individual de autoatendimento (FR-041).
O cookie deve carregar qual contexto está ativo, e a verificação de perfil roda a cada requisição.

---

## D5 — Envio de e-mail transacional

**Decisão**: Resend, chamado por `fetch` direto à API REST, sem SDK.

**Justificativa**: o plano gratuito cobre folgadamente o volume esperado (FR-049 dispara e-mail por
submissão pública — dezenas por mês, não milhares). Chamar a API REST com `fetch` evita mais uma
dependência npm, coerente com o Princípio I.

**Alternativas consideradas**: SendGrid e Brevo atendem igualmente; a escolha é reversível porque o
envio fica isolado atrás de um único módulo (`api/_lib/email.js`). SMTP direto (Nodemailer) foi
rejeitado por exigir dependência e por entregabilidade pior sem domínio próprio.

**Restrição conhecida**: sem domínio próprio (plano gratuito da Vercel), o remetente fica em um
domínio de teste do provedor, o que aumenta a chance de cair em spam. Isso reforça a necessidade do
FR-049a (o registro nunca depende do sucesso do e-mail) e do fallback de contato manual.

---

## D6 — Geração do código de protocolo

**Decisão**: 10 caracteres do alfabeto Crockford Base32 (sem I, L, O, U — reduz erro de digitação),
sorteados de `crypto.randomBytes`, com prefixo por tipo. Exemplo: `VOL-7K2M9XQ4RT`.

**Justificativa**: o spec (Assumptions e FR-044) exige protocolo **não sequencial e não previsível**,
porque o protocolo é o único credencial da consulta pública de status — um código adivinhável
exporia o status de submissões de terceiros. 10 caracteres Base32 ≈ 50 bits de entropia, muito além
do que força bruta alcança contra um endpoint com limitação de tentativas.

**Alternativas consideradas**:
- *ID sequencial ou UUIDv4 visível*: sequencial é adivinhável (rejeitado); UUIDv4 é seguro mas longo
  demais para alguém anotar num papel ou ditar por telefone — público idoso, Princípio I.

**Regra derivada**: o endpoint público de consulta por protocolo precisa de limitação de tentativas
por IP, e deve responder "não encontrado" de forma idêntica para protocolo inexistente e para
protocolo mal formado, sem vazar qual é o caso.

---

## D7 — Migrações de banco

**Decisão**: arquivos `.sql` numerados em `db/migrations/`, aplicados por um script Node
(`db/migrate.js`) que registra o que já rodou numa tabela `schema_migrations`.

**Justificativa**: ~15 tabelas e um time que precisa enxergar o SQL para aprender. Ferramenta de
migração (Flyway, Prisma Migrate, node-pg-migrate) resolveria mais do que o problema exige.

**Alternativas consideradas**: aplicar o schema manualmente pelo console do Neon — rejeitado por não
deixar histórico versionado, contrariando a rastreabilidade que o Princípio III pede.

---

## D8 — Estratégia de testes

**Decisão**: `node:test` (runner nativo do Node 24) sobre as quatro regras críticas escolhidas pelo
grupo: não-duplicação de confirmação de doação (FR-050), geração de protocolo (FR-045), anonimização
(FR-055) e controle de acesso por perfil (FR-047). Demais telas verificadas manualmente pelos
portões da constituição.

**Justificativa**: são as regras onde uma falha silenciosa custa caro — dinheiro conferido em dobro,
protocolo adivinhável, dado pessoal que deveria ter sumido e não sumiu, e acesso indevido. O runner
nativo evita instalar Vitest/Jest.

**Alternativas consideradas**:
- *Suíte completa com Playwright E2E*: mais rigor acadêmico, rejeitado pelo custo de tempo frente ao
  prazo (decisão do grupo em 2026-09-04).
- *Nenhum teste automatizado*: rejeitado — deixaria regras de dinheiro e de LGPD sem rede.

---

## D9 — Doação com Pix estático

**Decisão**: a chave Pix e a imagem do QR code são conteúdo institucional cadastrado no Painel
(entidade Chave Pix Institucional). Nenhuma integração de pagamento. O doador declara a doação e um
funcionário confirma contra o extrato bancário.

**Justificativa**: decisão do responsável pelo projeto em 2026-09-04, que exigiu emenda ao Princípio
VII da constituição (versão 2.0.0, ratificada em 2026-09-05). O que se elimina **não é custo** — é a
dependência externa de a instituição abrir e ter aprovada uma conta PJ em provedor de pagamentos,
cujo prazo é controlado por terceiros. Custo de hospedagem e domínio a instituição assume de
qualquer forma, e esse ponto nunca foi contestado.

**Alternativas consideradas**: API de pagamentos dinâmica (Mercado Pago, Efí, Asaas) — era o desenho
anterior do spec, revertido. Ver `spec.md` → Clarifications → Session 2026-09-04 (2).

**Cuidado ao defender esta decisão**: a justificativa de "custo zero" já foi avaliada e derrubada
pelo orientador. Usar esse argumento reabre uma discussão encerrada. O argumento válido é a
eliminação da dependência de gateway/conta PJ e do risco de cronograma que ela traz.

**Implicação técnica notável**: sem webhook, o backend do CSU01 fica bem menor — não há endpoint
público de callback, não há verificação de assinatura de webhook, não há job de polling. Em
compensação, entra a tela de conferência no Painel e a regra de detecção de possível duplicata
(FR-050).

---

## D10 — Valores de configuração ainda indefinidos

Dois requisitos dependem de números que só a instituição pode fixar. Ambos entram como configuração
em tabela, não como constante no código, para que a equipe possa ajustá-los sem redeploy.

| Requisito | O que falta | Sugestão de partida |
|---|---|---|
| FR-028 | "período prolongado" sem atualização de item necessário | 30 dias (é o valor que o protótipo já usa) |
| FR-056 | prazos de retenção por categoria de dado | a definir com a instituição — não há default seguro |

**NEEDS CLARIFICATION (institucional, não técnico)**: o FR-056 não tem valor sugerido de propósito.
Prazo de retenção é decisão jurídica da instituição (a constituição já coloca a definição das bases
legais e dos prazos fora do sistema); chutar um número aqui daria falsa sensação de conformidade.
Até haver definição, o sistema deve armazenar os prazos como configuração e **não** executar
anonimização automática por decurso de prazo — apenas sinalizar à equipe.

---

## Riscos técnicos registrados

| Risco | Impacto | Mitigação |
|---|---|---|
| Cold start do Neon após hibernação | Primeira requisição lenta | Já previsto em Assumptions; SC-001 não depende mais de tempo de máquina |
| E-mail em domínio de teste cai em spam | Doador/voluntário não recebe confirmação | FR-049a: registro nunca depende do e-mail; equipe reenvia manualmente |
| Doação real sem declaração do doador | Não aparece no sistema | Consequência aceita e registrada em Assumptions; conciliação contábil continua no extrato |
| Repetição de HTML entre 21 páginas | Divergência visual ao editar | Injeção de navbar/rodapé por JS, como o protótipo já faz |
| Conta institucional compartilhada | Auditoria não identifica funcionário | Aceito conscientemente (FR-035); registrado como limitação, não lacuna |
