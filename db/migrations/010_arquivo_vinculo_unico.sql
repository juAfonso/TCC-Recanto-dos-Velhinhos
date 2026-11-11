-- 010 — Cada arquivo pertence a no máximo um registro (notícia, candidatura ou imagem da
-- página institucional). O código já fazia assim — todo envio cria um `arquivo` novo em
-- rotas/_lib/blob.js —, mas o banco aceitaria dois registros apontando para o mesmo
-- arquivo, e o diagrama do banco mostrava a relação como 0..N. Mesmo raciocínio da 008.
--
-- O UNIQUE aceita vários NULL: notícia sem imagem e candidatura com currículo em texto
-- continuam valendo. Imagem trocada ou retirada é só desvinculada (o arquivo fica), e
-- isso também continua valendo.
--
-- Se um dia quiserem reaproveitar a mesma imagem em mais de uma notícia, é esta
-- restrição que terá de sair.

ALTER TABLE noticia
  ADD CONSTRAINT noticia_imagem_arquivo_unico UNIQUE (imagem_arquivo_id);

ALTER TABLE cand_funcionario
  ADD CONSTRAINT cand_funcionario_curriculo_arquivo_unico UNIQUE (curriculo_arquivo_id);

ALTER TABLE conteudo_institucional_imagem
  ADD CONSTRAINT conteudo_institucional_imagem_arquivo_unico UNIQUE (arquivo_id);
