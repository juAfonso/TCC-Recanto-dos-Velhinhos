# Feature Specification: Portal Público e Painel Administrativo do Recanto dos Velhinhos

**Feature Branch**: `001-portal-painel-ilpi`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Construir a aplicação web do Recanto dos Velhinhos Francisco Gonçalves Barbosa (ILPI em Pinheiral/RJ), substituindo a gestão manual atual (planilhas Excel e Instagram) por uma plataforma digital com dois módulos: Portal Público e Painel Administrativo. Ver detalhamento completo de Portal Público, Painel Administrativo, critérios de aceitação e itens fora de escopo no prompt original do usuário."

## Clarifications

### Session 2026-09-04

- Q: Quando a API de pagamentos envia duas notificações confirmando a mesma doação Pix (webhook duplicado), como o sistema deve reagir? → A: O sistema identifica que a doação já está confirmada (por protocolo/ID da transação) e ignora silenciosamente a segunda notificação, sem alterar nada. **[SUPERADA pela decisão de Pix estático — ver Session 2026-09-04 (2). Não há mais webhook.]**
- Q: Quando a API de pagamentos de terceiros está indisponível ou retorna erro ao tentar iniciar uma doação Pix (gerar QR code), o que o sistema deve fazer? → A: O sistema não cria o registro de doação; exibe uma mensagem de erro ao visitante e sugere tentar novamente em instantes. **[SUPERADA pela decisão de Pix estático — ver Session 2026-09-04 (2). Não há mais API de pagamentos.]**
- Q: Se o envio automático do e-mail de confirmação (FR-049) falhar, o cadastro de voluntário/candidatura/solicitação já enviado deve ser mantido, ou a falha deve impedir/reverter o registro? → A: O registro é sempre mantido. O sistema tenta reenviar o e-mail automaticamente mais uma vez após um intervalo; se ainda assim falhar, o sistema registra a falha de envio internamente para que a equipe possa reenviar ou contatar manualmente.
- Q: Qual o valor concreto da "janela razoável" de espera antes de uma doação Pix ser tratada como definitivamente pendente (aguardando conciliação manual)? → A: 15 minutos. **[SUPERADA pela decisão de Pix estático — ver Session 2026-09-04 (2). Sem confirmação automática, não há janela de espera: a doação declarada nasce pendente e assim permanece até a conferência humana.]**
- Q: O spec deve incluir requisitos explícitos de conformidade com a LGPD nesta versão, ou isso fica como responsabilidade da instituição fora do escopo do sistema? → A: Incluir LGPD nesta versão — consentimento explícito nos formulários públicos, aviso de privacidade, direitos do titular (acesso, correção, anonimização, revogação de consentimento) e política de retenção. FR-024 é reescrito para distinguir exclusão física (que permanece proibida) de anonimização a pedido do titular (permitida, preservando histórico e auditoria).

### Session 2026-09-04 (2) — Reversão do CSU01 para Pix estático

> Esta sessão **reverte** a decisão anterior, que havia descartado a rota de Pix estático, e exigiu
> emenda ao Princípio VII da constituição (versão 2.0.0, **ratificada em 2026-09-05**). Esclareceu-se
> em 2026-09-05 que a objeção do orientador era à justificativa de *custo zero*, não à mudança de
> rota em si; a justificativa desta decisão é outra — eliminar a dependência de conta PJ em provedor
> de pagamentos — e portanto não é alcançada por aquela objeção.

- Q: O CSU01 mantém a API de pagamentos dinâmica (QR code gerado por terceiros + confirmação automática) ou passa a usar Pix estático? → A: Pix estático. A instituição cadastra sua chave Pix e/ou a imagem do QR code no Painel Administrativo, e o Portal Público apenas os exibe. O sistema não integra nenhuma API de pagamentos, não gera cobrança dinâmica e não recebe webhook de confirmação. Motivação: eliminar a dependência de contratação de provedor e de conta PJ habilitada.
- Q: Sem API, como a doação passa a existir dentro do sistema? → A: O doador paga no aplicativo do próprio banco e, em seguida, **declara** a doação no site (valor, data e, opcionalmente, anexo do comprovante bancário). O sistema registra a declaração com status pendente e emite código de protocolo. Um funcionário confere a entrada no extrato bancário da instituição e confirma (ou rejeita) a declaração no Painel Administrativo. A declaração do doador nunca equivale, por si só, a confirmação de recebimento.

### Session 2026-09-23 — Decisões da equipe (não dependem da instituição)

- Q: O FR-014 exige notificar a equipe de triagem a cada novo cadastro de voluntário. Isso será e-mail à conta institucional ou apenas o alerta no Painel Administrativo? → A: Apenas o alerta no painel. Não há envio ativo de e-mail à equipe. Consequência aceita conscientemente: uma submissão aguarda até que alguém abra o painel; isso é compatível com o aviso de "a análise pode levar alguns dias" que o autor já recebe (FR-049). O e-mail ao **autor** da submissão continua existindo normalmente.
- Q: Qual o valor concreto do "período prolongado" sem atualização de item necessário (FR-028)? → A: 30 dias, valor que o protótipo já usava. Fica como configuração editável, não como constante no código.
- Q: O conflito de data ao cadastrar campanha/evento (FR-030) é aviso ou bloqueio? → A: Aviso. Confirmação do que o spec já previa — o funcionário pode prosseguir com a data conflitante, porque só ele conhece o contexto.
- Q: O guia de uso para a equipe do Recanto será documento entregue à parte ou uma área dentro do sistema? → A: Uma área **dentro do Painel Administrativo** (FR-060), complementada por ajuda contextual nas telas menos autoexplicativas (FR-061). Motivo: documento entregue se perde, fica desatualizado no computador de alguém e não alcança quem entrar na instituição anos depois; a página no Painel está sempre disponível a quem opera o sistema. Esta escolha **amplia o escopo** e por isso exige atualização do PRD, conforme a regra do CLAUDE.md. Optou-se por registrar como requisitos do Painel, e **não** como um CSU12: uma tela de ajuda não é um caso de uso de negócio — não há ator atingindo um objetivo institucional —, e criar um décimo segundo caso de uso obrigaria a renumerar e reescrever referências a "11 casos de uso" em todo o documento do TCC sem ganho de clareza.

## User Scenarios & Testing (mandatory)

### User Story 1 - Portal Público Informativo (Priority: P1)

Um visitante acessa o site sem precisar de login e encontra a página institucional (história, missão e equipe), a lista de campanhas e eventos ativos, e a lista de necessidades prioritárias de doação (itens e valores), sempre refletindo o que a equipe da instituição publicou mais recentemente.

**Why this priority**: É o substituto direto do uso atual de planilhas e Instagram — a menor fatia que já entrega valor real (visibilidade pública organizada) sem depender de nenhum outro módulo. Sem isso, nenhum outro fluxo do portal faz sentido.

**Independent Test**: Pode ser testado publicando conteúdo institucional, uma campanha/evento e um item necessário via Painel Administrativo e verificando que aparecem corretamente no Portal Público, acessível sem autenticação, em desktop e em celular.

**Acceptance Scenarios**:

1. Given a instituição publicou seu histórico, missão e equipe, When um visitante acessa a página institucional, Then o conteúdo é exibido corretamente sem exigir login.
2. Given existem campanhas/eventos ativos e itens necessários cadastrados, When um visitante acessa a página correspondente, Then a lista exibida reflete exatamente os registros vigentes, sem itens já suprimidos ou eventos encerrados.
3. Given um item necessário é baixado (suprido) no Painel Administrativo, When o visitante recarrega o Portal Público, Then aquele item não aparece mais na listagem.

### User Story 2 - Doação Financeira via Pix (Priority: P1)

Um visitante decide doar dinheiro. A página de doação exibe a chave Pix e a imagem do QR code que a própria instituição cadastrou no Painel Administrativo, e ele faz o pagamento no aplicativo do seu banco — fora do sistema. Em seguida, se quiser que a doação seja reconhecida e acompanhada, ele **declara** a doação no site, escolhendo entre declaração espontânea (sem se identificar) ou associativa (informando seus dados), informando valor e data e, se desejar, anexando o comprovante do banco. O sistema registra a declaração com status pendente e devolve um código de protocolo único, que permite consultar o status e recuperar a declaração de doação depois, mesmo sem identificação. Um funcionário confere a entrada no extrato bancário da instituição e confirma ou rejeita a declaração no Painel Administrativo.

**Why this priority**: É a principal fonte de sustentabilidade financeira digital da instituição e o motivo prático mais forte para o visitante retornar ao site.

**Independent Test**: Pode ser testado de ponta a ponta cadastrando a chave Pix/QR code no Painel, verificando sua exibição no Portal Público, registrando uma declaração espontânea e uma associativa, confirmando a emissão do protocolo e o status inicial pendente, e então confirmando uma delas e rejeitando a outra no Painel, com consulta posterior do status via protocolo.

**Acceptance Scenarios**:

1. Given a instituição cadastrou sua chave Pix e a imagem do QR code no Painel Administrativo, When um visitante acessa a página de doação, Then vê a chave (com opção de copiar) e o QR code, junto do aviso de que o pagamento é feito no aplicativo do próprio banco.
2. Given a instituição ainda não cadastrou nenhuma chave Pix, When um visitante acessa a página de doação, Then o sistema informa que a doação digital está temporariamente indisponível e oferece o canal de contato da instituição, sem exibir campo de declaração.
3. Given um visitante pagou e escolhe declarar a doação de forma espontânea, informando valor e data, When ele conclui o fluxo, Then recebe um código de protocolo, a declaração é registrada com status pendente, e nenhum dado de identificação é exigido.
4. Given um visitante escolhe declarar a doação de forma associativa e informa seus dados, When ele conclui o fluxo, Then a declaração é registrada com status pendente e vinculada ao seu cadastro de doador.
5. Given uma declaração de doação está pendente, When um funcionário confere a entrada correspondente no extrato bancário e a confirma no Painel Administrativo, Then o status muda para confirmada, a declaração de doação fica disponível ao doador, e a ação fica registrada na auditoria com autor e data.
6. Given uma declaração de doação está pendente e o funcionário não localiza a entrada correspondente no extrato, When ele rejeita a declaração informando o motivo, Then o status muda para não localizada, o motivo fica registrado, e o registro é preservado sem exclusão física.
7. Given uma declaração de doação foi registrada, When nenhum funcionário a conferiu ainda, Then ela permanece com status pendente por tempo indeterminado, sem ser descartada, e aparece na lista de pendências do Painel Administrativo.
8. Given um visitante declarou uma doação espontânea e recebeu o código de protocolo, When ele sai da página e retorna posteriormente informando o protocolo, Then consegue consultar o status atualizado e, se já confirmada, obter a declaração de doação — sem precisar fornecer nenhum dado de identificação.
9. Given um visitante está na tela de declaração de doação, When ele lê as instruções, Then o sistema deixa explícito que a declaração não confirma o recebimento e que a conferência é feita manualmente pela equipe.

### User Story 3 - Gestão de Itens Necessários e de Campanhas/Eventos (Priority: P2)

Um funcionário autorizado cadastra e mantém atualizada, pelo Painel Administrativo, a lista de itens necessários (com busca por nome, atualização de quantidade e baixa quando o item é suprido) e a lista de campanhas/eventos institucionais (com data, descrição e recursos necessários), garantindo que a data de um novo evento não conflite com outro já confirmado.

**Why this priority**: É o mecanismo que alimenta o conteúdo mostrado na User Story 1; sem ele, a equipe voltaria a depender de atualização manual fora do sistema.

**Independent Test**: Pode ser testado cadastrando, buscando, atualizando e dando baixa em um item necessário, e cadastrando um evento em uma data livre e depois tentando cadastrar outro na mesma data, verificando o aviso de conflito.

**Acceptance Scenarios**:

1. Given um funcionário cadastra um novo item necessário, When ele salva o registro, Then o item passa a aparecer imediatamente na listagem pública de necessidades.
2. Given um item necessário foi totalmente suprido, When o funcionário registra a baixa, Then o item deixa de aparecer no Portal Público, mas permanece consultável no histórico administrativo.
3. Given um item não recebe atualização de quantidade por um período prolongado, When o funcionário acessa o Painel Administrativo, Then esse item aparece sinalizado como sem atualização recente.
4. Given já existe um evento confirmado em uma data, When um funcionário tenta cadastrar outro evento na mesma data, Then o sistema o avisa sobre o conflito de disponibilidade antes de confirmar.
5. Given um funcionário confirma o cadastro de uma campanha/evento, When o cadastro é salvo, Then ele é publicado automaticamente no Portal Público sem passo manual adicional.

### User Story 4 - Cadastro de Voluntários com Triagem (Priority: P2)

Uma pessoa interessada em ser voluntária se cadastra pelo Portal Público informando nome, endereço, telefone, e-mail, idade e área de interesse (anexando autorização do responsável legal se for menor de idade). O cadastro entra como pendente e só é efetivado após um funcionário revisar e aprovar ou rejeitar. Ao concluir o envio, o interessado recebe automaticamente um e-mail de confirmação com o código de protocolo e o aviso de que a análise pode levar alguns dias.

**Why this priority**: É um dos principais canais de engajamento da instituição com a comunidade, mas depende do Portal Público já existir (User Story 1) e da estrutura de gestão de usuários e triagem do Painel Administrativo.

**Independent Test**: Pode ser testado submetendo um cadastro de voluntário maior de idade e um de menor de idade (com e sem anexo de autorização), e verificando que ambos entram como pendentes, recebem o e-mail de confirmação, e que a equipe consegue aprová-los ou rejeitá-los.

**Acceptance Scenarios**:

1. Given um visitante maior de idade preenche o cadastro de voluntário, When ele envia o formulário, Then o cadastro é registrado com status pendente, a equipe de triagem é notificada, e o interessado recebe um e-mail automático de confirmação com o código de protocolo.
2. Given um visitante menor de idade tenta se cadastrar como voluntário sem anexar a autorização do responsável legal, When ele tenta enviar o formulário, Then o sistema impede o envio e explica que o anexo é obrigatório.
3. Given existe um cadastro de voluntário pendente, When um funcionário o aprova, Then o status muda para aprovado e a pessoa passa a constar como voluntária ativa.
4. Given existe um cadastro de voluntário pendente, When um funcionário o rejeita informando um motivo, Then o status muda para rejeitado, o motivo é registrado, e o registro é preservado no histórico, não excluído.

### User Story 5 - Candidatura a Vaga de Emprego com Triagem (Priority: P2)

Uma pessoa interessada em trabalhar na instituição escolhe um cargo (limpeza, cuidador, enfermagem ou cozinha), preenche seus dados pessoais e anexa um currículo — ou, se não tiver arquivo, descreve sua experiência em texto. A candidatura entra como em análise até um funcionário avaliá-la, podendo aprová-la (efetivando o cadastro como funcionário) ou rejeitá-la. Ao concluir o envio, o candidato recebe automaticamente um e-mail de confirmação com o código de protocolo e o aviso de que a avaliação pode levar alguns dias.

**Why this priority**: Substitui um processo hoje totalmente manual de recrutamento, mas assim como o voluntariado depende da estrutura básica de portal e triagem já estar disponível.

**Independent Test**: Pode ser testado submetendo uma candidatura com currículo anexado e outra apenas com descrição textual, verificando o recebimento do e-mail de confirmação em ambos os casos, e verificando que a equipe consegue avaliar, aprovar (gerando um novo funcionário) ou rejeitar cada uma.

**Acceptance Scenarios**:

1. Given um candidato escolhe um cargo e envia dados pessoais com currículo anexado, When ele conclui o envio, Then a candidatura é registrada com status em análise e o candidato recebe um e-mail automático de confirmação com o código de protocolo.
2. Given um candidato não possui arquivo de currículo, When ele preenche a descrição textual da experiência no lugar do anexo, Then o sistema aceita a candidatura normalmente.
3. Given existe uma candidatura em análise, When um funcionário a aprova, Then um novo cadastro de funcionário é criado a partir dos dados da candidatura — ou, caso o CPF do candidato já corresponda a um voluntário cadastrado, o perfil de funcionário é adicionado ao cadastro existente, sem duplicar o registro.
4. Given existe uma candidatura em análise, When um funcionário tenta rejeitá-la sem informar um motivo, Then o sistema impede a conclusão da rejeição até que um motivo seja preenchido.
5. Given existe uma candidatura em análise, When um funcionário a rejeita informando um motivo, Then o status muda para rejeitada, o motivo é registrado, e o registro é preservado no histórico.

### User Story 6 - Solicitação Externa de Evento ou Campanha com Triagem (Priority: P2)

Uma pessoa ou organização externa que deseja propor um evento ou campanha para a instituição preenche dados de contato, tipo, objetivo, data pretendida e recursos esperados. A solicitação entra como em análise até um funcionário avaliá-la, podendo aprová-la (gerando o evento/campanha correspondente) ou rejeitá-la com um motivo. Ao concluir o envio, o solicitante recebe automaticamente um e-mail de confirmação com o código de protocolo e o aviso de que a análise pode levar alguns dias.

**Why this priority**: Amplia as fontes de eventos/campanhas além da própria equipe interna, mas é um fluxo complementar à gestão interna já coberta pela User Story 3.

**Independent Test**: Pode ser testado submetendo uma solicitação externa, verificando o recebimento do e-mail de confirmação, e verificando que a equipe consegue aprová-la (criando o evento/campanha que passa a aparecer no Portal Público) ou rejeitá-la informando um motivo.

**Acceptance Scenarios**:

1. Given uma pessoa externa preenche a solicitação de evento/campanha, When ela envia o formulário, Then a solicitação é registrada com status em análise e o solicitante recebe um e-mail automático de confirmação com o código de protocolo.
2. Given existe uma solicitação em análise, When um funcionário a aprova, Then um novo evento/campanha é criado automaticamente e passa a ser exibido no Portal Público.
3. Given existe uma solicitação em análise, When um funcionário a rejeita, Then ele é obrigado a informar um motivo, e o status muda para rejeitada sem gerar evento/campanha.

### User Story 7 - Gestão de Usuários e Visão Consolidada no Painel Administrativo (Priority: P3)

Um funcionário autorizado consulta, altera ou inativa (nunca exclui) cadastros de funcionários, voluntários e doadores associados, buscando por CPF ou e-mail, com o nível de acesso de cada um definido pelo respectivo perfil. O painel também mostra uma visão consolidada com indicadores e alertas prioritários, como itens mais urgentes e cadastros pendentes de triagem.

**Why this priority**: Refina e centraliza a operação do dia a dia da equipe depois que os fluxos essenciais de captação (doação, voluntariado, vagas, eventos) já estão funcionando.

**Independent Test**: Pode ser testado buscando um usuário existente por CPF/e-mail, alterando seus dados, inativando-o e confirmando que ele deixa de ter acesso mas continua visível no histórico; e verificando que o painel de indicadores reflete corretamente itens urgentes e pendências de triagem existentes.

**Acceptance Scenarios**:

1. Given um funcionário busca um usuário por CPF ou e-mail, When o registro é encontrado, Then ele pode consultar e alterar os dados cadastrais.
2. Given um funcionário inativa um usuário, When a ação é confirmada, Then o usuário deixa de ter acesso ao sistema, mas seu registro e histórico permanecem íntegros e consultáveis.
3. Given existem itens necessários urgentes e cadastros pendentes de triagem, When um funcionário acessa a visão consolidada, Then esses itens e pendências aparecem destacados como alertas prioritários.

### User Story 8 - Divulgação Institucional (Priority: P3)

Um funcionário publica notícias e atualizações institucionais que passam a aparecer na página pública, com uma tentativa de sincronização com redes sociais já integradas — sem que uma falha nessa sincronização impeça a publicação no site.

**Why this priority**: Reforça a comunicação institucional, mas é a funcionalidade de menor impacto direto sobre a operação (doações, voluntariado, vagas) coberta pelas demais histórias.

**Independent Test**: Pode ser testado publicando uma notícia e verificando que ela aparece no Portal Público mesmo quando a sincronização com a rede social simulada falha.

**Acceptance Scenarios**:

1. Given um funcionário publica uma notícia, When a sincronização com a rede social integrada é bem-sucedida, Then a notícia aparece tanto no Portal Público quanto na rede social.
2. Given um funcionário publica uma notícia, When a sincronização com a rede social falha, Then a notícia é publicada normalmente no Portal Público e o funcionário é avisado de que a sincronização externa não ocorreu.

### User Story 9 - Autoatendimento de Voluntários e Doadores Associados (Priority: P3)

Um voluntário ativo ou um doador associado aprovado acessa, com login próprio, uma área restrita aos seus próprios dados: o voluntário consulta seus dados cadastrais e status de voluntariado; o doador associado consulta seu histórico de doações. Nenhum dos dois enxerga dados de outra pessoa. Caso esqueça a senha, o usuário pode redefini-la por e-mail, sem depender da equipe administrativa.

**Why this priority**: É um refinamento de conveniência sobre os cadastros já existentes (User Stories 4 e 2), reduzindo contato manual com a equipe para consultas simples.

**Independent Test**: Pode ser testado autenticando como um voluntário aprovado e como um doador associado, confirmando que cada um vê apenas seus próprios dados/histórico, que nenhum consegue acessar dados de outro usuário, e que ambos conseguem redefinir a senha via e-mail quando necessário.

**Acceptance Scenarios**:

1. Given um voluntário foi aprovado na triagem, When ele acessa a área de autoatendimento com seu login, Then vê seus próprios dados cadastrais e status de voluntariado.
2. Given um doador associado tem doações registradas, When ele acessa a área de autoatendimento com seu login, Then vê o histórico completo de suas próprias doações.
3. Given um voluntário ou doador associado está autenticado, When ele tenta acessar dados de outro usuário por qualquer meio da interface, Then o sistema nega o acesso.
4. Given um voluntário ou doador associado esqueceu sua senha, When ele solicita redefinição informando o e-mail cadastrado, Then recebe um link de redefinição por e-mail e consegue definir uma nova senha sem precisar contatar a equipe administrativa.

### User Story 10 - Consulta Pública de Status de Solicitações (Priority: P3)

Um voluntário com cadastro pendente, um candidato a vaga, um solicitante de evento/campanha ou um doador consulta, sem precisar de login, o status atual da própria submissão (pendente/em análise, aprovado, rejeitado ou confirmada) usando o código de protocolo recebido no momento do envio.

**Why this priority**: Reduz o contato manual da equipe para informar andamento, mas depende das triagens (User Stories 4, 5 e 6) e do fluxo de doação (User Story 2) já existirem.

**Independent Test**: Pode ser testado enviando uma candidatura, anotando o protocolo recebido, e consultando o status com esse protocolo antes e depois da triagem pela equipe; e repetindo o teste para uma doação.

**Acceptance Scenarios**:

1. Given uma submissão ou doação foi enviada, When o solicitante informa o protocolo recebido, Then o sistema exibe o status atual correspondente.
2. Given um protocolo informado não corresponde a nenhuma submissão ou doação existente, When a consulta é feita, Then o sistema informa que não encontrou nenhum registro, sem revelar dados de outras submissões.

### User Story 11 - Exercício de Direitos do Titular de Dados (LGPD) (Priority: P2)

Uma pessoa cujos dados pessoais estão no sistema (voluntário, candidato a vaga, doador associado ou solicitante externo) consulta o aviso de privacidade no Portal Público, e pode solicitar acesso aos seus próprios dados, correção, revogação do consentimento ou anonimização. A equipe administrativa recebe, avalia e atende essas solicitações pelo Painel Administrativo, e o titular acompanha o andamento pelo código de protocolo.

**Why this priority**: A coleta de dados pessoais (CPF, endereço, dados de menores de idade, currículos) começa já nas User Stories 2, 4, 5 e 6 — sem consentimento registrado e sem canal de exercício de direitos, a operação real da instituição fica em desconformidade com a LGPD desde o primeiro cadastro. A captura de consentimento (FR-051/FR-052) não pode ser adiada: ela acompanha as próprias histórias que coletam dados. O fluxo de atendimento das solicitações do titular pode vir logo em seguida.

**Independent Test**: Pode ser testado enviando um cadastro de voluntário sem aceitar o consentimento (deve ser bloqueado), depois com aceite (deve registrar data/hora e finalidade), e em seguida abrindo uma solicitação de anonimização por esse titular, verificando que a equipe consegue atendê-la, que os dados pessoais deixam de ser legíveis e que o histórico/auditoria do registro permanece íntegro.

**Acceptance Scenarios**:

1. Given um visitante preenche um formulário público que coleta dados pessoais (voluntário, candidatura, doação associativa ou solicitação externa), When ele tenta enviar sem aceitar explicitamente o aviso de privacidade, Then o sistema impede o envio e explica que o aceite é obrigatório.
2. Given um visitante aceita o aviso de privacidade e envia o formulário, When o registro é criado, Then o sistema armazena o consentimento com data/hora, finalidade e versão do texto aceito.
3. Given um titular quer exercer seus direitos, When ele acessa o Portal Público, Then encontra o aviso de privacidade e o canal de solicitação acessíveis sem login.
4. Given um titular solicita anonimização dos seus dados, When a equipe atende a solicitação, Then os dados pessoais identificáveis daquele cadastro deixam de ser legíveis no sistema, enquanto o registro, seu histórico e a trilha de auditoria permanecem íntegros.
5. Given um titular solicita anonimização mas possui doações confirmadas sujeitas a retenção legal/contábil, When a equipe avalia a solicitação, Then o sistema mantém os dados estritamente necessários à obrigação legal, anonimiza o restante, e o titular é informado do que foi retido e por quê.
6. Given um voluntário ativo revoga seu consentimento, When a revogação é registrada, Then o sistema interrompe o uso dos dados para as finalidades revogadas e sinaliza o cadastro à equipe para as providências cabíveis, sem excluir fisicamente o registro.
7. Given um titular abre uma solicitação de direitos, When ele conclui o envio, Then recebe um código de protocolo e pode consultar o status dessa solicitação sem login (FR-044).

## Edge Cases

- Como o sistema trata uma tentativa de cadastro de voluntário menor de idade sem o anexo de autorização do responsável legal?
- O que acontece quando uma candidatura a vaga é enviada sem currículo em anexo e sem descrição textual da experiência?
- Como o sistema reage quando uma solicitação externa de evento pede uma data já ocupada por um evento/campanha já confirmado?
- O que acontece quando um item necessário fica muito tempo sem atualização de quantidade?
- Como o sistema trata uma tentativa de acesso a uma funcionalidade do Painel Administrativo por um perfil sem permissão para aquela ação? → Resolvido via FR-047: o acesso é negado e a tentativa é registrada no histórico de auditoria.
- O que acontece quando a mesma pessoa (mesmo CPF/e-mail) já está cadastrada como voluntária e depois é aprovada como funcionária pela mesma candidatura? → Resolvido via FR-048: o perfil de funcionário é adicionado ao cadastro existente, sem criar um registro duplicado.
- Como o sistema trata a rejeição de um cadastro (voluntário, candidatura, solicitação de evento) sem que o funcionário informe um motivo, quando um motivo é obrigatório? → O sistema impede a conclusão da rejeição até que um motivo seja preenchido; motivo é obrigatório nas três triagens (FR-015, FR-019, FR-022).
- O que acontece se um funcionário tentar confirmar duas vezes a mesma declaração de doação, ou se o doador declarar duas vezes a mesma doação? → Resolvido via FR-050: uma doação já confirmada não pode ser confirmada de novo nem gerar nova declaração, e o sistema sinaliza ao funcionário declarações pendentes com valor e data próximos para que ele avalie se são duplicadas.
- O que acontece quando um doador declara uma doação que nunca entrou na conta da instituição (engano ou má-fé)? → Resolvido via FR-008: o funcionário não localiza a entrada no extrato, marca a declaração como não localizada com o motivo registrado, e o registro é preservado sem exclusão física.
- O que acontece com o anonimato da doação espontânea quando o doador anexa o comprovante do banco, que traz seu nome e CPF parcial? → Resolvido via FR-051: o aceite do aviso de privacidade passa a ser obrigatório nesse caso, e o sistema avisa antes do anexo que a doação deixa de ser anônima.
- O que acontece quando um voluntário ou doador associado esquece a senha da área de autoatendimento? → Resolvido via FR-046: redefinição por e-mail, sem intervenção de um funcionário.
- Como o sistema evita que alguém descubra o status de submissões de outras pessoas tentando adivinhar ou testar códigos de protocolo?
- O que acontece quando a conferência da doação pela equipe só ocorre depois que o visitante já saiu da página? → Resolvido via FR-045: o doador recebe um código de protocolo ao declarar a doação e pode consultar o status e obter a declaração de doação posteriormente, independentemente de ter permanecido na página original. Esse é o caso normal com Pix estático, não a exceção.
- O que acontece quando um titular pede anonimização mas seus dados são necessários ao cumprimento de obrigação legal (ex.: doações confirmadas sujeitas a prestação de contas)? → Resolvido via FR-055: o sistema retém apenas os dados estritamente necessários à obrigação legal, anonimiza o restante, e informa o titular sobre o que foi retido e por quê.
- O que acontece com o cadastro de um voluntário ativo que revoga o consentimento? → Resolvido via FR-057: o uso dos dados para as finalidades revogadas é interrompido e o cadastro é sinalizado à equipe, sem exclusão física do registro (FR-024).
- O que acontece com os dados pessoais de uma candidatura ou cadastro de voluntário rejeitado que ultrapassa o prazo de retenção definido? → Resolvido via FR-056: o sistema sinaliza o registro para anonimização ao fim do prazo de retenção, preservando dados estatísticos não identificáveis.

## Requirements (mandatory)

### Functional Requirements

**Portal Público**

- **FR-001**: O sistema DEVE exibir uma página institucional (história, missão e equipe) acessível sem autenticação.
- **FR-002**: O sistema DEVE listar publicamente as campanhas e eventos ativos, ocultando os que já foram encerrados ou ainda não aprovados.
- **FR-003**: O sistema DEVE listar publicamente as necessidades prioritárias de doação (itens e valores), refletindo o que a equipe interna publicou mais recentemente.
- **FR-004**: O sistema DEVE remover automaticamente da listagem pública qualquer item necessário que tenha sido baixado por ter sido suprido.

**Doação Financeira via Pix**

- **FR-005**: O sistema DEVE permitir declaração de doação financeira espontânea, sem exigir nenhum dado de identificação do doador.
- **FR-006**: O sistema DEVE permitir declaração de doação financeira associativa, coletando os dados de identificação do doador e vinculando a doação ao seu cadastro.
- **FR-007**: O sistema DEVE permitir que a equipe administrativa cadastre e atualize a chave Pix e a imagem do QR code da instituição, e DEVE exibi-las publicamente na página de doação, com opção de copiar a chave. O sistema NÃO PODE integrar API de pagamentos, gerar cobrança Pix dinâmica nem receber notificação automática de confirmação.
- **FR-007a**: Quando nenhuma chave Pix estiver cadastrada, o sistema NÃO PODE oferecer o fluxo de declaração de doação; DEVE informar que a doação digital está temporariamente indisponível e exibir o canal de contato da instituição.
- **FR-008**: O sistema DEVE registrar toda declaração de doação com status pendente, e DEVE permitir que um funcionário autorizado a confirme ou a marque como não localizada após conferência no extrato bancário da instituição, registrando autor, data e — na marcação como não localizada — o motivo. A declaração do doador NÃO PODE, por si só, alterar o status para confirmada.
- **FR-009**: O sistema NÃO PODE registrar doações de itens físicos ou de dinheiro vivo digitalmente; esses casos permanecem exclusivamente como registro físico da instituição.
- **FR-010**: O sistema DEVE disponibilizar ao doador uma declaração de doação assim que a doação for confirmada por um funcionário, acessível por meio de consulta posterior usando o código de protocolo (FR-045). O sistema NÃO PODE emitir essa declaração enquanto a doação estiver pendente ou não localizada.
- **FR-010a**: O sistema DEVE deixar explícito ao doador, na tela de declaração, que o pagamento ocorre no aplicativo do próprio banco, que a declaração não confirma o recebimento, e que a conferência é feita manualmente pela equipe.
- **FR-010b**: O sistema DEVE permitir que o doador anexe opcionalmente o comprovante bancário à declaração, e DEVE restringir o acesso a esse anexo a perfis autorizados, nunca o expondo no Portal Público.

**Cadastro de Voluntários**

- **FR-011**: O sistema DEVE permitir que qualquer visitante se cadastre como voluntário informando nome, endereço, telefone, e-mail, idade e área de interesse.
- **FR-012**: O sistema DEVE exigir anexo de autorização do responsável legal quando o cadastrando for menor de idade, e impedir o envio do cadastro sem esse anexo.
- **FR-013**: O sistema DEVE registrar todo novo cadastro de voluntário com status pendente até triagem por um funcionário.
- **FR-014**: O sistema DEVE sinalizar todo novo cadastro de voluntário submetido na visão consolidada do Painel Administrativo (FR-036), onde a equipe responsável pela triagem o encontra. A sinalização é por consulta ao painel, NÃO por envio ativo de e-mail à equipe — decisão de 2026-09-23. Consequência aceita: uma submissão permanece aguardando até que alguém abra o painel, o que é compatível com o aviso de que a análise pode levar alguns dias, já enviado ao autor (FR-049).
- **FR-015**: O sistema DEVE permitir que um funcionário aprove ou rejeite um cadastro de voluntário pendente, exigindo um motivo registrado junto ao status em caso de rejeição, e preservando o registro em ambos os casos.

**Candidatura a Vaga de Emprego**

- **FR-016**: O sistema DEVE permitir candidatura a vaga para os cargos de limpeza, cuidador, enfermagem ou cozinha, com seleção obrigatória de um desses cargos.
- **FR-017**: O sistema DEVE aceitar a candidatura com anexo de currículo em arquivo ou, na ausência de arquivo, com descrição textual da experiência, exigindo pelo menos uma das duas formas.
- **FR-018**: O sistema DEVE registrar toda candidatura com status em análise até avaliação por um funcionário.
- **FR-019**: O sistema DEVE permitir que um funcionário aprove uma candidatura, efetivando automaticamente o cadastro do candidato como funcionário (FR-048), ou a rejeite exigindo um motivo registrado junto ao status, preservando o registro em ambos os casos.

**Solicitação Externa de Evento ou Campanha**

- **FR-020**: O sistema DEVE permitir que pessoas ou organizações externas solicitem um evento ou campanha informando dados de contato, tipo, objetivo, data pretendida e recursos esperados.
- **FR-021**: O sistema DEVE registrar toda solicitação externa com status em análise até avaliação por um funcionário.
- **FR-022**: O sistema DEVE permitir que um funcionário aprove uma solicitação, gerando automaticamente o evento/campanha correspondente e publicando-o no Portal Público, ou a rejeite exigindo um motivo registrado junto ao status.

**Gestão de Usuários (Painel Administrativo)**

- **FR-023**: O sistema DEVE permitir cadastro, consulta, alteração e inativação de usuários dos perfis funcionário, voluntário e doador associado, buscáveis por CPF ou e-mail.
- **FR-024**: O sistema NÃO PODE permitir exclusão física (definitiva) do registro de nenhum usuário; a inativação é a única forma de remoção de acesso. Atender a um pedido de anonimização do titular (FR-055) NÃO configura exclusão física: os dados pessoais identificáveis deixam de ser legíveis, mas o registro, seu histórico e a trilha de auditoria permanecem íntegros.
- **FR-025**: O sistema DEVE definir o nível de acesso de cada usuário autenticado de acordo com seu perfil (funcionário, voluntário, doador associado).

**Gestão de Itens Necessários**

- **FR-026**: O sistema DEVE permitir que um funcionário cadastre, busque por nome e atualize a quantidade de itens necessários.
- **FR-027**: O sistema DEVE permitir dar baixa em um item quando ele for suprido, removendo-o automaticamente da listagem pública sem excluir seu registro histórico.
- **FR-028**: O sistema DEVE sinalizar, no Painel Administrativo, itens necessários que não recebem atualização de quantidade há **30 dias ou mais** (valor definido em 2026-09-23). O prazo DEVE ser armazenado como configuração editável pela equipe, não como constante no código, para permitir ajuste sem nova publicação do sistema.

**Gestão de Campanhas e Eventos**

- **FR-029**: O sistema DEVE permitir que um funcionário cadastre campanhas/eventos com data, descrição e recursos necessários.
- **FR-030**: O sistema DEVE verificar disponibilidade de data ao cadastrar uma campanha/evento e avisar o funcionário em caso de conflito com outro evento já confirmado. O aviso é **sinalização, nunca bloqueio**: confirmado em 2026-09-23 que o funcionário pode prosseguir com a data conflitante se assim decidir, porque só ele conhece o contexto (por exemplo, dois eventos pequenos que cabem no mesmo dia).
- **FR-031**: O sistema DEVE publicar automaticamente no Portal Público toda campanha/evento confirmado no Painel Administrativo, sem etapa manual adicional.

**Divulgação Institucional**

- **FR-032**: O sistema DEVE permitir que um funcionário publique notícias/atualizações na página pública.
- **FR-033**: O sistema DEVE tentar sincronizar cada publicação com as redes sociais integradas, sem que uma falha nessa sincronização impeça a publicação no Portal Público.

**Triagem e Auditoria**

- **FR-034**: O sistema NUNCA PODE aprovar automaticamente um cadastro de voluntário, uma candidatura a vaga ou uma solicitação de evento/campanha; toda aprovação exige ação explícita de um funcionário.
- **FR-035**: O sistema DEVE registrar data/hora de toda ação de aprovação, rejeição, alteração ou inativação realizada no Painel Administrativo. Como o acesso de funcionários ocorre por conta administrativa compartilhada (FR-040), a autoria registrada corresponde à conta utilizada, não a um funcionário individual identificado.

**Painel de Indicadores**

- **FR-036**: O sistema DEVE exibir, no Painel Administrativo, uma visão consolidada com indicadores e alertas prioritários, incluindo ao menos itens necessários mais urgentes, cadastros pendentes de triagem e declarações de doação pendentes de conferência (FR-008).

**Edição e Correção de Dados**

- **FR-037**: O sistema DEVE permitir que a equipe administrativa edite ou corrija, a qualquer momento, qualquer dado previamente cadastrado, preservando o histórico da alteração.

**Acesso e Proteção de Dados**

- **FR-038**: O sistema DEVE restringir o acesso a dados pessoais de candidatos, voluntários e doadores exclusivamente a perfis autorizados do Painel Administrativo.
- **FR-039**: O sistema DEVE funcionar corretamente nas versões mais recentes de Chrome, Firefox, Edge e Safari, e ser responsivo em desktop, tablet e smartphone para toda funcionalidade do Portal Público.

**Provisionamento de Acesso**

- **FR-040**: Ao aprovar uma candidatura a vaga, o sistema DEVE efetivar o cadastro do candidato como funcionário nos registros administrativos, sem gerar nem exigir nenhuma credencial de acesso individual — o acesso de funcionários ao Painel Administrativo ocorre por meio de uma conta administrativa (ou pequeno número de contas) compartilhada, previamente configurada pela instituição, e não por login individual atribuído a cada funcionário.

**Autoatendimento de Voluntários e Doadores Associados**

- **FR-041**: O sistema DEVE oferecer login próprio de autoatendimento para voluntários com cadastro aprovado e para doadores associados, permitindo que cada um consulte seus próprios dados cadastrais e histórico (status de voluntariado, ou histórico de doações, respectivamente).
- **FR-042**: O sistema NÃO PODE permitir que um voluntário ou doador associado autenticado visualize dados cadastrais, histórico ou status de qualquer outro usuário.

**Acompanhamento de Status pelo Público Externo**

- **FR-043**: O sistema DEVE gerar um código de protocolo único para cada cadastro de voluntário, candidatura a vaga e solicitação de evento/campanha, exibido ao autor da submissão no momento do envio.
- **FR-044**: O sistema DEVE permitir que qualquer pessoa consulte o status de uma submissão (cadastro de voluntário, candidatura a vaga, solicitação de evento/campanha, doação ou solicitação de titular de dados — FR-059) informando o código de protocolo recebido, sem necessidade de login, e sem exigir nem expor nenhum outro dado pessoal do solicitante nessa consulta.

**Rastreabilidade de Doações**

- **FR-045**: O sistema DEVE gerar um código de protocolo único para toda declaração de doação (espontânea ou associativa) no momento em que ela é registrada, exibido ao doador na conclusão do fluxo, permitindo consulta posterior do status e da declaração de doação sem exigir nenhum dado de identificação.

**Segurança de Acesso ao Autoatendimento**

- **FR-046**: O sistema DEVE permitir que um voluntário ou doador associado com login de autoatendimento redefina sua senha por meio de um link enviado ao e-mail cadastrado, sem intervenção de um funcionário.

**Controle de Acesso por Nível de Permissão**

- **FR-047**: O sistema DEVE negar o acesso e registrar a tentativa quando um perfil autenticado solicitar uma ação ou dado fora do seu nível de permissão (FR-025), sem expor detalhes internos do motivo da negação.

**Acúmulo de Perfis por Pessoa**

- **FR-048**: Quando uma candidatura aprovada (FR-019) corresponder ao mesmo CPF de um usuário já cadastrado como voluntário, o sistema DEVE adicionar o perfil de funcionário ao cadastro existente, em vez de criar um novo registro de usuário duplicado.

**Confirmação Automática de Submissão**

- **FR-049**: O sistema DEVE enviar automaticamente um e-mail de confirmação ao autor de todo cadastro de voluntário, candidatura a vaga ou solicitação de evento/campanha externa, no momento do envio, contendo o código de protocolo (FR-043) e informando que a análise pode levar alguns dias.
- **FR-049a**: O registro de um cadastro de voluntário, candidatura a vaga ou solicitação de evento/campanha NÃO PODE depender do sucesso do envio do e-mail de confirmação (FR-049); o registro é mantido mesmo se o envio falhar. Em caso de falha, o sistema DEVE tentar reenviar automaticamente o e-mail uma vez após um intervalo; se a nova tentativa também falhar, o sistema DEVE registrar a falha de envio internamente para permitir reenvio ou contato manual pela equipe.
- **FR-049b**: O sistema DEVE enviar automaticamente um e-mail ao autor da submissão quando a triagem for concluída (FR-015, FR-019, FR-022), informando se foi aprovada ou rejeitada e, na rejeição, o motivo registrado. Decisão de 2026-09-23: até então o autor só descobria o resultado consultando o protocolo, o que é passivo demais para quem se voluntariou e ficou aguardando. Aplica-se a mesma regra de resiliência do FR-049a — a falha no envio NÃO PODE reverter nem alterar a decisão de triagem já registrada.

**Integridade da Confirmação de Doação**

- **FR-050**: O sistema DEVE impedir que uma mesma declaração de doação seja confirmada mais de uma vez: se a doação já estiver com status confirmada, uma nova tentativa de confirmação NÃO PODE alterar o registro nem emitir nova declaração de doação. O sistema DEVE também sinalizar ao funcionário, na conferência, declarações pendentes com mesmo valor e data próximos entre si, para que ele avalie se são doações distintas ou uma declaração duplicada pelo mesmo doador.

**Proteção de Dados Pessoais (LGPD)**

- **FR-051**: O sistema DEVE exigir aceite explícito do aviso de privacidade em todo formulário público que colete dados pessoais (cadastro de voluntário, candidatura a vaga, declaração de doação associativa e solicitação externa de evento/campanha), impedindo o envio sem esse aceite. A declaração de doação espontânea, por não coletar dados de identificação (FR-005), está dispensada — **exceto** quando o doador optar por anexar o comprovante bancário (FR-010b), que contém dados pessoais do pagador: nesse caso o aceite passa a ser obrigatório e o sistema DEVE avisar, antes do anexo, que a doação deixa de ser anônima.
- **FR-052**: O sistema DEVE registrar, junto a cada aceite de consentimento, a data/hora, a finalidade do tratamento e a versão do texto do aviso de privacidade aceito.
- **FR-053**: O sistema DEVE disponibilizar publicamente, sem exigir login, um aviso de privacidade descrevendo quais dados são coletados, com que finalidade, por quanto tempo são retidos e por qual canal o titular exerce seus direitos.
- **FR-054**: O sistema DEVE permitir que o titular solicite acesso aos seus próprios dados e a correção deles, tanto pela área de autoatendimento (FR-041), quando aplicável, quanto por um canal público de solicitação identificado por código de protocolo.
- **FR-055**: O sistema DEVE permitir que a equipe administrativa atenda a um pedido de anonimização, tornando ilegíveis os dados pessoais identificáveis do titular sem excluir fisicamente o registro (FR-024) e preservando histórico e auditoria (FR-035). Quando parte dos dados for necessária ao cumprimento de obrigação legal ou regulatória, o sistema DEVE reter apenas esses dados, anonimizar o restante e permitir informar ao titular o que foi retido e por quê.
- **FR-056**: O sistema DEVE aplicar prazos de retenção por categoria de dado (candidaturas e cadastros de voluntário rejeitados, anexos de currículo e autorização de responsável legal), sinalizando à equipe os registros que atingiram o fim do prazo para anonimização, preservando dados estatísticos não identificáveis.
- **FR-057**: O sistema DEVE permitir que o titular revogue o consentimento previamente concedido, registrando a revogação, interrompendo o uso dos dados para as finalidades revogadas e sinalizando o cadastro à equipe administrativa, sem exclusão física do registro.
- **FR-058**: O sistema DEVE tratar os dados de menores de idade (cadastro de voluntário e anexo de autorização do responsável legal) com acesso restrito a perfis autorizados e consentimento específico do responsável legal registrado no ato do cadastro.
- **FR-059**: O sistema DEVE registrar toda solicitação de exercício de direitos do titular com código de protocolo, status e data, permitindo consulta pública do andamento pelo protocolo (FR-044) e acompanhamento das pendências pela equipe no Painel Administrativo.

**Ajuda ao Usuário do Painel Administrativo**

- **FR-060**: O sistema DEVE disponibilizar, dentro do Painel Administrativo, uma área de ajuda acessível a qualquer perfil autenticado, explicando como executar as operações do Painel em linguagem cotidiana: as três triagens e a obrigatoriedade do motivo na rejeição, a conferência de doação contra o extrato bancário, o cadastro da chave Pix, a gestão de itens necessários, campanhas, notícias e usuários, e o atendimento de pedidos do titular de dados.
- **FR-060a**: A área de ajuda DEVE conter uma seção explicitando **o que o sistema não faz**: não acessa a conta bancária da instituição, não confirma doações automaticamente, não aprova nenhuma submissão sem ação humana e não exclui fisicamente cadastros. Expectativa equivocada da equipe sobre esses pontos compromete a operação tanto quanto uma funcionalidade ausente — se a equipe supuser confirmação automática de doação, nenhuma doação será conferida.
- **FR-061**: O sistema DEVE oferecer ajuda contextual na própria tela onde a operação acontece, no mínimo na conferência de doação, na rejeição com motivo obrigatório e na anonimização, sem exigir que o usuário abra a área de ajuda (FR-060) para concluir a tarefa. Esta exigência decorre do Princípio I da constituição, segundo o qual toda tarefa administrativa frequente deve ser concluível sem consultar documentação externa — a área de ajuda é referência de consulta, não pré-requisito de uso.

## Key Entities

- **Usuário**: pessoa com acesso ao sistema. Possui um ou mais perfis (funcionário, voluntário e/ou doador associado) associados ao mesmo CPF — uma pessoa pode acumular mais de um perfil simultaneamente (FR-048) —, dados de identificação (nome, CPF, e-mail, telefone) e status (ativo/inativo). Funcionários acessam o Painel Administrativo por conta(s) administrativa(s) compartilhada(s); voluntários aprovados e doadores associados possuem login próprio de autoatendimento restrito aos seus próprios dados, com redefinição de senha por e-mail (FR-046). O cadastro de voluntário carrega ainda um código de protocolo e um status de triagem (pendente/aprovado/rejeitado) até a efetivação como voluntário ativo.
- **Doação**: registro da declaração de uma contribuição financeira feita via Pix fora do sistema. Possui valor e data informados pelo doador, tipo (espontânea ou associativa), status (pendente/confirmada/não localizada, com motivo quando não localizada), anexo opcional do comprovante bancário (FR-010b, de acesso restrito), vínculo opcional com um doador associado, código de protocolo (FR-045), data do registro e — quando conferida — autor e data da conferência.
- **Chave Pix Institucional**: dado de configuração cadastrado pela equipe administrativa e exibido publicamente na página de doação. Possui a chave Pix, a imagem do QR code, e autor e data da última atualização. Não é credencial de acesso e não dá ao sistema nenhum poder sobre a conta bancária da instituição.
- **Item Necessário**: necessidade prioritária de doação (item físico ou valor). Possui nome, quantidade/valor necessário, data da última atualização e status (ativo/suprido).
- **Campanha/Evento**: iniciativa institucional. Possui data, descrição, recursos necessários, origem (cadastro interno ou solicitação externa aprovada) e status (ativo/encerrado).
- **Candidatura a Vaga**: submissão de candidato a emprego. Possui cargo pretendido, dados pessoais, currículo anexado ou descrição textual de experiência, código de protocolo e status (em análise/aprovada/rejeitada, com motivo quando rejeitada).
- **Solicitação de Evento/Campanha Externa**: submissão de terceiros propondo um evento/campanha. Possui dados de contato, tipo, objetivo, data pretendida, recursos esperados, código de protocolo e status (em análise/aprovada/rejeitada, com motivo quando rejeitada).
- **Notícia/Atualização Institucional**: conteúdo de divulgação publicado no Portal Público, com status de sincronização com redes sociais integradas.
- **Autorização de Responsável Legal**: anexo vinculado ao cadastro de um voluntário menor de idade, acessível apenas a perfis autorizados.
- **Registro de Consentimento**: comprovação do aceite do aviso de privacidade por um titular. Possui vínculo com a submissão/cadastro correspondente, data/hora do aceite, finalidade do tratamento, versão do texto aceito e status (vigente/revogado, com data da revogação quando aplicável).
- **Solicitação de Titular de Dados**: pedido de exercício de direito previsto na LGPD (acesso, correção, anonimização ou revogação de consentimento). Possui tipo, dados de contato do solicitante, código de protocolo, status (em análise/atendida/recusada, com motivo quando recusada) e data.

## Success Criteria (mandatory)

### Measurable Outcomes

- **SC-001**: A declaração de doação fica disponível ao doador, pela consulta por protocolo, imediatamente após um funcionário confirmar a doação no Painel Administrativo — o tempo total percebido pelo doador depende da rotina de conferência da equipe (SC-001a), não do sistema.
- **SC-001a**: A equipe administrativa consegue conferir e confirmar uma declaração de doação pendente contra o extrato bancário em menos de 2 minutos por declaração, e a instituição se compromete a fazer essa conferência ao menos uma vez por dia útil.
- **SC-002**: Uma atualização em um item necessário (cadastro, quantidade ou baixa) aparece refletida no Portal Público em até 1 minuto após o registro.
- **SC-003**: 100% das campanhas, eventos e necessidades vigentes são exibidos corretamente no Portal Público sem exigir login, em qualquer teste de acesso público.
- **SC-004**: Em testes de controle de acesso, 0% dos dados pessoais de candidatos, voluntários e doadores ficam visíveis a perfis não autorizados.
- **SC-005**: 100% das funcionalidades do Portal Público operam corretamente nas versões mais recentes de Chrome, Firefox, Edge e Safari, em telas de desktop, tablet e smartphone.
- **SC-006**: 100% das campanhas/eventos aprovados no Painel Administrativo aparecem no Portal Público sem nenhuma ação manual adicional.
- **SC-007**: A equipe de triagem recebe notificação de um novo cadastro de voluntário em até 5 minutos após a submissão.
- **SC-008**: 100% dos dados cadastrados no sistema podem ser localizados e corrigidos posteriormente pela equipe administrativa.
- **SC-009**: Um visitante consegue localizar a chave Pix/QR code e concluir a declaração de uma doação espontânea, do acesso à página até o recebimento do protocolo, em menos de 2 minutos (sem contar o tempo do pagamento no aplicativo do banco).
- **SC-010**: A equipe administrativa consegue publicar ou atualizar uma necessidade de doação no Portal Público em menos de 5 minutos, sem depender de planilhas ou publicações manuais em redes sociais.
- **SC-011**: Um solicitante externo consegue consultar o status atual da própria submissão usando o protocolo recebido, sem precisar contatar a equipe por telefone ou e-mail, em menos de 1 minuto.
- **SC-012**: Um voluntário aprovado ou um doador associado consegue consultar seus próprios dados/histórico pela área de autoatendimento sem depender de a equipe administrativa levantar essa informação manualmente.
- **SC-013**: O e-mail automático de confirmação de envio (FR-049) é entregue ao autor da submissão em até 5 minutos após o registro.
- **SC-014**: 100% dos registros criados por formulários públicos que coletam dados pessoais possuem um consentimento associado, com data/hora, finalidade e versão do aviso de privacidade — verificável em qualquer auditoria de amostra.
- **SC-015**: Uma solicitação de exercício de direito do titular (acesso, correção, anonimização ou revogação) é respondida ao solicitante em até 15 dias corridos a partir do registro.
- **SC-016**: Após o atendimento de um pedido de anonimização, 0% dos dados pessoais identificáveis daquele titular permanecem legíveis nas telas e consultas do sistema, enquanto 100% dos registros de histórico e auditoria vinculados continuam existindo.

## Assumptions

- O fuso horário de referência para datas de eventos e prazos é o horário de Brasília (America/Sao_Paulo).
- A instituição fornece previamente os textos e imagens da página institucional (história, missão, equipe); a geração desse conteúdo não faz parte do sistema.
- A lista de cargos disponíveis para candidatura (limpeza, cuidador, enfermagem, cozinha) é fixa nesta versão; alterá-la exige nova validação de escopo.
- A maioridade civil brasileira (18 anos) é o critério usado para exigir ou dispensar o anexo de autorização do responsável legal no cadastro de voluntário.
- Anexos (currículo, autorização de responsável legal) aceitam formatos comuns de documento e imagem, com tamanho máximo razoável definido tecnicamente na fase de planejamento.
- Não existe janela de espera automática: como não há API de pagamentos, toda declaração de doação nasce pendente e assim permanece até a conferência humana contra o extrato bancário (FR-008), sem ser descartada. O doador acompanha a mudança de status por meio do código de protocolo (FR-045), independentemente de ter permanecido na página original.
- O sistema não integra nenhuma API de pagamentos e não tem acesso à conta bancária da instituição. A chave Pix e o QR code são conteúdo institucional cadastrado pela equipe (FR-007); a conciliação entre o extrato bancário e as declarações de doação é trabalho humano, conforme o Princípio VII da constituição (versão 2.0.0). Consequência aceita conscientemente: a confirmação de uma doação depende da rotina da equipe, e uma doação real cujo doador não declare nada no site não aparece no sistema.
- Toda a equipe de funcionários com acesso ao Painel Administrativo pode visualizar a fila de triagem pendente; a notificação de novo cadastro/candidatura/solicitação chega a esse grupo, não a uma pessoa específica pré-configurada.
- Devido ao pequeno número de pessoas na administração, o acesso de funcionários ao Painel Administrativo é feito por uma conta administrativa (ou um pequeno número de contas) compartilhada entre a equipe, e não por credencial individual gerada por funcionário; a aprovação de uma candidatura efetiva apenas o registro cadastral do novo funcionário, sem provisionar acesso individual ao sistema. Como consequência, o registro de auditoria (FR-035) identifica a conta institucional utilizada em cada ação, não o funcionário individual que a executou.
- Voluntários aprovados e doadores associados usam autenticação própria padrão (login e senha, com redefinição de senha por e-mail — FR-046) para acessar sua área de autoatendimento restrita aos próprios dados.
- O código de protocolo usado na consulta pública de status (FR-044) é gerado de forma não sequencial e não previsível, funcionando como único identificador necessário para a consulta, de modo a evitar que alguém descubra o status de submissões de terceiros por tentativa/adivinhação. O mesmo padrão de protocolo se aplica às doações (FR-045).
- A hospedagem do sistema roda em plano gratuito (Vercel + Neon/PostgreSQL), o que implica ausência de domínio próprio, SLA ou suporte pago, e possível hibernação do banco de dados após período de inatividade (podendo afetar pontualmente o prazo do SC-001). Caso a operação exija recursos além do plano gratuito no futuro, a contratação de um plano superior é decisão e custo da instituição, fora da manutenção contínua do grupo.
- A conformidade com a LGPD faz parte do escopo desta versão no que o sistema pode garantir tecnicamente: consentimento registrado, aviso de privacidade publicado, canal de exercício de direitos, anonimização e prazos de retenção (FR-051 a FR-059). Continuam sendo responsabilidade organizacional da instituição, fora do sistema: a designação do encarregado (DPO), a redação jurídica do texto do aviso de privacidade e a definição formal das bases legais e dos prazos de retenção por categoria — o sistema apenas aplica os prazos e textos que a instituição fornecer.
- O prazo de resposta ao titular adotado no SC-015 (15 dias corridos) segue o parâmetro da LGPD para solicitações de acesso; prazos diferentes exigem nova validação com a instituição.
- Doações espontâneas não coletam dados de identificação (FR-005) e, portanto, não geram registro de consentimento nem são alcançadas por pedidos de anonimização — não há titular identificável vinculado a elas.
- Fica fora de escopo desta versão: cadastro/gestão completa de residentes, controle de consultas e exames, integração automática (sem intervenção humana) com redes sociais além da tentativa de sincronização na publicação, geração de conteúdo por IA, relatórios avançados/BI, aplicativo móvel nativo, gateway de pagamento próprio, integração com sistemas externos de saúde (CNES, prontuários) e módulo financeiro completo — conforme o Princípio VI da constituição do projeto.