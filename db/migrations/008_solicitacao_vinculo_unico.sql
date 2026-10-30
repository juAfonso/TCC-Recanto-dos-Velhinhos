-- 008 — O vínculo entre a solicitação externa e o evento/campanha criado na confirmação
-- (FR-022) passa a ficar só de um lado: `solicitacao_origem_id` em evento e campanha.
-- Antes ele estava também em `solicitacao_externa.evento_id`/`campanha_id`, gravado nos
-- dois sentidos, sem nada no banco que garantisse que os dois lados concordavam.

-- Se algum vínculo só existir do lado da solicitação, traz para o evento/campanha antes de apagar.
UPDATE evento e SET solicitacao_origem_id = s.id
  FROM solicitacao_externa s
 WHERE s.evento_id = e.id AND e.solicitacao_origem_id IS NULL;

UPDATE campanha c SET solicitacao_origem_id = s.id
  FROM solicitacao_externa s
 WHERE s.campanha_id = c.id AND c.solicitacao_origem_id IS NULL;

ALTER TABLE solicitacao_externa
  DROP COLUMN evento_id,
  DROP COLUMN campanha_id;

-- Uma solicitação origina no máximo um evento ou uma campanha (DER, cardinalidade 0,1).
ALTER TABLE evento   ADD CONSTRAINT evento_solicitacao_origem_unica   UNIQUE (solicitacao_origem_id);
ALTER TABLE campanha ADD CONSTRAINT campanha_solicitacao_origem_unica UNIQUE (solicitacao_origem_id);
