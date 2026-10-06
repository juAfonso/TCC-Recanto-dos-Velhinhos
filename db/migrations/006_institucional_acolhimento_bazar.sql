-- 006 — Duas seções novas da página institucional, editáveis como as outras
-- (Session 2026-10-06 (2) do spec.md, FR-001/FR-001a). A de acolhimento é só texto
-- informativo: cadastro de residentes continua fora do escopo.

ALTER TABLE conteudo_institucional
  ADD COLUMN acolhimento text NOT NULL DEFAULT '',
  ADD COLUMN bazar       text NOT NULL DEFAULT '';
