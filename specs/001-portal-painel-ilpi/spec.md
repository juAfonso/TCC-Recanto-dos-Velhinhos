# Feature Specification: Portal Público e Painel Administrativo do Recanto dos Velhinhos

**Feature Branch**: `001-portal-painel-ilpi`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Construir a aplicação web do Recanto dos Velhinhos Francisco Gonçalves Barbosa (ILPI em Pinheiral/RJ), substituindo a gestão manual atual (planilhas Excel e Instagram) por uma plataforma digital com dois módulos: Portal Público e Painel Administrativo. Ver detalhamento completo de Portal Público, Painel Administrativo, critérios de aceitação e itens fora de escopo no prompt original do usuário."

## Clarifications

### Session 2026-09-04

- Q: Quando a API de pagamentos envia duas notificações confirmando a mesma doação Pix (webhook duplicado), como o sistema deve reagir? → A: O sistema identifica que a doação já está confirmada (por protocolo/ID da transação) e ignora silenciosamente a segunda notificação, sem alterar nada.
- Q: Quando a API de pagamentos de terceiros está indisponível ou retorna erro ao tentar iniciar uma doação Pix (gerar QR code), o que o sistema deve fazer? → A: O sistema não cria o registro de doação; exibe uma mensagem de erro ao visitante e sugere tentar novamente em instantes.
- Q: Se o envio automático do e-mail de confirmação (FR-049) falhar, o cadastro de voluntário/candidatura/solicitação já enviado deve ser mantido, ou a falha deve impedir/reverter o registro? → A: O registro é sempre mantido. O sistema tenta reenviar o e-mail automaticamente mais uma vez após um intervalo; se ainda assim falhar, o sistema registra a falha de envio internamente para que a equipe possa reenviar ou contatar manualmente.
- Q: Qual o valor concreto da "janela razoável" de espera antes de uma doação Pix ser tratada como definitivamente pendente (aguardando conciliação manual)? → A: 15 minutos.

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

Um visitante decide doar dinheiro. Ele escolhe entre doação espontânea (sem se identificar) ou doação associativa (informando seus dados), digita o valor, e o sistema gera um QR code/comprovante consultando uma API de pagamentos de terceiros compatível com Pix, exibindo antes disso um código de protocolo único que permite consultar o status e recuperar o comprovante posteriormente, mesmo sem identificação. Enquanto o visitante aguarda na tela, o sistema consulta periodicamente o status do pagamento diretamente na API; se a confirmação não ocorrer dentro do prazo, a doação permanece registrada como pendente e pode ser verificada manualmente depois.

**Why this priority**: É a principal fonte de sustentabilidade financeira digital da instituição e o motivo prático mais forte para o visitante retornar ao site.

**Independent Test**: Pode ser testado de ponta a ponta simulando uma doação espontânea e uma associativa, confirmando a geração do protocolo, do QR code/comprovante e o registro correto da doação com o status esperado (confirmada ou pendente), incluindo a consulta posterior do status via protocolo.

**Acceptance Scenarios**:

1. Given um visitante escolhe doação espontânea e informa um valor, When ele conclui o fluxo, Then recebe um código de protocolo, um QR code/comprovante Pix, e a doação é registrada sem exigir nenhum dado de identificação.
2. Given um visitante escolhe doação associativa e informa seus dados, When ele conclui o fluxo, Then a doação é registrada e vinculada ao seu cadastro de doador.
3. Given uma doação foi iniciada e o QR code foi gerado, When o sistema consulta o status do pagamento na API do provedor e ele confirma o recebimento, Then o status da doação muda de pendente para confirmada e um comprovante fica disponível em poucos segundos.
4. Given uma doação está com status pendente, When o administrador aciona a verificação manual no painel, Then o sistema consulta a API do provedor e atualiza o status da doação conforme o retorno, sem duplicar registros.
5. Given uma doação foi iniciada, When nenhuma confirmação é obtida dentro do prazo esperado, seja pela consulta automática, seja pela verificação manual do administrador, Then a doação permanece registrada com status pendente, sem ser perdida ou duplicada.
6. Given uma doação espontânea foi iniciada e o visitante recebeu o código de protocolo, When ele sai da página antes da confirmação do pagamento e retorna posteriormente informando o protocolo, Then ele consegue consultar o status atualizado da doação e, se já confirmada, baixar o comprovante — sem precisar fornecer nenhum dado de identificação.

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

## Edge Cases

- Como o sistema trata uma tentativa de cadastro de voluntário menor de idade sem o anexo de autorização do responsável legal?
- O que acontece quando uma candidatura a vaga é enviada sem currículo em anexo e sem descrição textual da experiência?
- Como o sistema reage quando uma solicitação externa de evento pede uma data já ocupada por um evento/campanha já confirmado?
- O que acontece quando um item necessário fica muito tempo sem atualização de quantidade?
- Como o sistema trata uma tentativa de acesso a uma funcionalidade do Painel Administrativo por um perfil sem permissão para aquela ação? → Resolvido via FR-047: o acesso é negado e a tentativa é registrada no histórico de auditoria.
- O que acontece quando a mesma pessoa (mesmo CPF/e-mail) já está cadastrada como voluntária e depois é aprovada como funcionária pela mesma candidatura? → Resolvido via FR-048: o perfil de funcionário é adicionado ao cadastro existente, sem criar um registro duplicado.
- Como o sistema trata a rejeição de um cadastro (voluntário, candidatura, solicitação de evento) sem que o funcionário informe um motivo, quando um motivo é obrigatório? → O sistema impede a conclusão da rejeição até que um motivo seja preenchido; motivo é obrigatório nas três triagens (FR-015, FR-019, FR-022).
- O que acontece se a mesma doação for confirmada duas vezes pela API de pagamentos (notificação duplicada)? → Resolvido via FR-050: o sistema identifica a doação já confirmada pelo protocolo/ID da transação e ignora silenciosamente a segunda notificação, sem duplicar registro nem reprocessar o comprovante.
- O que acontece quando um voluntário ou doador associado esquece a senha da área de autoatendimento? → Resolvido via FR-046: redefinição por e-mail, sem intervenção de um funcionário.
- Como o sistema evita que alguém descubra o status de submissões de outras pessoas tentando adivinhar ou testar códigos de protocolo?
- O que acontece quando a confirmação de pagamento de uma doação Pix chega depois que o visitante já saiu da página, sem ver o comprovante em tempo real? → Resolvido via FR-045: o doador recebe um código de protocolo ao iniciar a doação e pode consultar o status e recuperar o comprovante posteriormente, independentemente de ter permanecido na página original.

## Requirements (mandatory)

### Functional Requirements

**Portal Público**

- **FR-001**: O sistema DEVE exibir uma página institucional (história, missão e equipe) acessível sem autenticação.
- **FR-002**: O sistema DEVE listar publicamente as campanhas e eventos ativos, ocultando os que já foram encerrados ou ainda não aprovados.
- **FR-003**: O sistema DEVE listar publicamente as necessidades prioritárias de doação (itens e valores), refletindo o que a equipe interna publicou mais recentemente.
- **FR-004**: O sistema DEVE remover automaticamente da listagem pública qualquer item necessário que tenha sido baixado por ter sido suprido.

**Doação Financeira via Pix**

- **FR-005**: O sistema DEVE permitir doação financeira espontânea, sem exigir nenhum dado de identificação do doador.
- **FR-006**: O sistema DEVE permitir doação financeira associativa, coletando os dados de identificação do doador e vinculando a doação ao seu cadastro.
- **FR-007**: O sistema DEVE gerar um QR code e comprovante Pix por meio de uma API de pagamentos de terceiros para cada doação financeira iniciada.
- **FR-007a**: Quando a API de pagamentos de terceiros estiver indisponível ou retornar erro ao gerar o QR code, o sistema NÃO PODE registrar a doação; DEVE exibir uma mensagem de erro ao visitante e sugerir nova tentativa.
- **FR-008**: O sistema DEVE registrar a doação com status pendente até a confirmação do pagamento pela API de pagamentos, e atualizar o status para confirmada assim que a confirmação chegar.
- **FR-009**: O sistema NÃO PODE registrar doações de itens físicos ou de dinheiro vivo digitalmente; esses casos permanecem exclusivamente como registro físico da instituição.
- **FR-010**: O sistema DEVE disponibilizar o comprovante da doação ao doador em poucos segundos após a confirmação do pagamento, tanto na tela em que a doação foi iniciada quanto por meio de consulta posterior usando o código de protocolo (FR-045).

**Cadastro de Voluntários**

- **FR-011**: O sistema DEVE permitir que qualquer visitante se cadastre como voluntário informando nome, endereço, telefone, e-mail, idade e área de interesse.
- **FR-012**: O sistema DEVE exigir anexo de autorização do responsável legal quando o cadastrando for menor de idade, e impedir o envio do cadastro sem esse anexo.
- **FR-013**: O sistema DEVE registrar todo novo cadastro de voluntário com status pendente até triagem por um funcionário.
- **FR-014**: O sistema DEVE notificar a equipe responsável pela triagem sempre que um novo cadastro de voluntário for submetido.
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
- **FR-024**: O sistema NÃO PODE permitir exclusão definitiva de nenhum usuário; inativação é a única forma de remoção de acesso.
- **FR-025**: O sistema DEVE definir o nível de acesso de cada usuário autenticado de acordo com seu perfil (funcionário, voluntário, doador associado).

**Gestão de Itens Necessários**

- **FR-026**: O sistema DEVE permitir que um funcionário cadastre, busque por nome e atualize a quantidade de itens necessários.
- **FR-027**: O sistema DEVE permitir dar baixa em um item quando ele for suprido, removendo-o automaticamente da listagem pública sem excluir seu registro histórico.
- **FR-028**: O sistema DEVE sinalizar, no Painel Administrativo, itens necessários que não recebem atualização de quantidade por um período prolongado.

**Gestão de Campanhas e Eventos**

- **FR-029**: O sistema DEVE permitir que um funcionário cadastre campanhas/eventos com data, descrição e recursos necessários.
- **FR-030**: O sistema DEVE verificar disponibilidade de data ao cadastrar uma campanha/evento e avisar o funcionário em caso de conflito com outro evento já confirmado.
- **FR-031**: O sistema DEVE publicar automaticamente no Portal Público toda campanha/evento confirmado no Painel Administrativo, sem etapa manual adicional.

**Divulgação Institucional**

- **FR-032**: O sistema DEVE permitir que um funcionário publique notícias/atualizações na página pública.
- **FR-033**: O sistema DEVE tentar sincronizar cada publicação com as redes sociais integradas, sem que uma falha nessa sincronização impeça a publicação no Portal Público.

**Triagem e Auditoria**

- **FR-034**: O sistema NUNCA PODE aprovar automaticamente um cadastro de voluntário, uma candidatura a vaga ou uma solicitação de evento/campanha; toda aprovação exige ação explícita de um funcionário.
- **FR-035**: O sistema DEVE registrar data/hora de toda ação de aprovação, rejeição, alteração ou inativação realizada no Painel Administrativo. Como o acesso de funcionários ocorre por conta administrativa compartilhada (FR-040), a autoria registrada corresponde à conta utilizada, não a um funcionário individual identificado.

**Painel de Indicadores**

- **FR-036**: O sistema DEVE exibir, no Painel Administrativo, uma visão consolidada com indicadores e alertas prioritários, incluindo ao menos itens necessários mais urgentes e cadastros pendentes de triagem.

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
- **FR-044**: O sistema DEVE permitir que qualquer pessoa consulte o status de uma submissão (cadastro de voluntário, candidatura a vaga, solicitação de evento/campanha ou doação) informando o código de protocolo recebido, sem necessidade de login, e sem exigir nem expor nenhum outro dado pessoal do solicitante nessa consulta.

**Rastreabilidade de Doações**

- **FR-045**: O sistema DEVE gerar um código de protocolo único para toda doação (espontânea ou associativa) no momento em que ela é iniciada, exibido ao doador antes da geração do QR code Pix, permitindo consulta posterior do status e do comprovante sem exigir nenhum dado de identificação.

**Segurança de Acesso ao Autoatendimento**

- **FR-046**: O sistema DEVE permitir que um voluntário ou doador associado com login de autoatendimento redefina sua senha por meio de um link enviado ao e-mail cadastrado, sem intervenção de um funcionário.

**Controle de Acesso por Nível de Permissão**

- **FR-047**: O sistema DEVE negar o acesso e registrar a tentativa quando um perfil autenticado solicitar uma ação ou dado fora do seu nível de permissão (FR-025), sem expor detalhes internos do motivo da negação.

**Acúmulo de Perfis por Pessoa**

- **FR-048**: Quando uma candidatura aprovada (FR-019) corresponder ao mesmo CPF de um usuário já cadastrado como voluntário, o sistema DEVE adicionar o perfil de funcionário ao cadastro existente, em vez de criar um novo registro de usuário duplicado.

**Confirmação Automática de Submissão**

- **FR-049**: O sistema DEVE enviar automaticamente um e-mail de confirmação ao autor de todo cadastro de voluntário, candidatura a vaga ou solicitação de evento/campanha externa, no momento do envio, contendo o código de protocolo (FR-043) e informando que a análise pode levar alguns dias.
- **FR-049a**: O registro de um cadastro de voluntário, candidatura a vaga ou solicitação de evento/campanha NÃO PODE depender do sucesso do envio do e-mail de confirmação (FR-049); o registro é mantido mesmo se o envio falhar. Em caso de falha, o sistema DEVE tentar reenviar automaticamente o e-mail uma vez após um intervalo; se a nova tentativa também falhar, o sistema DEVE registrar a falha de envio internamente para permitir reenvio ou contato manual pela equipe.

**Idempotência de Confirmação de Pagamento**

- **FR-050**: O sistema DEVE tratar de forma idempotente as notificações de confirmação de pagamento recebidas da API de pagamentos para uma mesma doação: se a doação já estiver com status confirmada, uma nova notificação para o mesmo protocolo/ID de transação NÃO PODE alterar o registro nem gerar novo comprovante.

## Key Entities

- **Usuário**: pessoa com acesso ao sistema. Possui um ou mais perfis (funcionário, voluntário e/ou doador associado) associados ao mesmo CPF — uma pessoa pode acumular mais de um perfil simultaneamente (FR-048) —, dados de identificação (nome, CPF, e-mail, telefone) e status (ativo/inativo). Funcionários acessam o Painel Administrativo por conta(s) administrativa(s) compartilhada(s); voluntários aprovados e doadores associados possuem login próprio de autoatendimento restrito aos seus próprios dados, com redefinição de senha por e-mail (FR-046). O cadastro de voluntário carrega ainda um código de protocolo e um status de triagem (pendente/aprovado/rejeitado) até a efetivação como voluntário ativo.
- **Doação**: registro de uma contribuição financeira via Pix. Possui valor, tipo (espontânea ou associativa), status (pendente/confirmada), vínculo opcional com um doador associado, código de protocolo (FR-045) e data.
- **Item Necessário**: necessidade prioritária de doação (item físico ou valor). Possui nome, quantidade/valor necessário, data da última atualização e status (ativo/suprido).
- **Campanha/Evento**: iniciativa institucional. Possui data, descrição, recursos necessários, origem (cadastro interno ou solicitação externa aprovada) e status (ativo/encerrado).
- **Candidatura a Vaga**: submissão de candidato a emprego. Possui cargo pretendido, dados pessoais, currículo anexado ou descrição textual de experiência, código de protocolo e status (em análise/aprovada/rejeitada, com motivo quando rejeitada).
- **Solicitação de Evento/Campanha Externa**: submissão de terceiros propondo um evento/campanha. Possui dados de contato, tipo, objetivo, data pretendida, recursos esperados, código de protocolo e status (em análise/aprovada/rejeitada, com motivo quando rejeitada).
- **Notícia/Atualização Institucional**: conteúdo de divulgação publicado no Portal Público, com status de sincronização com redes sociais integradas.
- **Autorização de Responsável Legal**: anexo vinculado ao cadastro de um voluntário menor de idade, acessível apenas a perfis autorizados.

## Success Criteria (mandatory)

### Measurable Outcomes

- **SC-001**: O comprovante de uma doação Pix fica disponível ao doador em até 10 segundos após a confirmação do pagamento, em condições normais de operação (ressalvado o efeito pontual de hibernação do banco de dados em caso de inatividade prolongada, conforme registrado em Assumptions).
- **SC-002**: Uma atualização em um item necessário (cadastro, quantidade ou baixa) aparece refletida no Portal Público em até 1 minuto após o registro.
- **SC-003**: 100% das campanhas, eventos e necessidades vigentes são exibidos corretamente no Portal Público sem exigir login, em qualquer teste de acesso público.
- **SC-004**: Em testes de controle de acesso, 0% dos dados pessoais de candidatos, voluntários e doadores ficam visíveis a perfis não autorizados.
- **SC-005**: 100% das funcionalidades do Portal Público operam corretamente nas versões mais recentes de Chrome, Firefox, Edge e Safari, em telas de desktop, tablet e smartphone.
- **SC-006**: 100% das campanhas/eventos aprovados no Painel Administrativo aparecem no Portal Público sem nenhuma ação manual adicional.
- **SC-007**: A equipe de triagem recebe notificação de um novo cadastro de voluntário em até 5 minutos após a submissão.
- **SC-008**: 100% dos dados cadastrados no sistema podem ser localizados e corrigidos posteriormente pela equipe administrativa.
- **SC-009**: Um visitante consegue concluir uma doação espontânea via Pix, do início ao recebimento do QR code, em menos de 2 minutos.
- **SC-010**: A equipe administrativa consegue publicar ou atualizar uma necessidade de doação no Portal Público em menos de 5 minutos, sem depender de planilhas ou publicações manuais em redes sociais.
- **SC-011**: Um solicitante externo consegue consultar o status atual da própria submissão usando o protocolo recebido, sem precisar contatar a equipe por telefone ou e-mail, em menos de 1 minuto.
- **SC-012**: Um voluntário aprovado ou um doador associado consegue consultar seus próprios dados/histórico pela área de autoatendimento sem depender de a equipe administrativa levantar essa informação manualmente.
- **SC-013**: O e-mail automático de confirmação de envio (FR-049) é entregue ao autor da submissão em até 5 minutos após o registro.

## Assumptions

- O fuso horário de referência para datas de eventos e prazos é o horário de Brasília (America/Sao_Paulo).
- A instituição fornece previamente os textos e imagens da página institucional (história, missão, equipe); a geração desse conteúdo não faz parte do sistema.
- A lista de cargos disponíveis para candidatura (limpeza, cuidador, enfermagem, cozinha) é fixa nesta versão; alterá-la exige nova validação de escopo.
- A maioridade civil brasileira (18 anos) é o critério usado para exigir ou dispensar o anexo de autorização do responsável legal no cadastro de voluntário.
- Anexos (currículo, autorização de responsável legal) aceitam formatos comuns de documento e imagem, com tamanho máximo razoável definido tecnicamente na fase de planejamento.
- Quando a confirmação de pagamento de uma doação Pix não chega dentro de uma janela de 15 minutos após o início da doação, a doação permanece com status pendente, disponível para consulta e conciliação manual pela equipe, sem ser descartada; o doador pode acompanhar essa mudança de status posteriormente por meio do código de protocolo (FR-045), independentemente de ter permanecido na página original.
- Toda a equipe de funcionários com acesso ao Painel Administrativo pode visualizar a fila de triagem pendente; a notificação de novo cadastro/candidatura/solicitação chega a esse grupo, não a uma pessoa específica pré-configurada.
- Devido ao pequeno número de pessoas na administração, o acesso de funcionários ao Painel Administrativo é feito por uma conta administrativa (ou um pequeno número de contas) compartilhada entre a equipe, e não por credencial individual gerada por funcionário; a aprovação de uma candidatura efetiva apenas o registro cadastral do novo funcionário, sem provisionar acesso individual ao sistema. Como consequência, o registro de auditoria (FR-035) identifica a conta institucional utilizada em cada ação, não o funcionário individual que a executou.
- Voluntários aprovados e doadores associados usam autenticação própria padrão (login e senha, com redefinição de senha por e-mail — FR-046) para acessar sua área de autoatendimento restrita aos próprios dados.
- O código de protocolo usado na consulta pública de status (FR-044) é gerado de forma não sequencial e não previsível, funcionando como único identificador necessário para a consulta, de modo a evitar que alguém descubra o status de submissões de terceiros por tentativa/adivinhação. O mesmo padrão de protocolo se aplica às doações (FR-045).
- A hospedagem do sistema roda em plano gratuito (Vercel + Neon/PostgreSQL), o que implica ausência de domínio próprio, SLA ou suporte pago, e possível hibernação do banco de dados após período de inatividade (podendo afetar pontualmente o prazo do SC-001). Caso a operação exija recursos além do plano gratuito no futuro, a contratação de um plano superior é decisão e custo da instituição, fora da manutenção contínua do grupo.
- Fica fora de escopo desta versão: cadastro/gestão completa de residentes, controle de consultas e exames, integração automática (sem intervenção humana) com redes sociais além da tentativa de sincronização na publicação, geração de conteúdo por IA, relatórios avançados/BI, aplicativo móvel nativo, gateway de pagamento próprio, integração com sistemas externos de saúde (CNES, prontuários) e módulo financeiro completo — conforme o Princípio VI da constituição do projeto.