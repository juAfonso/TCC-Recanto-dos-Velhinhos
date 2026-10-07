-- 007 — Registro de cada anonimização (FR-055, decisão de 2026-10-07).
-- Diz o que foi anonimizado, por qual conta e quando, e quais campos ficaram retidos por
-- obrigação legal, com a justificativa — exigida sempre que algum campo é retido. Não guarda
-- nenhum dado pessoal: só o NOME dos campos retidos. Somente inclusão, como a auditoria.

CREATE TABLE anonimizacao (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_tipo  text NOT NULL CHECK (entidade_tipo IN ('pessoa', 'cadastro_voluntario', 'candidatura', 'curriculo', 'solicitacao_externa')),
  entidade_id    uuid NOT NULL,
  -- Feita a partir de outra (a da pessoa alcança os cadastros dela): aponta para a principal.
  origem_id      uuid REFERENCES anonimizacao (id),
  campos_retidos text[] NOT NULL DEFAULT '{}',
  justificativa  text,
  executado_por  text NOT NULL,
  executado_em   timestamptz NOT NULL DEFAULT now(),
  CHECK (cardinality(campos_retidos) = 0 OR justificativa IS NOT NULL)
);

CREATE INDEX anonimizacao_entidade ON anonimizacao (entidade_tipo, entidade_id);

CREATE FUNCTION impedir_alteracao_anonimizacao() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'anonimizacao é somente inclusão (Princípio III)';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER anonimizacao_somente_inclusao
  BEFORE UPDATE OR DELETE ON anonimizacao
  FOR EACH ROW EXECUTE FUNCTION impedir_alteracao_anonimizacao();
