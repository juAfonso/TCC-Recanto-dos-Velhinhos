# Texto do TCC revisado — seções 8, 11, 12, 19.1 e 19.2

> **Data:** 2026-10-04
> **Origem:** versão conferida pelo grupo, corrigida na redação e alinhada ao
> `specs/001-portal-painel-ilpi/spec.md` (Sessions 2026-10-03 (2) e 2026-10-04).
> Em caso de divergência, o `spec.md` prevalece. Este arquivo é a redação para colar no documento.

## O que mudou em relação à versão do grupo

Para revisão antes de colar. Os itens marcados com **(decidido)** foram confirmados em 2026-10-03;
os demais são correções de redação ou de coerência.

| Onde | Antes | Agora | Por quê |
|---|---|---|---|
| História 1 | "declarando que paguei (por meio de um botão confirmando)" | Botão "Já fiz o Pix" | "Confirmar" é ação exclusiva do funcionário; o doador **declara**. |
| História 9 | Anonimizar registro (duplicava a 26) | Inativar usuário | Os testes da 9 são de inativação; a anonimização já é a 26. |
| Teste 9 **(decidido)** | Inativar "apagando dados sensíveis"; "excluir permanentemente" permitido | Inativar não apaga nada e pode ser desfeito; não existe exclusão | Inativar e anonimizar são coisas diferentes: o voluntário afastado precisa poder voltar. |
| Testes 11 e 13 **(decidido)** | "Aprovar" = chamar para entrevista e, ao mesmo tempo, efetivar como funcionário | Etapa "chamado para entrevista" antes da aprovação final | O texto contratava quem ainda não tinha sido entrevistado. |
| Testes 11 e 13 **(decidido)** | Motivo opcional | Motivo opcional (mantido) | Reverte a regra anterior de motivo obrigatório. |
| Teste 11 **(decidido)** | 6 meses "a partir do momento em que mandou a solicitação" | 6 meses a partir da rejeição | Contando do envio, uma triagem demorada apagaria o cadastro antes da decisão. |
| Teste 10 **(decidido)** | Autorização entregue na instituição | Mantido, com página pronta para impressão e bloqueio da aprovação até a autorização ser recebida | Nenhum documento de menor fica guardado no sistema. |
| História 10 | Sem data de nascimento | Inclui data de nascimento | A regra do menor de idade depende dela. |
| Teste 1 **(decidido)** | Mínimo R$ 1,00 | Mantido | O sistema foi ajustado de R$ 5 para R$ 1. |
| Teste 2 **(decidido)** | Conta criada automaticamente | Conta criada e ativada por link enviado ao e-mail | Impede criar conta em nome de outra pessoa digitando o e-mail dela. |
| Teste 15 **(decidido)** | Aprovar → "irão entrar em contato" | Aprovar → aguardando contato → confirmar evento → publicar | Requisito "Gestão de campanhas" misturava publicação interna com contato externo. |
| Histórias 17 e 18 **(decidido)** | Só doador associado | Mantido | O voluntário não tem mais autoatendimento. |
| Histórias 25 e 26 **(decidido)** | Pedidos do titular "a partir de um contato" | Mantido: fora do sistema, pelo contato do aviso de privacidade | Teste 25 reescrito, porque "o pedido é concluído" não era verificável. |
| Doação **(decidido em 2026-10-04)** | Protocolo para cada doação | Sem protocolo: só o botão "Já fiz o Pix"; conferência por valor, data/hora e nome | Decisão do grupo. Não há recibo: a confirmação fica registrada no Painel, e a doação associativa só aparece no autoatendimento depois de confirmada. |
| Doação **(decidido em 2026-10-04)** | Anexo opcional do comprovante | Removido | A conferência passou a ser por valor, data/hora e nome. |
| História 2 **(decidido em 2026-10-04)** | Cadastro de doador associado | Feito junto com a primeira doação; nas seguintes, doa logado sem redigitar dados | Não existe tela de cadastro separada. |
| Campanhas **(decidido em 2026-10-04)** | Toda campanha com "X% arrecadado" | Meta em dinheiro opcional, valor arrecadado informado pela equipe | Doação Pix não é ligada a campanha; o sistema não tem como calcular o percentual. |
| Notícias **(decidido em 2026-10-04)** | Não dava para editar nem excluir | Editar, despublicar e uma imagem com texto alternativo | Excluir contraria o Princípio III; despublicar resolve o mesmo problema. |
| Candidatura **(decidido em 2026-10-04)** | Idade, sem CPF | Data de nascimento e CPF | Sem CPF, a junção voluntário–funcionário pelo CPF não funciona. |
| Solicitação externa e telefone | — | Nome do evento; telefone só aceita número válido, com máscara | Problemas apontados na revisão do protótipo. |
| Requisito "Preservação de registros" | "Exclusão definitiva de dados sensíveis após 6 meses" | Anonimização dos não aprovados após 6 meses da triagem | O prazo vale só para não aprovados; nada é excluído fisicamente. |
| RNF Integridade | "Somente registros sensíveis podem ser apagados" | Nenhum registro é apagado | Contradizia o próprio objetivo 1 ("sem exclusão definitiva"). |
| Objetivo 1 | "perfis de usuários — doadores associados —" | Funcionários, voluntários e doadores associados | Deixava de fora dois dos três perfis. |
| Requisito "Anonimização" | "elimina os dados pessoais, mas anonimizando os outros dados" | Redação reescrita | A frase era circular. |
| Divulgação | — | Sem sincronização com redes sociais | Removida do escopo (Princípio VI). |

Os problemas do protótipo apontados pelo grupo estão refletidos aqui quando mudam requisito; as
correções de tela estão listadas como pendência no CLAUDE.md.

---

## 8. Objetivos Específicos

- Desenvolver módulos para cadastro e gerenciamento dos perfis de usuários da instituição —
  funcionários, voluntários e doadores associados —, com controle de níveis de acesso e preservação
  do histórico, sem exclusão definitiva de registros.
- Implementar um canal de doação financeira via Pix no portal público, com registro das doações
  declaradas pelo doador e conferência posterior pela equipe administrativa.
- Implementar ferramentas para a organização de campanhas e eventos promovidos pela instituição,
  incluindo o cadastro de ações, datas, descrição e recursos necessários, com verificação de
  conflito de datas.
- Implementar uma funcionalidade para divulgação dos itens e suprimentos de que a instituição
  necessita no momento, permitindo atualização simples pela administração e exibição automática no
  portal público.
- Implementar um fluxo de triagem de voluntários pela administração, com etapa de entrevista,
  incluindo o tratamento de candidatos menores de idade mediante autorização do responsável legal.
- Implementar o recebimento e a avaliação de candidaturas a vagas de emprego, com envio de currículo
  e triagem pela administração, com etapa de entrevista.
- Implementar um canal para que pessoas e organizações externas proponham eventos ou campanhas à
  instituição, sujeitos à avaliação da administração.
- Disponibilizar uma área de autoatendimento, com acesso individual, para que doadores associados
  consultem exclusivamente seus próprios dados e histórico.
- Disponibilizar consulta pública do andamento de solicitações por meio de código de
  protocolo, sem exigência de cadastro ou de fornecimento de dados pessoais.
- Ampliar a visibilidade da instituição por meio da divulgação online centralizada de sua identidade
  institucional, atividades, notícias, necessidades e campanhas.
- Assegurar a conformidade do tratamento de dados pessoais com a Lei Geral de Proteção de Dados, por
  meio do registro de consentimento, da publicação de aviso de privacidade e da indicação de contato
  para o exercício dos direitos do titular.
- Desenvolver uma interface acessível, responsiva e de fácil utilização, adequada aos diferentes
  perfis de usuários da instituição, incluindo pessoas com baixa familiaridade tecnológica.

---

## 11. Requisitos Não Funcionais

### Usabilidade

- Interface intuitiva, de fácil compreensão e uso, adequada a funcionários e voluntários com
  diferentes níveis de familiaridade tecnológica, incluindo pessoas idosas.
- Layouts simples, menus claros e navegação direta, com linguagem cotidiana em português e sem
  jargão técnico nos textos visíveis ao usuário.

### Acessibilidade

- Contraste adequado entre texto e fundo, verificado em todas as telas.
- Fontes legíveis, com tamanho confortável para leitores idosos e sem quebra de layout quando o
  usuário amplia o zoom do navegador.
- Navegação completa por teclado, com foco visível e ordem de tabulação coerente.
- Texto alternativo descritivo em toda imagem que transmita informação, e rótulos associados a todos
  os campos de formulário.

### Responsividade e compatibilidade

- Funcionamento correto nas versões mais recentes dos navegadores Chrome, Firefox, Edge e Safari.
- Layout projetado primeiro para telas pequenas e ampliado para telas maiores, com experiência
  consistente em smartphone, tablet e desktop.
- Nenhuma funcionalidade do portal público pode depender de recurso indisponível em dispositivos
  móveis.

### Segurança

- Autenticação obrigatória para acesso ao Painel Administrativo e à área de autoatendimento.
- Senhas armazenadas exclusivamente de forma cifrada, nunca em texto claro.
- Autorização verificada no servidor a cada requisição; ocultar um elemento na interface não
  constitui controle de acesso.
- Acesso a dados pessoais de voluntários, candidatos e doadores restrito a perfis autorizados, sem
  exposição no portal público.

### Privacidade e proteção de dados pessoais

- Tratamento de dados pessoais em observância à Lei nº 13.709/2018, com coleta mínima necessária e
  finalidade declarada ao titular.
- Consentimento registrado com data, finalidade e versão do aviso aceito.
- Dados de menores de idade com acesso restrito a perfis autorizados. A autorização do responsável
  legal é entregue em papel na sede da instituição; o sistema registra apenas o seu recebimento e
  não guarda cópia do documento.
- Arquivos enviados pelo público acessíveis apenas mediante verificação de permissão, nunca por
  endereço público direto.

### Integridade e rastreabilidade

- Nenhum registro é excluído do sistema: registros de negócio são inativados ou mudam de status, e
  dados pessoais só deixam de ser legíveis por anonimização.
- Toda alteração de status registra a conta que a executou e a data, permitindo auditoria
  posterior.
- A anonimização a pedido do titular torna os dados pessoais ilegíveis sem descaracterizar o
  histórico e a trilha de auditoria.

### Desempenho

- Conclusão de uma declaração de doação, do acesso à página ao registro da declaração, em menos de
  dois minutos, sem contar o tempo do pagamento no aplicativo do banco.
- Conferência e confirmação de uma declaração de doação pela equipe em menos de dois minutos por
  registro.
- Consultas otimizadas por índices nos campos usados em busca e listagem, evitando degradação com o
  crescimento da base.

### Disponibilidade e hospedagem

- Sistema acessível pela internet, a qualquer horário, sem dependência de instalação local.
- A hospedagem utiliza planos gratuitos nesta versão, o que implica ausência de acordo de nível de
  serviço e de suporte contratado.
- O banco de dados pode entrar em hibernação após período de inatividade, ocasionando atraso
  perceptível na primeira requisição seguinte.
- Falha no serviço externo de envio de e-mail não pode impedir nem reverter o registro de uma
  submissão já efetuada.

### Manutenibilidade

- Estrutura simples, sem dependências desnecessárias, permitindo manutenção por desenvolvedores com
  formação técnica.
- Parâmetros operacionais, como prazos de sinalização e de retenção, armazenados como configuração
  editável pela equipe, sem necessidade de nova publicação do sistema.

---

## 12. Requisitos Funcionais

**Gestão de usuários** — Cadastro, consulta, alteração e inativação de registros dos perfis
funcionário, voluntário e doador associado, com busca por nome, CPF ou e-mail. Cada pessoa tem um
único cadastro, identificado pelo CPF; funcionário e voluntário são papéis exclusivos, e o de doador
associado pode ser acumulado com qualquer um deles.

**Preservação de registros** — Nenhum registro é excluído definitivamente: a remoção de acesso
ocorre por inativação, que pode ser desfeita, preservando o histórico necessário à prestação de
contas da instituição. Os dados pessoais de candidaturas e cadastros de voluntário não aprovados são
anonimizados seis meses após a conclusão da triagem.

**Doação financeira via Pix** — Geração, no portal público, de QR code e código "copia e cola" do Pix
a partir da chave cadastrada pela administração e do valor escolhido pelo doador, permitindo que ele
faça a contribuição pelo aplicativo do próprio banco e, em seguida, declare a doação no sistema pelo
botão "Já fiz o Pix". O doador associado se cadastra na primeira doação e, nas seguintes, doa pela
área de autoatendimento sem informar seus dados de novo.

**Conferência de doações** — Registro de toda declaração de doação com status pendente, valor e
data/hora, sem emissão de recibo, e conferência posterior pela administração contra o extrato bancário da instituição — pelo
valor e pela data/hora e, na doação associativa, também pelo nome do doador —, com confirmação ou
marcação como não localizada, com motivo opcional.

**Gestão de campanhas e eventos** — Cadastro, alteração e encerramento de eventos — com nome, data,
descrição e recursos necessários — e de campanhas — com nome, período, descrição, recursos a
arrecadar e, opcionalmente, meta em dinheiro com valor arrecadado informado pela equipe —, na mesma
tela, com aviso de conflito de datas entre eventos e publicação automática no portal público.

**Divulgação institucional** — Publicação, edição e despublicação de notícias, informações
institucionais e necessidades da instituição no portal público, com uma imagem por notícia
acompanhada de texto alternativo, ampliando a visibilidade da instituição perante a comunidade.

**Cadastro de voluntários** — Cadastro de voluntários pelo portal público, com triagem pela
administração, incluindo etapa de entrevista, antes da atuação junto aos residentes. Para candidatos
menores de idade, a aprovação depende da entrega, na sede da instituição, da autorização assinada
pelo responsável legal.

**Candidatura a vagas de emprego** — Recebimento de candidaturas a vagas pelo portal público, com
CPF, data de nascimento e envio de currículo em arquivo ou descrição textual da experiência, e avaliação pela administração,
incluindo etapa de entrevista. A aprovação efetiva o cadastro do candidato como funcionário nos
registros administrativos.

**Solicitação externa de evento ou campanha** — Recebimento de propostas de eventos ou campanhas
apresentadas por pessoas ou organizações externas, com o nome e a descrição do evento, e avaliação
pela administração. Uma vez
aprovada a proposta e combinados os detalhes com o solicitante, a administração confirma o evento,
que então é publicado automaticamente no portal público.

**Triagem e auditoria** — Impossibilidade de aprovação automática de qualquer submissão originada do
público externo, exigindo ação explícita de um funcionário, com motivo opcional em caso de rejeição,
e registro da conta institucional e da data/hora de toda ação administrativa.

**Itens necessários** — Atualização, pela administração, da lista de itens de que a instituição
necessita no momento, com exibição automática no portal público, baixa dos itens supridos e
sinalização daqueles sem atualização por período prolongado.

**Acompanhamento de solicitações** — Consulta pública do andamento de submissões — cadastro de
voluntário, candidatura e proposta de evento — mediante código de protocolo,
sem necessidade de login e sem exposição de dados pessoais.

**Autoatendimento** — Acesso individual, por doadores associados, a uma área restrita aos seus
próprios dados cadastrais e histórico das doações já confirmadas pela administração, com
novas doações sem redigitar os dados e redefinição de senha por e-mail sem intervenção da
administração.

**Comunicação automática com o solicitante** — Envio automático de e-mail ao autor das submissões de
cadastro de voluntário, candidatura e proposta de evento no momento do envio, contendo o código de
protocolo, e a cada decisão da triagem, informando o resultado.

**Painel de indicadores** — Exibição, no Painel Administrativo, de visão consolidada com indicadores
e alertas prioritários, incluindo itens necessários mais urgentes, itens sem atualização, cadastros
pendentes de triagem e declarações de doação pendentes de conferência.

**Proteção de dados pessoais** — Registro de consentimento explícito em todo formulário público que
colete dados pessoais, com data, finalidade e versão do aviso aceito; publicação do aviso de
privacidade; e indicação do contato pelo qual o titular solicita acesso, correção, anonimização dos
seus dados ou revogação do consentimento.

**Anonimização de dados** — Atendimento, pela administração, de pedidos de anonimização, tornando
ilegíveis os dados pessoais identificáveis do titular e preservando o registro, o histórico e a
trilha de auditoria.

**Controle de acesso** — Restrição do acesso a dados pessoais de candidatos, voluntários e doadores
exclusivamente a perfis autorizados, com negação e registro de toda tentativa de acesso a
funcionalidade fora do nível de permissão do perfil em uso.

**Ajuda ao usuário do Painel** — Disponibilização, dentro do Painel Administrativo, de área de ajuda
que descreve a execução de cada operação e explicita o que o sistema não faz, complementada por
orientações na própria tela nas operações menos autoexplicativas.

---

## 19.1. Histórias de Usuários

1. Eu, como doador, gostaria de encontrar no site a chave Pix e o QR code da instituição para fazer
   minha doação pelo aplicativo do meu banco e, depois, declarar no site que fiz o pagamento (pelo
   botão "Já fiz o Pix").
2. Eu, como doador, gostaria de me cadastrar como doador associado na minha primeira doação, para ter
   meu histórico de contribuições registrado no sistema e poder doar de novo sem informar meus dados
   outra vez.
3. Eu, como funcionário, gostaria de cadastrar e atualizar a chave Pix da instituição, para que ela
   seja exibida no portal público.
4. Eu, como funcionário, gostaria de conferir as declarações de doação pendentes contra o extrato
   bancário da instituição, confirmando-as ou marcando-as como não localizadas, para manter o
   registro correto das doações que chegaram, já que o sistema não tem acesso à conta bancária.
5. Eu, como funcionário, gostaria de cadastrar um novo evento ou campanha, informando data, descrição
   e recursos necessários.
6. Eu, como funcionário, gostaria de encerrar uma campanha ou evento ativo, para que ele deixe de ser
   exibido no portal público, preservando seu histórico.
7. Eu, como funcionário, gostaria de divulgar uma notícia ou necessidade institucional, publicando-a
   no site com uma imagem, e de editá-la ou retirá-la do site quando necessário.
8. Eu, como funcionário administrativo, gostaria de registrar um funcionário ou voluntário no
   sistema.
9. Eu, como funcionário, gostaria de inativar um usuário, removendo seu acesso sem apagar seus dados
   nem seu histórico.
10. Eu, como voluntário, gostaria de me cadastrar diretamente pelo portal público, informando meus
    dados (nome, data de nascimento, escolaridade, profissão, RG, CPF, endereço, bairro, CEP, cidade,
    UF, telefone e e-mail) e o tipo de serviço que vou prestar, com seus objetivos e condições.
11. Eu, como funcionário, gostaria de analisar um cadastro de voluntário pendente, chamando a pessoa
    para entrevista ou rejeitando o cadastro, e depois da entrevista aprová-lo ou rejeitá-lo, antes
    que ela possa atuar junto aos residentes.
12. Eu, como candidato, gostaria de me candidatar a uma vaga de emprego pelo portal público,
    informando meus dados e anexando meu currículo ou descrevendo minha experiência.
13. Eu, como funcionário, gostaria de avaliar uma candidatura recebida, chamando o candidato para
    entrevista ou rejeitando-o, e depois da entrevista aprová-lo ou rejeitá-lo.
14. Eu, como funcionário, gostaria de atualizar a lista de itens necessários da instituição, para que
    ela seja refletida automaticamente no portal público.
15. Eu, como solicitante externo, gostaria de propor um evento ou campanha em parceria com a
    instituição, para que a administração avalie minha proposta.
16. Eu, como visitante do portal público, gostaria de consultar o status da minha solicitação
    (cadastro de voluntário, candidatura a vaga ou proposta de evento/campanha) informando o código
    de protocolo, sem precisar fazer login.
17. Eu, como doador associado, gostaria de acessar uma área de autoatendimento restrita aos meus
    próprios dados, para acompanhar meu histórico de doações e fazer novas doações sem precisar
    informar meus dados de novo.
18. Eu, como doador associado, gostaria de redefinir minha senha de autoatendimento por e-mail, caso
    eu a esqueça, sem precisar contatar a equipe administrativa.
19. Eu, como funcionário, gostaria de acessar o Painel Administrativo por meio de uma conta
    institucional compartilhada pela equipe, sem a necessidade de login individual por funcionário.
20. Eu, como funcionário, preciso que o sistema impeça e registre qualquer tentativa de acesso a uma
    funcionalidade fora do nível de permissão do perfil em uso, para proteger os dados sensíveis da
    instituição.
21. Eu, como funcionário, gostaria de visualizar um painel de indicadores com alertas prioritários
    (itens com prioridade alta, itens sem atualização há muito tempo, cadastros pendentes de triagem
    e declarações de doação pendentes de conferência), para agir rapidamente sobre o que precisa de
    atenção.
22. Eu, como funcionário, gostaria que toda ação administrativa relevante (chamada para entrevista,
    aprovação, rejeição, edição, baixa de item, inativação de usuário, entre outras) fosse
    registrada com data e hora, para fins de auditoria e rastreabilidade — considerando que o acesso
    ao Painel ocorre por conta institucional compartilhada, sem login individual por funcionário.
23. Eu, como visitante, gostaria de ser informado, antes de enviar qualquer formulário que colete
    meus dados pessoais, sobre o tratamento que será dado a eles, e de registrar meu consentimento
    explícito.
24. Eu, como visitante, gostaria de consultar, sem precisar me cadastrar, um aviso de privacidade que
    descreva quais dados a instituição coleta, com que finalidade e por qual contato posso exercer
    meus direitos.
25. Eu, como titular de dados pessoais, gostaria de solicitar o acesso, a correção ou a anonimização
    dos meus dados, ou a revogação do meu consentimento, pelo contato da instituição informado no
    aviso de privacidade.
26. Eu, como funcionário, quero atender a um pedido de anonimização tornando ilegíveis, de forma
    irreversível, os dados pessoais do titular, sem excluir o registro, para cumprir o direito
    previsto na LGPD e, ao mesmo tempo, preservar o histórico e a auditoria da instituição.
27. Eu, como funcionário, gostaria de consultar, dentro do próprio Painel Administrativo, uma área de
    ajuda que explique como executar cada operação e o que o sistema não faz, para não depender de
    treinamento externo.

---

## 19.2. Testes de Aceitação

### 1. Doação via Pix

1. O doador acessa a página de doações e escolhe um valor; o sistema gera o QR code e o código
   "copia e cola" com a chave da instituição e esse valor, com opção de copiar, e avisa que o
   pagamento é feito no aplicativo do próprio banco.
2. Depois de pagar R$ 50,00, o doador clica em "Já fiz o Pix", e o sistema registra a declaração com
   status pendente, com o valor de R$ 50,00 e a data/hora do clique, e exibe um agradecimento
   explicando que a equipe confere a doação manualmente.
3. O doador tenta continuar sem informar o valor, e o sistema pede a correção antes de prosseguir.
4. O doador informa um valor não numérico ou negativo, e o sistema o recusa.
5. O doador informa um valor menor que R$ 1,00, e o sistema avisa que está abaixo do valor mínimo.

### 2. Cadastro de doador associado

1. Na primeira doação associativa, o doador informa nome, e-mail e CPF válidos e clica em "Já fiz o
   Pix"; o sistema registra a declaração, cria o cadastro de doador associado e envia ao e-mail um
   link para definir a senha.
2. O doador informa um CPF em formato inválido, e o sistema pede a correção, sem concluir o
   cadastro.
3. Antes de definir a senha pelo link recebido, o doador tenta entrar no autoatendimento, e o
   sistema nega o acesso.
4. O doador associado entra no autoatendimento, gera o QR code, paga e clica em "Já fiz o Pix", e o
   sistema registra a nova declaração vinculada ao seu cadastro sem pedir seus dados de novo.

### 3. Cadastro da chave Pix institucional

1. O funcionário cadastra a chave Pix, e o sistema passa a exibi-la na página pública de doações.
2. Não havendo chave Pix ativa cadastrada, o sistema informa ao visitante que a doação digital está
   temporariamente indisponível e exibe o contato da instituição.

### 4. Conferência de doação contra o extrato

1. O funcionário abre a conferência, e o sistema mostra, para cada declaração pendente, o valor, a
   data/hora e, se associativa, o nome do doador.
2. O funcionário localiza a entrada correspondente no extrato bancário e confirma a declaração, e o
   sistema atualiza o status para "confirmada", registrando a data da confirmação no Painel; se a
   doação é associativa, ela passa a aparecer no autoatendimento do doador.
3. O funcionário não localiza a entrada no extrato e marca a declaração como não localizada,
   informando o motivo se quiser, e o sistema preserva integralmente o registro.
4. O funcionário tenta confirmar uma doação já confirmada, e o sistema não altera o registro.

### 5. Cadastro de evento ou campanha

1. O funcionário informa uma data disponível, descrição e recursos necessários, e o sistema grava o
   evento e o publica automaticamente no portal público.
2. O funcionário informa uma data em que já existe evento confirmado, e o sistema exibe um aviso de
   conflito, permitindo que ele altere a data ou prossiga mesmo assim.
3. O funcionário informa uma data que já passou, e o sistema pede a correção.
4. O funcionário cadastra uma campanha sem meta em dinheiro, e o portal público a exibe sem barra de
   arrecadação.
5. O funcionário atualiza o valor arrecadado de uma campanha com meta, e o portal público passa a
   exibir o novo progresso.

### 6. Encerramento de campanha ou evento

1. O funcionário encerra uma campanha ativa, e o sistema atualiza seu status para "encerrada",
   removendo-a da listagem pública e preservando seu histórico.
2. O funcionário tenta encerrar uma campanha já encerrada, e o sistema não altera o registro.

### 7. Divulgação de notícia institucional

1. O funcionário publica uma notícia válida, e o sistema a exibe no portal público.
2. O funcionário anexa uma imagem sem preencher o texto alternativo, e o sistema impede a publicação
   até que ele seja preenchido.
3. O funcionário edita uma notícia publicada, e o portal público passa a exibir a versão editada.
4. O funcionário despublica uma notícia, e o sistema a retira do portal público, mantendo-a no
   Painel para ser publicada de novo se necessário.

### 8. Registro de funcionário ou voluntário

1. O funcionário registra um novo usuário do perfil "voluntário" ou "funcionário" com dados válidos,
   e o sistema grava o registro com sucesso.
2. O funcionário tenta registrar um funcionário ou voluntário cujo CPF já existe, e o sistema exibe
   o registro existente em vez de criar um novo.

### 9. Inativação de usuário

1. O funcionário confirma a inativação de um usuário, e o sistema altera o status para "inativo",
   removendo o acesso e mantendo o registro, os dados e o histórico íntegros e consultáveis; a
   inativação pode ser desfeita depois.
2. O funcionário pede a inativação de um usuário que tem uma submissão em triagem (por exemplo, um
   voluntário ativo com candidatura a vaga em análise), e o sistema avisa sobre a pendência,
   permitindo prosseguir se ele decidir.
3. O funcionário procura uma forma de excluir permanentemente um usuário, e o sistema não oferece
   essa opção, indicando a inativação; dados pessoais só deixam de ser legíveis por anonimização
   (teste 26).

### 10. Cadastro de voluntário

1. Um voluntário maior de idade preenche corretamente todos os dados obrigatórios, e o sistema grava
   o cadastro com status "pendente" e o sinaliza no painel de triagem.
2. Um voluntário menor de 18 anos envia o cadastro, e o sistema o grava com a autorização do
   responsável legal pendente, oferecendo uma página pronta para impressão, já preenchida, que deve
   ser entregue assinada na sede da instituição.
3. Um voluntário deixa um campo obrigatório em branco, e o sistema pede a correção antes de
   prosseguir.
4. Ao concluir o envio, o voluntário recebe automaticamente um e-mail de confirmação com o código de
   protocolo e o aviso de que a triagem pode levar alguns dias.
5. O envio do e-mail de confirmação falha, e o sistema mantém o cadastro registrado, tenta reenviar
   e, persistindo a falha, a registra para contato manual.

### 11. Triagem de voluntário

1. O funcionário chama para entrevista um voluntário com cadastro pendente, e o sistema atualiza o
   status para "chamado para entrevista" e avisa o voluntário por e-mail.
2. Depois da entrevista, o funcionário aprova o cadastro, e o sistema atualiza o status do
   voluntário para "ativo".
3. O funcionário tenta aprovar um voluntário menor de idade cuja autorização ainda não foi marcada
   como recebida, e o sistema impede a aprovação.
4. O funcionário rejeita um cadastro, informando o motivo se quiser, e o sistema atualiza o status
   para "rejeitado"; os dados são preservados por 6 meses a partir da rejeição e, depois disso,
   sinalizados para anonimização.

### 12. Candidatura a vaga

1. O candidato seleciona o cargo "cuidador", anexa um currículo válido e informa seus dados, e o
   sistema grava a candidatura com status "em análise" e a sinaliza no painel de triagem.
2. O candidato descreve sua experiência em texto, sem anexar arquivo, e o sistema aceita a
   candidatura normalmente.
3. O candidato não anexa currículo nem preenche a descrição, e o sistema pede o preenchimento de ao
   menos uma das duas opções.
4. O candidato informa um CPF inválido, ou deixa a data de nascimento em branco, e o sistema pede a
   correção antes de enviar.
5. Ao concluir o envio, o candidato recebe automaticamente um e-mail de confirmação com o código de
   protocolo.

### 13. Avaliação de candidatura

1. O funcionário chama o candidato para entrevista, e o sistema atualiza o status para "chamado para
   entrevista", sem criar cadastro de funcionário.
2. Depois da entrevista, o funcionário aprova a candidatura, e o sistema atualiza o status para
   "aprovada" e efetiva o cadastro do candidato como funcionário.
3. O funcionário aprova uma candidatura cujo CPF já corresponde a um voluntário cadastrado, e o
   sistema adiciona o perfil de funcionário ao cadastro existente, sem criar registro duplicado, e
   encerra o papel de voluntário, mantendo seu histórico.
4. O funcionário rejeita a candidatura, informando o motivo se quiser, e o sistema atualiza o status
   para "rejeitada", sem criar cadastro de funcionário.

### 14. Itens necessários

1. O funcionário cadastra um novo item com quantidade e prioridade válidas, e o sistema o publica
   automaticamente no portal público.
2. O funcionário dá baixa em um item suprido, e o sistema o remove da listagem pública sem excluir
   seu registro histórico.
3. O funcionário informa uma quantidade negativa, e o sistema indica o erro, sem gravar a
   informação.
4. Um item permanece 30 dias sem atualização de quantidade, e o sistema o sinaliza no Painel
   Administrativo para revisão.

### 15. Solicitação externa de evento

1. O solicitante informa dados de contato válidos, o nome do evento e a descrição da proposta, e o
   sistema grava a
   solicitação com status "em análise" e a sinaliza no painel de triagem.
2. Ao concluir o envio, o solicitante recebe automaticamente um e-mail de confirmação com o código de
   protocolo.
3. O funcionário aprova a solicitação, e o sistema atualiza o status para "aprovada — aguardando
   contato" e avisa o solicitante, por e-mail, que a instituição vai entrar em contato para combinar
   o evento; nada é publicado ainda.
4. Depois de combinar os detalhes com o solicitante, o funcionário confirma o evento, e o sistema o
   publica automaticamente no portal público.
5. O funcionário aprova uma solicitação cuja data já está ocupada, e o sistema exibe o aviso de
   conflito, permitindo que ele decida prosseguir.

### 16. Consulta de status por protocolo

1. O visitante informa um protocolo válido, e o sistema exibe apenas o tipo, o status atual e a data
   da solicitação, sem expor dados pessoais.
2. O visitante informa um protocolo inexistente ou mal formado, e o sistema responde de forma
   idêntica nos dois casos, informando que nenhum registro foi encontrado.
3. O visitante faz diversas tentativas sucessivas com códigos diferentes, e o sistema limita as
   tentativas, impedindo a descoberta de protocolos de terceiros.

### 17. Autoatendimento

1. O doador associado informa credenciais válidas, e o sistema concede acesso apenas aos seus
   próprios dados, mostrando somente as doações já confirmadas pela administração.
2. O usuário informa e-mail ou senha incorretos, e o sistema nega o acesso.
3. O doador associado autenticado declara uma nova doação, e o sistema a vincula ao seu cadastro sem
   pedir seus dados de novo.
4. Um doador associado tenta acessar, por qualquer meio, dados de outro usuário, e o sistema nega o
   acesso e registra a tentativa.

### 18. Redefinição de senha

1. O usuário solicita a redefinição informando o e-mail cadastrado, e o sistema envia um link de
   redefinição para esse e-mail.
2. O usuário usa o link recebido para definir uma nova senha, e o sistema atualiza a credencial,
   permitindo login imediato.
3. O usuário solicita a redefinição com um e-mail não cadastrado, e o sistema responde da mesma
   forma, sem revelar se o e-mail existe na base.

### 19. Acesso por conta institucional

1. Um funcionário acessa o Painel informando as credenciais da conta institucional, e o sistema
   concede acesso às funcionalidades administrativas.
2. Uma tentativa de acesso com credenciais inválidas é rejeitada pelo sistema.

### 20. Controle de acesso por permissão

1. Um perfil sem permissão tenta executar determinada ação, e o sistema nega o acesso sem expor
   detalhes internos do motivo.
2. A tentativa negada é registrada no histórico de auditoria com data e hora.

### 21. Painel de indicadores

1. O funcionário acessa o painel, e o sistema exibe a quantidade de itens prioritários, de itens sem
   atualização, de cadastros pendentes de triagem e de declarações de doação pendentes de
   conferência.
2. Não havendo pendências, o sistema informa que não há alertas.

### 22. Auditoria das ações administrativas

1. O funcionário aprova um cadastro de voluntário, e o sistema registra a ação, a conta
   institucional utilizada e a data/hora — sem identificar qual funcionário executou a ação, já que
   o acesso é compartilhado.
2. O funcionário consulta o histórico, e o sistema exibe as ações mais recentes em ordem
   cronológica.

### 23. Consentimento na coleta de dados

1. O visitante tenta enviar um formulário que coleta dados pessoais sem aceitar o aviso de
   privacidade, e o sistema impede o envio e explica que o aceite é obrigatório.
2. O visitante aceita e envia, e o sistema registra o consentimento com data/hora, finalidade e
   versão do texto aceito.

### 24. Aviso de privacidade público

1. O visitante acessa o aviso de privacidade sem fazer login, e o sistema exibe quais dados são
   coletados, com que finalidade, por quanto tempo são retidos e por qual contato exercer seus
   direitos.

### 25. Solicitação de direitos do titular

1. O titular pede, pelo contato da instituição, a correção de um dado; o funcionário confere a
   identidade e corrige o dado no Painel, e o sistema grava a correção preservando o histórico da
   alteração e registrando a ação na auditoria.
2. O titular pede, pelo contato da instituição, a revogação do consentimento; o funcionário registra
   a revogação no Painel, e o sistema marca o consentimento como revogado, com a data, e interrompe
   o uso dos dados para as finalidades revogadas, sem excluir o registro.

### 26. Atendimento de anonimização

1. O funcionário atende um pedido de anonimização, e o sistema torna ilegíveis os dados pessoais
   identificáveis do titular, preservando o registro, o histórico e a trilha de auditoria.
2. O titular possui doações confirmadas sujeitas a retenção legal, e o sistema permite reter apenas
   esses dados, anonimizar os demais e registrar a justificativa da retenção.

### 27. Área de ajuda do Painel

1. O funcionário acessa a área de ajuda pelo Painel, e o sistema exibe as instruções de operação e a
   seção que explica o que o sistema não faz.
2. Na tela de conferência de doação, o sistema exibe a explicação do procedimento sem que o
   funcionário precise sair da tela para consultar a ajuda.
