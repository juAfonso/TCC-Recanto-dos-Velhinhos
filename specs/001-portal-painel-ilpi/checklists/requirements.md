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
- [x] Requirements are testable and unambiguous
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
  - **BLOQUEIO ATIVO:** a emenda ao Princípio VII está registrada como **proposta, pendente de ciência
    da orientação**, porque foi o próprio orientador quem havia descartado a rota de Pix estático. O
    CSU01 **não deve ser implementado** até essa validação. As demais histórias não estão bloqueadas.
  - **Ainda desatualizados:** o PRD, a seção 19 do documento do TCC e o protótipo `recanto-frontend`
    (telas `doacoes.html` e `admin/doacoes.html`) continuam descrevendo o fluxo com API de pagamentos.
