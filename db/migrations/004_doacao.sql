-- 004 — Doação (data-model.md → "Doação")

-- Chave Pix cadastrada pela equipe no Painel (FR-007). Nunca no código nem em arquivo
-- versionado. Sem chave ativa, o Portal não oferece a declaração (FR-007a).
CREATE TABLE chave_pix_institucional (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave          text NOT NULL,
  tipo_chave     text NOT NULL CHECK (tipo_chave IN ('cnpj', 'cpf', 'email', 'telefone', 'aleatoria')),
  nome_recebedor text NOT NULL,
  cidade         text NOT NULL,
  ativa          boolean NOT NULL DEFAULT true,
  criado_por     text NOT NULL,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_por text NOT NULL,
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);

-- No máximo uma chave ativa.
CREATE UNIQUE INDEX chave_pix_uma_ativa ON chave_pix_institucional ((true)) WHERE ativa;

-- Declaração de doação paga fora do sistema. Sem protocolo e sem anexo (2026-10-04).
-- Não editável: declaração errada é marcada como não localizada (FR-037, 2026-10-06).
CREATE TABLE doacao (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo                  text NOT NULL CHECK (tipo IN ('espontanea', 'associativa')),
  valor                 numeric(12, 2) NOT NULL CHECK (valor >= 1),
  -- now() do servidor no clique em "Já fiz o Pix" (D9), nunca o relógio do navegador.
  declarada_em          timestamptz NOT NULL DEFAULT now(),
  pessoa_id             uuid REFERENCES pessoa (id),
  status                text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmada', 'nao_localizada')),
  motivo_nao_localizada text,
  conferido_por         text,
  conferido_em          timestamptz,
  criado_por            text NOT NULL,
  -- Restrição 3 do DER: só a associativa tem doador.
  CHECK ((tipo = 'espontanea') = (pessoa_id IS NULL))
);

CREATE INDEX doacao_conferencia ON doacao (status, declarada_em);
CREATE INDEX doacao_pessoa ON doacao (pessoa_id) WHERE pessoa_id IS NOT NULL;
