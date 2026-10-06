# SAGE — Tabelas do Banco de Dados

> Banco: **Neon (PostgreSQL)**. Fonte: migrações `db/migrations/001` a `006`
> (estado de 06/10/2026). Dicionário de dados conferido contra o SQL, não só contra o
> `data-model.md`.

**Convenções**

- **PK** chave primária · **FK** chave estrangeira · **UQ** valor único · **NN** obrigatório (`NOT NULL`).
- Identificadores são `uuid` gerados por `gen_random_uuid()` (extensão `pgcrypto`), exceto
  `registro_auditoria` (`bigserial`), `conteudo_institucional` (linha única, `id = 1`),
  `configuracao` e `aviso_privacidade` (chave textual) e `limite_tentativa` (chave composta).
- Carimbos de tempo são `timestamptz`; datas de negócio são `date`.
- **Nenhuma tabela de negócio é excluída fisicamente** (Princípio III). Remover é mudar
  `status` ou desativar (`ativo = false`). Dado pessoal só desaparece por anonimização:
  os campos viram `[anonimizado]` e `anonimizado_em` é preenchido (FR-055).
- Colunas `*_por` guardam o autor da ação: a conta institucional, o doador, `publico`
  (submissão do Portal) ou `sistema` — nunca o funcionário individual (FR-035).

---

## Resumo

| # | Tabela | Grupo | Finalidade | CSU / requisito |
|---|---|---|---|---|
| 1 | `pessoa` | Pessoas e acesso | Pessoa cadastrada, identificada pelo CPF | CSU04, FR-048 |
| 2 | `papel` | Pessoas e acesso | Papéis da pessoa: funcionário, voluntário, doador associado | CSU04, FR-048 |
| 3 | `conta_institucional` | Pessoas e acesso | Login compartilhado do Painel Administrativo | FR-040 |
| 4 | `token_senha` | Pessoas e acesso | Links de definição e redefinição de senha do doador | CSU09, FR-046 |
| 5 | `cadastro_voluntario` | Submissões | Cadastro de voluntário com triagem | CSU05 |
| 6 | `candidatura` | Submissões | Candidatura a vaga com triagem | CSU06 |
| 7 | `solicitacao_externa` | Submissões | Pedido externo de evento ou campanha | CSU08 |
| 8 | `aviso_privacidade` | LGPD | Versões do aviso de privacidade | CSU11, FR-053 |
| 9 | `consentimento` | LGPD | Aceite do aviso, com data, finalidade e revogação | CSU11, FR-051 |
| 10 | `chave_pix_institucional` | Doação | Chave Pix da instituição usada para gerar o QR code | CSU01, FR-007 |
| 11 | `doacao` | Doação | Declaração "Já fiz o Pix" e sua conferência | CSU01 |
| 12 | `item_necessario` | Conteúdo | Itens de que a instituição precisa | CSU07 |
| 13 | `evento` | Conteúdo | Eventos divulgados no Portal | CSU02 |
| 14 | `campanha` | Conteúdo | Campanhas de arrecadação | CSU02 |
| 15 | `recurso` | Conteúdo | O que cada campanha arrecada | CSU02 |
| 16 | `noticia` | Conteúdo | Notícias do Portal | CSU03 |
| 17 | `conteudo_institucional` | Conteúdo | Textos da página institucional (linha única) | CSU03, FR-001a |
| 18 | `conteudo_institucional_imagem` | Conteúdo | Imagens da página institucional | CSU03, FR-001a |
| 19 | `arquivo` | Operação | Ponteiro para arquivos no Vercel Blob | FR-017, FR-032b |
| 20 | `registro_auditoria` | Operação | Quem fez o quê e quando (somente inclusão) | FR-035, FR-047 |
| 21 | `historico_alteracao` | Operação | Valor anterior de cada edição | FR-037 |
| 22 | `falha_email` | Operação | E-mails que não puderam ser enviados | FR-049a |
| 23 | `configuracao` | Operação | Valores editáveis (prazos, contato) | FR-028, FR-056 |
| 24 | `limite_tentativa` | Operação | Contador técnico contra tentativas repetidas | research D13 |

**Relacionamentos principais**

```
pessoa 1 ── N papel                   pessoa 1 ── N token_senha
pessoa 1 ── N doacao (associativa)    pessoa 1 ── N consentimento (doador, um por versão)
cadastro_voluntario N ── 0..1 pessoa  candidatura N ── 0..1 pessoa
cadastro_voluntario 1 ── 1 consentimento
candidatura         1 ── 1 consentimento     candidatura 0..1 ── 0..1 arquivo (currículo)
solicitacao_externa 1 ── 1 consentimento     solicitacao_externa 0..1 ── 0..1 evento | campanha
aviso_privacidade 1 ── N consentimento
campanha 1 ── N recurso
noticia 0..1 ── 0..1 arquivo          conteudo_institucional_imagem N ── 1 arquivo
```

---

## 1. Pessoas e acesso

### 1.1 `pessoa`

Pessoa cadastrada (entidade Pessoa do DER). Uma pessoa = uma linha, pelo CPF. Estar
cadastrada **não** dá acesso: só o doador associado tem login.

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | uuid | PK | Identificador |
| `cpf` | text | NN, UQ entre não anonimizados | CPF, só dígitos |
| `nome` | text | NN | Nome completo |
| `email` | text | UQ (sem diferenciar maiúsculas) entre não anonimizados | E-mail |
| `telefone` | text | | Telefone brasileiro |
| `data_nascimento` | date | | Data de nascimento |
| `ativo` | boolean | NN, padrão `true` | Inativação reversível (FR-024) |
| `senha_hash` | text | | Hash `scrypt`; só doador associado |
| `senha_definida_em` | timestamptz | | Nulo até usar o link de definição |
| `anonimizado_em` | timestamptz | | Data da anonimização (FR-055) |
| `criado_por`, `criado_em` | text, timestamptz | NN | Autoria da criação |
| `atualizado_por`, `atualizado_em` | text, timestamptz | | Última alteração |

Índices: `pessoa_cpf_unico (cpf)` e `pessoa_email_unico (lower(email))`, ambos únicos e
parciais (`WHERE anonimizado_em IS NULL`).

### 1.2 `papel`

Um papel por linha; implementa as especializações do DER.

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | uuid | PK | Identificador |
| `pessoa_id` | uuid | NN, FK → `pessoa` | Dono do papel |
| `tipo` | text | NN, `funcionario` \| `voluntario` \| `doador_associado` | Tipo de papel |
| `status` | text | NN, `ativo` \| `inativo` \| `encerrado`, padrão `ativo` | Situação |
| `origem_id` | uuid | | Cadastro de voluntário ou candidatura que originou o papel |
| `inicio_em` | timestamptz | NN | Início do papel |
| `fim_em` | timestamptz | | Fim (nulo enquanto ativo) |
| `criado_por` | text | NN | Autor da criação |
| `alterado_por`, `alterado_em` | text, timestamptz | | Última mudança de status |

Índice único parcial `papel_exclusivo_ativo (pessoa_id) WHERE tipo IN ('funcionario','voluntario') AND status = 'ativo'`:
funcionário e voluntário ativos são **exclusivos** na mesma pessoa (FR-048).
O papel de doador associado convive com qualquer outro.

### 1.3 `conta_institucional`

Login compartilhado do Painel. Não é pessoa e não tem nível de permissão.

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | uuid | PK | Identificador |
| `identificador` | text | NN, UQ | Login (o Gmail institucional) |
| `senha_hash` | text | NN | Hash da senha própria do Painel |
| `ativo` | boolean | NN, padrão `true` | Conta habilitada |
| `criado_por`, `criado_em` | text, timestamptz | NN | Autoria da criação |
| `atualizado_por`, `atualizado_em` | text, timestamptz | | Última alteração |

### 1.4 `token_senha`

Links de definição (válidos por 7 dias) e redefinição (1 hora) de senha, de uso único.

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | uuid | PK | Identificador |
| `pessoa_id` | uuid | NN, FK → `pessoa` | Dono do link |
| `finalidade` | text | NN, `definir` \| `redefinir` | Tipo de link |
| `token_hash` | text | NN, UQ | SHA-256 do token (o token não é gravado) |
| `expira_em` | timestamptz | NN | Validade |
| `usado_em` | timestamptz | | Quando foi usado |
| `invalidado_em` | timestamptz | | Invalidado por um link mais novo |
| `criado_em` | timestamptz | NN | Emissão |

---

## 2. Submissões públicas com triagem

As três têm **protocolo** (consulta pública de status, CSU10), nascem no status inicial e
só mudam por ação humana no Painel (Princípio VIII). Colunas comuns às três:

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | uuid | PK | Identificador |
| `protocolo` | text | NN, UQ | `VOL-…`, `CAN-…` ou `SOL-…` |
| `status` | text | NN, CHECK | Etapa da triagem (valores em cada tabela) |
| `motivo_rejeicao` | text | | Opcional (decisão de 03/10/2026) |
| `triado_por`, `triado_em` | text, timestamptz | | Última decisão de triagem |
| `concluido_em` | timestamptz | | Rejeição ou encerramento; início do prazo de retenção de 6 meses (FR-056) |
| `anonimizado_em` | timestamptz | | Data da anonimização |
| `criado_por`, `criado_em` | text, timestamptz | NN | Autoria do envio |

### 2.1 `cadastro_voluntario`

Só os campos do termo de adesão da Lei 9.608/1998, mais a data de nascimento.

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| *(colunas comuns)* | | | |
| `status` | text | `pendente` \| `entrevista` \| `aprovado` \| `rejeitado` \| `encerrado_titular` | Etapa |
| `origem` | text | NN, `portal` \| `painel`, padrão `portal` | Onde foi cadastrado |
| `nome` | text | NN | Nome |
| `cpf` | text | NN | CPF |
| `rg`, `escolaridade`, `profissao` | text | | Dados do termo de adesão |
| `data_nascimento` | date | obrigatória na API | Define se é menor |
| `endereco`, `bairro`, `cep`, `cidade`, `uf` | text | | Endereço |
| `telefone`, `email` | text | | Contato |
| `tipo_servico`, `objetivos`, `condicoes` | text | | Serviço voluntário pretendido |
| `menor_de_idade` | boolean | NN | Calculado no envio |
| `autorizacao_status` | text | NN, `nao_se_aplica` \| `pendente` \| `recebida` | Autorização em papel do responsável |
| `autorizacao_recebida_por`, `_em` | text, timestamptz | | Quem marcou a autorização como recebida |
| `pessoa_id` | uuid | FK → `pessoa` | Preenchido na aprovação |

CHECK: não pode estar `aprovado` com autorização `pendente` (FR-012).

No DER, esta tabela corresponde a `Cand_Voluntario` só quando `origem = portal`. A linha de
origem `painel` existe apenas para guardar o termo de adesão de quem a equipe cadastrou direto
(FR-023); conceitualmente, esse voluntário não passou por candidatura, e por isso a Admissão
é (0,1) do lado de `Cand_Voluntario` (decisão de 2026-10-06).

### 2.2 `candidatura`

Cargos fixos; não há tabela de vagas.

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| *(colunas comuns)* | | | |
| `status` | text | `em_analise` \| `entrevista` \| `aprovada` \| `rejeitada` \| `encerrada_titular` | Etapa |
| `cargo` | text | NN, `limpeza` \| `cuidador` \| `enfermagem` \| `cozinha` | Vaga pretendida |
| `nome`, `cpf` | text | NN | Identificação |
| `telefone`, `email` | text | | Contato |
| `data_nascimento` | date | obrigatória na API | Maioridade |
| `curriculo_arquivo_id` | uuid | FK → `arquivo` | Currículo enviado como arquivo |
| `curriculo_texto` | text | | Currículo digitado |
| `efetivado_em` | timestamptz | | Aprovação; início do prazo do currículo do aprovado |
| `curriculo_anonimizado_em` | timestamptz | | Só o currículo anonimizado |
| `pessoa_id` | uuid | FK → `pessoa` | Preenchido na aprovação |

CHECK: currículo em arquivo **ou** texto (FR-017), exceto depois de anonimizado.

### 2.3 `solicitacao_externa`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| *(colunas comuns)* | | | |
| `status` | text | `em_analise` \| `aguardando_contato` \| `confirmada` \| `rejeitada` \| `encerrada_titular` | Etapa |
| `tipo` | text | NN, `evento` \| `campanha` | O que se pede |
| `nome_contato` | text | NN | Pessoa ou organização |
| `email`, `telefone` | text | | Contato |
| `nome_iniciativa` | text | NN | Nome do evento ou da campanha |
| `objetivo` | text | NN | Objetivo |
| `data_pretendida` | date | | Evento |
| `periodo_inicio`, `periodo_fim` | date | | Campanha |
| `recursos_esperados` | text | | O que pede à instituição (espaço, equipe, horário) |
| `evento_id` | uuid | FK → `evento` | Evento criado na confirmação |
| `campanha_id` | uuid | FK → `campanha` | Campanha criada na confirmação |

---

## 3. LGPD

### 3.1 `aviso_privacidade`

Nova versão = nova linha; versão publicada nunca é editada. Vigente = a mais recente.

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `versao` | text | PK | Ex.: `2026-10-v1` |
| `texto` | text | NN | Texto do aviso |
| `publicado_por`, `publicado_em` | text, timestamptz | NN | Publicação |

### 3.2 `consentimento`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | uuid | PK | Identificador |
| `cadastro_voluntario_id` | uuid | FK → `cadastro_voluntario`, UQ | Dono, se for voluntário |
| `candidatura_id` | uuid | FK → `candidatura`, UQ | Dono, se for candidatura |
| `solicitacao_externa_id` | uuid | FK → `solicitacao_externa`, UQ | Dono, se for solicitação |
| `pessoa_id` | uuid | FK → `pessoa` | Dono, se for doador associado |
| `aviso_versao` | text | NN, FK → `aviso_privacidade` | Versão aceita |
| `finalidade` | text | NN | Finalidade do tratamento |
| `aceito_em` | timestamptz | NN | Data e hora do aceite |
| `revogado_em`, `revogado_por` | timestamptz, text | | Revogação (FR-057) |

CHECK: exatamente uma das quatro FKs preenchida (Restrição 4 do DER).
UQ `(pessoa_id, aviso_versao)`: o doador tem um consentimento por versão aceita.

---

## 4. Doação

### 4.1 `chave_pix_institucional`

A chave nunca fica no código; é cadastrada pela equipe no Painel.

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | uuid | PK | Identificador |
| `chave` | text | NN | Chave Pix (o CNPJ do Recanto) |
| `tipo_chave` | text | NN, `cnpj` \| `cpf` \| `email` \| `telefone` \| `aleatoria` | Tipo |
| `nome_recebedor` | text | NN | Nome no BR Code |
| `cidade` | text | NN | Cidade no BR Code |
| `ativa` | boolean | NN, padrão `true` | Chave em uso |
| `criado_por`, `criado_em` | text, timestamptz | NN | Criação |
| `atualizado_por`, `atualizado_em` | text, timestamptz | NN | Última alteração |

Índice único parcial `chave_pix_uma_ativa`: no máximo uma chave ativa.

### 4.2 `doacao`

Declaração de um Pix pago fora do sistema. Sem protocolo e sem anexo. **Não é
editável**: declaração errada é marcada como não localizada.

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | uuid | PK | Identificador |
| `tipo` | text | NN, `espontanea` \| `associativa` | Tipo de doação |
| `valor` | numeric(12,2) | NN, ≥ 1,00 | Valor do QR code |
| `declarada_em` | timestamptz | NN | Hora do servidor no clique em "Já fiz o Pix" |
| `pessoa_id` | uuid | FK → `pessoa` | Doador (só na associativa) |
| `status` | text | NN, `pendente` \| `confirmada` \| `nao_localizada`, padrão `pendente` | Conferência |
| `motivo_nao_localizada` | text | | Opcional |
| `conferido_por`, `conferido_em` | text, timestamptz | | Funcionário que conferiu o extrato |
| `criado_por` | text | NN | Autor da declaração |

CHECK: `tipo = 'espontanea'` se e somente se `pessoa_id` é nulo (Restrição 3 do DER).
Só a conferência humana leva a `confirmada` (Princípio VII).

---

## 5. Conteúdo

### 5.1 `item_necessario`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | uuid | PK | Identificador |
| `nome` | text | NN | Item |
| `quantidade` | numeric(10,2) | NN, ≥ 0 | Quantidade necessária |
| `unidade` | text | NN | Ex.: pacotes, latas |
| `prioridade` | text | NN, `alta` \| `media` \| `baixa` | Ordem no Portal |
| `status` | text | NN, `ativo` \| `suprido` | Baixa do item (FR-027) |
| `quantidade_atualizada_em` | timestamptz | NN | Base do alerta de 30 dias (FR-028) |
| `criado_por`, `criado_em` | text, timestamptz | NN | Criação |
| `atualizado_por`, `atualizado_em` | text, timestamptz | | Última edição |
| `baixa_por`, `baixa_em` | text, timestamptz | | Baixa |

### 5.2 `evento`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | uuid | PK | Identificador |
| `nome`, `descricao` | text | NN | Divulgação |
| `recursos_necessarios` | text | | Recursos em texto livre |
| `data` | date | NN | Data do evento |
| `solicitacao_origem_id` | uuid | FK → `solicitacao_externa` | Se veio de solicitação externa |
| `status` | text | NN, `ativo` \| `encerrado` | Encerrado à mão ou pelo cron diário |
| `criado_por`, `criado_em` | text, timestamptz | NN | Criação |
| `atualizado_por`, `atualizado_em` | text, timestamptz | | Última edição |
| `encerrado_por`, `encerrado_em` | text, timestamptz | | Conta ou `sistema` |

### 5.3 `campanha`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | uuid | PK | Identificador |
| `nome`, `descricao` | text | NN | Divulgação |
| `periodo_inicio`, `periodo_fim` | date | NN, fim ≥ início | Período |
| `meta_valor` | numeric(12,2) | > 0 | Meta opcional |
| `arrecadado_valor` | numeric(12,2) | ≥ 0; só com meta | Informado à mão pela equipe |
| `arrecadado_por`, `arrecadado_em` | text, timestamptz | | Quem informou o arrecadado |
| `solicitacao_origem_id` | uuid | FK → `solicitacao_externa` | Se veio de solicitação externa |
| `status` | text | NN, `ativo` \| `encerrado` | Situação |
| `criado_por`, `criado_em` | text, timestamptz | NN | Criação |
| `atualizado_por`, `atualizado_em` | text, timestamptz | | Última edição |
| `encerrado_por`, `encerrado_em` | text, timestamptz | | Conta ou `sistema` |

### 5.4 `recurso`

O que cada campanha arrecada (relação Arrecada do DER). Tirar um recurso é desativar.

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | uuid | PK | Identificador |
| `campanha_id` | uuid | NN, FK → `campanha` | Campanha |
| `tipo` | text | NN, `dinheiro` \| `item` | Tipo de recurso |
| `descricao` | text | NN | Descrição |
| `ativo` | boolean | NN, padrão `true` | Recurso em uso |
| `criado_por`, `criado_em` | text, timestamptz | NN | Criação |
| `desativado_por`, `desativado_em` | text, timestamptz | | Desativação |

### 5.5 `noticia`

"Excluir" é despublicar.

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | uuid | PK | Identificador |
| `titulo`, `corpo` | text | NN | Conteúdo |
| `imagem_arquivo_id` | uuid | FK → `arquivo` | Imagem opcional |
| `imagem_alt` | text | obrigatório se houver imagem | Texto alternativo (Princípio II) |
| `status` | text | NN, `publicada` \| `despublicada` | Visibilidade no Portal |
| `criado_por`, `criado_em` | text, timestamptz | NN | Criação |
| `atualizado_por`, `atualizado_em` | text, timestamptz | | Última edição |
| `status_alterado_por`, `status_alterado_em` | text, timestamptz | | Última publicação ou despublicação |

### 5.6 `conteudo_institucional`

Linha única (`id = 1`); versões anteriores ficam em `historico_alteracao`.

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | integer | PK, sempre 1 | Linha única |
| `historia`, `missao`, `equipe` | text | NN | Seções da página |
| `acolhimento`, `bazar` | text | NN | Seções adicionadas na migração 006 |
| `atualizado_por`, `atualizado_em` | text, timestamptz | NN | Última edição |

### 5.7 `conteudo_institucional_imagem`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | uuid | PK | Identificador |
| `arquivo_id` | uuid | NN, FK → `arquivo` | Imagem |
| `texto_alternativo` | text | NN, não vazio | Descrição para leitor de tela |
| `ordem` | integer | NN, padrão 0 | Posição na página |
| `ativo` | boolean | NN, padrão `true` | Tirar da página = desativar |
| `criado_por`, `criado_em` | text, timestamptz | NN | Criação |
| `desativado_por`, `desativado_em` | text, timestamptz | | Desativação |

---

## 6. Operação

### 6.1 `arquivo`

Ponteiro para objeto no Vercel Blob (a Vercel não tem disco persistente).

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | uuid | PK | Identificador |
| `blob_url` | text | NN | URL no Blob (nunca exposta se privada) |
| `blob_pathname` | text | NN | Caminho do objeto no Blob |
| `acesso` | text | NN, `privado` \| `publico` | Currículo é privado |
| `categoria` | text | NN, `curriculo` \| `imagem_noticia` \| `imagem_institucional` | Uso |
| `nome_original`, `mime_type` | text | NN | Metadados |
| `tamanho_bytes` | integer | NN | Tamanho |
| `enviado_por`, `enviado_em` | text, timestamptz | NN | Envio |
| `removido_em` | timestamptz | | Objeto removido do Blob na anonimização |

### 6.2 `registro_auditoria`

**Somente inclusão**: `UPDATE`, `DELETE` e `TRUNCATE` revogados e um gatilho
(`registro_auditoria_somente_inclusao`) que recusa alterações.

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | bigserial | PK | Sequencial |
| `autor_tipo` | text | NN, `conta_institucional` \| `doador` \| `sistema` \| `anonimo` | Tipo de autor |
| `autor_id` | uuid | | Conta ou pessoa |
| `acao` | text | NN | Ex.: `doacao.confirmar`, `acesso.negado` |
| `entidade_tipo`, `entidade_id` | text, uuid | | Registro afetado |
| `detalhe` | jsonb | NN | Contexto, nunca com dado pessoal |
| `ocorrido_em` | timestamptz | NN | Momento da ação |

### 6.3 `historico_alteracao`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | uuid | PK | Identificador |
| `entidade_tipo`, `entidade_id` | text, uuid | NN | Registro editado |
| `estado_anterior` | jsonb | NN | Valores antes da edição |
| `alterado_por`, `alterado_em` | text, timestamptz | NN | Autoria |
| `anonimizado_em` | timestamptz | | Anonimizado junto com o registro |

### 6.4 `falha_email`

E-mails que falharam nas duas tentativas; a falha nunca desfaz o registro (FR-049a).

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | uuid | PK | Identificador |
| `destinatario` | text | NN | E-mail de destino |
| `motivo` | text | NN, `confirmacao` \| `triagem` \| `definir_senha` \| `redefinir_senha` | Tipo de mensagem |
| `modelo` | text | NN | Modelo de e-mail usado |
| `entidade_tipo`, `entidade_id` | text, uuid | | Submissão relacionada |
| `erro` | text | NN | Mensagem técnica |
| `falhou_em` | timestamptz | NN | Momento da falha |
| `tratada_por`, `tratada_em` | text, timestamptz | | Reenvio ou tratamento manual |
| `anonimizado_em` | timestamptz | | Anonimização |

### 6.5 `configuracao`

Valores editáveis pela equipe, nunca constantes no código.

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `chave` | text | PK | Nome do parâmetro |
| `valor` | text | NN | Valor |
| `atualizado_por`, `atualizado_em` | text, timestamptz | NN | Última alteração |

Linhas iniciais: `item_sem_atualizacao_dias` = 30, `retencao_meses` = 6 e
`contato_instituicao` (inserida pelo `db/seed.js`).

### 6.6 `limite_tentativa`

Contador técnico contra tentativas repetidas (login, consulta de protocolo). Não tem
dado pessoal (a chave é um hash) e é a **única tabela com limpeza física**, feita pelo
cron diário.

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `chave` | text | PK (com `janela_inicio`) | SHA-256 de escopo + IP/e-mail |
| `janela_inicio` | timestamptz | PK | Início da janela de contagem |
| `contagem` | integer | NN, padrão 0 | Tentativas na janela |
