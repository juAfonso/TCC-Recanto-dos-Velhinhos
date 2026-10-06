-- 003 — Aviso de privacidade, submissões públicas com triagem e consentimento
-- (data-model.md → "Submissões públicas com triagem" e "LGPD")

-- Nova versão = nova linha; versão publicada nunca se edita (FR-053).
-- Vigente = a de `publicado_em` mais recente.
CREATE TABLE aviso_privacidade (
  versao        text PRIMARY KEY,
  texto         text NOT NULL,
  publicado_por text NOT NULL,
  publicado_em  timestamptz NOT NULL DEFAULT now()
);

-- Cadastro de voluntário (FR-011 a FR-015, CSU05). Prefixo VOL-.
-- Só os campos do termo de adesão da Lei 9.608/1998, mais data de nascimento (FR-011).
CREATE TABLE cadastro_voluntario (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo                text NOT NULL UNIQUE,
  origem                   text NOT NULL DEFAULT 'portal' CHECK (origem IN ('portal', 'painel')),
  nome                     text NOT NULL,
  escolaridade             text,
  profissao                text,
  rg                       text,
  cpf                      text NOT NULL,
  data_nascimento          date,  -- obrigatório na API; nulo só depois da anonimização
  endereco                 text,
  bairro                   text,
  cep                      text,
  cidade                   text,
  uf                       text,
  telefone                 text,
  email                    text,
  tipo_servico             text,
  objetivos                text,
  condicoes                text,
  menor_de_idade           boolean NOT NULL,
  autorizacao_status       text NOT NULL CHECK (autorizacao_status IN ('nao_se_aplica', 'pendente', 'recebida')),
  autorizacao_recebida_por text,
  autorizacao_recebida_em  timestamptz,
  status                   text NOT NULL DEFAULT 'pendente'
                             CHECK (status IN ('pendente', 'entrevista', 'aprovado', 'rejeitado', 'encerrado_titular')),
  motivo_rejeicao          text,
  triado_por               text,
  triado_em                timestamptz,
  concluido_em             timestamptz,
  pessoa_id                uuid REFERENCES pessoa (id),
  anonimizado_em           timestamptz,
  criado_por               text NOT NULL,
  criado_em                timestamptz NOT NULL DEFAULT now(),
  -- Menor só é aprovado com a autorização em papel recebida na sede (FR-012).
  CHECK (status <> 'aprovado' OR autorizacao_status <> 'pendente')
);

CREATE INDEX cadastro_voluntario_fila ON cadastro_voluntario (status, criado_em);

-- Candidatura a vaga (FR-016 a FR-019, CSU06). Prefixo CAN-. Cargos fixos, sem tabela de vagas.
CREATE TABLE candidatura (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo                text NOT NULL UNIQUE,
  cargo                    text NOT NULL CHECK (cargo IN ('limpeza', 'cuidador', 'enfermagem', 'cozinha')),
  nome                     text NOT NULL,
  cpf                      text NOT NULL,
  telefone                 text,
  email                    text,
  data_nascimento          date,  -- obrigatório na API; nulo só depois da anonimização
  curriculo_arquivo_id     uuid REFERENCES arquivo (id),
  curriculo_texto          text,
  status                   text NOT NULL DEFAULT 'em_analise'
                             CHECK (status IN ('em_analise', 'entrevista', 'aprovada', 'rejeitada', 'encerrada_titular')),
  motivo_rejeicao          text,
  triado_por               text,
  triado_em                timestamptz,
  concluido_em             timestamptz,
  efetivado_em             timestamptz,
  curriculo_anonimizado_em timestamptz,
  pessoa_id                uuid REFERENCES pessoa (id),
  anonimizado_em           timestamptz,
  criado_por               text NOT NULL,
  criado_em                timestamptz NOT NULL DEFAULT now(),
  -- Arquivo ou texto (FR-017). Depois da anonimização os dois podem ficar vazios.
  CHECK (curriculo_arquivo_id IS NOT NULL OR curriculo_texto IS NOT NULL
         OR anonimizado_em IS NOT NULL OR curriculo_anonimizado_em IS NOT NULL)
);

CREATE INDEX candidatura_fila ON candidatura (status, criado_em);

-- Solicitação externa de evento ou campanha (FR-020 a FR-022, CSU08). Prefixo SOL-.
-- As FKs para evento/campanha são adicionadas em 005, depois que essas tabelas existem.
CREATE TABLE solicitacao_externa (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo          text NOT NULL UNIQUE,
  tipo               text NOT NULL CHECK (tipo IN ('evento', 'campanha')),
  nome_contato       text NOT NULL,
  email              text,
  telefone           text,
  nome_iniciativa    text NOT NULL,
  objetivo           text NOT NULL,
  data_pretendida    date,
  periodo_inicio     date,
  periodo_fim        date,
  recursos_esperados text,
  status             text NOT NULL DEFAULT 'em_analise'
                       CHECK (status IN ('em_analise', 'aguardando_contato', 'confirmada', 'rejeitada', 'encerrada_titular')),
  motivo_rejeicao    text,
  triado_por         text,
  triado_em          timestamptz,
  concluido_em       timestamptz,
  anonimizado_em     timestamptz,
  criado_por         text NOT NULL,
  criado_em          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX solicitacao_externa_fila ON solicitacao_externa (status, criado_em);

-- Consentimento (FR-051, FR-052, FR-057). Restrição 4 do DER: pertence a exatamente
-- uma submissão ou a um doador associado.
CREATE TABLE consentimento (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cadastro_voluntario_id uuid UNIQUE REFERENCES cadastro_voluntario (id),
  candidatura_id         uuid UNIQUE REFERENCES candidatura (id),
  solicitacao_externa_id uuid UNIQUE REFERENCES solicitacao_externa (id),
  pessoa_id              uuid REFERENCES pessoa (id),
  aviso_versao           text NOT NULL REFERENCES aviso_privacidade (versao),
  finalidade             text NOT NULL,
  aceito_em              timestamptz NOT NULL DEFAULT now(),
  revogado_em            timestamptz,
  revogado_por           text,
  CHECK (num_nonnulls(cadastro_voluntario_id, candidatura_id, solicitacao_externa_id, pessoa_id) = 1),
  -- Doador: um consentimento por versão do aviso aceita.
  UNIQUE (pessoa_id, aviso_versao)
);
