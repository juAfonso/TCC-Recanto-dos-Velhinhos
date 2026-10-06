-- 002 — Operação: auditoria, histórico, falhas de e-mail, configuração, limite e arquivos
-- (data-model.md → "Operação" e "arquivo")

-- Append-only (FR-035, FR-047). `detalhe` nunca leva dado pessoal.
CREATE TABLE registro_auditoria (
  id            bigserial PRIMARY KEY,
  autor_tipo    text NOT NULL CHECK (autor_tipo IN ('conta_institucional', 'doador', 'sistema', 'anonimo')),
  autor_id      uuid,
  acao          text NOT NULL,
  entidade_tipo text,
  entidade_id   uuid,
  detalhe       jsonb NOT NULL DEFAULT '{}'::jsonb,
  ocorrido_em   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX registro_auditoria_recentes ON registro_auditoria (ocorrido_em DESC);

-- A aplicação conecta com o mesmo usuário que cria as tabelas. O REVOKE tira dele a
-- permissão de alterar a auditoria; o gatilho cobre o caso de alguém devolver a permissão.
REVOKE UPDATE, DELETE, TRUNCATE ON registro_auditoria FROM CURRENT_USER;

CREATE FUNCTION impedir_alteracao_auditoria() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'registro_auditoria é somente inclusão (Princípio III)';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER registro_auditoria_somente_inclusao
  BEFORE UPDATE OR DELETE ON registro_auditoria
  FOR EACH ROW EXECUTE FUNCTION impedir_alteracao_auditoria();

-- Valor anterior de cada edição (FR-037, D16). Pode conter dado pessoal, por isso é
-- anonimizado junto com o registro.
CREATE TABLE historico_alteracao (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_tipo   text NOT NULL,
  entidade_id     uuid NOT NULL,
  estado_anterior jsonb NOT NULL,
  alterado_por    text NOT NULL,
  alterado_em     timestamptz NOT NULL DEFAULT now(),
  anonimizado_em  timestamptz
);

CREATE INDEX historico_alteracao_entidade ON historico_alteracao (entidade_tipo, entidade_id, alterado_em DESC);

-- E-mails que falharam nas duas tentativas (FR-049a, FR-049b).
CREATE TABLE falha_email (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario   text NOT NULL,
  motivo         text NOT NULL CHECK (motivo IN ('confirmacao', 'triagem', 'definir_senha', 'redefinir_senha')),
  modelo         text NOT NULL,
  entidade_tipo  text,
  entidade_id    uuid,
  erro           text NOT NULL,
  falhou_em      timestamptz NOT NULL DEFAULT now(),
  tratada_por    text,
  tratada_em     timestamptz,
  anonimizado_em timestamptz
);

CREATE INDEX falha_email_pendentes ON falha_email (falhou_em DESC) WHERE tratada_em IS NULL;

-- Valores editáveis pela equipe, nunca constante no código (D10).
-- `contato_instituicao` é inserido pelo db/seed.js.
CREATE TABLE configuracao (
  chave          text PRIMARY KEY,
  valor          text NOT NULL,
  atualizado_por text NOT NULL,
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO configuracao (chave, valor, atualizado_por) VALUES
  ('item_sem_atualizacao_dias', '30', 'sistema'),
  ('retencao_meses',            '6',  'sistema');

-- Contador técnico de tentativas (D13). Chave = SHA-256 de escopo + IP/e-mail, nunca em
-- claro. Única tabela com limpeza física, feita pelo cron diário.
CREATE TABLE limite_tentativa (
  chave         text NOT NULL,
  janela_inicio timestamptz NOT NULL,
  contagem      integer NOT NULL DEFAULT 0,
  PRIMARY KEY (chave, janela_inicio)
);

-- Ponteiro para objeto no Vercel Blob (D3).
CREATE TABLE arquivo (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blob_url      text NOT NULL,
  blob_pathname text NOT NULL,
  acesso        text NOT NULL CHECK (acesso IN ('privado', 'publico')),
  categoria     text NOT NULL CHECK (categoria IN ('curriculo', 'imagem_noticia', 'imagem_institucional')),
  nome_original text NOT NULL,
  mime_type     text NOT NULL,
  tamanho_bytes integer NOT NULL,
  enviado_por   text NOT NULL,
  enviado_em    timestamptz NOT NULL DEFAULT now(),
  removido_em   timestamptz
);
