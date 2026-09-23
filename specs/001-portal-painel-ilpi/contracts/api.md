# Contratos de API — Portal Público e Painel Administrativo

**Feature**: `001-portal-painel-ilpi` · **Data**: 2026-09-04 · **Fase**: 1

Funções serverless em `/api` na Vercel (Node.js 24 LTS). Todas as respostas são JSON UTF-8. Todo texto
voltado ao usuário final vai em português do Brasil, sem jargão (Princípio I).

---

## Convenções

**Três zonas de acesso**, e a zona é o que determina a verificação de autorização:

| Zona | Prefixo | Autenticação |
|---|---|---|
| Pública | `/api/public/*` | nenhuma |
| Autoatendimento | `/api/me/*` | cookie de sessão de `usuario` |
| Administrativa | `/api/admin/*` | cookie de sessão de `conta_institucional` |

**Autorização é sempre verificada no servidor** (Princípio IV). Esconder um botão na interface não
conta como controle de acesso. Toda requisição a `/api/admin/*` revalida o nível de permissão; a
negação registra a tentativa em `registro_auditoria` e responde `403` sem detalhar o motivo interno
(FR-047).

**Formato de erro** (uniforme):

```json
{ "erro": { "codigo": "PROTOCOLO_NAO_ENCONTRADO", "mensagem": "Não encontramos nenhum registro com esse código." } }
```

**Códigos HTTP**: `200` ok · `201` criado · `400` entrada inválida · `401` sem sessão ·
`403` sem permissão · `404` não encontrado · `409` conflito de estado · `422` regra de negócio
violada · `429` limite de tentativas · `503` recurso indisponível.

**Nunca** trafegam em resposta pública: CPF, endereço, telefone, e-mail de terceiros, URL de Blob
restrito, motivo interno de negação de acesso.

---

## Zona pública

### Conteúdo institucional (CSU03, US1)

| Método | Rota | Retorna |
|---|---|---|
| `GET` | `/api/public/institucional` | história, missão, equipe (FR-001) |
| `GET` | `/api/public/campanhas` | campanhas/eventos vigentes (FR-002) |
| `GET` | `/api/public/itens-necessarios` | itens ativos (FR-003) |
| `GET` | `/api/public/noticias` | notícias publicadas (FR-032) |
| `GET` | `/api/public/vagas` | vagas ativas (FR-016) |
| `GET` | `/api/public/aviso-privacidade` | texto e versão vigentes (FR-053) |

### Doação (CSU01)
`GET /api/public/pix` — dados para pagamento (FR-007).

```json
{ "disponivel": true, "chave": "12.345.678/0001-90", "tipoChave": "cnpj", "qrcodeUrl": "https://…" }
```

Sem chave ativa cadastrada, responde `200` com `{ "disponivel": false, "contato": "…" }`. O
front-end então **não** oferece o formulário de declaração e mostra o canal de contato (FR-007a).

`POST /api/public/doacoes` — declara uma doação já paga (FR-005, FR-006, FR-045).

```json
{ "tipo": "espontanea", "valor": 150.00, "dataInformada": "2026-09-03",
  "comprovanteArquivoId": null, "consentimento": null }
```

- `tipo: "associativa"` exige os dados do doador e `consentimento` (FR-051).
- `tipo: "espontanea"` dispensa consentimento — **exceto** se `comprovanteArquivoId` vier
  preenchido, porque o comprovante carrega dados do pagador (FR-051). Sem consentimento nesse caso:
  `422 CONSENTIMENTO_OBRIGATORIO`.
- Resposta `201`: `{ "protocolo": "DOA-7K2M9XQ4RT", "status": "pendente" }`.
- O status **sempre** nasce `pendente`. Nenhuma entrada desse endpoint pode produzir `confirmada`
  (Princípio VII).

### Submissões públicas com triagem (CSU05, CSU06, CSU08)

| Método | Rota | Regras |
|---|---|---|
| `POST` | `/api/public/voluntarios` | menor de idade exige `autorizacaoArquivoId` (FR-012); consentimento obrigatório |
| `POST` | `/api/public/candidaturas` | exige currículo em arquivo **ou** texto (FR-017); consentimento obrigatório |
| `POST` | `/api/public/solicitacoes-evento` | consentimento obrigatório |

Todas respondem `201` com `{ "protocolo": "…", "status": "pendente" }` (FR-013, FR-018, FR-021) e
disparam o e-mail de confirmação ao autor do FR-049. **A falha do e-mail não desfaz o registro nem
altera a resposta** (FR-049a).

**Notificação à equipe de triagem (FR-014)**: resolvida em 2026-09-23 — **não há envio de e-mail à
equipe**. A sinalização de nova submissão acontece apenas em `GET /api/admin/dashboard` (FR-036),
que lista os cadastros pendentes de triagem. Nenhum endpoint dispara e-mail para a conta
institucional. O e-mail do FR-049 continua indo só para o **autor** da submissão.

### Consulta de status (CSU10)

`GET /api/public/status/:protocolo` (FR-044)

```json
{ "tipo": "doacao", "status": "pendente", "atualizadoEm": "2026-09-04T12:00:00Z" }
```

Regras de segurança, todas obrigatórias:
- Retorna **apenas** tipo, status e data. Nenhum dado pessoal, nem do próprio solicitante.
- Protocolo inexistente e protocolo mal formado produzem resposta **idêntica** (`404`), para não
  revelar qual é o caso.
- Limitação de tentativas por IP (`429`), porque o protocolo é a única credencial (research D6).
- Cobre voluntário, candidatura, solicitação externa, doação e solicitação de titular (FR-059).

### Direitos do titular (CSU11)

`POST /api/public/solicitacoes-titular` — abre pedido de acesso, correção, anonimização ou revogação
(FR-054, FR-059). Responde `201` com protocolo `LGP-…`.

### Upload

`POST /api/public/uploads` — recebe currículo, autorização de menor ou comprovante bancário.
Responde `{ "arquivoId": "uuid" }`, que é então enviado no `POST` da submissão.
Valida tipo MIME e tamanho. **Nunca** devolve a URL do Blob (research D3).

---

## Zona de autoatendimento (CSU09)

Sessão de `usuario`. Cada rota devolve **somente** dados do próprio titular (FR-042) — o `id` vem da
sessão, nunca da URL ou do corpo.

| Método | Rota | Notas |
|---|---|---|
| `POST` | `/api/auth/login` | login individual (FR-041) |
| `POST` | `/api/auth/logout` | |
| `POST` | `/api/auth/recuperar-senha` | envia link por e-mail (FR-046) |
| `POST` | `/api/auth/redefinir-senha` | consome token de uso único e expiração curta |
| `GET` | `/api/me` | dados cadastrais próprios |
| `GET` | `/api/me/doacoes` | histórico próprio (doador associado) |
| `GET` | `/api/me/voluntariado` | status de voluntariado próprio |
| `POST` | `/api/me/solicitacoes-titular` | direitos do titular já autenticado (FR-054) |

`POST /api/auth/recuperar-senha` responde `200` mesmo para e-mail inexistente, para não revelar
quais e-mails estão cadastrados.

---

## Zona administrativa

Sessão de `conta_institucional`. Toda ação que altera estado grava em `registro_auditoria` com a
conta e a data (FR-035).

### Autenticação

`POST /api/admin/login` (FR-040) · `POST /api/admin/logout`

### Conferência de doações (CSU01)
| Método | Rota | Notas |
|---|---|---|
| `GET` | `/api/admin/doacoes?status=pendente` | fila de conferência |
| `GET` | `/api/admin/doacoes/:id` | inclui `possiveisDuplicatas[]` (FR-050) e link do comprovante |
| `POST` | `/api/admin/doacoes/:id/confirmar` | `409 DOACAO_JA_CONFIRMADA` se já estiver confirmada |
| `POST` | `/api/admin/doacoes/:id/nao-localizar` | exige `motivo`; `422` sem ele |
| `GET/PUT` | `/api/admin/pix` | cadastra/atualiza chave e QR code (FR-007) |

`confirmar` é idempotente por design: a segunda chamada não altera o registro nem emite nova
declaração de doação (FR-050).

### Triagens (CSU05, CSU06, CSU08)

Mesmo formato para as três filas — `voluntarios`, `candidaturas`, `solicitacoes-evento`:

| Método | Rota |
|---|---|
| `GET` | `/api/admin/{fila}?status=pendente` |
| `POST` | `/api/admin/{fila}/:id/aprovar` |
| `POST` | `/api/admin/{fila}/:id/rejeitar` |

- `rejeitar` exige `motivo` nas **três** filas; sem ele, `422 MOTIVO_OBRIGATORIO`.
- Não existe rota de aprovação automática ou em lote por critério calculado (Princípio VIII,
  FR-034).
- `candidaturas/:id/aprovar`: se o CPF já existir em `usuario`, adiciona o perfil `funcionario` ao
  cadastro existente em vez de criar outro (FR-048).

### Gestão de conteúdo (CSU02, CSU03, CSU07)

`GET/POST/PUT` em `/api/admin/itens`, `/api/admin/campanhas`, `/api/admin/noticias`.
`POST /api/admin/itens/:id/baixar` dá baixa em item suprido (FR-027).
Cadastro de campanha em data conflitante responde `200` com aviso de conflito — sinaliza, não
bloqueia (FR-030). Publicação de notícia nunca falha por erro de sincronização com rede social
(FR-033).

**Não existe `DELETE` em nenhuma dessas rotas** (Princípio III, FR-024).

### Gestão de usuários (CSU04)

| Método | Rota | Notas |
|---|---|---|
| `GET` | `/api/admin/usuarios?busca=` | busca por CPF ou e-mail (FR-023) |
| `POST`/`PUT` | `/api/admin/usuarios[/:id]` | |
| `POST` | `/api/admin/usuarios/:id/inativar` | única forma de remoção de acesso |
| `GET` | `/api/admin/auditoria` | histórico (FR-035) |
| `GET` | `/api/admin/dashboard` | indicadores e pendências (FR-036) |

### Ajuda do Painel (FR-060, FR-060a, FR-061)

**Nenhum endpoint.** A área de ajuda é uma página estática (`public/admin/ajuda.html`) e a ajuda
contextual do FR-061 é texto nas próprias telas. Não há dado a ler nem a gravar, então não existe
rota de API — registrar isso aqui evita que alguém invente um `/api/admin/ajuda` desnecessário.

### Direitos do titular (CSU11)

| Método | Rota | Notas |
|---|---|---|
| `GET` | `/api/admin/solicitacoes-titular?status=em_analise` | |
| `POST` | `/api/admin/solicitacoes-titular/:id/atender` | executa a ação pedida |
| `POST` | `/api/admin/solicitacoes-titular/:id/recusar` | exige `motivo` |
| `POST` | `/api/admin/usuarios/:id/anonimizar` | FR-055 |
| `GET` | `/api/admin/retencao/pendentes` | registros no fim do prazo (FR-056) |

`anonimizar` (FR-055) torna ilegíveis os campos pessoais, preenche `anonimizado_em`, remove os
objetos restritos no Blob e **preserva** a linha, o histórico e a auditoria. Aceita
`dadosRetidosJustificativa` quando obrigação legal exigir manter parte dos dados.

`/api/admin/retencao/pendentes` apenas **lista**. Enquanto os prazos do FR-056 não forem definidos
pela instituição, nenhuma anonimização automática por decurso de prazo é executada (research D10).

---

## Contratos que os testes automatizados devem cobrir

Estes quatro são os testes da estratégia escolhida (research D8):

1. `POST /api/admin/doacoes/:id/confirmar` duas vezes → segunda responde `409`, não altera o
   registro e não emite nova declaração (FR-050).
2. Protocolos gerados em série → todos únicos, sem ordem previsível, no alfabeto definido (FR-045).
3. `POST /api/admin/usuarios/:id/anonimizar` → campos pessoais ilegíveis, linha preservada,
   auditoria intacta, contagem de registros de histórico inalterada (FR-055).
4. Requisição a `/api/admin/*` com sessão de autoatendimento (ou sem sessão) → `403`, registro em
   `registro_auditoria`, e nenhum dado no corpo da resposta (FR-047).
