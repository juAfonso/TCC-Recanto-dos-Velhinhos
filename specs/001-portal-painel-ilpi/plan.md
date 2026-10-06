# Implementation Plan: Portal Público e Painel Administrativo do Recanto dos Velhinhos

**Branch**: `001-portal-painel-ilpi` (trabalho na `main`) | **Date**: 2026-10-05 (refeito; versão
anterior de 2026-09-04) | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-portal-painel-ilpi/spec.md`, com as sessões de
03, 04 e 05/10 e a constituição 3.0.0.

---

## Summary

Substituir a gestão manual da ILPI (planilhas e Instagram) por uma aplicação web com **Portal
Público** (sem login), **autoatendimento do doador associado** e **Painel Administrativo** (conta
institucional). Cobre os 11 casos de uso e os requisitos FR-001 a FR-061 (FR-010, FR-010b, FR-033,
FR-045 e FR-059 são números reservados).

A abordagem mantém o protótipo de `public/` em HTML/CSS/JS puro e troca sua camada falsa
(`assets/js/data.js`) por chamadas `fetch` a funções serverless em `api/` na Vercel, com PostgreSQL
no Neon, currículos e imagens no Vercel Blob e e-mail pelo SMTP do Gmail institucional.

**Por que o plano foi refeito**: o plano de 2026-09-04 desenhava doação com protocolo e anexo,
autorização de menor no Blob, autoatendimento de voluntário, solicitação de titular com protocolo,
sincronização com redes sociais e acúmulo de perfis. Tudo isso foi revertido entre 03 e 05/10. O
desenho novo também incorpora a etapa de entrevista, papéis exclusivos, encerramento automático,
página institucional editável e as regras de revogação, retenção e anonimização do clarify de
2026-10-05.

---

## Technical Context

**Language/Version**: JavaScript ES2022 — no navegador, sem transpilação; Node.js 24 LTS nas funções.

**Primary Dependencies**: três dependências npm, todas justificadas (Princípio I):
`@neondatabase/serverless` (D2), `@vercel/blob` (D3) e `nodemailer` (D5). No front-end, um arquivo
de terceiros copiado, sem npm: `qrcode-generator` (D9). Todo o resto vem do runtime: `node:crypto`
(`scrypt`, HMAC, SHA-256, `randomBytes`), `node:test`, `Request.formData()`. Sem framework, ORM,
biblioteca de autenticação ou build step.

**Storage**: Neon (PostgreSQL) — ~22 tabelas ([data-model.md](./data-model.md)). Vercel Blob —
currículos (privados) e imagens de notícia e da página institucional (públicas). O QR code Pix não é
armazenado.

**Testing**: `node:test` em quatro regras críticas — FR-050, FR-043/FR-044a, FR-055 e FR-047
(D8) —, contra uma branch de teste do Neon. O resto é validado pelos cenários e portões de
[quickstart.md](./quickstart.md).

**Target Platform**: Vercel Hobby (estático + funções Node 24 + um cron diário). Chrome, Firefox,
Edge e Safari recentes, em desktop e celular.

**Project Type**: aplicação web — front-end estático + API serverless.

**Performance Goals**: SC-001a (conferir uma doação em < 2 min), SC-007 (nova submissão no Painel em
até 1 min), SC-009 (declarar doação em < 2 min), SC-013 (e-mail em até 5 min). Sem meta de
throughput: dezenas de submissões e doações por mês.

**Constraints**:
- Plano gratuito em toda a stack: sem domínio próprio, sem SLA, hibernação do Neon.
- Vercel Hobby: cron **uma vez por dia, ±59 min**; corpo de requisição **4,5 MB**; função até
  **300 s** (conferido na documentação em 2026-10-05).
- Mobile-first (Princípio V); sem integração de pagamento (Princípio VII).

**Scale/Scope**: uma ILPI em Pinheiral/RJ. ~22 tabelas, ~65 rotas, ~27 telas. Centenas de pessoas
cadastradas, dezenas de doações por mês.

**NEEDS CLARIFICATION**: nenhum. A validade e o reenvio dos links de senha, deixados para o plano
pelo clarify de 2026-10-05, estão resolvidos em research D11. O FR-056, marcado como pendente no
plano anterior, foi decidido em 2026-09-30 e ampliado em 2026-10-05.

**Risco aceito (2026-10-05)**: research D15 mostra que a verificação do FR-006b, embora use
mensagem neutra, deixa descobrir por comparação se um CPF ou e-mail é de associado. O plano limita
tentativas; o grupo aceitou o risco residual e as demais decisões técnicas do plano.

---

## Constitution Check

*GATE: avaliado antes da Fase 0 e reavaliado após a Fase 1. Constituição **3.0.0** (2026-10-05).*

| Princípio | Situação | Como o plano atende |
|---|---|---|
| I — Simplicidade | ✅ Passa | Sem framework, ORM nem build step. Três dependências npm e um arquivo vendorizado, cada um com justificativa escrita (D2, D3, D5, D9). Limite de tentativas e cron usam o banco e a plataforma que já existem (D12, D13), sem serviço novo. Janela de duplicata é constante, não configuração especulativa (D18). |
| II — Acessibilidade | ✅ Passa | Portão por tela em `quickstart.md`. Texto alternativo obrigatório validado no servidor para imagens de notícia e da página institucional (FR-032b, FR-001a). Erros de validação devolvem `campos[]` para a tela marcar cada campo. |
| III — Integridade | ✅ Passa, com duas observações | Nenhuma rota `DELETE`; toda mudança de status registra autor e data, inclusive as automáticas (autor `sistema`, FR-029c); `registro_auditoria` append-only; histórico de alterações (D16). **Observações**: (a) a anonimização remove o objeto do currículo no Blob e marca a linha — é o mecanismo do FR-055, que o CLAUDE.md já distingue de exclusão física; (b) o cron apaga janelas expiradas de `limite_tentativa`, contador técnico sem dado pessoal e sem valor de negócio (D13). |
| IV — Separação de contextos | ✅ Passa | Exatamente os dois acessos autenticados da versão 3.0.0: conta institucional (`/api/admin/*`) e doador associado (`/api/me/*`), mais a zona pública. Contexto verificado no servidor a cada requisição; id do doador sempre da sessão; currículo só por URL assinada após checar a sessão; nenhum dado pessoal na zona pública (consulta de status e página de autorização do menor desenhadas para isso — D17). |
| V — Responsividade | ✅ Passa | Portão por tela pública; protótipo já é mobile-first. |
| VI — Escopo fechado | ✅ Passa | Cobre os 11 CSUs. A página institucional editável está dentro do CSU03 (decisão de 2026-10-05). Nada de residentes, saúde, IA, redes sociais, BI ou módulo financeiro. Cron e Blob são recursos da própria plataforma de hospedagem, não integrações externas novas. |
| VII — Pix sem integração | ✅ Passa | QR estático montado no navegador a partir da chave cadastrada pela instituição; sem API de pagamento, cobrança dinâmica ou webhook; declaração nasce `pendente` e só um humano confirma; data/hora do clique pelo servidor. *Nota de redação*: o princípio ainda fala em "imagem de QR code fornecida pela instituição"; o QR gerado da chave cadastrada cumpre o mesmo propósito. Um ajuste de redação (PATCH) pode ser feito quando convier, sem bloquear nada. |
| VIII — Triagem humana | ✅ Passa | Submissões nascem no status inicial; toda transição de triagem é rota humana explícita; entrevista antes da aprovação; nenhuma aprovação automática ou em lote; nada publicado na aprovação da solicitação externa, só na confirmação. O único automatismo — encerrar evento vencido — não é triagem. |

**Resultado**: nenhum gate reprovado.

**Reavaliação pós-Fase 1**: o desenho de `data-model.md` e `contracts/api.md` não acrescentou
dependência nem camada além das listadas. Duas regras de negócio passaram para o banco por
segurança — exclusividade de papéis (índice parcial, D14) e Restrição 4 do DER (`CHECK` em
`consentimento`) —, o que reforça os Princípios III e IV sem acrescentar complexidade de código.
Nenhum princípio mudou de situação.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-portal-painel-ilpi/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — D1–D18
├── data-model.md        # Fase 1 — entidades, transições, retenção
├── quickstart.md        # Fase 1 — setup e cenários V1–V12
├── contracts/
│   └── api.md           # Fase 1 — rotas por zona de acesso
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 — /speckit-tasks (ainda não existe)
```

### Source Code (repository root)

```text
public/                              # protótipo, já no repositório desde 2026-09-04
├── index.html · institucional.html · campanhas.html · noticias.html
├── doacoes.html · voluntariado.html · vagas.html · solicitar-evento.html
├── consultar-status.html · login.html · autoatendimento.html
├── aviso-privacidade.html           # NOVO — FR-053
├── definir-senha.html               # NOVO — definição e redefinição (D11)
├── autorizacao-menor.html           # NOVO — página para imprimir (FR-012, D17)
├── admin/
│   ├── dashboard.html · itens.html · campanhas.html · noticias.html · doacoes.html
│   ├── usuarios.html · pix.html
│   ├── triagem-voluntarios.html · triagem-vagas.html · triagem-eventos.html
│   ├── institucional.html           # NOVO — FR-001a
│   ├── lgpd.html                    # NOVO — revogação, anonimização, fila de retenção (CSU11)
│   ├── configuracoes.html           # NOVO — prazos, contato, aviso de privacidade
│   ├── auditoria.html               # NOVO — FR-035
│   └── ajuda.html                   # NOVO — FR-060/060a (escrita depois das telas prontas)
└── assets/
    ├── css/style.css
    ├── js/
    │   ├── api.js                   # NOVO — substitui data.js
    │   ├── pix.js                   # já existe (BR Code)
    │   ├── consentimento.js         # NOVO — FR-051/052
    │   ├── mascaras.js              # NOVO — telefone e CPF (FR-037a)
    │   └── page-*.js · admin-*.js · auth.js · nav.js · utils.js
    ├── vendor/qrcode.js             # já existe (D9)
    └── img/

api/index.js                         # ÚNICA função (2026-10-06): despacha /api/... para rotas/
rotas/                               # antes api/ — mesma estrutura, sem virar função cada uma
├── _lib/                            # módulos compartilhados (o "_" impede virar rota)
│   ├── db.js · sessao.js · acesso.js · auditoria.js · historico.js
│   ├── protocolo.js · email.js · blob.js · limite.js · validacao.js
│   └── anonimizacao.js · papeis.js · datas.js
├── public/  ·  auth/  ·  me/  ·  admin/  ·  cron/
db/
├── migrations/                      # 001_*.sql …
├── migrate.js
└── seed.js                          # --demo só local
tests/
├── doacao-confirmacao.test.js       # FR-050
├── protocolo.test.js                # FR-043 / FR-044a
├── anonimizacao.test.js             # FR-055
└── acesso.test.js                   # FR-047
vercel.json                          # cron diário
package.json
```

**Structure Decision**: a Vercel serve `public/` como estático e `api/` como funções, com rotas por
arquivo (ex.: `api/admin/doacoes/[id]/confirmar.js`). Separar em `backend/` e `frontend/` exigiria
configuração extra sem ganho (Princípio I). `api/_lib/` é a única camada compartilhada.

Telas do protótipo que **mudam de comportamento** (pendências 2 e 6 do CLAUDE.md): `doacoes.html`
(sem protocolo, sem anexo, sem botão que simula confirmação), `admin/doacoes.html` (motivo
opcional, motivo padrão, possível duplicata), as três triagens (etapa de entrevista),
`autoatendimento.html` (só doador, só confirmadas), `admin/itens.html` (prioridade em vez de
"urgente"), `admin/campanhas.html` (evento × campanha, meta opcional, recursos),
`solicitar-evento.html` (nome da iniciativa, data ou período), `vagas.html` (CPF e data de
nascimento), `admin/noticias.html` (editar, despublicar, imagem).

---

## Ordem de implementação sugerida

`/speckit-tasks` detalha. A ordem segue as prioridades do spec e as dependências.

1. **Fundação** — `package.json`, migrações, `api/_lib/` (banco, sessão, acesso, auditoria,
   histórico, limite, e-mail), login do Painel, `api.js` no lugar de `data.js`, seed de produção
   sem credencial de demonstração. Os quatro testes automatizados nascem aqui, junto com a regra
   que protegem.
2. **US1 + US3 (P1/P2)** — Portal informativo e o que o alimenta: itens, eventos/campanhas, cron
   diário.
3. **US2 (P1)** — doação: chave Pix, verificação associativa, declaração, conferência, conta do
   doador e links de senha (D11, D15). Pode correr em paralelo com o item 2 depois da fundação.
4. **US4, US5, US6 (P2)** — submissões e triagens com entrevista, e-mails (FR-049/049a/049b),
   página de autorização do menor.
5. **US11 (P2) — LGPD** — o consentimento acompanha cada formulário dos itens 3 e 4 desde o
   início; aqui entram o aviso versionado, a revogação, a anonimização e a fila de retenção.
6. **US7, US8, US9, US10 (P3)** — gestão de usuários e auditoria, notícias e página
   institucional, autoatendimento, consulta por protocolo.
7. **Ajuda do Painel (FR-060/060a/061)** — por último, escrita contra as telas prontas (decisão de
   2026-09-23).

---

## Complexity Tracking

| Violação | Por que é necessária | Alternativa mais simples rejeitada porque |
|---|---|---|
| Duas dependências npm (`@neondatabase/serverless`, `@vercel/blob`) | Pool TCP não sobrevive a função serverless; a Vercel não tem disco persistente | `pg` esgota conexões do Neon gratuito; disco local não persiste (D2, D3) |
| Terceira dependência npm (`nodemailer`, 2026-09-23) | Sem domínio próprio, só o SMTP do Gmail autentica no DMARC | SMTP à mão sobre `node:tls` (STARTTLS, autenticação, MIME) custa mais do que a dependência economiza (D5) |
| Arquivo de terceiros no front (`qrcode-generator`, MIT, 2026-10-03) | O Portal gera o QR Pix com o valor escolhido (FR-007) | Codificar QR à mão arrisca QR que algum banco não lê (D9) |
| Tabela `limite_tentativa` com limpeza física pelo cron | FR-044a e segurança de login exigem contador que sobreviva entre chamadas | Contador em memória não existe em serverless; Redis seria serviço novo (D13) |

---

## Artefatos gerados

| Arquivo | Fase | Conteúdo |
|---|---|---|
| `research.md` | 0 | 18 decisões (D11–D18 novas; D3–D6, D8–D10 revistas), riscos |
| `data-model.md` | 1 | ~22 tabelas, transições, retenção, índices, tabelas removidas |
| `contracts/api.md` | 1 | ~65 rotas em cinco zonas; 4 contratos sob teste |
| `quickstart.md` | 1 | setup, 12 cenários de validação, portões |

**Próximo comando**: `/speckit-tasks`.
