-- 001 — Pessoas, papéis e acesso (data-model.md → "Pessoas, papéis e acesso")
-- Nada aqui é excluído fisicamente (Princípio III): remoção é mudança de status.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Pessoa cadastrada (entidade Pessoa do DER). Uma pessoa = uma linha, pelo CPF (FR-048).
-- Não significa "tem acesso": só o doador associado tem login (FR-025).
CREATE TABLE pessoa (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf               text NOT NULL,
  nome              text NOT NULL,
  email             text,
  telefone          text,
  data_nascimento   date,
  ativo             boolean NOT NULL DEFAULT true,
  senha_hash        text,
  senha_definida_em timestamptz,
  anonimizado_em    timestamptz,
  criado_por        text NOT NULL,
  criado_em         timestamptz NOT NULL DEFAULT now(),
  atualizado_por    text,
  atualizado_em     timestamptz NOT NULL DEFAULT now()
);

-- CPF e e-mail únicos só entre não anonimizados: depois da anonimização todos viram
-- "[anonimizado]" e não podem colidir entre si (FR-055).
CREATE UNIQUE INDEX pessoa_cpf_unico   ON pessoa (cpf)          WHERE anonimizado_em IS NULL;
CREATE UNIQUE INDEX pessoa_email_unico ON pessoa (lower(email)) WHERE anonimizado_em IS NULL;

-- Um papel por linha: especializações do DER e exclusividade do FR-048 (research D14).
CREATE TABLE papel (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id    uuid NOT NULL REFERENCES pessoa (id),
  tipo         text NOT NULL CHECK (tipo IN ('funcionario', 'voluntario', 'doador_associado')),
  status       text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'encerrado')),
  origem_id    uuid,
  inicio_em    timestamptz NOT NULL DEFAULT now(),
  fim_em       timestamptz,
  criado_por   text NOT NULL,
  alterado_por text,
  alterado_em  timestamptz
);

CREATE INDEX papel_pessoa ON papel (pessoa_id);

-- No máximo um papel de funcionário OU voluntário ativo por pessoa (D14).
-- Doador associado fica fora e convive com qualquer papel.
CREATE UNIQUE INDEX papel_exclusivo_ativo ON papel (pessoa_id)
  WHERE tipo IN ('funcionario', 'voluntario') AND status = 'ativo';

-- Login compartilhado do Painel (FR-040). Não é pessoa e não tem nível de permissão
-- (constituição 3.0.0, FR-025).
CREATE TABLE conta_institucional (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identificador  text NOT NULL UNIQUE,
  senha_hash     text NOT NULL,
  ativo          boolean NOT NULL DEFAULT true,
  criado_por     text NOT NULL,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_por text,
  atualizado_em  timestamptz
);

-- Links de definição (7 dias) e redefinição (1 hora) de senha — research D11.
-- Só o hash SHA-256 do token é gravado.
CREATE TABLE token_senha (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id     uuid NOT NULL REFERENCES pessoa (id),
  finalidade    text NOT NULL CHECK (finalidade IN ('definir', 'redefinir')),
  token_hash    text NOT NULL UNIQUE,
  expira_em     timestamptz NOT NULL,
  usado_em      timestamptz,
  invalidado_em timestamptz,
  criado_em     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX token_senha_pessoa ON token_senha (pessoa_id, finalidade);
