# Objetivos específicos e requisitos — texto revisado para o documento do TCC

> Revisado em 2026-10-07 contra o sistema entregue (fases 1 a 14) e as decisões do `CLAUDE.md`.
> Texto pronto para colar. As notas entre colchetes no fim de cada bloco dizem o que mudou em
> relação à versão do grupo; apague-as ao colar.
>
> Critério da divisão (feedback revisado em 2026-10-07): requisito funcional responde "o que o
> sistema permite fazer"; requisito não funcional responde "com quais características e restrições".
> Por isso, as regras de retenção e o limite de tentativas ficaram só nos RNFs, e os RFs de LGPD
> ficaram só com as funções (registrar consentimento, publicar o aviso, registrar revogação,
> anonimizar). Os objetivos de conformidade com a LGPD e de interface acessível continuam nos
> **objetivos específicos**, que dizem o que o trabalho pretende alcançar e podem incluir metas de
> qualidade; se o orientador preferir objetivos só funcionais, esses dois saem, porque os RNFs
> já os cobrem.

---

## 1. Objetivos Específicos

- Desenvolver módulos para cadastro e gerenciamento dos perfis de pessoas ligadas à instituição — funcionários, voluntários e doadores associados —, com acesso ao Painel Administrativo por conta institucional da equipe, preservação do histórico e sem exclusão definitiva de registros.
- Implementar um canal de doação financeira via Pix no portal público, com registro das doações declaradas pelo doador e conferência posterior pela equipe administrativa.
- Implementar ferramentas para a organização de campanhas e eventos promovidos pela instituição, incluindo o cadastro de ações, datas, descrição e recursos necessários, com verificação de conflito de datas.
- Implementar uma funcionalidade para divulgação dos itens e suprimentos de que a instituição necessita no momento, permitindo atualização simples pela administração e exibição automática no portal público.
- Implementar um fluxo de triagem de voluntários pela administração, com etapa de entrevista e geração do termo de adesão para assinatura, incluindo o tratamento de candidatos menores de idade mediante autorização do responsável legal.
- Implementar o recebimento e a avaliação de candidaturas a vagas de emprego, com envio de currículo e triagem pela administração, com etapa de entrevista.
- Implementar um canal para que pessoas e organizações externas proponham eventos ou campanhas à instituição, sujeitos à avaliação da administração.
- Disponibilizar uma área de autoatendimento, com acesso individual, para que doadores associados consultem exclusivamente seus próprios dados e histórico.
- Disponibilizar consulta pública do andamento de solicitações por meio de código de protocolo, sem exigência de cadastro ou de fornecimento de dados pessoais.
- Ampliar a visibilidade da instituição por meio da divulgação online centralizada de sua identidade institucional, atividades, notícias, necessidades e campanhas.
- Assegurar a conformidade do tratamento de dados pessoais com a Lei Geral de Proteção de Dados, por meio do registro de consentimento, da publicação de aviso de privacidade, da indicação de contato para o exercício dos direitos do titular, da anonimização de dados e da aplicação de prazos de retenção.
- Desenvolver uma interface acessível, responsiva e de fácil utilização, adequada aos diferentes públicos da instituição, incluindo pessoas com baixa familiaridade tecnológica.

[Mudou: o primeiro objetivo não fala mais em "níveis de acesso" para funcionário e voluntário, que não entram no sistema (Constituição 3.0.0); o de voluntários ganhou o termo de adesão (FR-012a); o de LGPD ganhou anonimização e retenção.]

---

## 2. Requisitos Não Funcionais

### Usabilidade

- Interface intuitiva, de fácil compreensão e uso, adequada à equipe da instituição e ao público em geral, com diferentes níveis de familiaridade tecnológica, incluindo pessoas idosas.
- Layouts simples, menus claros e navegação direta, com linguagem cotidiana em português e sem jargão técnico nos textos visíveis ao usuário.

[Mudou: "funcionários e voluntários" virou "equipe e público": voluntário não usa o sistema.]

### Acessibilidade

- Contraste adequado entre texto e fundo, verificado em todas as telas.
- Fontes legíveis, com tamanho confortável para leitores idosos e sem quebra de layout quando o usuário amplia o zoom do navegador para até 200%.
- Navegação completa por teclado, com foco visível e ordem de tabulação coerente.
- Texto alternativo descritivo em toda imagem que transmita informação, e rótulos associados a todos os campos de formulário.
- Mensagens de erro exibidas junto ao campo correspondente, em linguagem clara, indicando como corrigir.

[Mudou: zoom com o limite verificado (200%) e mensagens de erro junto ao campo.]

### Responsividade e compatibilidade

- Funcionamento correto nas versões mais recentes dos navegadores Chrome, Firefox, Edge e Safari.
- Layout projetado primeiro para telas pequenas e ampliado para telas maiores, com experiência consistente em smartphone, tablet e desktop.
- Nenhuma funcionalidade do portal público pode depender de recurso indisponível em dispositivos móveis.

### Segurança

- Autenticação obrigatória para acesso ao Painel Administrativo e à área de autoatendimento.
- Senhas armazenadas exclusivamente de forma cifrada, nunca em texto claro.
- Autorização verificada no servidor a cada requisição; ocultar um elemento na interface não constitui controle de acesso.
- Acesso a dados pessoais de voluntários, candidatos e doadores restrito a perfis autorizados, sem exposição no portal público.
- Limite de tentativas: o login é bloqueado por 15 minutos após cinco erros seguidos, e as consultas públicas de protocolo são limitadas por conexão.
- Sessão encerrada ao fechar o navegador e, em qualquer caso, após 8 horas.
- Códigos de protocolo gerados de forma imprevisível, para impedir a descoberta de solicitações de terceiros; a consulta responde da mesma forma a protocolo inexistente e a protocolo mal formado.

[Mudou: entraram limite de tentativas, duração da sessão e protocolo imprevisível.]

### Privacidade e proteção de dados pessoais

- Tratamento de dados pessoais em observância à Lei nº 13.709/2018, com coleta mínima necessária e finalidade declarada ao titular.
- Consentimento registrado com data, finalidade e versão do aviso aceito.
- Dados de menores de idade com acesso restrito a perfis autorizados. A autorização do responsável legal é entregue em papel na sede da instituição; o sistema registra apenas o seu recebimento e não guarda cópia do documento.
- Arquivos enviados pelo público acessíveis apenas mediante verificação de permissão, nunca por endereço público direto.
- Retenção limitada à finalidade: os dados de candidaturas, cadastros de voluntário e solicitações externas não aprovados ou encerrados são anonimizados seis meses após a conclusão da triagem; o currículo de quem foi contratado, seis meses após a efetivação. Dados de doador associado só são anonimizados a pedido do titular. O prazo é configuração editável pela equipe.

[Mudou: a regra de retenção veio do RF "Preservação de registros", que misturava função e política (feedback de 2026-10-07).]

### Integridade e rastreabilidade

- Nenhum registro é excluído do sistema: registros de negócio são inativados ou mudam de status, e dados pessoais só deixam de ser legíveis por anonimização.
- Toda alteração de status registra a conta que a executou e a data, permitindo auditoria posterior. Como o acesso ao Painel é feito por conta institucional compartilhada, a auditoria identifica a conta utilizada, e não o funcionário individual.
- Toda correção de dados guarda o estado anterior do registro.
- A anonimização a pedido do titular torna os dados pessoais ilegíveis sem descaracterizar o histórico e a trilha de auditoria.

[Mudou: a limitação da conta compartilhada ficou explícita, e entrou o histórico das correções.]

### Desempenho

- Conclusão de uma declaração de doação, do acesso à página ao registro da declaração, em menos de dois minutos, sem contar o tempo do pagamento no aplicativo do banco.
- Conferência e confirmação de uma declaração de doação pela equipe em menos de dois minutos por registro.
- Nova submissão do público exibida na visão consolidada do Painel em até um minuto após o envio.
- Consultas otimizadas por índices nos campos usados em busca e listagem, evitando degradação com o crescimento da base.

[Mudou: entrou o prazo de um minuto para a submissão aparecer no Painel (SC-007).]

### Disponibilidade e hospedagem

- Sistema acessível pela internet, a qualquer horário, sem dependência de instalação local.
- A hospedagem utiliza planos gratuitos nesta versão, sem domínio próprio, o que implica ausência de acordo de nível de serviço e de suporte contratado.
- O banco de dados pode entrar em hibernação após período de inatividade, ocasionando atraso perceptível na primeira requisição seguinte.
- O encerramento automático de eventos e campanhas vencidos é executado uma vez por dia; até lá, o portal público já deixa de exibi-los.
- Falha no serviço externo de envio de e-mail não pode impedir nem reverter o registro de uma submissão já efetuada.
- O e-mail é enviado por conta Gmail da instituição, sem domínio próprio, e pode ser classificado como spam pelo provedor do destinatário; por isso, o código de protocolo é o canal principal de acompanhamento, e o e-mail, complementar.

[Mudou: entraram a falta de domínio, a tarefa diária e o risco de spam do e-mail.]

### Manutenibilidade

- Estrutura simples, sem dependências desnecessárias, permitindo manutenção por desenvolvedores com formação técnica.
- Parâmetros operacionais, como prazos de sinalização e de retenção e o contato da instituição, armazenados como configuração editável pela equipe, sem necessidade de nova publicação do sistema.
- Textos institucionais e aviso de privacidade editáveis pela equipe no Painel, com preservação das versões anteriores.

[Mudou: entraram o contato da instituição e os textos editáveis.]

---

## 3. Requisitos Funcionais

### Gestão de usuários

Cadastro, consulta, alteração e inativação de registros dos perfis funcionário, voluntário e doador associado, com busca por nome, CPF ou e-mail. Cada pessoa tem um único cadastro, identificado pelo CPF; funcionário e voluntário são papéis exclusivos, e o de doador associado pode ser acumulado com qualquer um deles. A inativação é feita papel por papel e pode ser desfeita. O voluntário cadastrado diretamente pela administração dispensa a triagem, mas preenche os dados do termo de adesão; o menor de idade permanece pendente até a entrega da autorização do responsável. O doador associado não é cadastrado pela administração: seu cadastro nasce com a primeira doação associativa.

[Mudou: inativação por papel, cadastro direto de voluntário e origem do doador associado (decisões de 2026-10-06 e 2026-10-07).]

### Inativação e reativação

Inativação e reativação, pela administração, de cada papel de uma pessoa, sem apagar dados, como única forma de remover o acesso ou o vínculo com a instituição; o sistema não oferece exclusão de registros.

### Fila de retenção

Sinalização, à administração, dos registros cujo prazo de retenção venceu, para que sejam anonimizados um a um.

[Mudou: o antigo RF "Preservação de registros" foi dividido. Ficaram como RF as duas funções (inativar e reativar; sinalizar o prazo vencido). A regra "nenhum registro é excluído" já está no RNF de integridade, e a política de prazos foi para o RNF de privacidade (feedback de 2026-10-07).]

### Correção de dados

Correção, pela administração, dos dados de cadastros e de submissões, com registro do estado anterior de cada alteração. A declaração de doação não é editável, porque o que foi conferido contra o extrato é prova da conferência; declaração errada é marcada como não localizada.

[Novo: o FR-037 não aparecia no texto.]

### Doação financeira via Pix

Cadastro, pela administração, da chave Pix da instituição, com QR code de teste para conferência no aplicativo do banco, e possibilidade de retirar a chave do portal. Geração, no portal público, de QR code e código "copia e cola" do Pix a partir da chave cadastrada e do valor escolhido pelo doador, com mínimo de R$ 1,00, permitindo que ele faça a contribuição pelo aplicativo do próprio banco e, em seguida, declare a doação no sistema pelo botão "Já fiz o Pix". A doação pode ser espontânea, sem nenhuma identificação, ou associativa. O doador associado se cadastra na primeira doação e, nas seguintes, doa pela área de autoatendimento sem informar seus dados de novo; quem informa CPF ou e-mail já cadastrado sem estar conectado recebe mensagem neutra pedindo login, sem que o formulário revele quem é associado. Sem chave ativa, o portal não oferece a doação e exibe o contato da instituição. Somente o Pix é registrado no sistema; depósito, transferência e pagamento na sede são controlados pela secretaria, fora dele.

[Mudou: entraram o cadastro e a retirada da chave (FR-007, FR-007a), o valor mínimo, a doação espontânea, a mensagem neutra (FR-006b) e o limite "só Pix" (decisão de 2026-10-03).]

### Conferência de doações

Registro de toda declaração de doação com status pendente, valor e data/hora, sem emissão de recibo, e conferência posterior pela administração contra o extrato bancário da instituição — pelo valor e pela data/hora e, na doação associativa, também pelo nome do doador —, com confirmação ou marcação como não localizada, com motivo opcional. Declarações pendentes de mesmo valor em horários próximos são sinalizadas como possível duplicata, e uma doação confirmada não pode ser confirmada novamente. A declaração não pode ser editada depois de registrada.

[Mudou: entraram a sinalização de duplicata e o bloqueio da confirmação repetida (FR-050).]

### Gestão de campanhas e eventos

Cadastro, alteração e encerramento de eventos — com nome, data, descrição e recursos necessários — e de campanhas — com nome, período, descrição, recursos a arrecadar e, opcionalmente, meta em dinheiro com valor arrecadado informado pela equipe —, na mesma tela, com aviso de conflito de datas entre eventos, publicação automática no portal público e encerramento automático do que já passou da data ou do período.

### Divulgação institucional

Publicação, edição e despublicação de notícias no portal público, com uma imagem opcional por notícia acompanhada de texto alternativo, e edição pela equipe, no Painel, da página institucional (história, missão, equipe, acolhimento de residentes e bazar), com até seis imagens opcionais e preservação das versões anteriores do texto, ampliando a visibilidade da instituição perante a comunidade.

[Mudou: "necessidades da instituição" saiu daqui porque já é o requisito "Itens necessários"; entraram a galeria da página institucional e o histórico de versões.]

### Cadastro de voluntários

Cadastro de voluntários pelo portal público, com os dados do termo de adesão previsto na Lei nº 9.608/1998, e triagem pela administração, incluindo etapa de entrevista, antes da atuação junto aos residentes. Após o envio, o termo de adesão é disponibilizado já preenchido para impressão e assinatura. Para candidatos menores de idade, também é disponibilizada para impressão a autorização do responsável legal, e a aprovação depende da entrega dessa autorização assinada na sede da instituição.

[Mudou: entraram os dados do termo de adesão e as páginas para imprimir (FR-011, FR-012a).]

### Candidatura a vagas de emprego

Recebimento de candidaturas a vagas pelo portal público, com CPF, data de nascimento e envio de currículo em arquivo ou descrição textual da experiência, e avaliação pela administração, incluindo etapa de entrevista. A aprovação efetiva o cadastro do candidato como funcionário nos registros administrativos; se ele já for voluntário, o papel de voluntário é encerrado, sem ser apagado.

[Mudou: entrou o encerramento do papel de voluntário (FR-048).]

### Solicitação externa de evento ou campanha

Recebimento de propostas de eventos ou campanhas apresentadas por pessoas ou organizações externas, com o nome e a descrição do evento, e avaliação pela administração. A proposta aprovada fica aguardando contato; depois de combinados os detalhes com o solicitante, a administração confirma o evento ou a campanha, que então é publicado automaticamente no portal público.

### Triagem e auditoria

Impossibilidade de aprovação automática de qualquer submissão originada do público externo, exigindo ação explícita de um funcionário, com motivo opcional em caso de rejeição, e registro da conta institucional e da data/hora de toda ação administrativa, consultável no Painel em ordem cronológica.

[Mudou: entrou a consulta do histórico de auditoria.]

### Itens necessários

Atualização, pela administração, da lista de itens de que a instituição necessita no momento, com prioridade alta, média ou baixa, exibição automática no portal público, baixa dos itens supridos e sinalização daqueles sem atualização por período prolongado.

[Mudou: entraram os três níveis de prioridade (decisão de 2026-10-05).]

### Acompanhamento de solicitações

Consulta pública do andamento de submissões — cadastro de voluntário, candidatura e proposta de evento — mediante código de protocolo, sem necessidade de login e sem exposição de dados pessoais, exibindo apenas o tipo, a situação e a data.

[Mudou: a resposta idêntica para protocolo inexistente ou mal formado e o limite de consultas (FR-044a) são restrições de segurança e ficaram só no RNF de segurança (feedback de 2026-10-07).]

### Autoatendimento

Acesso individual, por doadores associados, a uma área restrita aos seus próprios dados cadastrais, somente para consulta, e ao histórico das doações já confirmadas pela administração, com novas doações sem redigitar os dados. A senha é criada pelo próprio doador, por link enviado ao seu e-mail após a primeira doação associativa, e pode ser redefinida da mesma forma, sem intervenção da administração. Quando houver nova versão do aviso de privacidade, o doador a aceita na doação seguinte.

[Mudou: entraram a criação da senha por link, a área só de consulta e o aceite de nova versão do aviso (decisão de 2026-10-07).]

### Comunicação automática com o solicitante

Envio automático de e-mail ao autor das submissões de cadastro de voluntário, candidatura e proposta de evento no momento do envio, contendo o código de protocolo, e a cada decisão da triagem, informando o resultado; e ao doador associado, com os links de criação e de redefinição de senha. Se o envio falhar, o sistema tenta novamente e, persistindo a falha, a registra para reenvio ou contato manual pela equipe, sem desfazer o registro da submissão.

[Mudou: entraram os e-mails de senha e o tratamento de falha (FR-049a).]

### Painel de indicadores

Exibição, no Painel Administrativo, de visão consolidada com indicadores e alertas prioritários, incluindo itens necessários mais urgentes, itens sem atualização, cadastros pendentes de triagem, declarações de doação pendentes de conferência, e-mails não entregues e registros com prazo de retenção vencido.

[Mudou: entraram os e-mails não entregues e a fila de retenção.]

### Proteção de dados pessoais

Registro de consentimento explícito em todo formulário público que colete dados pessoais, com data, finalidade e versão do aviso aceito; publicação do aviso de privacidade, em versões que se preservam; e indicação do contato pelo qual o titular solicita acesso, correção, anonimização dos seus dados ou revogação do consentimento. A revogação é registrada pela administração e produz efeito conforme o caso: a submissão em triagem é encerrada, o voluntário ativo é inativado e a conta de doador associado é desativada, sem anonimizar os dados.

[Mudou: entraram o aviso versionado e o efeito da revogação (FR-057).]

### Anonimização de dados

Atendimento, pela administração, de pedidos de anonimização, tornando ilegíveis os dados pessoais identificáveis do titular e preservando o registro, o histórico e a trilha de auditoria. Quando a lei exigir a guarda de parte dos dados, a administração indica quais permanecem e registra a justificativa. Das doações confirmadas de um doador anonimizado ficam apenas valor, data/hora, tipo e status.

[Mudou: entrou a retenção justificada (decisão de 2026-10-07).]

### Controle de acesso

Restrição do acesso a dados pessoais de candidatos, voluntários e doadores exclusivamente a perfis autorizados, com negação e registro de toda tentativa de acesso a funcionalidade fora do nível de permissão do perfil em uso.

### Configurações

Edição, pela administração, dos prazos de sinalização de itens sem atualização e de retenção de dados e do contato da instituição exibido no portal, sem necessidade de alteração no código.

[Novo: a tela existe no sistema e só aparecia nos requisitos não funcionais.]

### Ajuda ao usuário do Painel

Disponibilização, dentro do Painel Administrativo, de área de ajuda que descreve a execução de cada operação e explicita o que o sistema não faz, complementada por orientações na própria tela nas operações menos autoexplicativas.
