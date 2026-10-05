# Data Model — Portal Público e Painel Administrativo

**Feature**: `001-portal-painel-ilpi` · **Data**: 2026-09-04 · **Fase**: 1 (Design & Contracts)
**Banco**: Neon (PostgreSQL)

---

## Regras que valem para o modelo inteiro

Estas regras vêm da constituição e do spec, e nenhuma tabela pode contrariá-las.

1. **Nada é excluído fisicamente** (Princípio III, FR-024). Não existe `DELETE` sobre dado de
   negócio em lugar nenhum da API nem da camada de persistência. Remoção é mudança de status.
2. **Toda tabela de negócio carrega auditoria mínima**: `criado_em`, `atualizado_em` e, onde houver
   ação administrativa, `conferido_por` / `aprovado_por` (referência à **conta institucional**, não
   a um funcionário — FR-035).
3. **Anonimização não apaga a linha** (FR-055). Os campos pessoais viram valores ilegíveis e
   `anonimizado_em` é preenchido. Chaves estrangeiras, histórico e auditoria continuam válidos.
4. **Toda submissão pública tem protocolo** não sequencial (FR-043, FR-045, FR-059), gerado como
   descrito em `research.md` → D6.
5. **Toda triagem exige motivo na rejeição** (decisão de projeto: vale para voluntário, candidatura
   e solicitação externa).

---

## Entidades

### `usuario`

Pessoa com acesso ao sistema. Uma pessoa = uma linha, identificada por CPF, acumulando perfis
(FR-048) — voluntária aprovada em vaga vira também funcionária **sem** duplicar registro.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `cpf` | `text` UNIQUE | normalizado só com dígitos; anonimizável |
| `nome` | `text` | anonimizável |
| `email` | `text` | anonimizável; usado no login de autoatendimento |
| `telefone` | `text` | anonimizável |
| `senha_hash` | `text` NULL | `scrypt`; nulo enquanto não houver login próprio |
| `senha_salt` | `text` NULL | |
| `ativo` | `boolean` | inativação = única remoção de acesso (FR-024) |
| `anonimizado_em` | `timestamptz` NULL | preenchido por FR-055 |
| `criado_em`, `atualizado_em` | `timestamptz` | |

**Validações**: CPF válido e único. E-mail único entre usuários não anonimizados.
**Transições**: `ativo=true` ⇄ `ativo=false`. Anonimização é irreversível e força `ativo=false`.

### `usuario_perfil`

Acúmulo de perfis por pessoa (FR-048). Tabela associativa — é o que permite a mesma linha de
`usuario` ser voluntária e funcionária ao mesmo tempo.

| Campo | Tipo | Notas |
|---|---|---|
| `usuario_id` | `uuid` FK → `usuario` | PK composta |
| `perfil` | `text` | `funcionario` \| `voluntario` \| `doador_associado` |
| `concedido_em` | `timestamptz` | |
| `concedido_por` | `text` NULL | conta institucional |

### `conta_institucional`

Login compartilhado do Painel Administrativo (FR-040). Separada de `usuario` de propósito: não é uma
pessoa, e a auditoria registra a conta, não o indivíduo (FR-035) — limitação aceita conscientemente.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `identificador` | `text` UNIQUE | ex.: `admin` |
| `senha_hash`, `senha_salt` | `text` | |
| `nivel` | `text` | nível de permissão (FR-025, FR-047) |
| `ativo` | `boolean` | |

### `cadastro_voluntario`

Submissão pública com triagem obrigatória (Princípio VIII, FR-011 a FR-015).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `protocolo` | `text` UNIQUE | prefixo `VOL-` |
| `usuario_id` | `uuid` FK NULL | preenchido só na aprovação |
| `nome`, `email`, `telefone`, `cpf` | `text` | anonimizáveis |
| `data_nascimento` | `date` | define se é menor de idade |
| `menor_de_idade` | `boolean` | derivado na submissão |
| `autorizacao_blob_id` | `uuid` FK NULL → `arquivo` | obrigatório se menor (FR-012, FR-058) |
| `disponibilidade`, `areas_interesse` | `text` | |
| `status` | `text` | `pendente` \| `aprovado` \| `rejeitado` |
| `motivo_rejeicao` | `text` NULL | **obrigatório** quando `rejeitado` |
| `triado_por`, `triado_em` | `text`, `timestamptz` NULL | conta institucional |
| `anonimizado_em` | `timestamptz` NULL | |

**Transições**: `pendente → aprovado` (cria/atualiza `usuario` + perfil `voluntario`) · `pendente →
rejeitado` (exige motivo). Nunca automático (FR-034).

### `vaga` e `candidatura_vaga`

`vaga`: título, descrição, requisitos, `ativa`, auditoria.

`candidatura_vaga` (FR-016 a FR-019):

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK · `protocolo` `text` UNIQUE | prefixo `CAN-` |
| `vaga_id` | `uuid` FK → `vaga` | |
| `nome`, `email`, `telefone`, `cpf` | `text` | anonimizáveis |
| `curriculo_blob_id` | `uuid` FK NULL → `arquivo` | currículo em arquivo **ou** texto |
| `curriculo_texto` | `text` NULL | |
| `status` | `text` | `pendente` \| `aprovado` \| `rejeitado` |
| `motivo_rejeicao` | `text` NULL | obrigatório quando `rejeitado` |
| `triado_por`, `triado_em` | | |

**Validação**: pelo menos um entre `curriculo_blob_id` e `curriculo_texto` (FR-017).
**Na aprovação**: se o CPF já existir em `usuario`, adiciona o perfil `funcionario` à linha
existente em vez de criar outra (FR-048).

### `solicitacao_evento_externo`

Proposta de evento/campanha vinda de terceiros (FR-020 a FR-022). Campos de contato, tipo, objetivo,
`data_pretendida`, recursos esperados, `protocolo` (prefixo `EVE-`), `status`, `motivo_rejeicao`
(obrigatório na rejeição), auditoria.
**Validação**: conflito de `data_pretendida` com `campanha_evento` confirmado é sinalizado à equipe.

### `chave_pix_institucional`

Configuração exibida publicamente na página de doação (FR-007). **Não é credencial** — não dá ao
sistema nenhum poder sobre a conta bancária.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `chave` | `text` | exibida com opção de copiar |
| `tipo_chave` | `text` | `cpf` \| `cnpj` \| `email` \| `telefone` \| `aleatoria` |
| `nome_recebedor` | `text` | vai no BR Code; o front-end corta em 25 caracteres e tira acentos |
| `cidade` | `text` | vai no BR Code; o front-end corta em 15 caracteres e tira acentos |
| `ativa` | `boolean` | se não houver ativa → FR-007a |
| `atualizado_por`, `atualizado_em` | | |

### `doacao`

Registro da **declaração** de uma doação paga fora do sistema (FR-005 a FR-010b). O nome da entidade
segue "Doação" como no spec, mas o significado mudou com a reversão para Pix estático: a linha nasce
como afirmação não verificada do doador.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK · `protocolo` `text` UNIQUE | prefixo `DOA-` |
| `tipo` | `text` | `espontanea` \| `associativa` |
| `valor` | `numeric(12,2)` | informado pelo doador |
| `data_informada` | `date` | data em que o doador diz ter pago |
| `doador_usuario_id` | `uuid` FK NULL | só em `associativa` |
| `comprovante_blob_id` | `uuid` FK NULL → `arquivo` | opcional (FR-010b), **acesso restrito** |
| `status` | `text` | `pendente` \| `confirmada` \| `nao_localizada` |
| `motivo_nao_localizada` | `text` NULL | obrigatório quando `nao_localizada` |
| `conferido_por`, `conferido_em` | `text`, `timestamptz` NULL | conta institucional |
| `criado_em` | `timestamptz` | |
| `anonimizado_em` | `timestamptz` NULL | ver retenção contábil em FR-055 |

**Transições**: `pendente → confirmada` · `pendente → nao_localizada` (exige motivo). Ambas exigem
ação humana. **`confirmada` é terminal**: nova tentativa de confirmar não altera nada nem emite nova
declaração (FR-050).
**Regra de duplicata (FR-050)**: ao abrir a conferência, o sistema lista outras declarações
`pendente` com mesmo `valor` e `data_informada` em janela próxima, para o funcionário julgar. É
sinalização, nunca bloqueio automático.
**Anonimização**: doação `espontanea` sem comprovante anexado não tem titular identificável e fica
fora de pedidos de anonimização (Assumptions do spec).

### `item_necessario`

Nome, quantidade/valor necessário, `status` (`ativo` \| `suprido`), `atualizado_em`.
Item sem atualização há mais que o período configurado (FR-028) é sinalizado — ver `configuracao`.

### `campanha_evento`

Título, descrição, `data_inicio`, `data_fim`, recursos necessários, `status`, auditoria.
**Validação**: conflito de data com outro evento confirmado é sinalizado no cadastro (FR-030).

### `noticia`

Título, corpo, `publicado_em`, `status_sincronizacao_rede_social`
(`nao_tentado` \| `sucesso` \| `falhou`). Falha de sincronização **nunca** bloqueia a publicação
no site (FR-033).

### `arquivo`

Ponteiro para o objeto no Vercel Blob. Nenhuma URL de Blob é exposta diretamente ao Portal Público
— o download passa por função que checa autorização (research D3).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `blob_url` | `text` | URL interna do Vercel Blob |
| `nome_original`, `mime_type`, `tamanho_bytes` | | |
| `categoria` | `text` | `curriculo` \| `autorizacao_menor` \| `comprovante_doacao` |
| `enviado_em` | `timestamptz` | base para a retenção do FR-056 |
| `removido_em` | `timestamptz` NULL | anonimização remove o objeto no Blob e marca a linha |

### `registro_consentimento`

Comprovação do aceite do aviso de privacidade (FR-051, FR-052).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `submissao_tipo`, `submissao_id` | `text`, `uuid` | vínculo polimórfico com a submissão |
| `aceito_em` | `timestamptz` | |
| `finalidade` | `text` | |
| `versao_aviso` | `text` | versão do texto aceito |
| `status` | `text` | `vigente` \| `revogado` |
| `revogado_em` | `timestamptz` NULL | FR-057 |

### `solicitacao_titular_dados`

Pedido de exercício de direito LGPD (FR-054, FR-059).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK · `protocolo` `text` UNIQUE | prefixo `LGP-` |
| `tipo` | `text` | `acesso` \| `correcao` \| `anonimizacao` \| `revogacao` |
| `nome_solicitante`, `email_solicitante` | `text` | |
| `descricao` | `text` | |
| `status` | `text` | `em_analise` \| `atendida` \| `recusada` |
| `motivo_recusa` | `text` NULL | obrigatório quando `recusada` |
| `dados_retidos_justificativa` | `text` NULL | o que foi retido por obrigação legal e por quê (FR-055) |
| `atendido_por`, `atendido_em` | | |

### `registro_auditoria`

Trilha de toda ação administrativa (FR-035, FR-047). **Append-only** — sem update, sem delete.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `bigserial` PK | |
| `conta_institucional` | `text` | autoria = conta, não pessoa (FR-035) |
| `acao` | `text` | ex.: `doacao.confirmar`, `voluntario.rejeitar`, `acesso.negado` |
| `entidade_tipo`, `entidade_id` | `text`, `uuid` NULL | |
| `detalhe` | `jsonb` | **nunca** grava dado pessoal em claro |
| `ocorrido_em` | `timestamptz` | |

**Inclui tentativas negadas** (FR-047), registradas sem expor ao usuário o motivo interno.

### `configuracao`

Pares chave/valor editáveis pela equipe, para não exigir redeploy (research D10).

| Chave | Uso |
|---|---|
| `item_periodo_prolongado_dias` | FR-028 — **30** (definido em 2026-09-23) |
| `retencao_<categoria>_dias` | FR-056 — **sem default**, aguarda definição da instituição |
| `aviso_privacidade_versao` | versão corrente para FR-052 |

---

## Relacionamentos (resumo)

```
usuario 1─N usuario_perfil
usuario 1─N doacao (associativa)
usuario 0─1 cadastro_voluntario (após aprovação)
vaga    1─N candidatura_vaga
arquivo 1─1 { cadastro_voluntario.autorizacao | candidatura.curriculo
            | doacao.comprovante }
registro_consentimento N─1 (submissão polimórfica)
registro_auditoria → append-only, sem FK obrigatória
```

## Índices que importam

- `UNIQUE` em todo `protocolo` — é a chave da consulta pública.
- `usuario.cpf` UNIQUE — sustenta o acúmulo de perfis (FR-048).
- `doacao (status, data_informada)` — alimenta a fila de conferência e a detecção de duplicata.
- `item_necessario (status, atualizado_em)` — alimenta o alerta do FR-028.
- `registro_auditoria (ocorrido_em DESC)` — consulta do histórico.
