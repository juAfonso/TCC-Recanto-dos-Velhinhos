# Data Model — Portal Público e Painel Administrativo

**Feature**: `001-portal-painel-ilpi` · **Data**: 2026-10-05, ajustado em 2026-10-06 após o `/speckit-analyze` (refeito; versão anterior de 2026-09-04)
· **Fase**: 1 (Design & Contracts) · **Banco**: Neon (PostgreSQL)

Fonte: Key Entities do [spec.md](./spec.md) e o DER conceitual
(`docs/der-conceitual-recanto.drawio`). Decisões técnicas citadas como D1–D18 estão em
[research.md](./research.md).

---

## Regras que valem para o modelo inteiro

1. **Nada de negócio é excluído fisicamente** (Princípio III, FR-024). Não existe `DELETE` sobre
   tabela de negócio na API nem nos scripts. Remoção é mudança de status. Única exceção: a limpeza
   de `limite_tentativa`, que é contador técnico sem dado pessoal (D13).
2. **Toda tabela de negócio tem status e autor/data na própria linha** (constituição, "Persistência"):
   `criado_por`/`criado_em` desde a primeira versão, e `*_por`/`*_em` em cada mudança de status — além
   da linha em `registro_auditoria`. Autor é a conta institucional, o doador associado, `publico`
   (submissão do Portal) ou `sistema`; nunca o funcionário individual (FR-035). Tabelas de linhas
   filhas (`recurso`, `conteudo_institucional_imagem`) têm `ativo` em vez de serem apagadas: **tirar
   um recurso de uma campanha ou uma imagem da página é desativar, nunca `DELETE`**. Únicas tabelas
   sem status: `registro_auditoria` e `historico_alteracao` (são o próprio registro de autoria) e
   `limite_tentativa` (contador técnico, D13).
3. **Anonimização não apaga a linha** (FR-055, FR-056). Campos pessoais viram o texto fixo
   `[anonimizado]` (ou `NULL` onde o campo é opcional), `anonimizado_em` é preenchido, e o mesmo
   vale para `historico_alteracao`, `falha_email` e `consentimento` ligados (D16).
4. **Valores editáveis ficam em `configuracao`**, nunca como constante (FR-028, FR-056).
5. **Datas de negócio** (evento, período de campanha, prazos) são avaliadas no fuso
   `America/Sao_Paulo`. Carimbos de tempo são `timestamptz`.
6. **Identificadores** são `uuid` (`gen_random_uuid()`), exceto `registro_auditoria` (`bigserial`).

---

## Pessoas, papéis e acesso

### `pessoa`

Pessoa cadastrada — entidade Pessoa do DER. **Não** significa "tem acesso": só o doador associado
tem login (FR-025). Uma pessoa = uma linha, identificada pelo CPF (FR-048).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `cpf` | `text` UNIQUE | só dígitos, validado; anonimizável |
| `nome`, `email`, `telefone` | `text` | anonimizáveis; telefone brasileiro válido (FR-037a) |
| `data_nascimento` | `date` NULL | |
| `ativo` | `boolean` | inativação pelo Painel (FR-024), reversível |
| `senha_hash` | `text` NULL | `scrypt`; só para doador associado (D4) |
| `senha_definida_em` | `timestamptz` NULL | nulo até usar o link de definição (FR-006a) |
| `anonimizado_em` | `timestamptz` NULL | |
| `criado_em`, `atualizado_em` | `timestamptz` | |

**Índices**: `cpf` UNIQUE; `lower(email)` UNIQUE **parcial** `WHERE anonimizado_em IS NULL`.

### `papel`

Um papel por linha. Implementa as especializações do DER e a exclusividade do FR-048 (D14).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `pessoa_id` | `uuid` FK → `pessoa` | |
| `tipo` | `text` | `funcionario` \| `voluntario` \| `doador_associado` |
| `status` | `text` | `ativo` \| `inativo` \| `encerrado` |
| `origem_id` | `uuid` NULL | cadastro de voluntário ou candidatura que originou o papel; nulo se cadastrado direto no Painel |
| `inicio_em`, `fim_em` | `timestamptz` | `fim_em` nulo enquanto ativo |
| `alterado_por` | `text` | conta ou `sistema` |

**Exclusividade (D14)**: índice único parcial em `(pessoa_id)` `WHERE tipo IN ('funcionario',
'voluntario') AND status = 'ativo'`.

**Transições**:
- `ativo → inativo` (inativação, revogação de consentimento do voluntário — FR-057) · `inativo →
  ativo` (reativação).
- `voluntario: ativo → encerrado` só na efetivação como funcionário (FR-048); é terminal.
- `doador_associado: ativo → encerrado` na revogação do consentimento do doador (FR-057); bloqueia
  login e novas declarações vinculadas.

### `conta_institucional`

Login compartilhado do Painel (FR-040). Não é pessoa. **Sem campo de nível de permissão**
(constituição 3.0.0, FR-025).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `identificador` | `text` UNIQUE | |
| `senha_hash` | `text` | |
| `ativo` | `boolean` | |

Criada por `db/seed.js` em produção **com senha gerada na hora e mostrada uma vez**. As credenciais
de demonstração do protótipo (`admin`/`admin123`) não podem existir fora do ambiente local.

### `token_senha`

Links de definição e redefinição de senha (FR-006a, FR-046, D11).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `pessoa_id` | `uuid` FK → `pessoa` | |
| `finalidade` | `text` | `definir` (7 dias) \| `redefinir` (1 hora) |
| `token_hash` | `text` UNIQUE | SHA-256 do token; o token em si nunca é gravado |
| `expira_em` | `timestamptz` | |
| `usado_em`, `invalidado_em` | `timestamptz` NULL | gerar um novo invalida os anteriores |

Válido só se `usado_em`, `invalidado_em` nulos e `expira_em > now()`.

---

## Submissões públicas com triagem

As três têm protocolo (D6), nascem no status inicial e só mudam por ação humana (Princípio VIII,
FR-034). Campos comuns:

| Campo | Notas |
|---|---|
| `protocolo` | `text` UNIQUE |
| `motivo_rejeicao` | `text` NULL — **opcional** (2026-10-03) |
| `triado_por`, `triado_em` | última decisão de triagem |
| `concluido_em` | `timestamptz` NULL — rejeição ou encerramento a pedido do titular; **início do prazo de retenção** (FR-056) |
| `anonimizado_em` | `timestamptz` NULL |
| `criado_em` | `timestamptz` |

### `cadastro_voluntario` (FR-011 a FR-015, CSU05)

Prefixo `VOL-`. Campos do termo de adesão da Lei 9.608/1998 — nenhum além destes (FR-011).

| Campo | Tipo | Notas |
|---|---|---|
| `nome`, `escolaridade`, `profissao`, `rg`, `cpf` | `text` | anonimizáveis |
| `data_nascimento` | `date` | decide se é menor |
| `endereco`, `bairro`, `cep`, `cidade`, `uf` | `text` | anonimizáveis |
| `telefone`, `email` | `text` | anonimizáveis |
| `tipo_servico`, `objetivos`, `condicoes` | `text` | |
| `menor_de_idade` | `boolean` | calculado no envio (maioridade aos 18) |
| `autorizacao_status` | `text` | `nao_se_aplica` \| `pendente` \| `recebida` (FR-012) |
| `autorizacao_recebida_por`, `_em` | | |
| `status` | `text` | ver transições |
| `origem` | `text` | `portal` \| `painel` (2026-10-06) — no Painel, a equipe cadastra com os mesmos campos (FR-023) |
| `pessoa_id` | `uuid` FK NULL | preenchido só na aprovação |

**Transições** (`status`):

```
pendente ──► entrevista ──► aprovado
   │             │
   ├─────────────┴──► rejeitado              (motivo opcional)
   └─────────────┴──► encerrado_titular      (revogação do consentimento, FR-057)
```

- `→ aprovado` exige `autorizacao_status <> 'pendente'` (FR-012) e que a pessoa não seja
  funcionária ativa (FR-048). Cria ou reaproveita `pessoa` pelo CPF e cria papel `voluntario`.
- `rejeitado`, `aprovado` e `encerrado_titular` são terminais.
- **Origem `painel`** (FR-023, 2026-10-06): sem triagem. Maior de idade nasce `aprovado` (com
  pessoa e papel criados na mesma transação); menor nasce `pendente` com autorização `pendente` e
  segue `pendente → aprovado` quando a autorização for marcada como recebida, sem passar por
  entrevista.

### `candidatura` (FR-016 a FR-019, CSU06)

Prefixo `CAN-`. **Sem tabela de vagas**: os cargos são fixos (FR-016, Assumptions).

| Campo | Tipo | Notas |
|---|---|---|
| `cargo` | `text` | `limpeza` \| `cuidador` \| `enfermagem` \| `cozinha` |
| `nome`, `cpf`, `telefone`, `email` | `text` | anonimizáveis (FR-016a) |
| `data_nascimento` | `date` | maioridade |
| `curriculo_arquivo_id` | `uuid` FK NULL → `arquivo` | |
| `curriculo_texto` | `text` NULL | |
| `status` | `text` | `em_analise` → `entrevista` → `aprovada`; `rejeitada`; `encerrada_titular` |
| `efetivado_em` | `timestamptz` NULL | início do prazo do currículo do aprovado (FR-056) |
| `curriculo_anonimizado_em` | `timestamptz` NULL | só o currículo, mantendo o funcionário |
| `pessoa_id` | `uuid` FK NULL | preenchido na aprovação |

**Validação**: `curriculo_arquivo_id` ou `curriculo_texto` presente (FR-017).
**Na aprovação** (transação única): encontra ou cria `pessoa` pelo CPF; se houver papel
`voluntario` ativo, encerra-o; cria papel `funcionario`. Nada antes disso (FR-019).

### `solicitacao_externa` (FR-020 a FR-022, CSU08)

Prefixo `SOL-`.

| Campo | Tipo | Notas |
|---|---|---|
| `tipo` | `text` | `evento` \| `campanha` |
| `nome_contato`, `email`, `telefone` | `text` | pessoa ou organização; anonimizáveis |
| `nome_iniciativa` | `text` | nome do evento ou da campanha |
| `objetivo` | `text` | |
| `data_pretendida` | `date` NULL | evento |
| `periodo_inicio`, `periodo_fim` | `date` NULL | campanha |
| `recursos_esperados` | `text` | o que pede à instituição — **não** vira `recurso` |
| `status` | `text` | `em_analise` → `aguardando_contato` → `confirmada`; `rejeitada`; `encerrada_titular` |
| `evento_id` / `campanha_id` | `uuid` FK NULL | preenchido na confirmação |

**Transições**: `em_analise → aguardando_contato` (aprovar, nada publicado) → `confirmada` (cria
evento ou campanha com os dados combinados, FR-022). Rejeição a partir de `em_analise` ou
`aguardando_contato`. Aviso de conflito de data só para `tipo = evento` (FR-030).

---

## LGPD

### `consentimento` (FR-051, FR-052, FR-057)

Entidade Consentimento do DER. **Restrição 4 do DER** implementada com quatro FKs e um `CHECK` de
que exatamente uma está preenchida.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `cadastro_voluntario_id` | `uuid` FK NULL | 1 por cadastro |
| `candidatura_id` | `uuid` FK NULL | 1 por candidatura |
| `solicitacao_externa_id` | `uuid` FK NULL | 1 por solicitação |
| `pessoa_id` | `uuid` FK NULL | doador associado — **um por versão do aviso aceita** |
| `aviso_versao` | `text` FK → `aviso_privacidade.versao` | |
| `finalidade` | `text` | |
| `aceito_em` | `timestamptz` | |
| `revogado_em`, `revogado_por` | NULL | FR-057 |

`UNIQUE (pessoa_id, aviso_versao)` para doador; `UNIQUE` em cada uma das outras três FKs.

### `aviso_privacidade` (FR-053)

| Campo | Tipo | Notas |
|---|---|---|
| `versao` | `text` PK | ex.: `2026-10-v1` |
| `texto` | `text` | redigido pelo grupo, aprovado pela instituição |
| `publicado_em`, `publicado_por` | | |

Nova versão = nova linha; nunca se edita uma versão publicada. Vigente = a de `publicado_em` mais
recente.

---

## Doação

### `chave_pix_institucional` (FR-007)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `chave`, `tipo_chave` | `text` | `cnpj` \| `cpf` \| `email` \| `telefone` \| `aleatoria` |
| `nome_recebedor`, `cidade` | `text` | o front corta (25/15) e tira acentos para o BR Code |
| `ativa` | `boolean` | sem chave ativa → FR-007a |
| `atualizado_por`, `atualizado_em` | | |

### `doacao` (FR-005 a FR-009, FR-050)

Declaração de uma doação paga fora do sistema. **Sem protocolo, sem anexo** (2026-10-04).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `tipo` | `text` | `espontanea` \| `associativa` |
| `valor` | `numeric(12,2)` | valor do QR, `>= 1.00` |
| `declarada_em` | `timestamptz` | `now()` do servidor no clique (D9) |
| `pessoa_id` | `uuid` FK NULL | só em `associativa`; se a pessoa for anonimizada, continua apontando para a linha anonimizada ("doador anonimizado", FR-055) |
| `status` | `text` | `pendente` \| `confirmada` \| `nao_localizada` |
| `motivo_nao_localizada` | `text` NULL | opcional; pode ser o motivo padrão do FR-008a |
| `conferido_por`, `conferido_em` | NULL | |

**Validação**: `CHECK ((tipo = 'espontanea') = (pessoa_id IS NULL))` — Restrição 3 do DER.
**Transições**: `pendente → confirmada` · `pendente → nao_localizada`. Ambas terminais e humanas.
**Não editável** (FR-037, exceção de 2026-10-06): nenhuma rota altera `valor`, `tipo`, `declarada_em`
ou `pessoa_id`. Declaração errada é marcada como `nao_localizada`.
Confirmar o que já está `confirmada` não altera nada (FR-050), garantido por
`UPDATE … WHERE status = 'pendente'`.
**Possível duplicata (D18)**: outra `pendente` com mesmo `valor` e `declarada_em` a até 30 min.
**Anonimização**: a doação não tem campo pessoal próprio; ao anonimizar a pessoa, valor, data,
tipo e status ficam intactos, sem justificativa de retenção (FR-055, 2026-10-05).

---

## Conteúdo

### `item_necessario` (FR-026 a FR-028)

| Campo | Tipo | Notas |
|---|---|---|
| `nome` | `text` | |
| `quantidade` | `numeric(10,2)` | `>= 0` |
| `unidade` | `text` | ex.: pacotes, latas |
| `prioridade` | `text` | `alta` \| `media` \| `baixa` (2026-10-05) |
| `status` | `text` | `ativo` \| `suprido` |
| `quantidade_atualizada_em` | `timestamptz` | base do alerta do FR-028 |
| `criado_por`, `criado_em` | | |
| `atualizado_por`, `atualizado_em` | | |
| `baixa_por`, `baixa_em` | NULL | |

Portal ordena ativos por prioridade (alta → baixa). Alerta: `ativo` e
`quantidade_atualizada_em < now() - item_sem_atualizacao_dias`.

### `evento` e `campanha` (FR-029 a FR-031, DER)

Tipos diferentes, mesma tela (2026-10-05).

`evento`:

| Campo | Tipo | Notas |
|---|---|---|
| `nome`, `descricao`, `recursos_necessarios` | `text` | recursos em texto livre |
| `data` | `date` | não pode ser passada no cadastro |
| `solicitacao_origem_id` | `uuid` FK NULL | |
| `status` | `text` | `ativo` \| `encerrado` |
| `criado_por`, `criado_em` | | conta (ou a da confirmação da solicitação, FR-022) |
| `atualizado_por`, `atualizado_em` | | |
| `encerrado_por`, `encerrado_em` | NULL | conta ou `sistema` (FR-029c) |

`campanha`: igual, trocando `data` por `periodo_inicio`/`periodo_fim` e `recursos_necessarios` pela
tabela `recurso`, mais `meta_valor` `numeric NULL` e `arrecadado_valor` `numeric NULL`
(informado à mão, FR-029b; só faz sentido com meta).

**Conflito de data (FR-030)**: só evento × evento ativo na mesma `data`. Aviso, nunca bloqueio.

### `recurso` (DER, relação Arrecada)

| Campo | Tipo | Notas |
|---|---|---|
| `campanha_id` | `uuid` FK | toda campanha ativa tem ≥ 1 recurso **ativo** (FR-029) |
| `tipo` | `text` | `dinheiro` \| `item` |
| `descricao` | `text` | |
| `ativo` | `boolean` | editar a campanha desativa os recursos que saíram e cria os novos |
| `criado_por`, `criado_em` | | |
| `desativado_por`, `desativado_em` | NULL | |

Sem relação com `item_necessario`, como no DER.

### `noticia` (FR-032, FR-032a, FR-032b)

| Campo | Tipo | Notas |
|---|---|---|
| `titulo`, `corpo` | `text` | |
| `imagem_arquivo_id` | `uuid` FK NULL → `arquivo` | pública |
| `imagem_alt` | `text` NULL | obrigatório se houver imagem — `CHECK` |
| `status` | `text` | `publicada` \| `despublicada` |
| `criado_por`, `criado_em` | | |
| `atualizado_por`, `atualizado_em` | | edição de texto ou imagem |
| `status_alterado_por`, `status_alterado_em` | | última publicação ou despublicação |

### `conteudo_institucional` (FR-001, FR-001a)

**Uma única linha** (`id` fixo).

| Campo | Tipo | Notas |
|---|---|---|
| `historia`, `missao`, `equipe` | `text` | |
| `atualizado_por`, `atualizado_em` | | versões anteriores em `historico_alteracao` |

`conteudo_institucional_imagem`: `arquivo_id`, `texto_alternativo` (obrigatório), `ordem`, `ativo`, `criado_por`/`criado_em`, `desativado_por`/`desativado_em` — tirar uma imagem da página é desativar.

### `arquivo`

Ponteiro para objeto no Vercel Blob (D3).

| Campo | Tipo | Notas |
|---|---|---|
| `blob_url` | `text` | nunca em resposta pública se `acesso = privado` |
| `acesso` | `text` | `privado` (currículo) \| `publico` (imagens) |
| `categoria` | `text` | `curriculo` \| `imagem_noticia` \| `imagem_institucional` |
| `nome_original`, `mime_type`, `tamanho_bytes` | | |
| `enviado_por`, `enviado_em` | | `publico` (currículo) ou a conta (imagens) |
| `removido_em` | NULL | anonimização remove o objeto no Blob e marca a linha |

---

## Operação

### `registro_auditoria` (FR-035, FR-047)

**Append-only**: sem `UPDATE`, sem `DELETE` (permissão revogada para o usuário da aplicação).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `bigserial` PK | |
| `autor_tipo` | `text` | `conta_institucional` \| `doador` \| `sistema` \| `anonimo` |
| `autor_id` | `uuid` NULL | |
| `acao` | `text` | ex.: `doacao.confirmar`, `voluntario.entrevista`, `evento.encerrar_auto`, `acesso.negado` |
| `entidade_tipo`, `entidade_id` | `text`, `uuid` NULL | |
| `detalhe` | `jsonb` | **nunca** dado pessoal em claro |
| `ocorrido_em` | `timestamptz` | |

### `historico_alteracao` (FR-037, D16)

| Campo | Tipo | Notas |
|---|---|---|
| `entidade_tipo`, `entidade_id` | | |
| `estado_anterior` | `jsonb` | pode conter dado pessoal → anonimizado junto com o registro |
| `alterado_por`, `alterado_em` | | |

### `falha_email` (FR-049a, FR-049b)

| Campo | Tipo | Notas |
|---|---|---|
| `destinatario` | `text` | anonimizável |
| `motivo` | `text` | `confirmacao` \| `triagem` \| `definir_senha` \| `redefinir_senha` |
| `entidade_tipo`, `entidade_id` | | submissão relacionada |
| `erro` | `text` | mensagem técnica, sem dado pessoal |
| `falhou_em` | `timestamptz` | |
| `tratada_por`, `tratada_em` | NULL | |

### `configuracao` (D10)

Chave/valor: `item_sem_atualizacao_dias` = 30 · `retencao_meses` = 6 · `contato_instituicao`. Cada linha tem `atualizado_por`/`atualizado_em`; o valor anterior vai para `historico_alteracao`.

### `limite_tentativa` (D13)

`chave` (hash de IP/e-mail + escopo), `janela_inicio`, `contagem`. Limpa pelo cron diário.

---

## Retenção — o que a fila do FR-056 lista

Calculado na consulta (sem cron), com `retencao_meses` da configuração:

| Registro | Condição | O que se anonimiza |
|---|---|---|
| `cadastro_voluntario` | `status IN (rejeitado, encerrado_titular)` e `concluido_em` + prazo vencido | o cadastro inteiro |
| `candidatura` | idem | a candidatura inteira, com o currículo |
| `candidatura` aprovada | `efetivado_em` + prazo vencido e `curriculo_anonimizado_em IS NULL` | **só o currículo** |
| `solicitacao_externa` | `status IN (rejeitada, encerrada_titular)` e `concluido_em` + prazo vencido | a solicitação inteira |
| Doador associado inativo | — | **nunca entra na fila** (FR-056); só anonimiza a pedido |

---

## Relacionamentos (resumo)

```
pessoa 1─N papel                      (exclusividade funcionario/voluntario ativa — D14)
pessoa 1─N doacao                     (só associativa)
pessoa 1─N consentimento              (doador: um por versão do aviso)
pessoa 1─N token_senha
cadastro_voluntario 1─1 consentimento · N─0..1 pessoa (após aprovação)
candidatura         1─1 consentimento · N─0..1 pessoa · 0..1 arquivo (currículo)
solicitacao_externa 1─1 consentimento · 0..1 evento | 0..1 campanha
campanha 1─N recurso
noticia 0..1 arquivo · conteudo_institucional 1─N conteudo_institucional_imagem
aviso_privacidade 1─N consentimento
registro_auditoria, historico_alteracao → sem FK obrigatória
```

## Índices que importam

- `UNIQUE` em todo `protocolo` — chave da consulta pública.
- `pessoa.cpf` UNIQUE; `lower(pessoa.email)` UNIQUE parcial.
- Índice único parcial de papel ativo exclusivo (D14).
- `doacao (status, declarada_em)` — fila de conferência e duplicatas.
- `item_necessario (status, prioridade, quantidade_atualizada_em)`.
- `evento (status, data)` · `campanha (status, periodo_fim)` — Portal e cron.
- `registro_auditoria (ocorrido_em DESC)`.
- `limite_tentativa (chave, janela_inicio)`.

## Tabelas removidas em relação a 2026-09-04

`usuario_perfil` (virou `papel`), `vaga` (cargos fixos), `solicitacao_titular_dados` (FR-059
removido), `registro_consentimento` polimórfico (virou `consentimento` com FKs, DER), e os campos de
protocolo, data informada e comprovante da `doacao`, de anexo de autorização do voluntário, de
sincronização com redes sociais da notícia e de nível da conta institucional.
