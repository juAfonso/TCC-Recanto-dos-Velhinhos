# Specification Quality Checklist: Portal Público e Painel Administrativo do Recanto dos Velhinhos

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-12
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Todos os itens foram validados. As 3 perguntas de esclarecimento foram respondidas pelo usuário
  em 2026-08-13 e incorporadas ao spec.md (acesso administrativo compartilhado para funcionários;
  autoatendimento com login próprio para voluntários e doadores associados; consulta pública de
  status por código de protocolo). Especificação pronta para `/speckit-plan`.
- **2026-09-04** — Nova sessão de `/speckit-clarify`: 5 perguntas respondidas e incorporadas
  (idempotência de confirmação de pagamento; falha da API de pagamentos ao gerar QR code; falha no
  envio do e-mail de confirmação; janela de 15 minutos para doação pendente; inclusão da LGPD no
  escopo). Todos os itens do checklist permanecem válidos após a revalidação.
- **Pendências de configuração (não bloqueiam o `/speckit-plan`, mas precisam de valor concreto antes
  da implementação):** o "período prolongado" sem atualização de item necessário (FR-028) e os prazos
  de retenção por categoria de dado (FR-056) ainda não têm valores definidos — ambos dependem de
  definição da instituição e devem ser fixados como configuração na fase de planejamento.
- **Impacto de escopo da decisão sobre LGPD:** a inclusão da LGPD adicionou a User Story 11, os
  requisitos FR-051 a FR-059, duas entidades (Registro de Consentimento, Solicitação de Titular de
  Dados) e os critérios SC-014 a SC-016, além de reescrever FR-024. Conforme a regra do `CLAUDE.md`
  ("não implementar nada fora dos 10 CSUs sem antes atualizar o PRD e este arquivo"), o PRD e o
  `CLAUDE.md` precisam ser atualizados com essa decisão antes da implementação.
- **2026-09-04 — Reversão do CSU01 para Pix estático (mudança de maior impacto até aqui).** Durante o
  `/speckit-plan`, o responsável pelo projeto decidiu abandonar a API de pagamentos dinâmica em favor
  de chave Pix/QR code estáticos, com declaração da doação pelo doador e conferência manual da equipe
  contra o extrato bancário. Motivação: eliminar a dependência de contratar provedor de pagamentos e
  de ter conta PJ habilitada.
  - **Artefatos alterados:** `spec.md` (Clarifications ganhou a sessão "2026-09-04 (2)" e três
    respostas anteriores foram marcadas como SUPERADAS; User Story 2 reescrita, de 6 para 9 cenários;
    FR-007, FR-007a, FR-008, FR-010, FR-036, FR-045, FR-050 e FR-051 reescritos; FR-010a e FR-010b
    adicionados; entidade Doação redesenhada e entidade Chave Pix Institucional adicionada; SC-001
    reescrito e SC-001a adicionado; SC-009 ajustado; Edge Cases e Assumptions atualizados) e
    `.specify/memory/constitution.md` (Princípio VII emendado, versão 1.0.0 → 2.0.0).
  - **Bloqueio levantado em 2026-09-05.** A emenda ao Princípio VII esteve um dia como proposta
    pendente, porque a rota de Pix estático constava como descartada pelo orientador. Esclareceu-se
    que a objeção dele era à justificativa de *custo zero* — que ele derrubou mostrando que
    hospedagem e domínio têm custo assumido pela instituição de qualquer forma — e não à mudança de
    rota em si. A justificativa desta decisão é outra (eliminar a dependência de conta PJ em gateway
    e o risco de cronograma que ela traz), então não é alcançada por aquela objeção. Emenda
    ratificada, nenhuma história bloqueada.
  - **Ainda desatualizados:** o protótipo `recanto-frontend`, já importado para `public/`, tem as
    telas `doacoes.html` e `admin/doacoes.html` descrevendo o fluxo com API de pagamentos, e seu
    `README.md` ainda cita a stack abandonada (C#/MySQL). O PRD e a seção 19 do documento do TCC
    recebem os casos de uso revisados via `docs/casos-de-uso-tcc.md`.
- **2026-09-23 — Três decisões de equipe fechadas.** Eram as pendências que não dependiam da
  instituição e estavam apenas aguardando o grupo decidir: (a) FR-014, a equipe de triagem é
  sinalizada apenas pelo painel, sem envio de e-mail; (b) FR-028, o período prolongado sem
  atualização de item necessário é de 30 dias, armazenado como configuração editável; (c) FR-030,
  conflito de data em campanha/evento é aviso e não bloqueio — confirmação do que já constava.
  FR-014, FR-028 e FR-030 foram reescritos no `spec.md` para deixar as decisões explícitas no texto
  do requisito, e não apenas no log.
  - **Única pendência de configuração restante:** os prazos de retenção por categoria de dado
    (FR-056), que dependem de definição jurídica da instituição.
- **2026-09-23 — Ampliação de escopo: área de ajuda dentro do Painel.** O grupo decidiu que o guia
  de uso da equipe do Recanto será uma tela do sistema (`admin/ajuda.html`), e não um documento
  entregue à parte, porque documento se perde e não alcança quem entrar na instituição depois.
  Adicionados FR-060, FR-060a (seção "o que o sistema não faz") e FR-061 (ajuda contextual nas telas
  de conferência de doação, rejeição com motivo e anonimização).
  - **Registrado como requisitos, não como CSU12:** tela de ajuda não é caso de uso de negócio, e um
    décimo segundo CSU obrigaria a renumerar "11 casos de uso" em todo o documento sem ganho de
    clareza. **Continuam sendo 11 CSUs.**
  - **Pendência aberta por esta decisão:** o PRD precisa registrar a ampliação, conforme a regra do
    `CLAUDE.md`. O `spec.md`, o `plan.md` e os contratos já estão atualizados.
  - Sem impacto em contratos de API: a página é estática e a ajuda contextual é texto de tela.
- **2026-10-05 — Revalidação depois das sessões de 03, 04 e 05/10.** As notas acima de 2026-08-13 e
  2026-09-04 citam decisões revertidas depois (autoatendimento de voluntário, janela de 15 minutos,
  entidade Solicitação de Titular de Dados, FR-059). Valem como histórico, não como estado atual.
  A pendência dos prazos de retenção foi fechada em 2026-09-30 (6 meses, FR-056).
  - **Revisão de consistência (Session 2026-10-05 (2) do spec):** texto corrigido onde ainda refletia
    decisões revertidas (SC-006, SC-007, FR-038, FR-058, títulos de seção, status "confirmada" da
    solicitação externa); campos do doador associado, da candidatura e do contato da solicitação
    trazidos dos casos de uso e do protótipo; prioridade alta/média/baixa no Item Necessário (decisão nova do grupo); entidades
    Recurso, Registro de Auditoria, Falha de Envio de E-mail e Configuração adicionadas.
  - **Itens do checklist que voltam a ficar em aberto até o `/speckit-clarify`:** "Requirements are
    testable and unambiguous" e "Edge cases are identified". Ainda faltam decisões do grupo sobre:
    associativa com CPF/e-mail já cadastrado sem login; validade e reenvio dos links de senha;
    efeito concreto da revogação de consentimento (FR-057); retenção de solicitação externa
    rejeitada, de currículo de aprovado e de doador inativo (FR-056); quais dados de doação a
    anonimização retém por obrigação legal (FR-055); encerramento de evento/campanha vencido;
    e quem edita a página institucional (FR-001).
  - **`/speckit-clarify` de 2026-10-05 (Session 2026-10-05 (3) do spec):** cinco dessas decisões
    foram tomadas (FR-006b, FR-057, FR-056, FR-055, FR-029c) e aplicadas também em
    `docs/casos-de-uso-tcc.md` (CSU01, CSU02, CSU05, CSU06, CSU08 e CSU11). "Edge cases are
    identified" voltou a passar. Continuam abertas: validade e reenvio dos links de senha
    (detalhe técnico, fica para o `/speckit-plan`) e quem edita a página institucional (FR-001),
    que mantém "Requirements are testable and unambiguous" desmarcado.
