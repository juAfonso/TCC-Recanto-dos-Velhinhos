# Implementation Plan: Portal Público e Painel Administrativo do Recanto dos Velhinhos

**Branch**: `001-portal-painel-ilpi` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-portal-painel-ilpi/spec.md`

---

## Summary

Substituir a gestão manual da ILPI (planilhas Excel + Instagram) por uma aplicação web com dois
módulos: **Portal Público** (sem login) e **Painel Administrativo** (autenticado). Cobre 11 casos de
uso e os requisitos FR-001 a FR-059.

A abordagem técnica aproveita o protótipo `recanto-frontend` já existente — 21 páginas HTML, design
system de 1267 linhas de CSS e 24 módulos JS — mantendo-o em HTML/CSS/JS puro e substituindo apenas
sua camada de dados falsa (`assets/js/data.js`, hoje em `localStorage`) por chamadas `fetch` a
funções serverless em `/api` na Vercel, com PostgreSQL no Neon e arquivos no Vercel Blob.

Duas decisões desta sessão moldam o plano: a inclusão da LGPD no escopo (CSU11) e a **reversão do
CSU01 para Pix estático**, que removeu a integração com API de pagamentos e transformou a doação em
declaração do doador conferida manualmente pela equipe.

> ### CSU01 — liberado em 2026-09-05
> A reversão para Pix estático exigiu emenda ao Princípio VII da constituição (versão **2.0.0**),
> **ratificada em 2026-09-05**. Esteve bloqueada por um dia porque a rota constava como descartada
> pelo orientador; esclareceu-se que a objeção dele era à justificativa de *custo zero*, não à
> mudança em si, e a justificativa desta decisão é outra — eliminar a dependência de conta PJ em
> provedor de pagamentos. **Nenhuma história está bloqueada.**

---

## Technical Context

**Language/Version**: JavaScript ES2022 — navegador (sem transpilação) e Node.js 24 LTS nas funções
serverless.

**Primary Dependencies**: deliberadamente mínimas (Princípio I). `@neondatabase/serverless` (driver
HTTP, porque pool TCP não sobrevive a função efêmera) e `@vercel/blob` (upload de arquivos). Tudo
mais usa o runtime: `node:crypto` para hash de senha (`scrypt`) e assinatura de cookie (HMAC),
`fetch` nativo para o envio de e-mail, `node:test` para os testes. **Sem framework de front-end, sem
ORM, sem biblioteca de autenticação, sem build step.** Justificativas em `research.md`.

**Storage**: Neon (PostgreSQL) para dados relacionais; Vercel Blob para arquivos enviados
(currículos, autorização de menor, comprovante bancário, imagem do QR code Pix).

**Testing**: `node:test`, restrito a quatro regras críticas — FR-050 (não-duplicação de confirmação
de doação), FR-045 (protocolo), FR-055 (anonimização) e FR-047 (controle de acesso). Demais telas
verificadas manualmente pelos portões da constituição.

**Target Platform**: Vercel (estático + funções serverless Node.js 24 LTS). Navegadores: versões mais
recentes de Chrome, Firefox, Edge e Safari, desktop e mobile.

**Project Type**: aplicação web — front-end estático + API serverless.

**Performance Goals**: SC-001a (conferência de uma doação em menos de 2 minutos), SC-009 (declaração
de doação em menos de 2 minutos), SC-013 (e-mail de confirmação em até 5 minutos). Nenhuma meta de
throughput: o volume esperado é de dezenas de submissões por mês.

**Constraints**: plano gratuito em toda a stack — sem domínio próprio, sem SLA, e hibernação do
banco Neon após inatividade (cold start na primeira requisição). Mobile-first obrigatório
(Princípio V). Sem integração com API de pagamentos (Princípio VII, versão 2.0.0).

**Scale/Scope**: uma ILPI em Pinheiral/RJ. ~15 tabelas, ~40 endpoints, 21 telas. Ordem de grandeza:
centenas de usuários cadastrados, dezenas de doações por mês.

**NEEDS CLARIFICATION (institucional, não técnico)**: os prazos de retenção por categoria de dado
(FR-056) não têm valor definido e não recebem default de propósito — é decisão jurídica da
instituição. Até haver definição, o sistema armazena o prazo como configuração e apenas **sinaliza**
registros vencidos, sem anonimizar automaticamente. **É a última pendência que bloqueia valor de
configuração**; as três decisões de equipe que estavam abertas foram fechadas em 2026-09-23 (FR-014
sem e-mail à equipe, FR-028 em 30 dias, FR-030 como aviso).

---

## Constitution Check

*GATE: avaliado antes da Fase 0 e reavaliado após a Fase 1.*

| Princípio | Situação | Como o plano atende |
|---|---|---|
| I — Simplicidade | ✅ Passa | Stack sem framework, sem ORM, sem build step. Cada dependência tem justificativa escrita em `research.md` (D1–D8). Duas dependências npm no total. |
| II — Acessibilidade | ✅ Passa | Portão obrigatório por tela em `quickstart.md`. O design system do protótipo é o ponto de partida e precisa ter contraste verificado. |
| III — Integridade de dados | ✅ Passa | Nenhuma rota `DELETE` sobre dado de negócio (`contracts/api.md`); `registro_auditoria` é append-only; toda tabela tem status e auditoria. Anonimização (FR-055) preserva a linha. |
| IV — Separação de contextos | ✅ Passa | Três zonas de API com autenticação distinta; autorização verificada no servidor a cada requisição; arquivos restritos servidos por função que checa permissão, nunca por URL pública de Blob. |
| V — Responsividade | ✅ Passa | Portão obrigatório por tela pública; protótipo já é mobile-first. |
| VI — Escopo fechado | ✅ Passa | O plano cobre exatamente os 11 CSUs. Nada de residentes, medicamentos, estoque ou IA. |
| VII — Pix sem integração | ✅ Passa | O plano segue a versão **2.0.0** do princípio, ratificada em 2026-09-05: chave/QR code estáticos como conteúdo institucional, nenhuma integração de pagamento, e confirmação por ato humano conferido contra o extrato. |
| VIII — Triagem humana | ✅ Passa | Nenhuma rota de aprovação automática ou em lote por critério calculado; rejeição exige motivo nas três filas; submissões nascem `pendente`. |

**Resultado**: nenhum gate reprovado, nenhuma condição pendente.

**Reavaliação pós-Fase 1**: o desenho de `data-model.md` e `contracts/api.md` não introduziu nenhuma
abstração adicional nem nova dependência além das declaradas. Nenhum princípio mudou de situação.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-portal-painel-ilpi/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões técnicas e alternativas
├── data-model.md        # Fase 1 — entidades, validações, transições
├── quickstart.md        # Fase 1 — setup e cenários de validação
├── contracts/
│   └── api.md           # Fase 1 — contratos dos endpoints
├── checklists/
│   └── requirements.md  # log de qualidade da especificação
└── tasks.md             # Fase 2 — gerado por /speckit-tasks, NÃO por este comando
```

### Source Code (repository root)

```text
public/                          # front-end estático (do protótipo recanto-frontend)
├── index.html
├── institucional.html · campanhas.html · noticias.html
├── doacoes.html · voluntariado.html · vagas.html · solicitar-evento.html
├── consultar-status.html · login.html · autoatendimento.html
├── aviso-privacidade.html       # NOVO — FR-053
├── solicitar-direitos.html      # NOVO — CSU11 / FR-054
├── admin/
│   ├── dashboard.html · itens.html · campanhas.html · noticias.html
│   ├── doacoes.html · usuarios.html
│   ├── triagem-voluntarios.html · triagem-vagas.html · triagem-eventos.html
│   ├── pix.html                 # NOVO — FR-007
│   └── solicitacoes-titular.html # NOVO — CSU11 / FR-059
└── assets/
    ├── css/style.css            # design system existente
    ├── js/
    │   ├── api.js               # NOVO — substitui data.js (fetch + tratamento de erro)
    │   ├── auth.js · nav.js · utils.js
    │   ├── page-*.js · admin-*.js
    │   └── consentimento.js     # NOVO — FR-051/FR-052
    └── img/                     # hero.jpg, logo-icon.png (sem vídeo — removido em 2026-09-05)

api/                             # funções serverless (Vercel)
├── _lib/                        # módulos compartilhados, não são endpoints
│   ├── db.js · sessao.js · autorizacao.js · protocolo.js
│   ├── auditoria.js · email.js · blob.js · consentimento.js
├── public/                      # zona pública
├── me/                          # zona de autoatendimento
├── admin/                       # zona administrativa
└── auth/

db/
├── migrations/                  # 001_*.sql, 002_*.sql, …
├── migrate.js
└── seed.js

tests/
├── doacao-idempotencia.test.js  # FR-050
├── protocolo.test.js            # FR-045
├── anonimizacao.test.js         # FR-055
└── autorizacao.test.js          # FR-047
```

**Structure Decision**: estrutura de aplicação web com front-end estático e API serverless, ditada
pelo formato da Vercel (`public/` servido como estático, `api/` como funções). Não se adotou a
separação clássica `backend/` + `frontend/` porque a Vercel espera exatamente esses dois diretórios,
e inventar outra hierarquia exigiria configuração extra sem benefício — Princípio I.

Os módulos de `api/_lib/` são a única camada compartilhada. O prefixo `_` impede que a Vercel os
publique como endpoints.

**Pré-requisito de implementação**: o protótipo `recanto-frontend` **ainda não está no
repositório** — vive em `C:\Users\afons\Downloads\recanto-frontend\recanto-frontend`. Copiar para
`public/` e commitar é a primeira tarefa. Atenção ao `assets/video/hero-video.mp4`, responsável por
quase todos os 9,6 MB da pasta.

---

## Ordem de implementação sugerida

Deriva das prioridades do spec e das dependências entre histórias. `/speckit-tasks` detalha.

1. **Fundação** — trazer o protótipo para `public/`, schema inicial, `api/_lib/` (db, sessão,
   autorização, protocolo, auditoria), `api.js` no lugar de `data.js`.
2. **US1 (P1)** — Portal Público informativo. Prova a ponta a ponta sem depender de nada.
3. **US3 (P2) + CSU07** — gestão de itens e campanhas: é o que alimenta a US1.
4. **US4, US5, US6 (P1/P2)** — submissões públicas e triagens, com e-mail (FR-049/049a).
5. **US11 (P2) — LGPD** — o consentimento (FR-051/FR-052) **acompanha** cada formulário das etapas
   anteriores e não deve ser adiado; só o fluxo de atendimento de direitos vem aqui.
6. **US9, US10** — autoatendimento e consulta por protocolo.

**US2 (P1) — CSU01 doação**: liberada. Por ser P1 e por não depender de nenhuma outra história
(precisa apenas da fundação e da tela de configuração da chave Pix), pode entrar logo após a etapa 1,
em paralelo com a US1. Sem a integração de pagamento, o backend dela ficou pequeno: não há endpoint
de webhook, verificação de assinatura nem job de polling — o volume está na tela de conferência do
Painel e na regra de possível duplicata (FR-050).

---

## Complexity Tracking

| Violação | Por que é necessária | Alternativa mais simples rejeitada porque |
|---|---|---|
| Duas dependências npm (`@neondatabase/serverless`, `@vercel/blob`) | Pool TCP não sobrevive a função serverless, e a Vercel não tem disco persistente | `pg` puro esgota o limite de conexões do plano gratuito; salvar arquivo em disco local não persiste. Ver `research.md` D2 e D3 |

Nenhuma outra complexidade a justificar: não há ORM, framework, camada de repositório, biblioteca de
autenticação nem passo de build.

---

## Artefatos gerados

| Arquivo | Fase | Conteúdo |
|---|---|---|
| `research.md` | 0 | 10 decisões técnicas com alternativas e custos aceitos; riscos registrados |
| `data-model.md` | 1 | 16 entidades, validações, transições de estado, índices |
| `contracts/api.md` | 1 | ~40 endpoints em três zonas de acesso; 4 contratos sob teste |
| `quickstart.md` | 1 | Setup, 10 cenários de validação, portões de qualidade |

**Próximo comando**: `/speckit-tasks`.
