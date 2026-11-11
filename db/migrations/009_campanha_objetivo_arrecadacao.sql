-- 009 — Campanhas: objetivo, quantidade arrecadada por recurso e itens da proposta externa
-- (decisões de 2026-11-11).
--
-- 1. "Descrição" de evento e campanha passa a se chamar "objetivo", como na solicitação
--    externa: é o mesmo dado, que a confirmação copia de um para o outro.
-- 2. Cada recurso guarda quanto foi arrecadado, informado à mão pela equipe (a qualquer
--    momento, também depois do encerramento), para o relatório da campanha. Item tem
--    unidade (kg, pacotes…); dinheiro é sempre em R$ e fica sem unidade.
-- 3. Quem propõe uma campanha pelo site lista os itens que ela vai arrecadar. Na
--    confirmação, a lista vira os recursos da campanha (só itens: proposta externa não
--    arrecada dinheiro). Evento não tem lista.

ALTER TABLE evento   RENAME COLUMN descricao TO objetivo;
ALTER TABLE campanha RENAME COLUMN descricao TO objetivo;

ALTER TABLE recurso
  ADD COLUMN quantidade_arrecadada numeric(12, 2) CHECK (quantidade_arrecadada >= 0),
  ADD COLUMN unidade               text,
  ADD COLUMN arrecadado_por        text,
  ADD COLUMN arrecadado_em         timestamptz,
  ADD CONSTRAINT recurso_unidade_do_tipo CHECK (
    (tipo = 'dinheiro' AND unidade IS NULL)
    OR (tipo = 'item' AND (quantidade_arrecadada IS NULL OR unidade IS NOT NULL))
  );

ALTER TABLE solicitacao_externa
  ADD COLUMN itens_arrecadar text[],
  ADD CONSTRAINT solicitacao_itens_so_campanha CHECK (tipo = 'campanha' OR itens_arrecadar IS NULL);
