# Contratos de API — Portal Público e Painel Administrativo

**Feature**: `001-portal-painel-ilpi` · **Data**: 2026-10-05, ajustado em 2026-10-06 após o `/speckit-analyze` (refeito; versão anterior de 2026-09-04)
· **Fase**: 1

Funções serverless em `api/` na Vercel (Node.js 24 LTS, formato Web — research D1). Respostas em
JSON UTF-8. Texto para o usuário final em português do Brasil, sem jargão (Princípio I). Entidades
em [data-model.md](../data-model.md); decisões D1–D18 em [research.md](../research.md).

---

## Convenções

### Zonas de acesso (Princípio IV, constituição 3.0.0)

| Zona | Prefixo | Autenticação |
|---|---|---|
| Pública | `/api/public/*` | nenhuma |
| Autenticação | `/api/auth/*`, `/api/admin/login` | nenhuma (cria sessão) |
| Autoatendimento | `/api/me/*` | cookie `ctx = doador` — pessoa ativa, papel de doador ativo, senha definida (D4) |
| Administrativa | `/api/admin/*` | cookie `ctx = admin` — conta institucional ativa |
| Agendada | `/api/cron/*` | `Authorization: Bearer $CRON_SECRET` |

A autorização é verificada **no servidor** a cada requisição. Fora da zona certa: `403`, corpo sem
dados, tentativa registrada em `registro_auditoria` (FR-047). No autoatendimento, o id da pessoa
vem **sempre da sessão**, nunca da URL nem do corpo (FR-042).

### Formato de erro

```json
{ "erro": { "codigo": "VALOR_ABAIXO_DO_MINIMO", "mensagem": "O valor mínimo é R$ 1,00.", "campos": ["valor"] } }
```

`campos` aparece em erros de validação, para a tela marcar cada campo (Princípio II).

**Códigos HTTP**: `200` · `201` · `400` entrada inválida · `401` sem sessão · `403` sem permissão ·
`404` · `409` conflito de estado ou aviso que pede confirmação · `413` arquivo grande demais ·
`422` regra de negócio · `429` limite de tentativas · `503` indisponível.

### Avisos que pedem confirmação (FR-030, FR-023a)

Quando a regra é **aviso, nunca bloqueio**, a primeira chamada responde `409` com o aviso; a tela
mostra e, se o funcionário decidir seguir, repete a chamada com `"confirmarAviso": true`.

### Envio com arquivo

Rotas marcadas com 📎 recebem `multipart/form-data` (D3): os campos do formulário mais o arquivo.
Currículo até 4 MB; imagem até 2 MB. Acima disso: `413 ARQUIVO_GRANDE_DEMAIS`.

### Cache

Toda resposta de `GET /api/public/*` leva `Cache-Control: no-store`, para que uma mudança feita no
Painel apareça no Portal na hora seguinte em que a página for aberta (SC-002). Respostas do Painel e
do autoatendimento também levam `no-store`, por carregarem dado pessoal.

### O que nunca trafega na zona pública

CPF, RG, endereço, telefone, e-mail, nome de pessoa física, URL de currículo, motivo interno de
negação de acesso.

---

## Zona pública

### Conteúdo (US1, CSU02, CSU03, CSU07)

| Método | Rota | Retorna |
|---|---|---|
| `GET` | `/api/public/institucional` | história, missão, equipe e imagens com texto alternativo (FR-001) |
| `GET` | `/api/public/eventos-campanhas` | eventos com `data >= hoje` e campanhas com hoje no período, `status = ativo` (FR-002, D12); campanha sem meta vem sem `meta` nem `arrecadado` (FR-029b) |
| `GET` | `/api/public/itens-necessarios` | itens ativos, ordenados alta → média → baixa (FR-003, FR-026) |
| `GET` | `/api/public/noticias` | só `publicada` (FR-032a) |
| `GET` | `/api/public/aviso-privacidade` | texto e versão vigentes (FR-053) |

### Doação (CSU01)

**`GET /api/public/pix`** (FR-007, FR-007a)

```json
{ "disponivel": true, "chave": "…", "tipoChave": "cnpj", "nomeRecebedor": "…", "cidade": "Pinheiral" }
```

Sem chave ativa: `{ "disponivel": false, "contato": "…" }`. O front não mostra QR nem botão.

**`POST /api/public/doacoes/verificar-associativa`** (FR-006b, D15) — antes de gerar o QR.

```json
{ "cpf": "…", "email": "…" }
```

- `200 { "podeSeguir": true }` — CPF e e-mail livres, ou pessoa existente sem papel de doador.
- `200 { "podeSeguir": false, "mensagem": "Se você já é associado, entre no autoatendimento para doar. Se não, faça a doação espontânea." }`
  — CPF **ou** e-mail de doador associado. A resposta não diz qual dos dois bateu.
- Limite D13: `429`.

**`POST /api/public/doacoes`** — o clique em "Já fiz o Pix" (FR-005, FR-006, FR-006a, FR-008).

```json
{ "tipo": "associativa", "valor": 50.00,
  "doador": { "nome": "…", "cpf": "…", "email": "…", "telefone": "…" },
  "consentimento": { "avisoVersao": "2026-10-v1", "aceito": true } }
```

- `espontanea`: só `tipo` e `valor`. Sem consentimento (FR-051).
- `associativa` **com sessão de doador**: só `tipo` e `valor`; o vínculo vem da sessão.
- `associativa` **sem sessão**: exige `doador` e `consentimento`; repete a verificação do FR-006b
  (se barrar, `422 ASSOCIADO_DEVE_ENTRAR` com a mesma mensagem neutra). Cria `pessoa` e papel de
  doador, ou adiciona o papel a pessoa existente (D15); grava consentimento; envia link de
  definição de senha (D11) ao e-mail **do cadastro**.
- `valor < 1.00`, ausente ou não numérico: `400 VALOR_INVALIDO` / `VALOR_ABAIXO_DO_MINIMO`.
- Resposta `201`: `{ "status": "pendente", "mensagem": "Obrigado! A equipe confere sua doação no extrato do banco." }`.
  **Sem protocolo.** Nada nesta rota produz `confirmada` (Princípio VII).
- `declarada_em` é a hora do servidor (D9); o corpo não aceita data.

### Submissões com triagem (CSU05, CSU06, CSU08)

| Método | Rota | Regras específicas |
|---|---|---|
| `POST` | `/api/public/voluntarios` | campos do FR-011; menor → `autorizacaoStatus: "pendente"` na resposta (FR-012) |
| `POST` 📎 | `/api/public/candidaturas` | `cargo` fixo; CPF e data de nascimento (FR-016a); currículo em arquivo **ou** texto (FR-017) |
| `POST` | `/api/public/solicitacoes` | `tipo` evento/campanha; data **ou** período conforme o tipo; telefone brasileiro (FR-020, FR-037a) |

Comuns às três:
- Consentimento obrigatório: sem aceite, `422 CONSENTIMENTO_OBRIGATORIO` (FR-051).
- Resposta `201`: `{ "protocolo": "VOL-…", "status": "pendente", "emailEnviado": true }`. A tela
  destaca **"anote este código"**; `emailEnviado: false` não muda nada além de um aviso discreto.
- O registro é gravado antes do e-mail; falha de envio segue a política D5 e **nunca** desfaz o
  registro (FR-049a).
- A página de autorização do menor é montada no navegador com os dados do próprio formulário (D17).

### Consulta de status (CSU10)

**`GET /api/public/status/:protocolo`** (FR-044, FR-044a)

```json
{ "tipo": "voluntario", "status": "entrevista", "rotuloStatus": "Chamado para entrevista", "data": "2026-10-05" }
```

- Só tipo, status e data. Nenhum dado pessoal.
- Inexistente e mal formado: **mesma** resposta `404 NAO_ENCONTRADO`, mesmo tempo de resposta
  aproximado.
- `429` após 10 consultas por IP em 15 min (D13).
- Cobre voluntário, candidatura e solicitação externa. **Doação não tem protocolo.**

---

## Autenticação

### Painel

`POST /api/admin/login` `{ identificador, senha }` → cookie `ctx = admin` · `POST /api/admin/logout` ·
`GET /api/admin/sessao` → `{ identificador }` ou `401` (usado pelas telas do Painel para conferir o login).
Cinco falhas em 15 min por IP e conta → `429` (D13).

### Doador associado (CSU09)

| Método | Rota | Notas |
|---|---|---|
| `POST` | `/api/auth/login` | `{ email, senha }`; nega se senha não definida, pessoa inativa ou papel de doador não ativo, **com a mesma mensagem** de senha errada |
| `POST` | `/api/auth/logout` | |
| `POST` | `/api/auth/link-senha` | `{ email }` — envia link de **definição** (sem senha ainda) ou **redefinição**; resposta sempre `200` idêntica (FR-046, D11) |
| `POST` | `/api/auth/definir-senha` | `{ token, senha }` — consome token válido; encerra sessões abertas; `400 LINK_INVALIDO_OU_EXPIRADO` com orientação para pedir outro |

---

## Zona de autoatendimento (CSU09)

| Método | Rota | Retorna |
|---|---|---|
| `GET` | `/api/me` | dados cadastrais próprios |
| `GET` | `/api/me/doacoes` | **só doações `confirmada`** — valor e data (FR-041); pendentes e não localizadas nunca aparecem |

Doar logado usa `POST /api/public/doacoes` com o cookie (vínculo pela sessão).

---

## Zona administrativa

Toda ação que muda estado grava em `registro_auditoria` com a conta e a data (FR-035). Nenhuma rota
`DELETE` sobre dado de negócio (Princípio III).

### Visão consolidada e operação

| Método | Rota | Notas |
|---|---|---|
| `GET` | `/api/admin/dashboard` | contagens: itens de prioridade alta, itens sem atualização (FR-028), submissões pendentes nas três filas, doações pendentes, falhas de e-mail não tratadas, registros na fila de retenção (FR-036, SC-007) |
| `GET` | `/api/admin/auditoria` | mais recentes primeiro, paginado (FR-035) |
| `GET` | `/api/admin/falhas-email` · `POST …/:id/reenviar` · `POST …/:id/tratada` | FR-049a |
| `GET`/`PUT` | `/api/admin/configuracao` | prazos e contato (D10) |
| `GET`/`POST` | `/api/admin/aviso-privacidade` | `POST` publica **nova versão**; versões antigas não se editam |

### Conferência de doações (CSU01)

| Método | Rota | Notas |
|---|---|---|
| `GET` | `/api/admin/doacoes?status=pendente` | valor, data/hora do clique, nome do doador se associativa, `possivelDuplicata` (FR-008, D18) |
| `POST` | `/api/admin/doacoes/:id/confirmar` | `409 DOACAO_JA_CONFERIDA` se não estiver `pendente`; nada muda (FR-050) |
| `POST` | `/api/admin/doacoes/:id/nao-localizar` | `{ motivo?: string, motivoPadrao?: true }` — motivo **opcional**; `motivoPadrao` grava o texto do FR-008a |
| `GET`/`PUT` | `/api/admin/pix` | chave, tipo, nome do recebedor, cidade (FR-007) |

**Não existe rota que edite uma declaração de doação** (FR-037, exceção de 2026-10-06): o que foi
conferido contra o extrato é registro de conferência. Declaração errada é marcada como não
localizada.

### Triagens (CSU05, CSU06, CSU08)

Filas: `voluntarios`, `candidaturas`, `solicitacoes`.

| Método | Rota | Vale para | De → para |
|---|---|---|---|
| `GET` | `/api/admin/{fila}?status=` | todas | — |
| `GET` | `/api/admin/{fila}/:id` | todas | todos os campos coletados (FR-037a) |
| `POST` | `/api/admin/voluntarios/:id/entrevista` · `/candidaturas/:id/entrevista` | voluntário, candidatura | pendente/em análise → entrevista |
| `POST` | `/api/admin/voluntarios/:id/aprovar` · `/candidaturas/:id/aprovar` | voluntário, candidatura | entrevista → aprovado |
| `POST` | `/api/admin/solicitacoes/:id/aprovar` | solicitação | em análise → aguardando contato (nada publicado) |
| `POST` | `/api/admin/solicitacoes/:id/confirmar` | solicitação | aguardando contato → confirmada; corpo com os dados combinados e, na campanha, os recursos; cria e publica evento/campanha |
| `POST` | `/api/admin/{fila}/:id/rejeitar` | todas | `{ motivo?: string }` — **opcional** |
| `POST` | `/api/admin/voluntarios/:id/autorizacao-recebida` | voluntário menor | pendente → recebida (FR-012) |
| `GET` | `/api/admin/voluntarios/:id/autorizacao` | voluntário menor | dados para reimprimir a página (D17) |
| `GET` | `/api/admin/candidaturas/:id/curriculo` | candidatura | redireciona para URL assinada de vida curta (D3) |
| `PUT` | `/api/admin/{fila}/:id` | todas | **corrige dados** sem mudar status (FR-037, 2026-10-06); estado anterior em `historico_alteracao`; mesmas validações do envio; registro anonimizado → `409 REGISTRO_ANONIMIZADO`; no voluntário aprovado e na candidatura aprovada, nome, e-mail e telefone corrigidos também na `pessoa` |

Regras:
- Transição fora da ordem acima: `409 TRANSICAO_INVALIDA`. Exceção: voluntário de `origem = painel` vai de `pendente` direto a `aprovado`, sem entrevista, assim que a autorização for recebida (FR-023).
- Aprovar menor com autorização pendente: `422 AUTORIZACAO_PENDENTE`.
- Aprovar voluntário que é funcionário ativo: `422 FUNCIONARIO_NAO_PODE_SER_VOLUNTARIO` (FR-048).
- `candidaturas/:id/aprovar`: transação única — encontra ou cria a pessoa pelo CPF, encerra papel
  de voluntário ativo, cria papel de funcionário (FR-048, D14).
- Aprovar solicitação de evento ou confirmar evento em data ocupada: `409 CONFLITO_DE_DATA` com os
  eventos em conflito; seguir com `confirmarAviso: true` (FR-030).
- Toda decisão dispara e-mail ao autor (FR-049b), com motivo se houver; falha não reverte a decisão.
- Não existe aprovação automática nem em lote (FR-034, Princípio VIII).

### Conteúdo (CSU02, CSU03, CSU07)

| Método | Rota | Notas |
|---|---|---|
| `GET`/`POST` | `/api/admin/itens` | `?busca=` por nome; `POST` com nome, quantidade ≥ 0, unidade, prioridade (FR-026) |
| `PUT` | `/api/admin/itens/:id` | atualizar quantidade renova `quantidade_atualizada_em` |
| `POST` | `/api/admin/itens/:id/baixa` | `ativo → suprido` (FR-027) |
| `GET`/`POST` | `/api/admin/eventos-campanhas` | `POST` com `tipo`; evento: nome, data, descrição, recursos em texto; campanha: nome, período, descrição, `recursos[]` (≥ 1), `meta?`; data passada: `400`; conflito de evento: `409` + `confirmarAviso` |
| `PUT` | `/api/admin/eventos-campanhas/:id` | mesmas validações |
| `PUT` | `/api/admin/campanhas/:id/arrecadado` | só com meta (FR-029b) |
| `POST` | `/api/admin/eventos-campanhas/:id/encerrar` | a qualquer momento; já encerrado: `200` sem alteração (FR-029a) |
| `GET`/`POST` 📎 | `/api/admin/noticias` | imagem exige `imagemAlt` (FR-032b) |
| `PUT` 📎 | `/api/admin/noticias/:id` | |
| `POST` | `/api/admin/noticias/:id/despublicar` · `/publicar` | FR-032a |
| `GET`/`PUT` 📎 | `/api/admin/institucional` | textos e imagens, texto alternativo obrigatório, versão anterior no histórico (FR-001a) |

### Usuários (CSU04)

| Método | Rota | Notas |
|---|---|---|
| `GET` | `/api/admin/pessoas?busca=&situacao=` | nome, CPF ou e-mail (FR-023); `situacao` = `todos` (padrão) \| `ativos` \| `inativos` — inativos sempre consultáveis (constituição, Princípio III); cada resultado traz `ativo` |
| `GET` | `/api/admin/pessoas/:id` | todos os dados, papéis, submissões, consentimentos, histórico |
| `POST` | `/api/admin/pessoas` | cadastro direto, sem triagem; CPF existente: `409 CPF_JA_CADASTRADO` com o id para abrir o registro (FR-023). **Funcionário**: nome, CPF, data de nascimento, e-mail, telefone. **Voluntário** (2026-10-06): os mesmos campos do FR-011; cria `cadastro_voluntario` com `origem = painel` — maior de idade já `aprovado`, com pessoa e papel; menor `pendente` com autorização pendente, aprovado por `POST /api/admin/voluntarios/:id/aprovar` depois de `autorizacao-recebida`, sem exigir entrevista |
| `PUT` | `/api/admin/pessoas/:id` | correção, com histórico (FR-037) |
| `POST` | `/api/admin/pessoas/:id/papeis` | adiciona papel; respeita exclusividade (FR-048) |
| `POST` | `/api/admin/pessoas/:id/inativar` · `/reativar` | submissão em triagem: `409` + `confirmarAviso` (FR-023a) |

Não existe rota de exclusão (FR-024).

### LGPD (CSU11)

| Método | Rota | Notas |
|---|---|---|
| `POST` | `/api/admin/consentimentos/:id/revogar` | aplica o efeito do FR-057 conforme o dono do consentimento: submissão em triagem → `encerrado_titular`; voluntário ativo → papel inativo; doador → papel encerrado. Não anonimiza. |
| `POST` | `/api/admin/anonimizacoes` | `{ alvo: "pessoa" \| "cadastro_voluntario" \| "candidatura" \| "curriculo" \| "solicitacao", id, justificativaRetencao? }` (FR-055, FR-056) |
| `GET` | `/api/admin/retencao` | fila de registros vencidos, conforme a tabela de retenção do `data-model.md` |

`anonimizacoes`, em transação única: campos pessoais viram `[anonimizado]`; currículo removido do
Blob; `historico_alteracao`, `falha_email` e consentimentos ligados também anonimizados (D16);
doações da pessoa ficam com valor, data, tipo e status, sem justificativa (FR-055); a linha, o
histórico e a auditoria permanecem. `justificativaRetencao` só é exigida quando o funcionário marca
campos retidos por obrigação legal **fora** das doações.

### Ajuda (FR-060, FR-060a, FR-061)

**Nenhum endpoint.** `public/admin/ajuda.html` é estática e a ajuda contextual é texto das telas.

---

## Zona agendada

**`GET /api/cron/diario`** — `vercel.json`: `"schedule": "0 4 * * *"` (01:00 em Brasília, ±59 min).

1. Encerra eventos com `data < hoje` e campanhas com `periodo_fim < hoje` ainda `ativo`, autor
   `sistema`, ação `evento.encerrar_auto` / `campanha.encerrar_auto` (FR-029c).
2. Remove janelas expiradas de `limite_tentativa` (D13).

Idempotente. Sem `CRON_SECRET` correto: `401`.

---

## Contratos cobertos pelos testes automatizados (research D8)

1. **FR-050** — `POST /api/admin/doacoes/:id/confirmar` duas vezes: a segunda responde `409` e o
   registro não muda.
2. **FR-043 / FR-044a** — protocolos gerados em série são únicos, no alfabeto e formato definidos,
   sem ordem previsível; `GET /api/public/status/` com código inexistente e com código mal formado
   produz respostas idênticas.
3. **FR-055** — `POST /api/admin/anonimizacoes` sobre doador com doações confirmadas: nenhum campo
   pessoal legível em `pessoa`, `historico_alteracao`, `falha_email` e `consentimento`; doações com
   valor, data, tipo e status intactos; contagem de linhas e de auditoria inalterada.
4. **FR-047** — chamada a `/api/admin/*` sem sessão e com sessão de doador: `403`, corpo sem dados,
   linha `acesso.negado` em `registro_auditoria`.
