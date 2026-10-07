# SAGE — Memória do Projeto

> Última atualização: 2026-10-07
> TCC do IFRJ Campus Pinheiral — sistema web para a ILPI "Recanto dos Velhinhos
> Francisco Gonçalves Barbosa". Repositório: `TCC-Recanto-dos-Velhinhos`
> (GitHub, usuário juAfonso).
>
> **Regra de manutenção:** ao tomar uma decisão nova ou reverter uma antiga,
> atualize este arquivo no mesmo commit. Decisão sem data aqui é decisão que
> alguém vai redescutir do zero na próxima sessão.

---

## O que é o projeto

Sistema web para apoiar a gestão da ILPI (Instituição de Longa Permanência
para Idosos) Recanto dos Velhinhos, em Pinheiral/RJ. Escopo definido por PRD
e 11 casos de uso (CSU01–CSU11), cobrindo doações, campanhas, divulgação
institucional, gestão de usuários, voluntariado, vagas, itens necessários,
solicitações externas de evento/campanha e exercício de direitos do titular
de dados (LGPD).

**O Recanto dos Velhinhos vai efetivamente usar em operação a versão que o
grupo está produzindo no TCC** — não se trata de um protótipo acadêmico à
parte do produto real que a instituição usaria depois. Isso importa porque
qualquer limitação da infraestrutura gratuita escolhida (ver Stack técnica)
afeta o sistema que a instituição vai usar de fato, não só uma demo de
entrega.

**Escopo fora do sistema:** cadastro de residentes, controle de medicamentos,
controle de estoque e IA generativa aparecem num resumo de proposta separado
(mais amplo, para submissão de evento), mas **não fazem parte do PRD/TCC**.
Se alguém trouxer essas features achando que estão no escopo, a referência
correta é o PRD + os 10 CSUs, não o resumo de proposta.

## Stack técnica

- **Hospedagem:** Vercel, no plano gratuito, nesta fase. Implicações
  conhecidas e já registradas no spec.md: sem domínio próprio, sem SLA/suporte
  pago, e possível hibernação do banco após inatividade (pode afetar
  pontualmente prazos como o de disponibilização do comprovante Pix).
  **Só a `main` é publicada (decidido em 2026-10-06).** O `vercel.json` desliga
  os deploys de preview das outras branches (`git.deploymentEnabled`). Motivo:
  cada preview criava uma branch no Neon, e com `main`, `dev` e as branches
  de teste de cada pessoa o limite de ~10 do plano gratuito estourou (deploy
  falhou em "Provisioning Integrations"). Os previews também nasciam com banco
  vazio, sem utilidade. Para testar uma branch, use `npm run dev`.
  **A API é uma função só (decidido em 2026-10-06).** O Hobby aceita no
  máximo 12 funções por deploy, e a fase 4 chegou a 19: o deploy de produção
  falhou e o site ficou na fase 3. Agora só `api/index.js` é função; as rotas
  ficam em **`rotas/`** (antes `api/`), com a mesma estrutura e os mesmos
  endereços. **Rota nova vai em `rotas/`, nunca em `api/`** — senão volta a
  contar no limite. Plano Pro descartado (custo mensal). research D1.
- **Banco:** Neon (PostgreSQL) — relacional, plano gratuito, confirmado que
  não exige cartão de crédito. Mantém o modelo relacional já implícito no PRD.
- ~~C#, MySQL, Visual Studio~~ — stack original do TCC, **abandonada** em
  favor de Vercel + Neon para viabilizar hospedagem sem custo algum (nem
  hospedagem nem domínio, nesta fase). Se alguém reintroduzir suposição de
  C#/MySQL num plano técnico, é sinal de que está partindo de uma versão
  desatualizada deste arquivo.
- **Banco NoSQL descartado explicitamente pelo orientador** — não se encaixa
  no tipo de dado do SAGE (mais adequado a mídia/dados desestruturados); rota
  Firebase/Firestore está fora de cogitação.
- **Arquitetura (decidida em 2026-09-04):** HTML/CSS/JS estáticos + funções
  serverless em `/api` na Vercel. **Não** usar Next.js/React — a decisão foi
  manter as páginas do protótipo praticamente como estão e trocar apenas a
  camada mock (`assets/js/data.js`) por chamadas `fetch` à API. Justificativa
  registrada no Princípio I (simplicidade) da constituição: sem build step e
  sem curva de React para um time de 6 pessoas com prazo fixo. Custo aceito:
  sem componentização, algum HTML repetido entre páginas.
- **Upload de arquivos:** Vercel Blob. Cobre currículos (privados) e a
  imagem de cada notícia (pública, FR-032b). **Dois stores (decidido em
  2026-10-06):** na Vercel o acesso é escolhido ao criar o store, então há um
  privado (`SAGE-CURRICULOS`, currículos) e um público (imagens, fase 11 —
  **ainda a criar** em 2026-10-07; o código já está pronto).
  Na Vercel a autenticação é por OIDC (`BLOB_STORE_ID`, sem token guardado);
  token só no `.env.local`, para testar arquivo no `npm run dev`. O currículo **não** usa URL
  assinada: a função do Painel confere o login e repassa o arquivo, para o
  link nunca sair do servidor (research D3). O anexo de
  comprovante bancário (FR-010b) **saiu em 2026-10-04**. A
  autorização de responsável legal de menores **saiu do Blob em 2026-10-03**:
  passou a ser entregue em papel na sede (ver "Alinhamento com o texto do
  TCC"). A Vercel não tem disco
  persistente, então salvar em pasta local não é opção.
- **Testes (decidido em 2026-09-04):** automatizados só nas regras críticas —
  não-duplicação de confirmação de doação (FR-050), geração de protocolo,
  anonimização (FR-055) e controle de acesso por perfil (FR-047). O restante
  é verificado manualmente pelos portões da constituição (acessibilidade,
  responsividade, dados, acesso).
- **Sem API de pagamentos.** Ver a decisão de Pix estático em "Decisões já
  tomadas" — nenhum provedor de pagamentos será contratado ou integrado.
- **E-mail: SMTP do Gmail institucional, via `nodemailer` (decidido em
  2026-09-23).** A instituição confirmou que **não tem domínio próprio e não
  quer registrar um**. Isso inverteu a decisão anterior, que era Resend via
  `fetch`. Motivo: sem domínio, um provedor terceiro enviando como
  `algo@gmail.com` não passa na verificação DMARC — o gmail.com não autoriza
  terceiros a enviar em seu nome — e a mensagem vira spam. Pelo SMTP do
  próprio Gmail é o Google que entrega, e autentica. Gratuito, limite de ~500
  mensagens/dia contra um uso esperado de 20 a 50 por **mês**.
  **Atenção — a justificativa antiga do `research.md` dizia o contrário**
  ("SMTP direto tem entregabilidade pior sem domínio"). Está errada e foi
  corrigida. Se alguém reabrir esse assunto partindo dela, está lendo versão
  desatualizada.
  Três riscos registrados: é zona cinzenta nos termos do Google; a conta
  precisa ser **institucional e não pessoal** (se for o Gmail de alguém que
  sai da instituição, o envio para); e a senha de aplicativo é credencial —
  vai em variável de ambiente, nunca no repositório. Plano B, se o Google
  bloquear: Brevo/SendGrid enviando de subdomínio do próprio provedor.
  **Conta definida em 2026-10-06:** `recantodosvelhinhos.pinheiral@gmail.com`,
  que é ao mesmo tempo o **contato público** do Recanto e a **conta de envio**
  do sistema (`GMAIL_USER`). A instituição está ciente do uso para envios
  automáticos. Telefone oficial: **(24) 3016-4023** — o (24) 3356-2801 e o
  `contato@recantodosvelhinhos.org.br` do protótipo estavam errados (o
  Recanto não tem domínio). Esses valores são o ponto de partida do
  `contato_instituicao` no `db/seed.js`; depois disso, quem edita é a equipe
  pelo Painel, nunca o código.
- **É a terceira dependência npm do projeto**, quebrando a regra de duas. O
  Princípio I exige justificativa escrita para cada uma, e ela está no
  `research.md` D5: escrever SMTP à mão sobre `node:tls` custaria mais do que
  a dependência economiza.
- **O protocolo é o canal primário; o e-mail é complementar.** Sem domínio,
  há risco real de spam — e cair em spam é **pior que falhar**, porque a
  falha de envio o sistema detecta e sinaliza (FR-049a), enquanto a entrega
  no spam é silenciosa. A interface deve dizer "anote este código", não
  "enviamos um e-mail".
- **Runtime:** Node.js **24 LTS** (24.19.0), instalado em 2026-09-05 via
  `winget install OpenJS.NodeJS.LTS`. O plano dizia Node 20, que já chegou ao
  fim de vida — foi corrigido. Verificado que os três recursos nativos que
  sustentam a decisão de quase não usar dependências funcionam: `fetch`
  (e-mail), `scrypt` do `node:crypto` (senha) e `node:test` (testes).
  **Quem for programar precisa instalar o Node na própria máquina** — não
  basta estar na máquina de uma pessoa.
- **Fluxo de trabalho:** Spec Kit + Claude Code (VS Code), especificando e
  planejando a partir do PRD antes de implementar.
- **Ambiente de desenvolvimento (decidido em 2026-10-06):**
  1. **Três branches no Neon:** `main` (produção, dados reais), `dev` (na
     máquina de quem programa, com `npm run seed -- --demo`) e `teste`
     (apagada e recriada a cada `npm test`). Nunca rodar `--demo` na `main`:
     o seed marca cada banco como `demo` ou `producao` e recusa misturar.
     **Incidente de 2026-10-06:** a `main` recém-migrada (ainda sem marca)
     recebeu um `seed --demo` de algum computador cuja `DATABASE_URL`
     apontava para ela — com a senha de demonstração, que está no repositório.
     Como não havia dado real, a `main` foi zerada e recriada. Desde então,
     `npm run migrate -- --producao` (com `DATABASE_URL_PRODUCAO`) **marca o
     banco como produção já na criação das tabelas**, e o seed recusa `--demo`
     se a `DATABASE_URL` for igual à `DATABASE_URL_PRODUCAO`. **A URL da `main`
     não deve estar no `.env.local` de ninguém como `DATABASE_URL`.**
  2. **`npm run dev` no lugar do `vercel dev`.** Um servidor pequeno em
     `scripts/dev.js`, sem dependência, serve `public/` e as funções de
     `api/` como a Vercel. Motivo: o Vercel CLI exige instalação global e
     login em cada computador, e no Windows o app do Claude instala numa
     pasta isolada que o Prompt de Comando não enxerga.
  3. **O login do Painel é o Gmail institucional**
     (`recantodosvelhinhos.pinheiral@gmail.com`), com senha **própria**,
     gerada pelo seed de produção e mostrada uma única vez — não é a senha
     do Gmail.
  4. **Commits sempre em branch**, com PR para a `main`; nada direto na `main`.
  5. **Fechar o navegador encerra o login** (Painel e doador). O cookie não
     tem `Max-Age`; o limite de 8 h continua conferido no servidor. Motivo: o
     computador da secretaria é compartilhado.
  6. **`EMAIL_MODO=console`** no `.env.local`: no desenvolvimento os e-mails
     (inclusive o link de criar senha) aparecem no terminal do `npm run dev`
     e nada é enviado. Na Vercel, não definir.
- **Doação associativa com e-mail de outra pessoa (decidido em 2026-10-06,
  fase 4).** CPF novo com e-mail que já pertence a outra pessoa cadastrada
  recebe a **mesma mensagem neutra** do FR-006b. Sem isso, o cadastro novo
  colidiria com o e-mail único e quem digitou o e-mail alheio poderia
  tentar ganhar acesso. Mesmo risco residual de descoberta já aceito no D15.
- **Front-end:** já existe um protótipo estático (`recanto-frontend`) com as
  páginas index, login, institucional, doacoes, campanhas, noticias, vagas,
  voluntariado, autoatendimento, consultar-status, solicitar-evento e uma
  pasta `admin/` separada. Ele será integrado ao projeto Spec Kit como base
  do plano técnico — não é descartável, é ponto de partida.
  **Está no repositório em `public/` desde 2026-09-04.**
- **Versão do front (atualizado em 2026-09-05):** vale a entregue como
  `recanto-frontend-completo`, que substituiu a primeira versão. Ela traz
  identidade visual verde, logo real (`assets/img/logo-icon.png`) usado no
  cabeçalho de todas as telas, e ajustes em quase todas as páginas. A versão
  anterior foi excluída do disco; se precisar dela por algum motivo, está
  preservada no commit `dfaf3bc`.
- **O vídeo do hero foi removido em 2026-09-05.** `assets/video/hero-video.mp4`
  pesava 9,3 dos 9,6 MB do front. Foi trocado por `assets/img/hero.jpg`, um
  quadro extraído do próprio vídeo, e a classe CSS passou de `.hero-video`
  para `.hero-image`. Motivos: peso no repositório, consumo de dados móveis
  e autoplay atrapalhando leitor de tela (Princípios II e V).
  **Desde 2026-10-05 o hero é a fachada real do Recanto**
  (`assets/img/newNewHero.jpg`, commit `0370180`), no lugar do quadro de
  stock do modelo MANAS. `assets/img/newHero.jpg` ficou sem uso.
- **Se a operação exigir recursos além do plano gratuito no futuro** (mais
  tráfego, domínio próprio), migrar para um plano pago é decisão e custo da
  instituição — não uma obrigação de manutenção contínua do grupo depois da
  entrega.

## Equipe

Ana Carolina, Isadora, Julia, Lara, Maria Fernanda, Richelle.

**Ainda em aberto:** este arquivo não define quem tem autoridade final para
editar decisões aqui. Até decidirem isso formalmente, tratem qualquer edição
deste arquivo como algo a avisar no grupo antes de commitar, não a resolver
sozinho — reduz o risco de duas pessoas reescreverem a mesma decisão em
paralelo.

## Como começar a trabalhar (pessoa ou Claude)

Vale para qualquer pessoa do grupo e para qualquer sessão do Claude Code.
Passo a passo de comandos e validação em
`specs/001-portal-painel-ilpi/quickstart.md`.

1. **Uma vez por computador:** Node 24 LTS (`winget install
   OpenJS.NodeJS.LTS`), clonar o repositório, `npm install` e criar o
   `.env.local` a partir do `.env.example`. No PowerShell, `npm` pode ser
   bloqueado pela política de scripts: use `npm.cmd` ou o Prompt de Comando.
2. **Bancos (Neon):** a Julia passa as connection strings **em mensagem
   privada** — nunca no grupo, no repositório ou no chat do Claude.
   `DATABASE_URL` = branch `dev` (compartilhada). `DATABASE_URL_TESTE` = uma
   branch de teste **só sua** (ex.: `teste-isadora`), porque `npm test` apaga
   a branch inteira e atrapalharia quem estiver testando ao mesmo tempo.
   O Neon gratuito permite ~10 branches: não criar além do necessário.
3. **O que fazer:** `specs/001-portal-painel-ilpi/tasks.md`. Fases 1 e 2
   (fundação) prontas; cada história (Fases 3–13) depende só delas, salvo
   as exceções da tabela "User Story Dependencies". **Combinem no grupo quem
   fica com qual fase antes de começar** e não mexam na fase de outra pessoa.
4. **Como pedir ao Claude:** "Leia o CLAUDE.md e rode `/speckit-implement`
   só para a Fase N do tasks.md, numa branch própria a partir da main. No
   fim, commit, envie a branch e me passe o link do PR. Não mexa em outras
   fases." As skills do Spec Kit estão versionadas em `.claude/skills/`.
5. **Sempre:** branch própria, PR para a `main`, nada direto na `main`.
   `npm test` passando antes do PR. Toda decisão nova ou revertida entra
   neste arquivo, com data, no mesmo PR.

## Decisões já tomadas (e por quê)

- **Doação só via Pix, com chave/QR code ESTÁTICOS e confirmação manual
  (revertido em 2026-09-04, ratificado em 2026-09-05).** Esta
  decisão **reverte** a decisão anterior descrita logo abaixo. A instituição
  cadastra sua chave Pix no Painel Administrativo e o Portal Público gera o
  QR code a partir dela (ver item seguinte, de 2026-10-03). O pagamento acontece no aplicativo do banco
  do doador, fora do sistema. Depois de pagar, o doador **declara** a doação
  no site e ~~recebe um protocolo~~ (desde 2026-10-04: só clica em "Já fiz
  o Pix", sem protocolo nem anexo — ver item de 2026-10-04); a declaração
  nasce **pendente** e só vira confirmada
  quando um funcionário confere a entrada no extrato bancário e confirma no
  Painel. Não há API de pagamentos, cobrança dinâmica nem webhook.
  Motivação: eliminar a dependência de contratar provedor de pagamentos e de
  ter conta PJ habilitada. Custo aceito conscientemente: a conciliação vira
  trabalho humano, e uma doação real cujo doador não declare nada no site
  simplesmente não aparece no sistema. Boleto e cartão continuam fora. Itens
  físicos, dinheiro vivo, depósito e transferência bancária continuam tratados
  manualmente, fora do sistema (ver item de 2026-10-03 abaixo).
  Exigiu emenda ao Princípio VII da constituição (versão 2.0.0), **ratificada
  em 2026-09-05**.
- **Só Pix entra no sistema; depósito, transferência e pagamento na sede ficam
  fora (decidido em 2026-10-03).** O histórico do Recanto mostra que
  associados pagam na sede, por depósito ou por Pix. O SAGE registra apenas
  declarações de Pix. Contribuições pagas de outra forma são controladas pela
  secretaria, fora do sistema, como já acontecia com dinheiro vivo. Uma
  declaração cuja entrada no extrato seja depósito ou TED, e não Pix, **não é
  confirmada**: o funcionário a marca como não localizada, com o motivo padrão
  oferecido como opção (FR-008a; motivo opcional desde 2026-10-04). Consequências aceitas: o histórico do doador associado (CSU09) e
  os totais do Painel mostram só o que veio por Pix e foi declarado no site —
  **não são a arrecadação da instituição** e não servem como prestação de
  contas. Incluir depósito foi avaliado e descartado: exigiria emendar o
  Princípio VII ("exclusivamente via Pix"), renomear o CSU01, e piora a
  conferência (depósito em dinheiro no caixa costuma chegar ao extrato sem
  nome do pagador), sem resolver quem paga na sede. Mantidos os três status
  da doação; o "não localizada" do caso de depósito é explicado pelo motivo
  padrão, sem quarto status. Se alguém propuser registrar depósito "porque
  aparece no extrato", é reabrir esta decisão.
- **O Portal gera o QR code Pix com o valor escolhido (aprovado pelo grupo,
  registrado em 2026-10-03).** Substitui a imagem de QR code enviada pela
  equipe. O doador escolhe R$ 10, 20, 50 ou 100, ou digita outro valor
  (mínimo R$ 1 — era R$ 5, reduzido no mesmo dia pelo alinhamento com o texto
  do TCC), e o navegador monta o BR Code (padrão do Banco Central, o
  mesmo texto do "copia e cola") e desenha o QR (`public/assets/js/pix.js`).
  O Painel guarda só chave, nome do recebedor e cidade. Motivo: o doador não
  digita o valor no banco, então há menos divergência entre extrato e
  declaração na conferência. **Continua sendo Pix estático** — "Pix dinâmico"
  é o QR que aponta para URL de um provedor de pagamentos, e esse segue
  proibido. O valor no QR não confirma nada; a conferência humana do extrato
  continua obrigatória. Desenhar o QR usa `qrcode-generator` (MIT), copiado
  para `public/assets/vendor/` — não é dependência npm, justificativa no
  `research.md` D9. **Antes de operar, testar com a chave real em vários
  aplicativos de banco** — **feito em 2026-10-06: o QR de teste com a chave
  real (CNPJ) foi lido corretamente em três bancos**, com nome e valor certos. O mock em `data.js` usa uma chave fictícia em
  domínio `.invalid`, de propósito: o banco lê o QR e diz "chave não
  encontrada", sem risco de pagar a terceiro. A chave real entra pela tela
  `admin/pix.html` (criada em 2026-10-03), que valida o CNPJ, avisa quando o
  tipo é CPF/telefone e mostra um QR de teste de R$ 10 para conferir no app
  do banco. ~~Enquanto o front usar a camada mock, o que for salvo nessa
  tela fica só no navegador.~~ **Desde a fase 4 (2026-10-06)** a tela grava
  pela API na tabela `chave_pix_institucional`. **A chave real (CNPJ) está
  cadastrada na produção e também no banco `dev` (decidido em 2026-10-06)**:
  o QR do `npm run dev` é de verdade. **Em teste local, leia o QR mas não
  pague** — o dinheiro iria para a conta do Recanto. As declarações de teste
  ficam só no banco `dev` e não se misturam à conferência da produção. O
  `seed --demo` continua criando a chave fictícia `.invalid` em bancos novos.
- **Por que a objeção anterior do orientador não alcança esta decisão
  (esclarecido em 2026-09-05).** Ponto importante, porque é o que distingue
  esta reversão de uma desobediência à orientação. O orientador **não se opõe
  a mudanças de rota**; ele objetou especificamente a adotar Pix estático
  **tendo como única justificativa a ausência de custo** — e derrubou essa
  justificativa mostrando que hospedagem e domínio de produção têm custo
  assumido pela instituição de qualquer forma. Esse argumento dele continua
  válido e não está sendo contestado. A justificativa desta decisão é outra:
  elimina a **dependência externa** de a instituição abrir e ter aprovada uma
  conta PJ em provedor de pagamentos, cujo prazo é controlado por terceiros e
  colocaria o cronograma do TCC na mão da burocracia de um gateway. Custo
  nunca foi o argumento aqui. Se alguém reabrir esse assunto, é este o
  raciocínio a apresentar — não "sai mais barato".
- ~~**Doação via Pix com API de pagamentos dinâmica.**~~ **Decisão anterior,
  revertida em 2026-09-04 pelos itens acima.** Registro do histórico: chegou
  a se cogitar reduzir o CSU01 para chave Pix fixa/confirmação 100% manual,
  motivado pela hipótese de custo zero permanente. Essa hipótese caiu, e na
  ocasião o CSU01 foi mantido como desenhado originalmente: API de terceiros
  gerando QR code, consulta periódica de status e confirmação manual apenas
  como *fallback*.
- ~~**Toda declaração de doação gera um código de protocolo.**~~ **Revertido
  em 2026-10-04** (ver "Doação sem protocolo" abaixo). O protocolo continua
  existindo para voluntariado, candidatura e solicitação externa.
- **Voluntários e candidatos a vaga passam por triagem/aprovação obrigatória**
  da administração antes de ficarem ativos. Não há autoaprovação.
  **Esclarecido em 2026-10-06:** a triagem vale para quem se inscreve **pelo
  site**. O cadastro feito direto por um funcionário no Painel (FR-023) não
  passa por triagem, porque já é ação explícita da equipe; o voluntário
  cadastrado assim preenche o termo de adesão inteiro, e o menor fica
  pendente até a autorização do responsável ser recebida. Essa tela foi
  feita na **fase 10** (US7), em `admin/usuarios.html`.
  ~~Rejeição exige motivo registrado nas três triagens.~~ **Revertido em
  2026-10-03: o motivo da rejeição é opcional nas três triagens** (ver
  "Alinhamento com o texto do TCC").
- ~~**Pessoa que já é voluntária e tem candidatura a vaga aprovada acumula o
  perfil de funcionário no mesmo cadastro.**~~ **Revertido em 2026-10-05:**
  funcionário e voluntário são papéis **exclusivos**, como no DER conceitual.
  Continua um único cadastro por CPF, sem duplicar: na efetivação, o papel de
  voluntário é **encerrado** (não apagado); funcionário ativo não pode ser
  aprovado como voluntário. Doador associado acumula com qualquer um.
  Motivo: voluntário que é empregado da mesma entidade cria risco de vínculo
  trabalhista no serviço voluntário. FR-048 reescrito.
- **Toda submissão pública (voluntariado, candidatura, solicitação externa)
  dispara e-mail automático de confirmação** para o autor, com o código de
  protocolo e aviso de que a análise pode levar alguns dias.
- **Usuários nunca são excluídos fisicamente, só inativados.** Preserva
  histórico. Se alguma feature nova pedir "deletar usuário" no sentido de
  apagar a linha do banco, isso é sinal de que fugiu do padrão do projeto —
  parar e confirmar antes de implementar. **Exceção acordada em 2026-09-04:**
  anonimização a pedido do titular (LGPD, FR-055) torna os dados pessoais
  ilegíveis mas mantém o registro, o histórico e a auditoria — é o mecanismo
  que concilia o direito do titular com a preservação de histórico.
- **A conformidade com a LGPD entrou no escopo desta versão (2026-09-04).**
  Foi avaliada a alternativa de deixar a LGPD como responsabilidade jurídica
  da instituição, fora do sistema, e ela foi descartada: como o Recanto vai
  operar de verdade com este sistema, coletando CPF, endereço, dados de
  menores e currículos, a operação real ficaria em desconformidade desde o
  primeiro cadastro. O que o sistema passa a garantir: consentimento
  explícito registrado nos formulários públicos (com data/hora, finalidade e
  versão do aviso), aviso de privacidade público, anonimização, registro de
  revogação de consentimento e prazos de retenção (FR-051 a FR-058,
  CSU11/User Story 11 do spec.md). ~~Canal de exercício de direitos por
  protocolo~~ — **revertido em 2026-10-03**: os pedidos do titular chegam por
  contato com a instituição, fora do sistema (ver "Alinhamento com o texto do
  TCC"). Continua
  fora do sistema, como responsabilidade organizacional da instituição: a
  designação do encarregado (DPO), a redação jurídica do aviso de privacidade
  e a definição formal das bases legais e dos prazos de retenção — o sistema
  apenas aplica os textos e prazos que a instituição fornecer.
- **Retenção de dados de não aprovados: 6 meses (decidido em 2026-09-30).**
  Vale para candidaturas e cadastros de voluntário não aprovados, com
  currículo e demais anexos, contados da conclusão da triagem (FR-056). A
  LGPD **não fixa prazo em dias**: exige eliminar ou anonimizar quando a
  finalidade acaba (arts. 6º, 15 e 16). Se alguém disser "a lei manda guardar
  X meses", está errado. O prazo é escolha nossa dentro desse critério.
  Descartado o "banco de currículos" de 12 meses com consentimento
  específico: um prazo único é mais simples de explicar e de operar. O prazo
  fica como configuração editável, nunca como constante no código.
  **A instituição não foi consultada à parte.** Na conversa com a Andresa
  ficou claro que ninguém no Recanto domina LGPD, então o grupo redige o
  rascunho do aviso de privacidade, já com os 6 meses, e a instituição
  aprova. É essa aprovação que torna o texto e o prazo formalmente dela.
- **Alinhamento com o texto do TCC revisado pelo grupo (2026-10-03).** O
  grupo revisou as seções 8, 11, 12, 19.1 e 19.2 do documento do TCC, e o
  spec foi alinhado a elas (Session 2026-10-03 (2) do spec.md). Texto
  corrigido para colar no documento: `docs/texto-tcc-revisado.md`. Decisões:
  1. **[Reversão] Motivo da rejeição é opcional** nas três triagens. Quando
     não há motivo, o e-mail de resultado (FR-049b) diz só "não aprovado".
  2. **Triagem com etapa de entrevista.** Voluntário e candidato passam por
     pendente → chamado para entrevista → aprovado ou rejeitado. Só a
     aprovação final ativa o voluntário ou cria o funcionário — antes, o texto
     efetivava como funcionário quem ainda nem tinha sido entrevistado.
  3. **Inativar não apaga dados.** Inativação só tira o acesso e pode ser
     desfeita; dado pessoal só some por anonimização (FR-055) ou pelo prazo
     dos não aprovados (FR-056). O sistema não oferece "excluir usuário".
  4. **[Reversão] Pedidos do titular (LGPD) ficam fora do sistema**, pelo
     contato informado no aviso de privacidade. O funcionário confere a
     identidade e executa no Painel só correção, anonimização e registro de
     revogação. Saíram o FR-059 e a entidade "Solicitação de Titular".
     Custo aceito: não há registro dos pedidos em si, só das ações tomadas.
  5. **[Reversão] Mínimo da doação: R$ 1** (era R$ 5). Já aplicado em
     `doacoes.html` e `page-doacoes.js`.
  6. **Retenção continua contando da conclusão da triagem** (o texto do TCC
     dizia "do envio"; corrigido no texto, não no spec).
  7. **[Reversão] Autorização do responsável legal do menor é entregue em
     papel na sede.** O cadastro fica com "autorização pendente" e não pode
     ser aprovado até um funcionário marcar "recebida". O sistema oferece uma
     página pronta para impressão (window.print, sem biblioteca nova) com os
     dados preenchidos. Nenhum documento de menor fica no Blob.
  8. **[Reversão] Autoatendimento é só do doador associado.**
  9. **[Reversão] Solicitação externa aprovada não publica na hora.** Vai
     para "aprovada — aguardando contato"; o evento só é publicado quando o
     funcionário o confirma, depois de combinar com o solicitante.
  10. **Conta automática do doador associado** só é ativada por link de
      definição de senha enviado ao e-mail (impede criar conta em nome de
      outra pessoa).
  11. **FR-033 (sincronização com redes sociais) removido** — já conflitava
      com o Princípio VI da constituição.
  12. Cadastro de voluntário passa a coletar os dados do termo de adesão da
      Lei 9.608/1998, mais data de nascimento (sem ela, a regra do menor não
      funciona). Campo fora do termo de adesão da instituição não deve ser
      coletado.
  Nenhuma dessas mudanças exigiu emenda à constituição.
- **Doação sem protocolo e ajustes vindos do protótipo (2026-10-04).**
  Decisões do grupo, registradas na Session 2026-10-04 do spec.md:
  1. **[Reversão] Doação não gera protocolo.** O doador só clica em "Já fiz
     o Pix"; o sistema registra a declaração pendente com o valor do QR code
     e a data/hora do clique. O funcionário confere no extrato por valor e
     data/hora e, na associativa, também pelo nome (critério auxiliar: o
     doador pode ter pago da conta de outra pessoa). Saíram o FR-045 e a
     doação da consulta por protocolo. Custo aceito: o doador espontâneo
     não acompanha o status de nada.
  2. **Não há recibo nem declaração de doação.** A confirmação fica
     registrada no Painel (data e conta). A doação associativa só aparece
     no autoatendimento depois de confirmada; pendente ou não localizada não
     aparece para o doador. Saiu o FR-010.
  3. **[Reversão] Anexo do comprovante bancário removido** (FR-010b).
  4. **Cadastro de doador associado só junto com a primeira doação**
     associativa; nas seguintes, ele entra no autoatendimento e doa sem
     redigitar dados. Identificar só por CPF foi descartado (qualquer um
     atribuiria doações a outra pessoa e o formulário revelaria CPFs
     cadastrados).
  5. **Meta em dinheiro de campanha é opcional**, e o valor arrecadado é
     informado à mão pela equipe. Doação Pix não é ligada a campanha, então
     o sistema não tem como calcular "X% arrecadado".
  6. **Notícia: editar, despublicar e uma imagem** com texto alternativo
     obrigatório. "Excluir notícia" virou despublicar, para não emendar o
     Princípio III.
  7. **Candidatura pede CPF e data de nascimento** (não idade). Sem CPF, o
     FR-048 não funcionava — o protótipo mostrava CPF zerado ao admin.
  8. **Solicitação externa pede o nome do evento.** Telefone só aceita
     número brasileiro válido, com máscara. Todo dado coletado tem de
     aparecer ao funcionário na consulta, não só na edição (FR-037a).
  9. **[Reversão] Motivo de "não localizada" é opcional** na conferência
     da doação (FR-008), como já é na rejeição das triagens. O motivo padrão
     de depósito/transferência (FR-008a) virou opção pronta na tela.
  10. **Doador que paga e não clica em "Já fiz o Pix"** não aparece no
      sistema; o Pix fica com a secretaria, como pagamento na sede. Agora
      explícito como Fluxo de Exceção H do CSU01. A página avisa que sem o
      clique a doação não é registrada.
- **Alinhamento com o DER conceitual (2026-10-05).** Comparando os casos de
  uso com `der-conceitual-recanto.drawio` (Session 2026-10-05 do spec.md):
  1. **[Reversão] Funcionário e voluntário exclusivos** (ver item acima).
  2. **Evento e campanha são tipos diferentes, na mesma tela** com escolha do
     tipo. Evento: data e recursos necessários em texto. Campanha: período,
     recursos a arrecadar (entidade Recurso) e meta opcional. Continuam 11
     CSUs; o CSU02 e o CSU08 foram reescritos.
  3. **"Recursos esperados" da solicitação externa** = o que o solicitante
     pede à instituição (espaço, equipe, horário); atributo da solicitação,
     não vira Recurso.
  4. **Conflito de data só para evento**; campanha não é verificada.
  5. **Consentimento (LGPD) é entidade no DER**, ligada à Solicitação (1),
     ao Candidato (1) e ao Doador_Associado (1 ou mais, um por versão do
     aviso aceita); cada consentimento pertence a exatamente uma delas
     (Restrição 4 do DER). Como atributo, perderia o histórico de aceites do
     doador. O DER está versionado em `docs/der-conceitual-recanto.drawio`.
  Pendente no DER: explicar no texto que a Restrição 1 (todo mundo tem um
  papel) vale para a união das duas especializações parciais.
- **Formulário de voluntário (decidido em 2026-10-06, fase 6).** Obrigatórios:
  identificação, endereço, contato e tipo de serviço; escolaridade, profissão,
  objetivos e dias/horários são opcionais (a equipe completa na entrevista).
  Tipo de serviço por lista + "Outro". **Sem idade mínima**: todo menor entra
  com autorização do responsável pendente, entregue em papel na sede.
  Session 2026-10-06 (3) do spec.md.
- **Formulário de solicitação externa (decidido em 2026-10-06, fase 8).**
  E-mail **e** telefone obrigatórios; data do evento (ou início da campanha)
  **a partir de amanhã**, sem antecedência mínima; "o que pede ao Recanto"
  (recursos esperados) **opcional**. Aprovar não publica; a confirmação, com
  os dados combinados, cria e publica o evento ou a campanha.
  Session 2026-10-06 (5) do spec.md.
- **Anonimização (decidido em 2026-10-07, fase 9).** (1) Dado que a lei
  manda guardar: a equipe pode **reter nome, CPF e/ou data de nascimento**,
  e aí a **justificativa é obrigatória**; contatos, endereço, RG e currículo
  nunca ficam. Cada anonimização é registrada (tabela `anonimizacao`,
  migração 007). (2) Anonimizar a **pessoa** alcança, na mesma operação, os
  cadastros de voluntário e as candidaturas dela (vínculo ou mesmo CPF).
  Session 2026-10-07 do spec.md. **O texto do aviso de privacidade é do
  grupo**; a equipe o publica pela tela "Privacidade (LGPD)" do Painel, que
  cria versão nova sem editar a antiga.
- **Autoatendimento do doador (decidido em 2026-10-07, fase 12).** (1)
  **Aviso de privacidade novo é aceito na próxima doação**: o doador logado
  confirma a versão nova antes do Pix, e o aceite vira mais um
  consentimento (um por versão, como no DER). (2) **A área do doador é só
  consulta**: correção de dados pela secretaria, no Painel; troca de senha
  por "Esqueci minha senha". Session 2026-10-07 (4) do spec.md.
- **Divulgação institucional (decidido em 2026-10-07, fase 11).** A página
  institucional tem **galeria opcional de até 6 imagens**; nenhuma é
  obrigatória. Imagem de notícia trocada ou retirada é só desvinculada: o
  arquivo fica no Blob público. Imagens sobem **uma por envio**, porque o
  corpo de requisição na Vercel vai até 4,5 MB. **O store público do Blob
  ainda não foi criado**: até ele existir, incluir imagem responde "não
  conseguimos receber imagens agora" (o resto funciona). Session 2026-10-07
  (3) do spec.md.
- **Gestão de usuários no Painel (decidido em 2026-10-07, fase 10).**
  (1) **O Painel não cria doador associado**: ele só nasce com a primeira
  doação associativa (decisão de 04/10); o FR-023 foi ajustado. (2)
  **Inativar é papel por papel**: a pessoa pode deixar de ser voluntária e
  continuar doadora; ela aparece inativa quando nenhum papel está ativo.
  Papel encerrado não volta, e voluntário com consentimento revogado não é
  reativado (faz novo cadastro). (3) **Funcionário cadastrado no Painel não
  registra consentimento** nem recebe e-mail: a base é o vínculo de
  trabalho. Tornar funcionário quem é voluntário ativo encerra o papel de
  voluntário, depois de confirmação. Session 2026-10-07 (2) do spec.md.
- **Termo de adesão para imprimir (decidido em 2026-10-06, FR-012a).** Todo
  voluntário imprime o termo da Lei 9.608 já preenchido logo após o envio;
  o menor também a autorização do responsável. A equipe imprime o termo de
  qualquer cadastro pelo Painel. **Ampliou o CSU05**: falta levar ao PRD e à
  seção 19 do TCC. Session 2026-10-06 (4) do spec.md.
- **Prioridade do item necessário: alta, média ou baixa (decidido em
  2026-10-05).** O CSU07 falava em "prioridade" sem valores, e o protótipo
  usava só "urgente sim/não". Os de prioridade alta são os "itens mais
  urgentes" do Painel (FR-036); o Portal lista os ativos da alta para a baixa
  (FR-003, FR-026). Na mesma revisão de consistência (Session 2026-10-05 (2)
  do spec.md), os dados de contato da solicitação externa — nome da pessoa
  ou organização, e-mail e telefone — foram trazidos do protótipo e
  conferidos pelo grupo.
- **Cinco decisões do `/speckit-clarify` (2026-10-05)**, Session 2026-10-05
  (3) do spec.md:
  1. **Associativa com CPF/e-mail já cadastrado, sem login** (FR-006b):
     mensagem neutra pedindo login, nada é registrado e o QR não é gerado.
     O formulário não revela quem é associado.
  2. **Revogação de consentimento tem efeito por papel** (FR-057), sem
     anonimizar: submissão em triagem vira "encerrada a pedido do titular";
     voluntário ativo é inativado; doador associado tem a conta inativada.
     Anonimizar é outro pedido (FR-055).
  3. **Retenção de 6 meses para tudo cuja finalidade acabou** (FR-056):
     inclui solicitação externa rejeitada/encerrada e o currículo de quem
     foi aprovado (6 meses após a efetivação, só o currículo). **Doador
     associado inativo não tem prazo automático** — só anonimiza a pedido.
  4. **Anonimização de doador com doações confirmadas** (FR-055): ficam só
     valor, data/hora, tipo e status, ligados a "doador anonimizado". Nenhum
     dado pessoal é retido — quem pagou já consta do extrato bancário.
  5. **Evento/campanha vencido é encerrado automaticamente** (FR-029c), com
     o sistema como autor na auditoria; o funcionário continua podendo
     encerrar antes. O Portal esconde o que venceu mesmo antes de o status
     mudar, porque a tarefa agendada da Vercel gratuita roda só uma vez
     por dia.
  Ficou para depois: validade e reenvio dos links de senha (vai para o
  plano).
- **Página institucional editável no Painel (decidido em 2026-10-05).** A
  equipe edita história, missão, equipe, acolhimento de residentes e bazar
  numa tela própria (FR-001a), com
  imagens opcionais de texto alternativo obrigatório e histórico das
  versões. Entrou no CSU03 (fluxo alternativo 04), não é CSU novo. Motivo:
  o grupo entrega e sai; texto fixo no HTML travaria a instituição. Não é
  notícia — não se publica nem despublica. O protótipo ainda não tem a tela.
- **Texto institucional do Recanto e duas seções novas (2026-10-06).** O
  Recanto entregou o texto da página (fundação em 7/1/1983, 22 residentes,
  diretoria voluntária presidida pela Sra. Eliege de Faria Barbosa). Além de
  história, missão e equipe, ele tem **"Acolhimento de residentes"** e
  **"Nosso bazar"**, que viraram seções **editáveis** (migração 006), porque
  o dia do bazar e a situação de vagas mudam. A seção de acolhimento é só
  texto informativo — **cadastro de residentes continua fora do escopo**. O
  texto entra pelo `db/seed.js`; números como "22 residentes" envelhecem e a
  equipe atualiza pelo Painel. Session 2026-10-06 (2) do spec.md.
- **Constituição 3.0.0: emenda ao Princípio IV (ratificada em 2026-10-05)**
  pelo responsável pelo projeto, com ciência do orientador. O texto 2.0.0
  exigia três perfis com acesso (funcionário, voluntário e doador); o
  sistema decidido tem dois — conta institucional do Painel e doador
  associado no autoatendimento —, desde as decisões de 13/08 (FR-040) e
  03/10 (sem autoatendimento de voluntário). A emenda só alinha o texto ao
  desenho, sem mudar o sistema. Se alguém ler o Princípio IV pedindo login
  de funcionário ou voluntário, está lendo a versão 2.0.0.
- **Ajustes vindos do `/speckit-analyze` (aprovados pelo grupo em
  2026-10-06)**, Session 2026-10-06 do spec.md:
  1. **Constituição 3.0.1 (PATCH):** o Princípio VIII agora diz que a conta
     do doador associado **não** depende de triagem (não dá contato com os
     residentes; a doação continua esperando a conferência no extrato). O
     Princípio VII deixou de falar em "imagem de QR code" — o QR é gerado a
     partir da chave.
  2. **Voluntário cadastrado direto no Painel coleta o termo de adesão
     inteiro** (FR-023), porque a Lei 9.608/1998 vale para qualquer caminho
     de cadastro. Vira um cadastro de voluntário com origem "Painel": adulto
     já aprovado; menor pendente até a autorização ser recebida.
  3. **Declaração de doação não se edita** (exceção no FR-037): o que foi
     conferido contra o extrato é prova da conferência. Declaração errada é
     marcada como não localizada. Os dados das três submissões com triagem
     passaram a ser corrigíveis no Painel.
  4. Ajustes técnicos sem decisão nova: toda tabela ganhou autor e data na
     própria linha (constituição, "Persistência"); recurso de campanha e
     imagem da página institucional são **desativados**, nunca apagados;
     respostas da API sem cache (SC-002); inativos visíveis na busca de
     usuários; ajuda contextual nas três triagens. `tasks.md` renumerado
     (128 tarefas).
- **Falhas de serviços externos não derrubam o registro do usuário
  (2026-09-04).** Se o e-mail de confirmação falhar, o cadastro/candidatura/
  solicitação é mantido, o sistema tenta reenviar uma vez e, persistindo a
  falha, registra internamente para reenvio manual (FR-049a). Do lado da
  doação, a reversão para Pix estático eliminou a dependência de API: se
  nenhuma chave Pix estiver cadastrada, o fluxo de declaração simplesmente
  não é oferecido (FR-007a). Uma doação já confirmada não pode ser confirmada
  de novo, e declarações pendentes com valor/data próximos são sinalizadas ao
  funcionário como possível duplicata (FR-050). Não existe mais janela de 15
  minutos: toda declaração nasce pendente e assim fica até a conferência
  humana.
- **A chave Pix do Recanto é o CNPJ da instituição (confirmado 2026-09-05).**
  Bom caso: CNPJ é dado público de pessoa jurídica, então exibi-lo no Portal
  não levanta questão de LGPD, e ainda mostra ao doador que ele paga para a
  instituição e não para uma pessoa física. Se algum dia trocarem por CPF ou
  telefone pessoal, **parar e reavaliar** — aí passaria a ser exposição de
  dado pessoal num projeto que colocou a LGPD no escopo, além de o dinheiro
  cair em conta de pessoa física, o que atrapalha a prestação de contas.
  **A chave não fica no repositório.** É cadastrada pela equipe no Painel
  (`admin/pix.html`, FR-007) e vive na tabela `chave_pix_institucional`.
  Nunca escrever a chave no código nem em arquivo versionado.
- **Três decisões de equipe fechadas em 2026-09-23** (não dependiam da
  instituição, estavam só esperando o grupo decidir):
  1. **FR-014 — a equipe de triagem não recebe e-mail.** Nova submissão de
     voluntário aparece só como pendência no painel (FR-036). Consequência
     aceita: a submissão aguarda até alguém abrir o painel — compatível com o
     aviso de "a análise pode levar alguns dias" que o autor já recebe. O
     e-mail do FR-049 continua indo para o **autor**, não para a equipe.
  2. **FR-028 — 30 dias** para sinalizar item necessário sem atualização.
     Fica como configuração editável, nunca constante no código.
  3. **FR-030 — conflito de data é aviso, não bloqueio.** Confirmação do que o
     spec já previa: o funcionário decide, porque só ele conhece o contexto.
- **Área de ajuda DENTRO do Painel Administrativo (decidido em 2026-09-23).**
  Não é documento entregue à parte: é **tela do sistema**, em `admin/`
  (FR-060, FR-060a), somada a ajuda contextual nas telas menos
  autoexplicativas (FR-061). Motivo da escolha: documento entregue se perde,
  desatualiza no computador de alguém e não alcança quem entrar na
  instituição daqui a três anos; a página no Painel está sempre à mão de quem
  opera.
  **Esta decisão ampliou o escopo** e por isso o PRD precisa ser atualizado —
  é a regra do "Inegociável" sendo cumprida, não contornada.
  Três definições que evitam redebater:
  1. **Entrou como requisitos (FR-060, FR-060a, FR-061), não como CSU12.**
     Tela de ajuda não é caso de uso de negócio — não há ator atingindo um
     objetivo institucional. Criar um décimo segundo CSU obrigaria a
     renumerar e reescrever "11 casos de uso" em todo o documento do TCC sem
     ganho nenhum de clareza. **Continuam sendo 11 CSUs.**
  2. **É escrita depois do sistema construído**, contra as telas reais.
     Escrever antes produziria ajuda de telas que ainda vão mudar.
  3. **Cobre só o Painel, não o Portal Público.** Se o doador ou o voluntário
     precisar de ajuda para usar o site, o problema é da tela e se corrige na
     tela — é o que o Princípio I exige e o que o FR-010a já faz na doação.
     A ajuda existe para o Painel porque o grupo entrega e sai, e ninguém do
     Recanto recebe treinamento.
  O FR-060a exige uma seção sobre **o que o sistema não faz** — não enxerga a
  conta bancária, não confirma doação sozinho, não aprova ninguém sem ação
  humana e não apaga cadastro. Expectativa errada da equipe quebra a operação
  tanto quanto funcionalidade faltando: se acharem que a doação confirma
  sozinha, ninguém vai conferir o extrato.
- **Acesso ao Painel Administrativo é por conta institucional compartilhada**,
  não por login individual por funcionário. Como consequência, **a auditoria
  registra qual conta institucional executou cada ação, não qual funcionário
  específico** — rastreabilidade individual não é possível nesse desenho, e
  isso foi aceito conscientemente, não é lacuna.
- **Tentativa de acesso a uma funcionalidade fora do nível de permissão do
  perfil é negada e registrada** no histórico de auditoria.
- **Autoatendimento do doador associado permite redefinição de senha por
  e-mail**, sem depender de um funcionário. **Desde 2026-10-03 o voluntário
  não tem autoatendimento** — acompanha a triagem pelo protocolo e pelos
  e-mails. O nome do CSU09 ("Autoatendimento de Voluntário/Doador") precisa
  ser ajustado no PRD para "Autoatendimento do Doador Associado".
- **Padrão de documentação dos casos de uso:** Código/Nome, Sumário, Ator
  Principal/Secundário, Pré-condições, Fluxo (colunas Ator/Sistema),
  Pós-condições — mesmo formato das seções 19.1/19.2 (Histórias de Usuário +
  Testes de Aceitação) do modelo do TCC. Qualquer caso de uso novo segue esse
  mesmo formato, sem inventar estrutura própria. Essa seção já foi expandida
  de 19 para 21 histórias, incorporando os itens acima (protocolo de doação,
  redefinição de senha, controle de acesso por permissão, entre outros).

## Os 11 casos de uso (referência rápida)

CSU01 Doação via Pix · CSU02 Campanhas e Eventos · CSU03 Divulgação
Institucional · CSU04 Manter Usuários (com painel consolidado) · CSU05
Cadastrar Voluntário · CSU06 Cadastrar Candidato a Vaga · CSU07 Manter Itens
Necessários · CSU08 Solicitar Evento/Campanha Externa · CSU09 Autoatendimento
de Voluntário/Doador · CSU10 Consultar Status de Solicitação · **CSU11
Exercício de Direitos do Titular (LGPD)** — adicionado em 2026-09-04, ver
"Decisões já tomadas".

Esses 11 são o recorte de alto nível do PRD. O detalhamento em
FRs/cenários de aceitação (spec.md e seção 19) já passou de FR-001–FR-044
para FR-001–FR-061 (com subitens como FR-007a e FR-049a; FR-033 e FR-059
removidos em 2026-10-03, números reservados), com as adições listadas em
"Decisões já tomadas" — ao consultar requisito por número, usar a versão mais
recente do spec.md, não esta lista resumida.

**Pendências (atualizado em 2026-09-05):**

1. **(Atualizado em 2026-10-05)** Os **11 casos de uso** estão revisados em
   `docs/casos-de-uso-tcc.md`, no layout do `SAGE_Casos_de_Uso.docx` do grupo
   e alinhados às decisões de 03 e 04/10. Regra adotada na revisão: o fluxo
   principal termina quando o sistema registra a submissão; decisões humanas
   com mais de um resultado (aprovar, rejeitar, chamar para entrevista,
   confirmar, não localizar) são fluxos alternativos; validações e erros são
   fluxos de exceção, nunca "caso inválido, retorna" dentro do principal.
   **Falta colar no PRD e na seção 19** do documento do TCC.
2. ~~O protótipo em `public/` ainda tem `doacoes.html` e `admin/doacoes.html`
   descrevendo o fluxo com API de pagamentos.~~ **Resolvido em 2026-10-06**
   (fase 4 / US2): declaração "Já fiz o Pix" + conferência manual no Painel.
3. Fotos institucionais reais ainda precisam vir do Recanto (o hero já é
   a fachada real desde 2026-10-05), cada uma com texto alternativo
   (Princípio II).
4. ~~As credenciais de demonstração do `public/README.md` (`admin`/`admin123`
   e as de autoatendimento) existem só na camada mock e **não podem**
   sobreviver ao `db/seed.js` real.~~ **Resolvido em 2026-10-07** (fase 12):
   saíram da tela de login e do `public/README.md`.
5. ~~Plano desatualizado em relação ao spec.~~ **Resolvido em 2026-10-05**:
   `/speckit-plan` refeito — `plan.md`, `research.md` (D1–D18),
   `data-model.md`, `contracts/api.md` e `quickstart.md` seguem o spec de
   05/10 e a constituição 3.0.0. Links de senha: definição vale 7 dias,
   redefinição 1 hora, uso único, novo link pela tela "esqueci minha senha"
   (research D11). A verificação do FR-006b deixa descobrir por comparação
   se um CPF/e-mail é de associado; o plano limita tentativas e **o grupo
   aceitou o risco residual em 2026-10-05**, junto com as demais decisões
   técnicas do plano (research D15). Não reabrir sem fato novo. O protótipo continua precisando acompanhar (triagens com
   entrevista, autoatendimento só do doador, página de autorização para
   imprimir) — a lista completa de telas está em `plan.md`.
6. **(2026-10-04)** Correções do protótipo apontadas na revisão do grupo,
   já refletidas no spec e ainda não feitas no front: ~~doação sem
   protocolo e sem anexo, sem o botão que simula a confirmação~~ (**feito
   em 2026-10-06**, fase 4); meta opcional e valor arrecadado manual nas
   campanhas (Portal desde a fase 3; tela do Painel **feita na fase 5**); ~~nome do evento na solicitação externa~~ (**feito na fase 8**); máscara de telefone em
   todos os formulários e telefone visível ao admin fora da edição; ~~editar,
   despublicar e imagem em notícias~~ (**feito na fase 11**); ~~CPF e data de nascimento na
   candidatura~~ (**feito na fase 7**). Depende do back: abrir anexos e ler a descrição inteira no
   Painel. **(2026-10-05)** Trocar a caixa "urgente" de `admin/itens.html`
   pela escolha de prioridade alta/média/baixa, e ordenar por ela no Painel,
   na home e em `doacoes.html` (home e `doacoes.html` feitas na fase 3;
   Painel feito na fase 5).
7. ~~Emenda ao Princípio IV pendente de ratificação.~~ **Resolvida em
   2026-10-05** — ver "Constituição 3.0.0" em "Decisões já tomadas".

## Inegociável

- Não implementar nada fora dos 11 CSUs sem antes atualizar o PRD e este
  arquivo — código certo pra escopo errado é o erro mais caro de evitar aqui.
- Não reintroduzir boleto/cartão ou exclusão física de usuário sem decisão
  explícita da equipe registrada aqui. Anonimização a pedido do titular
  (FR-055) **não** é exclusão física e é permitida — a linha do registro, o
  histórico e a auditoria continuam existindo.
- Não reintroduzir API de pagamentos/cobrança Pix dinâmica/webhook no CSU01
  sem uma nova decisão explícita. **Esta regra inverteu de sinal em
  2026-09-04:** antes ela proibia o Pix estático; agora o Pix estático é a
  decisão vigente (ver "Decisões já tomadas"). Se alguém propuser API de
  pagamentos partindo do spec antigo, é sinal de que está lendo uma versão
  desatualizada.
- Não justificar o Pix estático por "custo zero" — essa justificativa
  específica já foi derrubada pelo orientador e reabri-la reabre a discussão
  toda. O argumento correto é a eliminação da dependência de conta PJ em
  gateway (ver "Decisões já tomadas").
- Não tratar a declaração do doador como confirmação de recebimento. Sem API,
  só um funcionário conferindo o extrato bancário pode confirmar uma doação.
- Não assumir C#/MySQL em nenhum plano técnico novo — a stack de hospedagem
  e banco já está decidida (Vercel + Neon/PostgreSQL).

## Harness — peças que já existem / ainda faltam

- [x] Memória do projeto — este arquivo.
- [ ] Regra por área — ainda não há pasta com restrição própria documentada.
      Candidata natural: uma regra em `admin/` sobre quem pode aprovar
      voluntário/candidato (liga com a triagem obrigatória acima).
- [ ] Hook — nenhum definido ainda. Só criar quando um erro real acontecer
      duas vezes (ex.: alguém commitar sem seguir o formato de caso de uso).
- [ ] Skill / Agente — não neste estágio do projeto (Parte 8 do kit de
      harness: só depois de um procedimento se repetir de fato).

---

*Atualizado a partir das decisões tomadas com o orientador e das definições
de escopo do grupo. Revisem, corrijam o que estiver errado ou desatualizado,
e datem qualquer mudança.*