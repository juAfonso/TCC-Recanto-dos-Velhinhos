-- 005 — Conteúdo: itens, eventos, campanhas, recursos, notícias e página institucional
-- (data-model.md → "Conteúdo")

-- Item necessário (FR-026 a FR-028).
CREATE TABLE item_necessario (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                     text NOT NULL,
  quantidade               numeric(10, 2) NOT NULL CHECK (quantidade >= 0),
  unidade                  text NOT NULL,
  prioridade               text NOT NULL CHECK (prioridade IN ('alta', 'media', 'baixa')),
  status                   text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'suprido')),
  quantidade_atualizada_em timestamptz NOT NULL DEFAULT now(),
  criado_por               text NOT NULL,
  criado_em                timestamptz NOT NULL DEFAULT now(),
  atualizado_por           text,
  atualizado_em            timestamptz,
  baixa_por                text,
  baixa_em                 timestamptz
);

CREATE INDEX item_necessario_portal ON item_necessario (status, prioridade, quantidade_atualizada_em);

-- Evento (FR-029 a FR-031). Recursos em texto livre.
CREATE TABLE evento (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                  text NOT NULL,
  descricao             text NOT NULL,
  recursos_necessarios  text,
  data                  date NOT NULL,
  solicitacao_origem_id uuid REFERENCES solicitacao_externa (id),
  status                text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado')),
  criado_por            text NOT NULL,
  criado_em             timestamptz NOT NULL DEFAULT now(),
  atualizado_por        text,
  atualizado_em         timestamptz,
  encerrado_por         text,
  encerrado_em          timestamptz
);

CREATE INDEX evento_portal ON evento (status, data);

-- Campanha (FR-029 a FR-031). Meta opcional; arrecadado informado à mão (FR-029b).
CREATE TABLE campanha (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                   text NOT NULL,
  descricao              text NOT NULL,
  periodo_inicio         date NOT NULL,
  periodo_fim            date NOT NULL,
  meta_valor             numeric(12, 2) CHECK (meta_valor > 0),
  arrecadado_valor       numeric(12, 2) CHECK (arrecadado_valor >= 0),
  arrecadado_por         text,
  arrecadado_em          timestamptz,
  solicitacao_origem_id  uuid REFERENCES solicitacao_externa (id),
  status                 text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado')),
  criado_por             text NOT NULL,
  criado_em              timestamptz NOT NULL DEFAULT now(),
  atualizado_por         text,
  atualizado_em          timestamptz,
  encerrado_por          text,
  encerrado_em           timestamptz,
  CHECK (periodo_fim >= periodo_inicio),
  -- Arrecadado só faz sentido com meta (FR-029b).
  CHECK (arrecadado_valor IS NULL OR meta_valor IS NOT NULL)
);

CREATE INDEX campanha_portal ON campanha (status, periodo_fim);

-- Recursos que a campanha arrecada (DER, relação Arrecada). Tirar um recurso é desativar.
CREATE TABLE recurso (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id    uuid NOT NULL REFERENCES campanha (id),
  tipo           text NOT NULL CHECK (tipo IN ('dinheiro', 'item')),
  descricao      text NOT NULL,
  ativo          boolean NOT NULL DEFAULT true,
  criado_por     text NOT NULL,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  desativado_por text,
  desativado_em  timestamptz
);

CREATE INDEX recurso_campanha ON recurso (campanha_id) WHERE ativo;

-- Notícia (FR-032, FR-032a, FR-032b). "Excluir" é despublicar.
CREATE TABLE noticia (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo              text NOT NULL,
  corpo               text NOT NULL,
  imagem_arquivo_id   uuid REFERENCES arquivo (id),
  imagem_alt          text,
  status              text NOT NULL DEFAULT 'publicada' CHECK (status IN ('publicada', 'despublicada')),
  criado_por          text NOT NULL,
  criado_em           timestamptz NOT NULL DEFAULT now(),
  atualizado_por      text,
  atualizado_em       timestamptz,
  status_alterado_por text,
  status_alterado_em  timestamptz,
  -- Toda imagem tem texto alternativo (Princípio II).
  CHECK (imagem_arquivo_id IS NULL OR length(trim(imagem_alt)) > 0)
);

CREATE INDEX noticia_portal ON noticia (status, criado_em DESC);

-- Página institucional editável (FR-001, FR-001a). Uma única linha.
CREATE TABLE conteudo_institucional (
  id             integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  historia       text NOT NULL DEFAULT '',
  missao         text NOT NULL DEFAULT '',
  equipe         text NOT NULL DEFAULT '',
  atualizado_por text NOT NULL,
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO conteudo_institucional (id, atualizado_por) VALUES (1, 'sistema');

-- Imagens da página institucional. Tirar uma imagem é desativar.
CREATE TABLE conteudo_institucional_imagem (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arquivo_id        uuid NOT NULL REFERENCES arquivo (id),
  texto_alternativo text NOT NULL CHECK (length(trim(texto_alternativo)) > 0),
  ordem             integer NOT NULL DEFAULT 0,
  ativo             boolean NOT NULL DEFAULT true,
  criado_por        text NOT NULL,
  criado_em         timestamptz NOT NULL DEFAULT now(),
  desativado_por    text,
  desativado_em     timestamptz
);

-- Solicitação confirmada aponta para o evento ou a campanha criada (FR-022).
ALTER TABLE solicitacao_externa
  ADD COLUMN evento_id   uuid REFERENCES evento (id),
  ADD COLUMN campanha_id uuid REFERENCES campanha (id);
