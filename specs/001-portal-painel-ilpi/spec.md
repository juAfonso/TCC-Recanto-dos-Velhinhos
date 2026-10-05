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

- Q: O CSU01 mantém a API de pagamentos dinâmica (QR code gerado por terceiros + confirmação automática) ou passa a usar Pix estático? → A: Pix estático. A instituição cadastra sua chave Pix e/ou a imagem do QR code no Painel Administrativo, e o Portal Público apenas os exibe. O sistema não integra nenhuma API de pagamentos, não gera cobrança dinâmica e não recebe webhook de confirmação. Motivação: eliminar a dependência de contratação de provedor e de conta PJ habilitada. **[A parte "imagem do QR code" foi substituída em 2026-10-03: o Portal gera o QR code estático a partir da chave — ver Session 2026-10-03.]**
- Q: Sem API, como a doação passa a existir dentro do sistema? → A: O doador paga no aplicativo do próprio banco e, em seguida, **declara** a doação no site (valor, data e, opcionalmente, anexo do comprovante bancário). O sistema registra a declaração com status pendente e emite código de protocolo. Um funcionário confere a entrada no extrato bancário da instituição e confirma (ou rejeita) a declaração no Painel Administrativo. A declaração do doador nunca equivale, por si só, a confirmação de recebimento. **[Em 2026-10-04 a declaração passou a ser só o clique em "Já fiz o Pix", sem valor/data digitados, sem anexo e sem protocolo — ver Session 2026-10-04.]**

### Session 2026-09-23 — Decisões da equipe (não dependem da instituição)

- Q: O FR-014 exige notificar a equipe de triagem a cada novo cadastro de voluntário. Isso será e-mail à conta institucional ou apenas o alerta no Painel Administrativo? → A: Apenas o alerta no painel. Não há envio ativo de e-mail à equipe. Consequência aceita conscientemente: uma submissão aguarda até que alguém abra o painel; isso é compatível com o aviso de "a análise pode levar alguns dias" que o autor já recebe (FR-049). O e-mail ao **autor** da submissão continua existindo normalmente.
- Q: Qual o valor concreto do "período prolongado" sem atualização de item necessário (FR-028)? → A: 30 dias, valor que o protótipo já usava. Fica como configuração editável, não como constante no código.
- Q: O conflito de data ao cadastrar campanha/evento (FR-030) é aviso ou bloqueio? → A: Aviso. Confirmação do que o spec já previa — o funcionário pode prosseguir com a data conflitante, porque só ele conhece o contexto.
- Q: O guia de uso para a equipe do Recanto será documento entregue à parte ou uma área dentro do sistema? → A: Uma área **dentro do Painel Administrativo** (FR-060), complementada por ajuda contextual nas telas menos autoexplicativas (FR-061). Motivo: documento entregue se perde, fica desatualizado no computador de alguém e não alcança quem entrar na instituição anos depois; a página no Painel está sempre disponível a quem opera o sistema. Esta escolha **amplia o escopo** e por isso exige atualização do PRD, conforme a regra do CLAUDE.md. Optou-se por registrar como requisitos do Painel, e **não** como um CSU12: uma tela de ajuda não é um caso de uso de negócio — não há ator atingindo um objetivo institucional —, e criar um décimo segundo caso de uso obrigaria a renumerar e reescrever referências a "11 casos de uso" em todo o documento do TCC sem ganho de clareza.

### Session 2026-09-30 — Prazo de retenção (FR-056)

- Q: Por quanto tempo o sistema guarda os dados de candidaturas e cadastros de voluntário não aprovados, incluindo currículo e demais anexos? → A: **6 meses**, contados da conclusão da triagem. A LGPD não fixa prazo em dias — exige que o dado seja eliminado ou anonimizado quando a finalidade (avaliar a pessoa para a vaga ou o voluntariado) se encerra (arts. 6º, 15 e 16); 6 meses cobre o processo seletivo e um eventual reaproveitamento próximo. Foi descartada a opção de "banco de currículos" com retenção maior mediante consentimento específico: um prazo único é mais simples de explicar no aviso de privacidade e de operar. O prazo segue como configuração editável, não constante no código. A instituição não foi consultada separadamente sobre o prazo: ele constará do rascunho do aviso de privacidade que o grupo redige e que a instituição aprova — é nessa aprovação que o prazo se torna formalmente da instituição.

### Session 2026-10-03 — QR code Pix gerado com o valor (FR-007)

- Q: O QR code da página de doação continua sendo uma imagem enviada pela equipe, ou o Portal o gera a partir da chave cadastrada, já com o valor escolhido pelo doador? → A: **O Portal gera.** A equipe cadastra só a chave, o nome do recebedor e a cidade; o navegador do doador monta o BR Code de um Pix **estático** (padrão EMV do Banco Central, o mesmo texto do "copia e cola") com o valor escolhido e o desenha como QR code. O doador escolhe entre valores sugeridos — R$ 10, R$ 20, R$ 50 e R$ 100 — ou digita outro valor (mínimo R$ 5). Motivo: o doador não precisa digitar o valor no banco, o que reduz erro de digitação e, por consequência, divergência entre o extrato e a declaração na conferência manual. **Não é Pix dinâmico**: Pix dinâmico, no vocabulário do Banco Central, é o QR que aponta para uma URL hospedada por um provedor de pagamentos, e exigiria exatamente a conta PJ em gateway que a decisão de 2026-09-04 eliminou. O QR estático com valor não envolve provedor nenhum, e o valor embutido nele não confirma pagamento — a confirmação continua sendo a conferência humana do extrato. Decisão aprovada pelo grupo; substitui a imagem de QR code enviada pela equipe. **[O mínimo de R$ 5 foi reduzido para R$ 1 — ver Session 2026-10-03 (2).]**

### Session 2026-10-03 (2) — Alinhamento com o texto do TCC revisado pelo grupo

> O grupo revisou as seções 8, 11, 12, 19.1 e 19.2 do documento do TCC. Este spec foi alinhado a
> esse texto. Os itens marcados **[REVERTE]** desfazem uma decisão registrada anteriormente e estão
> datados no CLAUDE.md.

- Q: O motivo da rejeição é obrigatório nas três triagens? → A: **Não — o motivo é opcional** nas três (voluntário, candidatura, solicitação externa). Quando informado, é registrado e enviado ao autor no e-mail de resultado (FR-049b); quando não, o e-mail informa apenas que a submissão não foi aprovada. **[REVERTE]** a regra de motivo obrigatório nas três triagens.
- Q: O que significa "aprovar" um voluntário ou um candidato, se a aprovação é chamar para entrevista? → A: Há uma etapa intermediária. O fluxo passa a ser *pendente/em análise → chamado para entrevista → aprovado ou rejeitado*. Só a aprovação final torna o voluntário ativo ou efetiva o candidato como funcionário. Resolve a incoerência de efetivar como funcionário alguém que ainda nem foi entrevistado.
- Q: Inativar um usuário apaga seus dados pessoais? → A: **Não.** Inativar só remove o acesso e pode ser desfeito. Dados pessoais só deixam de ser legíveis por anonimização — a pedido do titular (FR-055) ou ao fim do prazo de retenção dos não aprovados (FR-056). O sistema não oferece exclusão definitiva de usuário.
- Q: Por qual canal o titular exerce seus direitos da LGPD? → A: **Fora do sistema**, pelo contato da instituição (e-mail ou telefone) informado no aviso de privacidade. O funcionário confere a identidade de quem pede e executa no Painel apenas o que depende do sistema: anonimização (FR-055), correção (FR-037) e registro da revogação de consentimento (FR-057). **[REVERTE]** o canal público de solicitação com protocolo (FR-054 e FR-059 antigos).
- Q: Qual o valor mínimo da doação? → A: **R$ 1.** **[REVERTE]** o mínimo de R$ 5 da Session 2026-10-03.
- Q: Os 6 meses de retenção contam do envio ou da conclusão da triagem? → A: Da **conclusão da triagem**, como já decidido em 2026-09-30. Contar do envio faria uma triagem demorada apagar o cadastro antes da decisão.
- Q: Como chega a autorização do responsável legal de voluntário menor de idade? → A: **Entregue assinada na sede da instituição.** O cadastro entra com "autorização pendente" e não pode ser aprovado até um funcionário marcar "autorização recebida". Para facilitar, o sistema oferece uma página pronta para impressão, já preenchida com os dados informados, que o responsável imprime ou salva em PDF pelo próprio navegador. Nenhum documento de menor é armazenado no sistema. **[REVERTE]** o anexo obrigatório no formulário (FR-012 e FR-058 antigos).
- Q: O voluntário aprovado tem login de autoatendimento? → A: **Não.** O autoatendimento é só do doador associado. O voluntário acompanha a triagem pelo protocolo e pelos e-mails. **[REVERTE]** o autoatendimento de voluntário (FR-041 e FR-046 antigos).
- Q: Quando o evento de uma solicitação externa aprovada aparece no Portal? → A: **Só depois do contato.** Aprovar muda o status para "aprovada — aguardando contato" e o solicitante é avisado de que a instituição vai procurá-lo. Depois de combinar os detalhes, o funcionário confirma o evento, e só então ele é publicado. **[REVERTE]** a publicação automática na aprovação (FR-022 antigo).
- Q: Na primeira doação associativa com e-mail não cadastrado, como nasce a conta? → A: O sistema cria o cadastro de doador associado e envia ao e-mail um link para definir a senha. Só quem tem acesso ao e-mail ativa a conta, o que impede criar conta em nome de outra pessoa.
- Q: A sincronização de notícias com redes sociais (FR-033) continua? → A: **Não — removida.** Já conflitava com o Princípio VI da constituição, que põe "integração automática com redes sociais" fora de escopo.
- Q: Quais dados o cadastro de voluntário coleta? → A: Nome, data de nascimento, escolaridade, profissão, RG, CPF, endereço, bairro, CEP, cidade, UF, telefone, e-mail e o tipo de serviço a prestar, com seus objetivos e condições. A justificativa perante o princípio da coleta mínima é o termo de adesão exigido pela Lei nº 9.608/1998 (Lei do Voluntariado, art. 2º), que identifica as partes e precisa conter o objeto e as condições do serviço. Cada campo deve corresponder a um campo do termo de adesão que a instituição usa; um campo que não estiver no termo não deve ser coletado. A data de nascimento entrou porque a regra do menor de idade depende dela.

### Session 2026-10-04 — Doação sem protocolo e ajustes vindos do protótipo

> Decisões do grupo. Os itens marcados **[REVERTE]** estão datados no CLAUDE.md.

- Q: A declaração de doação continua gerando código de protocolo? → A: **Não.** **[REVERTE]** a decisão de que toda declaração de doação gera protocolo (FR-045). O doador só aperta "Já fiz o Pix"; o sistema registra a declaração como pendente com o valor do QR code e a data/hora do clique, e mostra um agradecimento explicando que a equipe confere manualmente. A conferência acontece só no Painel: o funcionário procura no extrato um Pix com o mesmo valor e data/hora próximos e, na doação associativa, também com o nome do doador. A consulta pública por protocolo deixa de incluir doações.
- Q: Sem protocolo, quem recebe a declaração de doação (FR-010)? → A: **Ninguém — o sistema não emite recibo nem declaração de doação.** O registro da confirmação (data e conta do funcionário) fica no Painel Administrativo. Para o doador associado, a doação só aparece no autoatendimento **depois de confirmada** pelo funcionário, com valor e data; declarações pendentes ou não localizadas não aparecem para ele. O doador espontâneo não acompanha nada.
- Q: O anexo opcional do comprovante bancário (FR-010b) continua? → A: **Não — removido.** A conferência passa a ser por valor, data/hora e nome, e o anexo era o único motivo de dado pessoal numa doação espontânea.
- Q: Como o associado doa de novo sem redigitar os dados? → A: Entrando no autoatendimento. O cadastro de doador associado é feito junto com a primeira doação associativa (não existe tela de cadastro separada); nas seguintes, logado, o "Já fiz o Pix" vincula a doação ao cadastro. Informar só o CPF foi descartado: qualquer um poderia atribuir doações a outra pessoa, e o formulário revelaria quais CPFs estão cadastrados.
- Q: De onde vem o "X% arrecadado" das campanhas, se nenhuma doação é ligada a uma campanha? → A: A meta em dinheiro passa a ser **opcional**. Quando existe, o funcionário atualiza o valor arrecadado à mão, a partir do controle da secretaria; sem meta, a campanha não mostra barra de arrecadação. Antes, toda campanha aparecia com arrecadação, o que não corresponde à realidade.
- Q: Notícias podem ser excluídas? → A: Não: podem ser **editadas e despublicadas**. A notícia despublicada sai do Portal, continua no histórico do Painel e pode voltar a ser publicada. Excluir exigiria emendar o Princípio III da constituição.
- Q: Notícias têm imagem? → A: Sim, **uma imagem por notícia**, com texto alternativo obrigatório (Princípio II) e limite de tamanho.
- Q: O que a candidatura a vaga coleta de identificação? → A: **CPF e data de nascimento**, no lugar da idade. O CPF é indispensável ao FR-048 (juntar voluntário e funcionário pelo CPF) — o protótipo mostrava CPF zerado ao administrador porque o formulário não o pedia. A data de nascimento confirma a maioridade para o emprego.
- Q: Outros ajustes vindos da revisão do protótipo? → A: A solicitação externa passa a pedir o **nome do evento**; todo campo de telefone aceita só número brasileiro válido, com máscara; e todo dado coletado precisa aparecer ao funcionário na consulta do registro, não só na tela de edição — dado que ninguém consulta não deveria ser coletado.

- Q: O motivo é obrigatório ao marcar uma declaração de doação como não localizada? → A: **Não — é opcional**, como já é na rejeição das triagens. **[REVERTE]** o motivo obrigatório do FR-008. O motivo padrão de depósito/transferência (FR-008a) continua disponível como opção pronta.
- Q: E o doador que paga mas não clica em "Já fiz o Pix"? → A: A doação existe no extrato, mas não no sistema, e fica sob controle da secretaria, fora do sistema — mesma situação de quem paga na sede. Já era uma limitação aceita (Assumptions); agora está explícita no CSU01 como fluxo de exceção. A página de doação reforça que o clique é necessário para a doação ser registrada.

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

Um visitante decide doar dinheiro. Ele escolhe um valor sugerido ou digita outro, e a página de doação gera o QR code Pix e o código copia e cola a partir da chave que a própria instituição cadastrou no Painel Administrativo, já com o valor escolhido. Ele faz o pagamento no aplicativo do seu banco — fora do sistema. Em seguida, se quiser que a doação seja reconhecida e acompanhada, ele **declara** a doação no site (pelo botão "Já fiz o Pix" — nunca "confirmar", palavra reservada à conferência do funcionário), escolhendo entre declaração espontânea (sem se identificar) ou associativa (na primeira vez, informando seus dados; nas seguintes, entrando no autoatendimento). O sistema registra a declaração com status pendente, com o valor do QR code e a data/hora do clique, sem gerar protocolo. Um funcionário procura no extrato bancário da instituição um Pix com o mesmo valor e data/hora próximos — e, na associativa, com o nome do doador — e confirma a declaração ou a marca como não localizada no Painel Administrativo. Quando a doação associativa é confirmada, ela passa a aparecer no histórico do doador associado no autoatendimento. O sistema não emite recibo.

**Why this priority**: É a principal fonte de sustentabilidade financeira digital da instituição e o motivo prático mais forte para o visitante retornar ao site.

**Independent Test**: Pode ser testado de ponta a ponta cadastrando a chave Pix no Painel, verificando no Portal Público que o QR code gerado abre no aplicativo do banco com a chave e o valor escolhidos, registrando uma declaração espontânea e uma associativa, verificando o status inicial pendente com valor e data/hora corretos, e então confirmando uma delas e marcando a outra como não localizada no Painel, com consulta posterior do status pelo associado no autoatendimento.

**Acceptance Scenarios**:

1. Given a instituição cadastrou sua chave Pix no Painel Administrativo, When um visitante acessa a página de doação e escolhe um valor sugerido ou digita outro valor de pelo menos R$ 1, Then vê o QR code e o código copia e cola gerados com a chave da instituição e o valor escolhido (com opção de copiar), junto do aviso de que o pagamento é feito no aplicativo do próprio banco; ao ler o QR code, o aplicativo do banco abre o pagamento já preenchido com esse valor.
2. Given a instituição ainda não cadastrou nenhuma chave Pix, When um visitante acessa a página de doação, Then o sistema informa que a doação digital está temporariamente indisponível e oferece o canal de contato da instituição, sem exibir campo de declaração.
3. Given um visitante gerou o QR code, pagou e escolheu a doação espontânea, When ele clica em "Já fiz o Pix", Then a declaração é registrada com status pendente, com o valor do QR code e a data/hora do clique, nenhum dado de identificação é exigido, nenhum protocolo é gerado, e o sistema exibe um agradecimento explicando que a equipe confere a doação manualmente.
4. Given um visitante escolhe a doação associativa e informa seus dados (ou já está autenticado no autoatendimento), When ele clica em "Já fiz o Pix", Then a declaração é registrada com status pendente e vinculada ao seu cadastro de doador.
4a. Given um visitante faz sua primeira declaração associativa com um e-mail ainda não cadastrado, When ele conclui o fluxo, Then o sistema cria o cadastro de doador associado e envia a esse e-mail um link para definir a senha; a conta só passa a ter acesso ao autoatendimento depois que a senha é definida por esse link.
4b. Given um visitante tenta continuar sem informar o valor, ou informa um valor não numérico, negativo ou menor que R$ 1, When ele avança, Then o sistema não gera o QR code e indica o erro no campo de valor (no caso do valor abaixo de R$ 1, informando o mínimo).
5. Given uma declaração de doação está pendente, When um funcionário confere a entrada correspondente no extrato bancário e a confirma no Painel Administrativo, Then o status muda para confirmada, a data e a conta da confirmação ficam registradas no Painel e na auditoria, e, se a doação é associativa, ela passa a aparecer no histórico do doador no autoatendimento.
5a. Given há declarações pendentes, When o funcionário abre a conferência, Then cada declaração mostra o valor e a data/hora do clique e, se associativa, o nome do doador, que são os dados usados para localizar o Pix no extrato.
6. Given uma declaração de doação está pendente e o funcionário não localiza a entrada correspondente no extrato, When ele marca a declaração como não localizada, com ou sem motivo, Then o status muda para não localizada, o motivo é registrado quando informado, e o registro é preservado sem exclusão física.
7. Given uma declaração de doação foi registrada, When nenhum funcionário a conferiu ainda, Then ela permanece com status pendente por tempo indeterminado, sem ser descartada, e aparece na lista de pendências do Painel Administrativo.
8. Given um doador associado declarou uma doação, When ele entra no autoatendimento, Then a doação só aparece no histórico depois de confirmada pelo funcionário; enquanto pendente ou se marcada como não localizada, não aparece. O sistema não emite recibo. O doador espontâneo não tem como acompanhar nada, e a página de doação deixa isso claro antes do clique.
9. Given um visitante está na tela de declaração de doação, When ele lê as instruções, Then o sistema deixa explícito que a declaração não confirma o recebimento e que a conferência é feita manualmente pela equipe.

### User Story 3 - Gestão de Itens Necessários e de Campanhas/Eventos (Priority: P2)

Um funcionário autorizado cadastra e mantém atualizada, pelo Painel Administrativo, a lista de itens necessários (com busca por nome, atualização de quantidade e baixa quando o item é suprido) e a lista de campanhas/eventos institucionais (com data, descrição e recursos necessários, e encerramento quando terminam), sendo avisado quando a data de um novo evento coincide com a de outro já confirmado.

**Why this priority**: É o mecanismo que alimenta o conteúdo mostrado na User Story 1; sem ele, a equipe voltaria a depender de atualização manual fora do sistema.

**Independent Test**: Pode ser testado cadastrando, buscando, atualizando e dando baixa em um item necessário, e cadastrando um evento em uma data livre e depois tentando cadastrar outro na mesma data, verificando o aviso de conflito.

**Acceptance Scenarios**:

1. Given um funcionário cadastra um novo item necessário, When ele salva o registro, Then o item passa a aparecer imediatamente na listagem pública de necessidades.
2. Given um item necessário foi totalmente suprido, When o funcionário registra a baixa, Then o item deixa de aparecer no Portal Público, mas permanece consultável no histórico administrativo.
3. Given um item não recebe atualização de quantidade por um período prolongado, When o funcionário acessa o Painel Administrativo, Then esse item aparece sinalizado como sem atualização recente.
4. Given já existe um evento confirmado em uma data, When um funcionário tenta cadastrar outro evento na mesma data, Then o sistema o avisa sobre o conflito de disponibilidade e permite que ele altere a data ou prossiga mesmo assim.
5. Given um funcionário confirma o cadastro de uma campanha/evento, When o cadastro é salvo, Then ele é publicado automaticamente no Portal Público sem passo manual adicional.
6. Given um funcionário cadastra uma campanha/evento, When ele informa uma data que já passou, Then o sistema não grava e pede que a data seja corrigida.
7. Given existe uma campanha/evento ativo, When um funcionário o encerra, Then o status muda para encerrado, ele deixa de aparecer na listagem pública e permanece consultável no histórico administrativo.
8. Given uma campanha/evento já está encerrado, When um funcionário tenta encerrá-lo de novo, Then o sistema não altera o registro.
9. Given um funcionário informa quantidade negativa para um item necessário, When ele tenta salvar, Then o sistema indica o erro e não grava a informação.
10. Given uma campanha/evento é cadastrado sem meta em dinheiro, When ele é exibido no Portal Público, Then não aparece nenhuma barra ou valor de arrecadação.
11. Given uma campanha tem meta em dinheiro, When o funcionário atualiza o valor arrecadado no Painel, Then o Portal Público exibe o progresso com o novo valor.

### User Story 4 - Cadastro de Voluntários com Triagem (Priority: P2)

Uma pessoa interessada em ser voluntária se cadastra pelo Portal Público informando nome, data de nascimento, escolaridade, profissão, RG, CPF, endereço, bairro, CEP, cidade, UF, telefone, e-mail e o tipo de serviço que vai prestar, com seus objetivos e condições (dados do termo de adesão da Lei nº 9.608/1998). Se for menor de idade, o cadastro fica com a autorização do responsável legal pendente, a ser entregue assinada na sede da instituição; o sistema oferece uma página pronta para impressão, já preenchida com os dados informados. O cadastro entra como pendente; um funcionário o analisa e chama a pessoa para entrevista ou o rejeita; depois da entrevista, aprova ou rejeita. Ao concluir o envio, o interessado recebe automaticamente um e-mail de confirmação com o código de protocolo e o aviso de que a análise pode levar alguns dias.

**Why this priority**: É um dos principais canais de engajamento da instituição com a comunidade, mas depende do Portal Público já existir (User Story 1) e da estrutura de gestão de usuários e triagem do Painel Administrativo.

**Independent Test**: Pode ser testado submetendo um cadastro de voluntário maior de idade e um de menor de idade, verificando que ambos entram como pendentes e recebem o e-mail de confirmação, que o do menor não pode ser aprovado antes de a autorização ser marcada como recebida, e que a equipe consegue chamar para entrevista, aprovar ou rejeitar cada um.

**Acceptance Scenarios**:

1. Given um visitante maior de idade preenche corretamente todos os campos obrigatórios do cadastro de voluntário, When ele envia o formulário, Then o cadastro é registrado com status pendente e sinalizado no Painel (FR-014), e o interessado recebe o código de protocolo na tela e um e-mail automático de confirmação.
2. Given um visitante menor de idade preenche o cadastro de voluntário, When ele envia o formulário, Then o cadastro é registrado com status pendente e com a autorização do responsável legal marcada como pendente, e o sistema oferece a página de autorização pronta para impressão, explicando que ela deve ser entregue assinada na sede da instituição.
3. Given um visitante deixa um campo obrigatório em branco, When ele tenta enviar, Then o sistema indica o campo e não envia o cadastro.
4. Given o envio do e-mail de confirmação falha, When o cadastro é registrado, Then o cadastro é mantido, o sistema tenta reenviar uma vez e, persistindo a falha, a registra para contato manual (FR-049a).
5. Given existe um cadastro de voluntário pendente, When um funcionário o chama para entrevista, Then o status muda para "chamado para entrevista".
6. Given um voluntário foi chamado para entrevista, When um funcionário o aprova, Then o status muda para aprovado e a pessoa passa a constar como voluntária ativa.
7. Given o cadastro é de menor de idade e a autorização ainda não foi marcada como recebida, When um funcionário tenta aprová-lo, Then o sistema impede a aprovação e informa que a autorização está pendente.
8. Given existe um cadastro de voluntário pendente ou chamado para entrevista, When um funcionário o rejeita, com ou sem motivo, Then o status muda para rejeitado, o motivo é registrado quando informado, e o registro é preservado e entra na contagem do prazo de retenção de 6 meses (FR-056).

### User Story 5 - Candidatura a Vaga de Emprego com Triagem (Priority: P2)

Uma pessoa interessada em trabalhar na instituição escolhe um cargo (limpeza, cuidador, enfermagem ou cozinha), preenche seus dados pessoais e anexa um currículo — ou, se não tiver arquivo, descreve sua experiência em texto. A candidatura entra como em análise até um funcionário avaliá-la: ele chama o candidato para entrevista ou o rejeita; depois da entrevista, aprova (efetivando o cadastro como funcionário) ou rejeita. Ao concluir o envio, o candidato recebe automaticamente um e-mail de confirmação com o código de protocolo e o aviso de que a avaliação pode levar alguns dias.

**Why this priority**: Substitui um processo hoje totalmente manual de recrutamento, mas assim como o voluntariado depende da estrutura básica de portal e triagem já estar disponível.

**Independent Test**: Pode ser testado submetendo uma candidatura com currículo anexado e outra apenas com descrição textual, verificando o recebimento do e-mail de confirmação em ambos os casos, e verificando que a equipe consegue chamar para entrevista, aprovar (gerando um novo funcionário) ou rejeitar cada uma.

**Acceptance Scenarios**:

1. Given um candidato escolhe o cargo "cuidador", anexa um currículo válido e informa seus dados, When ele conclui o envio, Then a candidatura é registrada com status em análise e sinalizada no Painel, e o candidato recebe o código de protocolo na tela e um e-mail automático de confirmação.
2. Given um candidato não possui arquivo de currículo, When ele preenche a descrição textual da experiência no lugar do anexo, Then o sistema aceita a candidatura normalmente.
3. Given um candidato não anexa currículo nem preenche a descrição, When ele tenta enviar, Then o sistema pede o preenchimento de ao menos uma das duas opções.
4. Given existe uma candidatura em análise, When um funcionário chama o candidato para entrevista, Then o status muda para "chamado para entrevista", sem criar cadastro de funcionário.
5. Given o candidato foi chamado para entrevista, When um funcionário aprova a candidatura, Then o status muda para aprovada e um novo cadastro de funcionário é criado a partir dos dados da candidatura — ou, caso o CPF do candidato já corresponda a um voluntário cadastrado, o perfil de funcionário é adicionado ao cadastro existente, sem duplicar o registro.
6. Given existe uma candidatura em análise ou com candidato chamado para entrevista, When um funcionário a rejeita, com ou sem motivo, Then o status muda para rejeitada, o motivo é registrado quando informado, nenhum cadastro de funcionário é criado, e o registro é preservado no histórico.

### User Story 6 - Solicitação Externa de Evento ou Campanha com Triagem (Priority: P2)

Uma pessoa ou organização externa que deseja propor um evento ou campanha para a instituição preenche dados de contato, nome do evento, tipo, objetivo, data pretendida e recursos esperados. A solicitação entra como em análise até um funcionário avaliá-la. Ele pode aprová-la, o que avisa o solicitante de que a instituição vai entrar em contato; depois de combinar os detalhes, o funcionário confirma o evento/campanha, que só então é publicado no Portal Público. Ou pode rejeitá-la, com ou sem motivo. Ao concluir o envio, o solicitante recebe automaticamente um e-mail de confirmação com o código de protocolo e o aviso de que a análise pode levar alguns dias.

**Why this priority**: Amplia as fontes de eventos/campanhas além da própria equipe interna, mas é um fluxo complementar à gestão interna já coberta pela User Story 3.

**Independent Test**: Pode ser testado submetendo uma solicitação externa, verificando o recebimento do e-mail de confirmação, aprovando-a e verificando que nada aparece no Portal até a confirmação do evento, e rejeitando outra.

**Acceptance Scenarios**:

1. Given uma pessoa externa informa dados de contato válidos e descreve a proposta, When ela envia o formulário, Then a solicitação é registrada com status em análise e sinalizada no Painel, e o solicitante recebe o código de protocolo na tela e um e-mail automático de confirmação.
2. Given existe uma solicitação em análise, When um funcionário a aprova, Then o status muda para "aprovada — aguardando contato", o solicitante é avisado por e-mail de que a instituição vai entrar em contato para combinar o evento, e nada é publicado ainda.
3. Given uma solicitação está aprovada e aguardando contato, When o funcionário, depois de combinar os detalhes com o solicitante, confirma o evento/campanha, Then o evento/campanha é criado com os dados combinados e publicado automaticamente no Portal Público.
4. Given a data pretendida já está ocupada por um evento confirmado, When o funcionário aprova a solicitação ou confirma o evento, Then o sistema exibe o aviso de conflito e permite que ele decida prosseguir (FR-030).
5. Given existe uma solicitação em análise ou aguardando contato, When um funcionário a rejeita, com ou sem motivo, Then o status muda para rejeitada, o motivo é registrado quando informado, e nenhum evento/campanha é gerado.

### User Story 7 - Gestão de Usuários e Visão Consolidada no Painel Administrativo (Priority: P3)

Um funcionário autorizado registra diretamente, consulta, altera ou inativa (nunca exclui) cadastros de funcionários, voluntários e doadores associados, buscando por nome, CPF ou e-mail, com o nível de acesso de cada um definido pelo respectivo perfil. O painel também mostra uma visão consolidada com indicadores e alertas prioritários: itens mais urgentes, itens sem atualização, cadastros pendentes de triagem e declarações de doação pendentes de conferência.

**Why this priority**: Refina e centraliza a operação do dia a dia da equipe depois que os fluxos essenciais de captação (doação, voluntariado, vagas, eventos) já estão funcionando.

**Independent Test**: Pode ser testado registrando um voluntário pelo Painel, tentando registrar outro com o mesmo CPF, buscando um usuário existente por nome/CPF/e-mail, alterando seus dados, inativando-o e confirmando que ele deixa de ter acesso mas continua visível e com os dados intactos; e verificando que o painel de indicadores reflete as pendências existentes.

**Acceptance Scenarios**:

1. Given um funcionário registra pelo Painel um novo usuário do perfil voluntário ou funcionário com dados válidos, When ele salva, Then o registro é gravado com sucesso, sem passar pela triagem (o próprio registro já é ação explícita de um funcionário).
2. Given já existe um usuário com o CPF informado, When um funcionário tenta registrá-lo de novo, Then o sistema exibe o registro existente em vez de criar outro.
3. Given um funcionário busca um usuário por nome, CPF ou e-mail, When o registro é encontrado, Then ele pode consultar e alterar os dados cadastrais.
4. Given um funcionário inativa um usuário, When a ação é confirmada, Then o usuário passa a constar como inativo e perde o acesso ao sistema, se tinha algum, mas seu registro, seus dados e seu histórico permanecem íntegros e consultáveis, e a inativação pode ser desfeita.
5. Given o usuário tem uma submissão em triagem (por exemplo, um voluntário ativo com candidatura a vaga em análise), When um funcionário pede a inativação, Then o sistema avisa sobre a pendência e permite prosseguir se ele decidir.
6. Given um funcionário procura uma forma de excluir definitivamente um usuário, When ele abre as ações do cadastro, Then o sistema não oferece exclusão e indica a inativação; o apagamento de dados pessoais só ocorre por anonimização (FR-055, FR-056).
7. Given existem pendências, When um funcionário acessa a visão consolidada, Then ela exibe a quantidade de itens prioritários, de itens sem atualização, de cadastros pendentes de triagem e de declarações de doação pendentes de conferência, destacadas como alertas.
8. Given não há nenhuma pendência, When um funcionário acessa a visão consolidada, Then o sistema informa que não há alertas.
9. Given um funcionário informa as credenciais da conta institucional compartilhada, When ele entra no Painel, Then o sistema concede acesso às funcionalidades administrativas; com credenciais inválidas, o acesso é negado.
10. Given um perfil sem permissão tenta executar uma ação, When a requisição chega ao servidor, Then o sistema nega o acesso sem expor detalhes internos do motivo e registra a tentativa no histórico de auditoria com data/hora (FR-047).
11. Given um funcionário aprova um cadastro de voluntário, When a ação é concluída, Then o sistema registra a ação, a conta institucional utilizada e a data/hora — sem identificar qual funcionário a executou, já que o acesso é compartilhado (FR-035).
12. Given um funcionário consulta o histórico de auditoria, When a tela abre, Then o sistema exibe as ações mais recentes em ordem cronológica.
13. Given um funcionário acessa a área de ajuda pelo Painel, When a página abre, Then o sistema exibe as instruções de operação e a seção sobre o que o sistema não faz (FR-060, FR-060a).
14. Given um funcionário está na tela de conferência de doação, When ele precisa de orientação, Then a explicação do procedimento está na própria tela, sem que ele precise sair dela (FR-061).

### User Story 8 - Divulgação Institucional (Priority: P3)

Um funcionário publica notícias, informações institucionais e necessidades da instituição, que passam a aparecer no Portal Público. Não há sincronização com redes sociais (removida em 2026-10-03, Princípio VI): se a equipe quiser divulgar também nas redes, faz isso manualmente.

**Why this priority**: Reforça a comunicação institucional, mas é a funcionalidade de menor impacto direto sobre a operação (doações, voluntariado, vagas) coberta pelas demais histórias.

**Independent Test**: Pode ser testado publicando uma notícia com imagem, editando-a, despublicando-a e publicando-a de novo, verificando o Portal Público a cada passo.

**Acceptance Scenarios**:

1. Given um funcionário preenche uma notícia válida, When ele a publica, Then a notícia passa a ser exibida no Portal Público.
2. Given um funcionário anexa uma imagem a uma notícia, When ele tenta publicar sem preencher o texto alternativo da imagem, Then o sistema impede a publicação e pede o texto alternativo.
3. Given uma notícia publicada, When um funcionário a edita, Then o Portal Público passa a exibir a versão editada.
4. Given uma notícia publicada, When um funcionário a despublica, Then ela deixa de aparecer no Portal Público, continua consultável no Painel e pode ser publicada de novo.

### User Story 9 - Autoatendimento do Doador Associado (Priority: P3)

Um doador associado acessa, com login próprio, uma área restrita aos seus próprios dados, onde consulta seus dados cadastrais e o histórico das contribuições que pagou por Pix e declarou no Portal, e de onde pode declarar uma nova doação sem informar seus dados de novo. Não enxerga dados de outra pessoa. Caso esqueça a senha, pode redefini-la por e-mail, sem depender da equipe administrativa. Voluntários não têm autoatendimento (decisão de 2026-10-03): acompanham a triagem pelo protocolo e pelos e-mails.

**Why this priority**: É um refinamento de conveniência sobre o cadastro de doador associado (User Story 2), reduzindo contato manual com a equipe para consultas simples.

**Independent Test**: Pode ser testado autenticando como um doador associado, confirmando que ele vê apenas seus próprios dados e histórico, que não consegue acessar dados de outro usuário, e que consegue redefinir a senha por e-mail.

**Acceptance Scenarios**:

1. Given um doador associado informa credenciais válidas, When ele acessa a área de autoatendimento, Then o sistema concede acesso apenas aos seus próprios dados.
2. Given um doador associado tem doações registradas, When ele acessa a área de autoatendimento, Then vê o histórico das suas próprias doações via Pix já confirmadas pelo funcionário (valor e data), sem recibo, com o aviso de que contribuições pagas na sede ou por depósito não aparecem ali e ficam registradas na secretaria da instituição.
3. Given um doador associado está autenticado, When ele declara uma nova doação, Then a declaração é vinculada ao seu cadastro sem que ele precise informar os dados de identificação de novo.
4. Given o usuário informa e-mail ou senha incorretos, When ele tenta entrar, Then o sistema nega o acesso.
5. Given um doador associado está autenticado, When ele tenta acessar dados de outro usuário por qualquer meio, Then o sistema nega o acesso e registra a tentativa (FR-047).
6. Given um doador associado esqueceu sua senha, When ele solicita redefinição informando o e-mail cadastrado, Then recebe um link de redefinição por e-mail e, ao usá-lo, define uma nova senha e consegue entrar imediatamente.
7. Given alguém solicita redefinição com um e-mail não cadastrado, When envia o pedido, Then o sistema responde da mesma forma que para um e-mail cadastrado, sem revelar se o e-mail existe na base.

### User Story 10 - Consulta Pública de Status de Solicitações (Priority: P3)

Um voluntário com cadastro pendente, um candidato a vaga ou um solicitante de evento/campanha consulta, sem precisar de login, o status atual da própria submissão (por exemplo: pendente/em análise, chamado para entrevista, aprovado, rejeitado) usando o código de protocolo recebido no momento do envio. Doações não têm protocolo (decisão de 2026-10-04). A consulta mostra apenas o tipo, o status atual e a data da submissão.

**Why this priority**: Reduz o contato manual da equipe para informar andamento, mas depende das triagens (User Stories 4, 5 e 6) já existirem.

**Independent Test**: Pode ser testado enviando uma candidatura, anotando o protocolo recebido, e consultando o status com esse protocolo antes e depois da triagem pela equipe.

**Acceptance Scenarios**:

1. Given uma submissão foi enviada, When o solicitante informa o protocolo recebido, Then o sistema exibe apenas o tipo, o status atual e a data, sem expor dados pessoais.
2. Given o protocolo informado não existe ou está mal formado, When a consulta é feita, Then o sistema responde de forma idêntica nos dois casos, informando que nenhum registro foi encontrado.
3. Given alguém faz muitas consultas seguidas com códigos diferentes, When o limite de tentativas é atingido, Then o sistema bloqueia novas consultas por um tempo, impedindo a descoberta de protocolos de terceiros por tentativa (FR-044a).

### User Story 11 - Proteção de Dados Pessoais e Direitos do Titular (LGPD) (Priority: P2)

Antes de enviar qualquer formulário que colete dados pessoais, o visitante é informado do tratamento que será dado a eles e registra seu consentimento explícito. O aviso de privacidade fica disponível no Portal Público, sem login, e informa o contato da instituição para o exercício de direitos. O titular faz seus pedidos (acesso, correção, anonimização ou revogação do consentimento) **por esse contato, fora do sistema** — decisão de 2026-10-03. Um funcionário confere a identidade de quem pede e executa no Painel o que depende do sistema: corrigir os dados, anonimizá-los ou registrar a revogação.

**Why this priority**: A coleta de dados pessoais (CPF, endereço, dados de menores de idade, currículos) começa já nas User Stories 2, 4, 5 e 6 — sem consentimento registrado e sem aviso de privacidade, a operação real da instituição fica em desconformidade com a LGPD desde o primeiro cadastro. A captura de consentimento (FR-051/FR-052) não pode ser adiada: ela acompanha as próprias histórias que coletam dados.

**Independent Test**: Pode ser testado enviando um cadastro de voluntário sem aceitar o consentimento (deve ser bloqueado), depois com aceite (deve registrar data/hora, finalidade e versão), e em seguida anonimizando esse cadastro pelo Painel, verificando que os dados pessoais deixam de ser legíveis e que o histórico e a auditoria do registro permanecem íntegros.

**Acceptance Scenarios**:

1. Given um visitante preenche um formulário público que coleta dados pessoais (voluntário, candidatura, doação associativa ou solicitação externa), When ele tenta enviar sem aceitar explicitamente o aviso de privacidade, Then o sistema impede o envio e explica que o aceite é obrigatório.
2. Given um visitante aceita o aviso de privacidade e envia o formulário, When o registro é criado, Then o sistema armazena o consentimento com data/hora, finalidade e versão do texto aceito.
3. Given um visitante quer saber como seus dados são tratados, When ele acessa o aviso de privacidade sem fazer login, Then vê quais dados são coletados, com que finalidade, por quanto tempo são retidos e o contato da instituição para exercer seus direitos.
4. Given a instituição recebeu, por contato, um pedido de anonimização e conferiu a identidade do titular, When o funcionário executa a anonimização no Painel, Then os dados pessoais identificáveis daquele cadastro deixam de ser legíveis no sistema, enquanto o registro, seu histórico e a trilha de auditoria permanecem íntegros.
5. Given o titular possui doações confirmadas sujeitas a retenção por obrigação legal, When o funcionário executa a anonimização, Then o sistema permite reter apenas esses dados, anonimiza o restante e exige o registro da justificativa da retenção.
6. Given a instituição recebeu, por contato, um pedido de revogação de consentimento, When o funcionário registra a revogação no Painel, Then o consentimento passa a constar como revogado com a data, o uso dos dados para as finalidades revogadas é interrompido, e o registro não é excluído.

## Edge Cases

- Como o sistema trata o cadastro de voluntário menor de idade? → Resolvido via FR-012 (revisto em 2026-10-03): o cadastro é aceito com a autorização do responsável legal pendente; o sistema oferece a página de autorização pronta para impressão e impede a aprovação até um funcionário marcar a autorização como recebida na sede.
- O que acontece quando uma candidatura a vaga é enviada sem currículo em anexo e sem descrição textual da experiência? → Resolvido via FR-017: o sistema pede o preenchimento de ao menos uma das duas opções.
- Como o sistema reage quando uma solicitação externa de evento pede uma data já ocupada por um evento/campanha já confirmado? → Resolvido via FR-030: aviso de conflito, nunca bloqueio, tanto na aprovação quanto na confirmação do evento.
- O que acontece quando um item necessário fica muito tempo sem atualização de quantidade? → Resolvido via FR-028: após 30 dias (configurável), o item é sinalizado no Painel.
- Como o sistema trata uma tentativa de acesso a uma funcionalidade do Painel Administrativo por um perfil sem permissão para aquela ação? → Resolvido via FR-047: o acesso é negado e a tentativa é registrada no histórico de auditoria.
- O que acontece quando a mesma pessoa (mesmo CPF/e-mail) já está cadastrada como voluntária e depois é aprovada como funcionária pela mesma candidatura? → Resolvido via FR-048: o perfil de funcionário é adicionado ao cadastro existente, sem criar um registro duplicado.
- Como o sistema trata a rejeição de um cadastro (voluntário, candidatura, solicitação de evento) sem que o funcionário informe um motivo? → Desde 2026-10-03 o motivo é opcional nas três triagens (FR-015, FR-019, FR-022): a rejeição é concluída normalmente, e o e-mail de resultado (FR-049b) informa apenas que a submissão não foi aprovada.
- O que acontece se um funcionário tentar confirmar duas vezes a mesma declaração de doação, ou se o doador declarar duas vezes a mesma doação? → Resolvido via FR-050: uma doação já confirmada não pode ser confirmada de novo nem gerar nova declaração, e o sistema sinaliza ao funcionário declarações pendentes com valor e data próximos para que ele avalie se são duplicadas.
- O que acontece quando um doador declara uma doação que nunca entrou na conta da instituição (engano ou má-fé)? → Resolvido via FR-008: o funcionário não localiza a entrada no extrato, marca a declaração como não localizada (motivo opcional), e o registro é preservado sem exclusão física.
- O doador paga, mas não clica em "Já fiz o Pix"? → O sistema não fica sabendo: o Pix existe só no extrato e é controlado pela secretaria, fora do sistema, como os pagamentos na sede (FR-009). Por isso os totais do Painel não são a arrecadação da instituição (FR-060a). A página de doação deixa claro que, sem o clique, a doação não é registrada (FR-010a).
- O que acontece quando um associado declara no site uma contribuição que pagou por depósito ou TED? → Resolvido via FR-008a: o funcionário vê no extrato que a entrada não é Pix, marca a declaração como não localizada, de preferência com o motivo padrão, e a contribuição segue registrada pela secretaria, fora do sistema (FR-009).
- Duas doações espontâneas do mesmo valor chegam no extrato em horários próximos? → O funcionário usa a data/hora de cada clique para casar declaração e entrada; se não der para distinguir, as duas entradas existem no extrato e as duas declarações podem ser confirmadas, já que cada uma corresponde a um Pix real. FR-050 sinaliza o caso para avaliação.
- O doador associado pagou de uma conta em nome de outra pessoa (cônjuge, empresa)? → O nome no extrato não bate. O funcionário decide pelo valor e pela data/hora; o nome é critério auxiliar, não obrigatório.
- O doador clicou em "Já fiz o Pix" bem depois de pagar? → A data/hora do clique fica distante da do extrato. A página orienta a clicar logo após o pagamento; o funcionário considera uma janela razoável na conferência.
- O que acontece quando um doador associado esquece a senha da área de autoatendimento? → Resolvido via FR-046: redefinição por e-mail, sem intervenção de um funcionário.
- Como o sistema evita que alguém descubra o status de submissões de outras pessoas tentando adivinhar ou testar códigos de protocolo? → Resolvido via FR-044a: protocolo não sequencial, resposta idêntica para protocolo inexistente ou mal formado, e limite de tentativas.
- O que acontece quando a conferência da doação pela equipe só ocorre depois que o visitante já saiu da página? → Esse é o caso normal com Pix estático. Nenhum doador acompanha o status da declaração; o associado vê a doação no autoatendimento quando ela é confirmada (FR-045 removido em 2026-10-04).
- O que acontece quando um titular pede anonimização mas seus dados são necessários ao cumprimento de obrigação legal (ex.: doações confirmadas sujeitas a prestação de contas)? → Resolvido via FR-055: o sistema retém apenas os dados estritamente necessários à obrigação legal, anonimiza o restante e registra a justificativa, que a instituição comunica ao titular pelo mesmo contato em que recebeu o pedido.
- O que acontece com o cadastro de um voluntário ativo que revoga o consentimento? → Resolvido via FR-057: o titular pede pelo contato da instituição, o funcionário registra a revogação no Painel, o uso dos dados para as finalidades revogadas é interrompido, sem exclusão física do registro (FR-024).
- Alguém digita o e-mail de outra pessoa numa doação associativa para criar uma conta em nome dela? → Resolvido via FR-006a: a conta só é ativada pelo link de definição de senha enviado a esse e-mail. A declaração em si continua registrada e pendente como qualquer outra, sujeita à conferência humana.
- Um funcionário tenta excluir definitivamente um usuário? → Resolvido via FR-024: a exclusão não existe; o sistema indica a inativação. Dados pessoais só deixam de ser legíveis por anonimização (FR-055, FR-056).
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
- **FR-006a**: Na primeira declaração associativa com um e-mail ainda não cadastrado, o sistema DEVE criar o cadastro de doador associado e enviar a esse e-mail um link para definição de senha; a conta NÃO PODE dar acesso ao autoatendimento antes de a senha ser definida por esse link. Isso impede que alguém crie uma conta em nome de outra pessoa apenas digitando o e-mail dela (decisão de 2026-10-03). Um doador associado autenticado DEVE poder declarar nova doação sem informar de novo seus dados de identificação.
- **FR-007**: O sistema DEVE permitir que a equipe administrativa cadastre e atualize a chave Pix da instituição, o nome do recebedor e a cidade. Na página de doação, o sistema DEVE oferecer valores sugeridos (R$ 10, R$ 20, R$ 50 e R$ 100) e um campo de valor livre com mínimo de R$ 1 (decisão de 2026-10-03, que substitui o mínimo de R$ 5), recusando valor ausente, não numérico, negativo ou abaixo do mínimo, e DEVE gerar, no navegador do doador, o QR code de Pix **estático** (BR Code, padrão EMV do Banco Central) e o código copia e cola correspondentes à chave cadastrada e ao valor escolhido, com opção de copiar o código. O sistema NÃO PODE integrar API de pagamentos, gerar cobrança Pix dinâmica (QR code que aponta para URL hospedada por provedor de pagamentos) nem receber notificação automática de confirmação; o valor embutido no QR code não equivale a confirmação de pagamento (decisão de 2026-10-03).
- **FR-007a**: Quando nenhuma chave Pix estiver cadastrada, o sistema NÃO PODE oferecer o fluxo de declaração de doação; DEVE informar que a doação digital está temporariamente indisponível e exibir o canal de contato da instituição.
- **FR-008**: O sistema DEVE registrar toda declaração de doação com status pendente, com o valor do QR code gerado e a data/hora do clique em "Já fiz o Pix" (o doador não digita valor nem data — decisão de 2026-10-04), e DEVE permitir que um funcionário autorizado a confirme ou a marque como não localizada após conferência no extrato bancário da instituição, registrando autor, data e — na marcação como não localizada — o motivo, que é **opcional** (decisão de 2026-10-04). A declaração do doador NÃO PODE, por si só, alterar o status para confirmada. A tela de conferência DEVE exibir, para cada declaração, o valor, a data/hora e, na associativa, o nome do doador, que são os critérios de busca no extrato.
- **FR-008a**: Quando a entrada correspondente a uma declaração aparecer no extrato como depósito ou transferência que não seja Pix, o funcionário NÃO PODE confirmá-la; DEVE marcá-la como não localizada. O sistema DEVE oferecer como opção pronta o motivo "Pagamento recebido por depósito ou transferência, fora do Pix. Registrado pela secretaria da instituição, fora deste sistema." (FR-009).
- **FR-009**: O sistema NÃO PODE registrar digitalmente doações de itens físicos, de dinheiro em espécie, nem contribuições pagas por depósito ou transferência bancária que não seja Pix (TED, DOC); esses casos permanecem exclusivamente como registro da instituição, fora do sistema (decisão de 2026-10-03).
- **FR-010**: ~~Declaração de doação (recibo) ao doador.~~ **Removido em 2026-10-04**: o sistema não emite recibo nem declaração de doação. A confirmação fica registrada no Painel, com data e conta (FR-008), e a doação associativa confirmada passa a aparecer no autoatendimento do doador (FR-041). Número reservado.
- **FR-010a**: O sistema DEVE deixar explícito ao doador, na página de doação, que o pagamento ocorre no aplicativo do próprio banco, que o clique em "Já fiz o Pix" não confirma o recebimento, que a conferência é feita manualmente pela equipe, que sem o clique a doação não é registrada no sistema, que o clique deve ser feito logo após o pagamento, e que a doação espontânea não pode ser acompanhada depois.
- **FR-010b**: ~~Anexo opcional do comprovante bancário.~~ **Removido em 2026-10-04**: a conferência passou a ser por valor, data/hora e nome. Número reservado.

**Cadastro de Voluntários**

- **FR-011**: O sistema DEVE permitir que qualquer visitante se cadastre como voluntário informando nome, data de nascimento, escolaridade, profissão, RG, CPF, endereço, bairro, CEP, cidade, UF, telefone, e-mail e o tipo de serviço que vai prestar, com seus objetivos e condições. Esses campos correspondem ao termo de adesão exigido pela Lei nº 9.608/1998; campo que não constar do termo de adesão usado pela instituição NÃO DEVE ser coletado (coleta mínima, Princípio IV).
- **FR-012**: Quando o cadastrando for menor de idade (pela data de nascimento), o sistema DEVE registrar o cadastro com a autorização do responsável legal **pendente**, oferecer uma página pronta para impressão, preenchida com os dados informados e com campos de assinatura, que o responsável imprime ou salva em PDF pelo próprio navegador, e informar que a autorização deve ser entregue assinada na sede da instituição. O sistema NÃO PODE armazenar a autorização como arquivo; DEVE permitir que um funcionário marque a autorização como recebida, registrando data e conta, e NÃO PODE permitir a aprovação do cadastro (FR-015) enquanto ela estiver pendente (decisão de 2026-10-03, que substitui o anexo obrigatório).
- **FR-013**: O sistema DEVE registrar todo novo cadastro de voluntário com status pendente até triagem por um funcionário.
- **FR-014**: O sistema DEVE sinalizar todo novo cadastro de voluntário submetido na visão consolidada do Painel Administrativo (FR-036), onde a equipe responsável pela triagem o encontra. A sinalização é por consulta ao painel, NÃO por envio ativo de e-mail à equipe — decisão de 2026-09-23. Consequência aceita: uma submissão permanece aguardando até que alguém abra o painel, o que é compatível com o aviso de que a análise pode levar alguns dias, já enviado ao autor (FR-049).
- **FR-015**: O sistema DEVE permitir que um funcionário, diante de um cadastro de voluntário pendente, o chame para entrevista ou o rejeite; e, diante de um cadastro chamado para entrevista, o aprove (tornando o voluntário ativo) ou o rejeite. Na rejeição, o motivo é **opcional** e, quando informado, é registrado junto ao status (decisão de 2026-10-03). O registro é preservado em todos os casos.

**Candidatura a Vaga de Emprego**

- **FR-016**: O sistema DEVE permitir candidatura a vaga para os cargos de limpeza, cuidador, enfermagem ou cozinha, com seleção obrigatória de um desses cargos.
- **FR-016a**: A candidatura DEVE coletar CPF válido e data de nascimento (não idade). O CPF é indispensável ao FR-048; a data de nascimento confirma a maioridade para o emprego (decisão de 2026-10-04).
- **FR-017**: O sistema DEVE aceitar a candidatura com anexo de currículo em arquivo ou, na ausência de arquivo, com descrição textual da experiência, exigindo pelo menos uma das duas formas.
- **FR-018**: O sistema DEVE registrar toda candidatura com status em análise até avaliação por um funcionário.
- **FR-019**: O sistema DEVE permitir que um funcionário, diante de uma candidatura em análise, chame o candidato para entrevista ou a rejeite; e, diante de uma candidatura com candidato chamado para entrevista, a aprove — efetivando automaticamente o cadastro do candidato como funcionário (FR-040, FR-048) — ou a rejeite. O cadastro de funcionário NÃO PODE ser criado antes da aprovação final. Na rejeição, o motivo é **opcional** e, quando informado, é registrado junto ao status. O registro é preservado em todos os casos.

**Solicitação Externa de Evento ou Campanha**

- **FR-020**: O sistema DEVE permitir que pessoas ou organizações externas solicitem um evento ou campanha informando dados de contato, nome do evento, tipo, objetivo, data pretendida e recursos esperados.
- **FR-021**: O sistema DEVE registrar toda solicitação externa com status em análise até avaliação por um funcionário.
- **FR-022**: O sistema DEVE permitir que um funcionário aprove uma solicitação em análise — mudando o status para "aprovada — aguardando contato", sem publicar nada — ou a rejeite, com motivo **opcional**. Diante de uma solicitação aguardando contato, o funcionário DEVE poder confirmar o evento/campanha, depois de combinar os detalhes com o solicitante fora do sistema, ou rejeitá-la. Só a confirmação gera o evento/campanha, com os dados combinados, e o publica no Portal Público (FR-031). Decisão de 2026-10-03, que substitui a publicação automática na aprovação.

**Gestão de Usuários (Painel Administrativo)**

- **FR-023**: O sistema DEVE permitir cadastro, consulta, alteração e inativação de usuários dos perfis funcionário, voluntário e doador associado, buscáveis por nome, CPF ou e-mail. O cadastro feito diretamente por um funcionário no Painel não passa por triagem, porque já é ação explícita de um funcionário (FR-034); para voluntário menor de idade, vale a mesma exigência de autorização recebida (FR-012). Se o CPF informado já existir, o sistema DEVE exibir o registro existente em vez de criar outro.
- **FR-023a**: Ao inativar um usuário que tenha submissão em triagem (por exemplo, voluntário ativo com candidatura em análise), o sistema DEVE avisar sobre a pendência e permitir prosseguir.
- **FR-024**: O sistema NÃO PODE permitir exclusão física (definitiva) do registro de nenhum usuário, nem oferecer essa ação na interface; a inativação é a única forma de remoção de acesso. A inativação NÃO apaga nem oculta dados pessoais e pode ser desfeita (decisão de 2026-10-03). Atender a um pedido de anonimização do titular (FR-055) NÃO configura exclusão física: os dados pessoais identificáveis deixam de ser legíveis, mas o registro, seu histórico e a trilha de auditoria permanecem íntegros.
- **FR-025**: O sistema DEVE definir o nível de acesso de cada usuário autenticado de acordo com seu perfil. Nesta versão há dois tipos de acesso autenticado: a conta institucional do Painel (FR-040) e o doador associado (FR-041). Funcionários e voluntários existem como perfis de cadastro, sem login individual.

**Gestão de Itens Necessários**

- **FR-026**: O sistema DEVE permitir que um funcionário cadastre, busque por nome e atualize a quantidade de itens necessários.
- **FR-027**: O sistema DEVE permitir dar baixa em um item quando ele for suprido, removendo-o automaticamente da listagem pública sem excluir seu registro histórico.
- **FR-028**: O sistema DEVE sinalizar, no Painel Administrativo, itens necessários que não recebem atualização de quantidade há **30 dias ou mais** (valor definido em 2026-09-23). O prazo DEVE ser armazenado como configuração editável pela equipe, não como constante no código, para permitir ajuste sem nova publicação do sistema.

**Gestão de Campanhas e Eventos**

- **FR-029**: O sistema DEVE permitir que um funcionário cadastre campanhas/eventos com data, descrição e recursos necessários, recusando no cadastro uma data que já passou.
- **FR-029b**: A meta em dinheiro de uma campanha/evento DEVE ser opcional. Quando houver meta, o funcionário DEVE poder atualizar manualmente o valor arrecadado, e o Portal exibe o progresso; sem meta, o Portal NÃO PODE exibir barra ou valor de arrecadação. O valor arrecadado é informado pela equipe a partir do controle da secretaria — o sistema não o calcula, porque as doações via Pix não são vinculadas a campanhas (decisão de 2026-10-04).
- **FR-029a**: O sistema DEVE permitir que um funcionário encerre uma campanha/evento ativo, mudando o status para encerrado, removendo-o da listagem pública e preservando seu histórico. Encerrar uma campanha/evento já encerrado NÃO PODE alterar o registro.
- **FR-030**: O sistema DEVE verificar disponibilidade de data ao cadastrar uma campanha/evento e avisar o funcionário em caso de conflito com outro evento já confirmado. O aviso é **sinalização, nunca bloqueio**: confirmado em 2026-09-23 que o funcionário pode prosseguir com a data conflitante se assim decidir, porque só ele conhece o contexto (por exemplo, dois eventos pequenos que cabem no mesmo dia). O mesmo aviso vale ao aprovar uma solicitação externa e ao confirmar o evento dela (FR-022).
- **FR-031**: O sistema DEVE publicar automaticamente no Portal Público toda campanha/evento confirmado no Painel Administrativo, sem etapa manual adicional.

**Divulgação Institucional**

- **FR-032**: O sistema DEVE permitir que um funcionário publique notícias, informações institucionais e necessidades da instituição no Portal Público.
- **FR-032a**: O sistema DEVE permitir editar e despublicar uma notícia. A notícia despublicada deixa de aparecer no Portal, continua consultável no Painel e pode ser publicada de novo; não há exclusão (Princípio III).
- **FR-032b**: O sistema DEVE permitir anexar uma imagem a cada notícia, exigindo texto alternativo descritivo antes da publicação (Princípio II) e respeitando um tamanho máximo definido no planejamento.
- **FR-033**: ~~Sincronizar cada publicação com as redes sociais integradas.~~ **Removido em 2026-10-03**: conflitava com o Princípio VI da constituição, que põe a integração automática com redes sociais fora de escopo. O número fica reservado para não renumerar os demais.

**Triagem e Auditoria**

- **FR-034**: O sistema NUNCA PODE aprovar automaticamente um cadastro de voluntário, uma candidatura a vaga ou uma solicitação de evento/campanha; toda aprovação exige ação explícita de um funcionário.
- **FR-035**: O sistema DEVE registrar data/hora de toda ação de aprovação, rejeição, alteração ou inativação realizada no Painel Administrativo. Como o acesso de funcionários ocorre por conta administrativa compartilhada (FR-040), a autoria registrada corresponde à conta utilizada, não a um funcionário individual identificado.

**Painel de Indicadores**

- **FR-036**: O sistema DEVE exibir, no Painel Administrativo, uma visão consolidada com indicadores e alertas prioritários, incluindo ao menos itens necessários mais urgentes, cadastros pendentes de triagem e declarações de doação pendentes de conferência (FR-008).

**Edição e Correção de Dados**

- **FR-037**: O sistema DEVE permitir que a equipe administrativa edite ou corrija, a qualquer momento, qualquer dado previamente cadastrado, preservando o histórico da alteração.
- **FR-037a**: Todo dado coletado num formulário DEVE estar visível ao funcionário na consulta do registro, não só na tela de edição; dado que não precisa ser consultado não deve ser coletado (coleta mínima, Princípio IV). Todo campo de telefone DEVE aceitar apenas número brasileiro válido (DDD mais 8 ou 9 dígitos), com máscara de preenchimento.

**Acesso e Proteção de Dados**

- **FR-038**: O sistema DEVE restringir o acesso a dados pessoais de candidatos, voluntários e doadores exclusivamente a perfis autorizados do Painel Administrativo.
- **FR-039**: O sistema DEVE funcionar corretamente nas versões mais recentes de Chrome, Firefox, Edge e Safari, e ser responsivo em desktop, tablet e smartphone para toda funcionalidade do Portal Público.

**Provisionamento de Acesso**

- **FR-040**: Ao aprovar uma candidatura a vaga, o sistema DEVE efetivar o cadastro do candidato como funcionário nos registros administrativos, sem gerar nem exigir nenhuma credencial de acesso individual — o acesso de funcionários ao Painel Administrativo ocorre por meio de uma conta administrativa (ou pequeno número de contas) compartilhada, previamente configurada pela instituição, e não por login individual atribuído a cada funcionário.

**Autoatendimento de Voluntários e Doadores Associados**

- **FR-041**: O sistema DEVE oferecer login próprio de autoatendimento para doadores associados, permitindo que cada um consulte seus próprios dados cadastrais e o histórico das suas doações **já confirmadas** por um funcionário (valor e data). Declarações pendentes ou não localizadas não aparecem no autoatendimento, e o sistema não emite recibo (decisão de 2026-10-04). Voluntários não têm autoatendimento nesta versão (decisão de 2026-10-03).
- **FR-042**: O sistema NÃO PODE permitir que um doador associado autenticado visualize dados cadastrais, histórico ou status de qualquer outro usuário.

**Acompanhamento de Status pelo Público Externo**

- **FR-043**: O sistema DEVE gerar um código de protocolo único para cada cadastro de voluntário, candidatura a vaga e solicitação de evento/campanha, exibido ao autor da submissão no momento do envio.
- **FR-044**: O sistema DEVE permitir que qualquer pessoa consulte o status de uma submissão (cadastro de voluntário, candidatura a vaga ou solicitação de evento/campanha) informando o código de protocolo recebido, sem necessidade de login. A consulta DEVE exibir apenas o tipo, o status atual e a data, sem exigir nem expor nenhum dado pessoal.
- **FR-044a**: O sistema DEVE responder de forma idêntica a protocolo inexistente e a protocolo mal formado, e DEVE limitar o número de consultas sucessivas vindas da mesma origem, para impedir a descoberta de protocolos de terceiros por tentativa.

**Rastreabilidade de Doações**

- **FR-045**: ~~Protocolo para toda declaração de doação.~~ **Removido em 2026-10-04**: a doação é declarada só pelo clique em "Já fiz o Pix" e conferida no Painel. A doação associativa confirmada aparece no autoatendimento (FR-041). Número reservado.

**Segurança de Acesso ao Autoatendimento**

- **FR-046**: O sistema DEVE permitir que um doador associado redefina sua senha por meio de um link enviado ao e-mail cadastrado, sem intervenção de um funcionário. O pedido feito com e-mail não cadastrado DEVE receber a mesma resposta que o feito com e-mail cadastrado, sem revelar se o e-mail existe na base.

**Controle de Acesso por Nível de Permissão**

- **FR-047**: O sistema DEVE negar o acesso e registrar a tentativa quando um perfil autenticado solicitar uma ação ou dado fora do seu nível de permissão (FR-025), sem expor detalhes internos do motivo da negação.

**Acúmulo de Perfis por Pessoa**

- **FR-048**: Quando uma candidatura aprovada (FR-019) corresponder ao mesmo CPF de um usuário já cadastrado como voluntário, o sistema DEVE adicionar o perfil de funcionário ao cadastro existente, em vez de criar um novo registro de usuário duplicado.

**Confirmação Automática de Submissão**

- **FR-049**: O sistema DEVE enviar automaticamente um e-mail de confirmação ao autor de todo cadastro de voluntário, candidatura a vaga ou solicitação de evento/campanha externa, no momento do envio, contendo o código de protocolo (FR-043) e informando que a análise pode levar alguns dias.
- **FR-049a**: O registro de um cadastro de voluntário, candidatura a vaga ou solicitação de evento/campanha NÃO PODE depender do sucesso do envio do e-mail de confirmação (FR-049); o registro é mantido mesmo se o envio falhar. Em caso de falha, o sistema DEVE tentar reenviar automaticamente o e-mail uma vez após um intervalo; se a nova tentativa também falhar, o sistema DEVE registrar a falha de envio internamente para permitir reenvio ou contato manual pela equipe.
- **FR-049b**: O sistema DEVE enviar automaticamente um e-mail ao autor da submissão a cada decisão da triagem (FR-015, FR-019, FR-022): ao ser chamado para entrevista ou ter a solicitação aprovada (avisando que a instituição vai entrar em contato), e no resultado final, informando se foi aprovada ou rejeitada e, na rejeição, o motivo, quando houver. Decisão de 2026-09-23: até então o autor só descobria o resultado consultando o protocolo, o que é passivo demais para quem se voluntariou e ficou aguardando. Aplica-se a mesma regra de resiliência do FR-049a — a falha no envio NÃO PODE reverter nem alterar a decisão de triagem já registrada.

**Integridade da Confirmação de Doação**

- **FR-050**: O sistema DEVE impedir que uma mesma declaração de doação seja confirmada mais de uma vez: se a doação já estiver com status confirmada, uma nova tentativa de confirmação NÃO PODE alterar o registro. O sistema DEVE também sinalizar ao funcionário, na conferência, declarações pendentes com mesmo valor e data próximos entre si, para que ele avalie se são doações distintas ou uma declaração duplicada pelo mesmo doador.

**Proteção de Dados Pessoais (LGPD)**

- **FR-051**: O sistema DEVE exigir aceite explícito do aviso de privacidade em todo formulário público que colete dados pessoais (cadastro de voluntário, candidatura a vaga, declaração de doação associativa e solicitação externa de evento/campanha), impedindo o envio sem esse aceite. A declaração de doação espontânea, por não coletar dados de identificação (FR-005), está dispensada.
- **FR-052**: O sistema DEVE registrar, junto a cada aceite de consentimento, a data/hora, a finalidade do tratamento e a versão do texto do aviso de privacidade aceito.
- **FR-053**: O sistema DEVE disponibilizar publicamente, sem exigir login, um aviso de privacidade descrevendo quais dados são coletados, com que finalidade, por quanto tempo são retidos e por qual canal o titular exerce seus direitos.
- **FR-054**: Os pedidos do titular (acesso, correção, anonimização e revogação de consentimento) são feitos **fora do sistema**, pelo contato da instituição informado no aviso de privacidade (FR-053); a conferência da identidade de quem pede também é feita fora do sistema. O sistema DEVE permitir que a equipe atenda no Painel o que depende dele: correção (FR-037), anonimização (FR-055) e registro da revogação (FR-057). O doador associado também consulta seus próprios dados no autoatendimento (FR-041). Decisão de 2026-10-03, que substitui o canal público de solicitação com protocolo.
- **FR-055**: O sistema DEVE permitir que a equipe administrativa atenda a um pedido de anonimização, tornando ilegíveis os dados pessoais identificáveis do titular sem excluir fisicamente o registro (FR-024) e preservando histórico e auditoria (FR-035). Quando parte dos dados for necessária ao cumprimento de obrigação legal ou regulatória, o sistema DEVE reter apenas esses dados, anonimizar o restante e exigir o registro da justificativa da retenção, que a instituição comunica ao titular pelo mesmo contato em que recebeu o pedido.
- **FR-056**: O sistema DEVE aplicar prazos de retenção por categoria de dado (candidaturas e cadastros de voluntário rejeitados e anexos de currículo), sinalizando à equipe os registros que atingiram o fim do prazo para anonimização, preservando dados estatísticos não identificáveis. Para candidaturas e cadastros de voluntário não aprovados, com seus anexos, o prazo é de **6 meses** contados da conclusão da triagem (decisão de 2026-09-30), armazenado como configuração editável, não como constante no código.
- **FR-057**: O sistema DEVE permitir que um funcionário registre no Painel a revogação de consentimento pedida pelo titular por contato (FR-054), marcando o consentimento como revogado com data e conta, e interrompendo o uso dos dados para as finalidades revogadas, sem exclusão física do registro.
- **FR-058**: O sistema DEVE tratar os dados de cadastro de voluntários menores de idade com acesso restrito a perfis autorizados. O consentimento específico do responsável legal é a autorização assinada entregue na sede (FR-012); o sistema registra o recebimento dela, com data e conta, e não guarda cópia do documento.
- **FR-059**: ~~Registrar toda solicitação do titular com protocolo e consulta pública.~~ **Removido em 2026-10-03**: os pedidos do titular passaram a ser feitos fora do sistema (FR-054). As ações que a equipe executa no Painel em resposta a eles continuam registradas na auditoria (FR-035). O número fica reservado.

**Ajuda ao Usuário do Painel Administrativo**

- **FR-060**: O sistema DEVE disponibilizar, dentro do Painel Administrativo, uma área de ajuda acessível a qualquer perfil autenticado, explicando como executar as operações do Painel em linguagem cotidiana: as três triagens (incluindo a etapa de entrevista e o recebimento da autorização do responsável legal), a conferência de doação contra o extrato bancário, o cadastro da chave Pix, a gestão de itens necessários, campanhas, notícias e usuários, e o atendimento, no Painel, dos pedidos do titular recebidos por contato.
- **FR-060a**: A área de ajuda DEVE conter uma seção explicitando **o que o sistema não faz**: não acessa a conta bancária da instituição, não confirma doações automaticamente, não aprova nenhuma submissão sem ação humana, não exclui fisicamente cadastros e não registra contribuições pagas na sede, em dinheiro ou por depósito — por isso os totais do Painel não representam a arrecadação da instituição. Expectativa equivocada da equipe sobre esses pontos compromete a operação tanto quanto uma funcionalidade ausente — se a equipe supuser confirmação automática de doação, nenhuma doação será conferida.
- **FR-061**: O sistema DEVE oferecer ajuda contextual na própria tela onde a operação acontece, no mínimo na conferência de doação, na triagem (entrevista, autorização do menor e rejeição) e na anonimização, sem exigir que o usuário abra a área de ajuda (FR-060) para concluir a tarefa. Esta exigência decorre do Princípio I da constituição, segundo o qual toda tarefa administrativa frequente deve ser concluível sem consultar documentação externa — a área de ajuda é referência de consulta, não pré-requisito de uso.

## Key Entities

- **Usuário**: pessoa com acesso ao sistema. Possui um ou mais perfis (funcionário, voluntário e/ou doador associado) associados ao mesmo CPF — uma pessoa pode acumular mais de um perfil simultaneamente (FR-048) —, dados de identificação (nome, CPF, e-mail, telefone) e status (ativo/inativo). Funcionários acessam o Painel Administrativo por conta(s) administrativa(s) compartilhada(s); só doadores associados possuem login próprio de autoatendimento, restrito aos seus próprios dados, com redefinição de senha por e-mail (FR-046). A inativação não apaga dados e pode ser desfeita (FR-024). O cadastro de voluntário carrega ainda os dados do termo de adesão (FR-011), um código de protocolo, um status de triagem (pendente/chamado para entrevista/aprovado/rejeitado, com motivo opcional na rejeição) e, para menor de idade, o status da autorização do responsável legal (pendente/recebida, com data e conta do recebimento).
- **Doação**: registro da declaração de uma contribuição financeira feita via Pix fora do sistema. Possui o valor do QR code gerado, a data/hora do clique em "Já fiz o Pix", tipo (espontânea ou associativa), status (pendente/confirmada/não localizada, com motivo opcional quando não localizada), vínculo opcional com um doador associado e — quando conferida — autor e data da conferência. Não tem protocolo nem anexo (decisão de 2026-10-04).
- **Chave Pix Institucional**: dado de configuração cadastrado pela equipe administrativa e exibido publicamente na página de doação. Possui a chave Pix, o tipo da chave, o nome do recebedor e a cidade (exigidos pelo BR Code), e autor e data da última atualização. O QR code não é armazenado: é gerado no navegador do doador a cada doação (FR-007). Não é credencial de acesso e não dá ao sistema nenhum poder sobre a conta bancária da instituição.
- **Item Necessário**: necessidade prioritária de doação (item físico ou valor). Possui nome, quantidade/valor necessário, data da última atualização e status (ativo/suprido).
- **Campanha/Evento**: iniciativa institucional. Possui nome, data, descrição, recursos necessários, meta em dinheiro opcional com valor arrecadado informado pela equipe (FR-029b), origem (cadastro interno ou solicitação externa aprovada) e status (ativo/encerrado). Não aceita data passada no cadastro.
- **Candidatura a Vaga**: submissão de candidato a emprego. Possui cargo pretendido, dados pessoais (incluindo CPF e data de nascimento, FR-016a), currículo anexado ou descrição textual de experiência, código de protocolo e status (em análise/chamado para entrevista/aprovada/rejeitada, com motivo opcional na rejeição).
- **Solicitação de Evento/Campanha Externa**: submissão de terceiros propondo um evento/campanha. Possui dados de contato, nome do evento, tipo, objetivo, data pretendida, recursos esperados, código de protocolo e status (em análise/aprovada — aguardando contato/evento confirmado/rejeitada, com motivo opcional na rejeição). Só no status "evento confirmado" gera a Campanha/Evento correspondente.
- **Notícia/Atualização Institucional**: conteúdo de divulgação publicado no Portal Público (notícias, informações institucionais e necessidades). Pode ter uma imagem com texto alternativo obrigatório (FR-032b) e status (publicada/despublicada, FR-032a). Sem sincronização com redes sociais (FR-033 removido).
- **Autorização de Responsável Legal**: documento em papel, assinado e entregue na sede. O sistema não guarda o arquivo: registra apenas, no cadastro do voluntário menor de idade, se a autorização está pendente ou recebida, com data e conta do recebimento (FR-012, FR-058).
- **Registro de Consentimento**: comprovação do aceite do aviso de privacidade por um titular. Possui vínculo com a submissão/cadastro correspondente, data/hora do aceite, finalidade do tratamento, versão do texto aceito e status (vigente/revogado, com data da revogação quando aplicável).
- ~~**Solicitação de Titular de Dados**~~: **removida em 2026-10-03** — os pedidos do titular são feitos fora do sistema (FR-054). As ações executadas no Painel em resposta a eles (correção, anonimização com justificativa de retenção, registro de revogação) ficam na trilha de auditoria (FR-035).

## Success Criteria (mandatory)

### Measurable Outcomes

- **SC-001**: A doação associativa aparece no histórico do autoatendimento do doador imediatamente após um funcionário confirmá-la no Painel Administrativo — o tempo total percebido pelo doador depende da rotina de conferência da equipe (SC-001a), não do sistema.
- **SC-001a**: A equipe administrativa consegue conferir e confirmar uma declaração de doação pendente contra o extrato bancário em menos de 2 minutos por declaração, e a instituição se compromete a fazer essa conferência ao menos uma vez por dia útil.
- **SC-002**: Uma atualização em um item necessário (cadastro, quantidade ou baixa) aparece refletida no Portal Público em até 1 minuto após o registro.
- **SC-003**: 100% das campanhas, eventos e necessidades vigentes são exibidos corretamente no Portal Público sem exigir login, em qualquer teste de acesso público.
- **SC-004**: Em testes de controle de acesso, 0% dos dados pessoais de candidatos, voluntários e doadores ficam visíveis a perfis não autorizados.
- **SC-005**: 100% das funcionalidades do Portal Público operam corretamente nas versões mais recentes de Chrome, Firefox, Edge e Safari, em telas de desktop, tablet e smartphone.
- **SC-006**: 100% das campanhas/eventos aprovados no Painel Administrativo aparecem no Portal Público sem nenhuma ação manual adicional.
- **SC-007**: A equipe de triagem recebe notificação de um novo cadastro de voluntário em até 5 minutos após a submissão.
- **SC-008**: 100% dos dados cadastrados no sistema podem ser localizados e corrigidos posteriormente pela equipe administrativa.
- **SC-009**: Um visitante consegue localizar a chave Pix/QR code e concluir a declaração de uma doação espontânea, do acesso à página até o registro da declaração, em menos de 2 minutos (sem contar o tempo do pagamento no aplicativo do banco).
- **SC-010**: A equipe administrativa consegue publicar ou atualizar uma necessidade de doação no Portal Público em menos de 5 minutos, sem depender de planilhas ou publicações manuais em redes sociais.
- **SC-011**: Um autor de submissão (voluntário, candidato ou solicitante externo) consegue consultar o status atual da própria submissão usando o protocolo recebido, sem precisar contatar a equipe por telefone ou e-mail, em menos de 1 minuto.
- **SC-012**: Um doador associado consegue consultar seus próprios dados e histórico pela área de autoatendimento sem depender de a equipe administrativa levantar essa informação manualmente.
- **SC-013**: O e-mail automático de confirmação de envio (FR-049) é entregue ao autor da submissão em até 5 minutos após o registro.
- **SC-014**: 100% dos registros criados por formulários públicos que coletam dados pessoais possuem um consentimento associado, com data/hora, finalidade e versão do aviso de privacidade — verificável em qualquer auditoria de amostra.
- **SC-015**: Depois que a instituição recebe e confere um pedido do titular, a equipe executa no Painel a correção, a anonimização ou o registro da revogação em menos de 5 minutos por pedido. O prazo de resposta ao titular (15 dias corridos) é compromisso da instituição, fora do sistema, já que o pedido chega por contato (FR-054).
- **SC-016**: Após o atendimento de um pedido de anonimização, 0% dos dados pessoais identificáveis daquele titular permanecem legíveis nas telas e consultas do sistema, enquanto 100% dos registros de histórico e auditoria vinculados continuam existindo.

## Assumptions

- O fuso horário de referência para datas de eventos e prazos é o horário de Brasília (America/Sao_Paulo).
- A instituição fornece previamente os textos e imagens da página institucional (história, missão, equipe); a geração desse conteúdo não faz parte do sistema.
- A lista de cargos disponíveis para candidatura (limpeza, cuidador, enfermagem, cozinha) é fixa nesta versão; alterá-la exige nova validação de escopo.
- A maioridade civil brasileira (18 anos), calculada pela data de nascimento, é o critério usado para exigir ou dispensar a autorização do responsável legal no cadastro de voluntário.
- Anexos (currículo e imagem de notícia) aceitam formatos comuns de documento e imagem, com tamanho máximo razoável definido tecnicamente na fase de planejamento. A autorização do responsável legal não é anexo: é entregue em papel na sede (FR-012).
- Não existe janela de espera automática: como não há API de pagamentos, toda declaração de doação nasce pendente e assim permanece até a conferência humana contra o extrato bancário (FR-008), sem ser descartada. Nenhum doador acompanha a declaração pendente; o associado vê a doação no autoatendimento depois de confirmada (decisão de 2026-10-04).
- O sistema não integra nenhuma API de pagamentos e não tem acesso à conta bancária da instituição. A chave Pix é conteúdo institucional cadastrado pela equipe, e o QR code é gerado a partir dela no navegador do doador, como Pix estático (FR-007); a conciliação entre o extrato bancário e as declarações de doação é trabalho humano, conforme o Princípio VII da constituição (versão 2.0.0). Consequência aceita conscientemente: a confirmação de uma doação depende da rotina da equipe, e uma doação real cujo doador não declare nada no site não aparece no sistema.
- Toda a equipe de funcionários com acesso ao Painel Administrativo pode visualizar a fila de triagem pendente; a notificação de novo cadastro/candidatura/solicitação chega a esse grupo, não a uma pessoa específica pré-configurada.
- Devido ao pequeno número de pessoas na administração, o acesso de funcionários ao Painel Administrativo é feito por uma conta administrativa (ou um pequeno número de contas) compartilhada entre a equipe, e não por credencial individual gerada por funcionário; a aprovação de uma candidatura efetiva apenas o registro cadastral do novo funcionário, sem provisionar acesso individual ao sistema. Como consequência, o registro de auditoria (FR-035) identifica a conta institucional utilizada em cada ação, não o funcionário individual que a executou.
- Doadores associados usam autenticação própria padrão (login e senha, com redefinição de senha por e-mail — FR-046) para acessar sua área de autoatendimento restrita aos próprios dados.
- O código de protocolo usado na consulta pública de status (FR-044) é gerado de forma não sequencial e não previsível, funcionando como único identificador necessário para a consulta, de modo a evitar que alguém descubra o status de submissões de terceiros por tentativa/adivinhação. Doações não têm protocolo desde 2026-10-04.
- A hospedagem do sistema roda em plano gratuito (Vercel + Neon/PostgreSQL), o que implica ausência de domínio próprio, SLA ou suporte pago, e possível hibernação do banco de dados após período de inatividade (podendo afetar pontualmente o prazo do SC-001). Caso a operação exija recursos além do plano gratuito no futuro, a contratação de um plano superior é decisão e custo da instituição, fora da manutenção contínua do grupo.
- **A instituição confirmou em 2026-09-23 que não possui domínio próprio e não pretende registrar um.** Duas consequências registradas: o endereço do sistema é um subdomínio do provedor de hospedagem, e o envio de e-mail passa a depender do SMTP da conta Gmail institucional (research D5), única rota que autentica corretamente sem domínio. Nenhuma das duas impede a operação, mas ambas reduzem a confiabilidade do e-mail.
- **O código de protocolo é o canal primário de acompanhamento; o e-mail é complementar.** Como o sistema envia a partir de um endereço sem domínio próprio, existe risco real de as mensagens serem classificadas como spam — e essa falha é silenciosa, ao contrário da falha de envio, que o FR-049a detecta e sinaliza. Por isso a interface DEVE enfatizar o registro do código de protocolo ("anote este código") em vez de anunciar o envio do e-mail como se fosse garantia de recebimento.
- A conformidade com a LGPD faz parte do escopo desta versão no que o sistema pode garantir tecnicamente: consentimento registrado, aviso de privacidade publicado, anonimização, registro de revogação e prazos de retenção (FR-051 a FR-058). O recebimento dos pedidos do titular e a conferência de sua identidade ficam fora do sistema, pelo contato da instituição (FR-054, decisão de 2026-10-03). Continuam sendo responsabilidade organizacional da instituição, fora do sistema: a designação do encarregado (DPO), a redação jurídica do texto do aviso de privacidade e a definição formal das bases legais e dos prazos de retenção por categoria — o sistema apenas aplica os prazos e textos que a instituição fornecer. Exceção prática registrada em 2026-09-30: a instituição informou não ter quem redija o aviso de privacidade, então o grupo redige um rascunho (já com o prazo de 6 meses do FR-056) e a instituição o aprova; a responsabilidade formal pelo texto e pelo prazo continua sendo dela.
- O prazo de resposta ao titular citado no SC-015 (15 dias corridos) segue o parâmetro da LGPD para solicitações de acesso e é cumprido pela instituição fora do sistema; prazos diferentes exigem nova validação com a instituição.
- Doações espontâneas não coletam dados de identificação (FR-005) e, portanto, não geram registro de consentimento nem são alcançadas por pedidos de anonimização — não há titular identificável vinculado a elas.
- Fica fora de escopo desta versão: cadastro/gestão completa de residentes, controle de consultas e exames, qualquer integração automática com redes sociais (FR-033 removido), geração de conteúdo por IA, relatórios avançados/BI, aplicativo móvel nativo, gateway de pagamento próprio, integração com sistemas externos de saúde (CNES, prontuários) e módulo financeiro completo — conforme o Princípio VI da constituição do projeto.