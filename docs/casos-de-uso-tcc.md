# SAGE — Casos de Uso

Sistema web para a ILPI Recanto dos Velhinhos Francisco Gonçalves Barbosa — CSU01 a CSU15

> **Revisão de 2026-11-11: alinhamento ao DER, a pedido do orientador.** Três critérios orientaram a revisão:
> (1) toda entidade do DER que um ator mantém tem um caso de uso "Manter"; as entidades criadas como efeito de
> outro fluxo — consentimento e anonimização — e as dependentes de outra — recurso, dentro da campanha — não
> têm caso de uso próprio; (2) as funcionalidades do site que não são cadastro de entidade também são casos de
> uso, desde que o ator alcance um objetivo próprio — por isso o login e a ajuda do Painel não são casos de uso;
> (3) o caso de uso diz o que o sistema faz, não como: sem tela, navegador, janela ou nome de tabela.
> Mudanças: o antigo CSU11 (Exercício de Direitos do Titular) saiu e seu conteúdo foi distribuído (CSU04 e
> CSU13); o CSU03 ficou só com notícias; o CSU04 passou a se chamar Manter Pessoas; entraram os CSU11 a CSU15.
> **No documento do TCC vão só os seis casos de uso principais, descritos por inteiro** (seção 2); os demais
> aparecem na lista da seção 1. A descrição completa deles está no Apêndice B, como material de apoio.
>
> Histórico anterior: revisão de 2026-10-05, alinhada ao `spec.md` e às decisões de 03 e 04/10; atualizações de
> 2026-10-07 (fases 10 a 14) e de 2026-10-17.
>
> Em todos os casos, o fluxo principal descreve só o caminho em que nada dá errado e termina quando o sistema
> registra a submissão; decisões humanas com mais de um resultado possível (aprovar, rejeitar, confirmar, não
> localizar) são fluxos alternativos; validações e erros são fluxos de exceção. Em caso de divergência, o
> `spec.md` prevalece.

---

# 1. Lista dos casos de uso

| Código | Nome | Ator principal | Sumário | No TCC |
|---|---|---|---|---|
| CSU01 | Doação via Pix | Doador | O doador doa por Pix, fora do sistema, e declara a doação; o funcionário a confere no extrato bancário. | Detalhado |
| CSU02 | Manter Campanhas e Eventos | Funcionário | O funcionário cadastra, altera e encerra eventos e campanhas, com os recursos que cada campanha arrecada; o que vence é encerrado automaticamente. | Detalhado |
| CSU03 | Manter Notícias | Funcionário | O funcionário publica, edita, despublica e publica novamente notícias, que o visitante lê no Portal Público. | Lista |
| CSU04 | Manter Pessoas | Funcionário | O funcionário consulta, cadastra, altera, inativa e reativa os papéis das pessoas e atende os pedidos do titular de dados: correção, revogação do consentimento e anonimização. | Detalhado |
| CSU05 | Cadastrar Voluntário | Visitante | O visitante se candidata a voluntário e a equipe faz a triagem, com entrevista e autorização do responsável para menores. | Detalhado |
| CSU06 | Cadastrar Candidato a Vaga | Visitante | O visitante se candidata a uma vaga de emprego e a equipe faz a triagem, com entrevista; a aprovação efetiva o candidato como funcionário. | Detalhado |
| CSU07 | Manter Itens Necessários | Funcionário | O funcionário mantém a lista de necessidades da instituição exibida no Portal Público. | Lista |
| CSU08 | Solicitar Evento ou Campanha Externa | Solicitante externo | Pessoa ou organização externa propõe um evento ou uma campanha; a equipe avalia, combina e confirma, gerando o evento ou a campanha. | Detalhado |
| CSU09 | Autoatendimento do Doador Associado | Doador associado | O doador associado consulta os próprios dados e doações confirmadas e doa sem informar os dados de novo. | Lista |
| CSU10 | Consultar Status de Solicitação | Autor da submissão | Quem enviou uma candidatura ou solicitação consulta o andamento pelo código de protocolo, sem login. | Lista |
| CSU11 | Manter Página Institucional | Funcionário | O funcionário atualiza os textos e as imagens da página institucional, preservando as versões anteriores. | Lista |
| CSU12 | Manter Chave Pix | Funcionário | O funcionário cadastra, troca ou retira a chave Pix da instituição usada nas doações. | Lista |
| CSU13 | Manter Aviso de Privacidade | Funcionário | O funcionário publica uma nova versão do aviso de privacidade, sem alterar as anteriores; o visitante o consulta sem login. | Lista |
| CSU14 | Manter Configurações | Funcionário | O funcionário ajusta os prazos e o contato da instituição usados pelo sistema. | Lista |
| CSU15 | Consultar Auditoria | Funcionário | O funcionário consulta o histórico das ações feitas no sistema e trata os e-mails que não puderam ser entregues. | Lista |

---

# 2. Casos de uso principais

---

# CSU01 — Doação via Pix

| Código | CSU01 |
|---|---|
| Nome | Doação via Pix |
| Sumário | Este caso de uso descreve os passos percorridos pelo doador para fazer uma doação financeira via Pix e declará-la no sistema, e pelo funcionário para conferi-la. O pagamento ocorre fora do sistema, no aplicativo bancário do doador. O sistema registra a doação a partir do clique em "Já fiz o Pix", com status pendente, e ela só se torna confirmada após conferência humana no extrato bancário da instituição. A doação não gera código de protocolo nem recibo. A chave Pix usada é mantida no CSU12. |
| Ator Principal | Doador |
| Ator Secundário | Funcionário |
| Pré-condições | Doador deve estar na página pública de doações do sistema. |

## Fluxo Principal

| Ator (doador) | Sistema |
|---|---|
| 1. Acessa a página pública de doações. | |
| | 2. Exibe os valores sugeridos (R$ 10, 20, 50 e 100), a opção de outro valor, a escolha entre doação espontânea e associativa e o aviso de que o pagamento é feito no aplicativo do próprio banco, de que sem o clique em "Já fiz o Pix" a doação não é registrada e de que a doação espontânea não pode ser acompanhada depois. |
| 3. Mantém a modalidade espontânea e escolhe um valor sugerido ou digita outro valor, de no mínimo R$ 1. | |
| | 4. Gera o QR code Pix estático e o código copia e cola com a chave da instituição e o valor escolhido, com opção de copiar o código. |
| 5. Efetua o pagamento no aplicativo do seu banco, fora do sistema, e clica em "Já fiz o Pix". | |
| | 6. Registra a doação com status pendente, com o valor do QR code e a data/hora do clique, sem nenhum dado de identificação, e a coloca na fila de conferência do Painel Administrativo. |
| | 7. Exibe um agradecimento explicando que a equipe confere a doação manualmente. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Primeira doação associativa

| Ator (doador) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, seleciona a modalidade associativa. | |
| | 2. Solicita nome, CPF, e-mail e telefone, e o aceite explícito do aviso de privacidade. |
| 3. Preenche os dados, aceita o aviso de privacidade e escolhe o valor. | |
| | 4. Gera o QR code Pix estático e o código copia e cola com o valor escolhido. |
| 5. Efetua o pagamento no aplicativo do seu banco e clica em "Já fiz o Pix". | |
| | 6. Registra a doação com status pendente, com valor e data/hora do clique; registra a pessoa com o papel de doador associado e vincula a doação a ela; registra o consentimento da pessoa com data/hora, finalidade e versão do aviso aceito. |
| | 7. Envia ao e-mail informado um link para definir a senha — a conta só dá acesso ao autoatendimento depois que a senha é definida — e retorna ao passo 7 do fluxo principal. |

## Fluxo Alternativo 02 – Doador associado já cadastrado

| Ator (doador associado) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, estando autenticado no autoatendimento (CSU09), escolhe o valor. | |
| | 2. Identifica a pessoa com o papel de doador associado, vincula a doação a ela sem pedir os dados de identificação e gera o QR code com o valor escolhido. |
| 3. Efetua o pagamento no aplicativo do banco e clica em "Já fiz o Pix". | |
| | 4. Registra a doação com status pendente, com valor e data/hora do clique, vinculada à pessoa, e retorna ao passo 7 do fluxo principal. |

## Fluxo Alternativo 03 – Conferência: Pix localizado no extrato

| Ator (funcionário) | Sistema |
|---|---|
| 1. A partir do passo 6 do fluxo principal, com a doação na fila, acessa a fila de conferência no Painel Administrativo. | |
| | 2. Exibe, para cada doação pendente, o valor, a data/hora do clique e, se associativa, o nome do doador, e sinaliza doações com valor e data próximos como possível duplicidade. |
| 3. Localiza no extrato bancário um Pix com o mesmo valor e data/hora próximos — na doação associativa, também pelo nome do doador, como critério auxiliar — e confirma a doação. | |
| | 4. Altera o status para confirmada e registra a data da confirmação e a conta institucional na auditoria. Se a doação é associativa, passa a exibi-la no histórico do doador no autoatendimento. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Conferência: Pix não localizado no extrato

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo alternativo 03, não localiza o Pix correspondente no extrato bancário. | |
| | 2. Oferece a marcação como não localizada, com motivo opcional e, como opção pronta, o motivo padrão para pagamento recebido por depósito ou transferência que não seja Pix. |
| 3. Informa o motivo, se quiser, e confirma a marcação. | |
| | 4. Altera o status para não localizada, preserva o registro sem exclusão física e registra a conta, a data e, quando informado, o motivo na auditoria. O caso de uso se encerra. |

## Fluxo Exceção 05 – Nenhuma chave Pix ativa

| Ator (doador) | Sistema |
|---|---|
| 1. No passo 1 do fluxo principal, acessa a página pública de doações. | |
| | 2. Verifica que não há chave Pix ativa — nunca cadastrada ou retirada do Portal pelo funcionário (CSU12) —, informa que a doação digital está temporariamente indisponível, exibe o contato da instituição e não oferece o QR code nem a declaração "Já fiz o Pix". O caso de uso se encerra. |

## Fluxo Exceção 06 – Valor inválido

| Ator (doador) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, deixa o valor em branco ou informa valor não numérico, negativo ou menor que R$ 1. | |
| | 2. Não gera o QR code, indica o erro no valor — informando o mínimo, quando for o caso — e retorna ao passo 3 do fluxo principal. |

## Fluxo Exceção 07 – Dados do doador associado inválidos ou sem aceite

| Ator (doador) | Sistema |
|---|---|
| 1. No passo 3 do fluxo alternativo 01, deixa dado obrigatório em branco, informa CPF ou e-mail inválido ou não aceita o aviso de privacidade. | |
| | 2. Impede o prosseguimento, indica cada dado a corrigir ou explica que o aceite é obrigatório, e retorna ao passo 3 do fluxo alternativo 01. |

## Fluxo Exceção 08 – Doador paga e não clica em "Já fiz o Pix"

| Ator (doador) | Sistema |
|---|---|
| 1. No passo 5 do fluxo principal, paga no aplicativo do banco e sai da página sem clicar em "Já fiz o Pix". | |
| | 2. Não registra nenhuma doação: o pagamento existe apenas no extrato bancário e é controlado pela secretaria, fora do sistema, como os pagamentos feitos na sede. O caso de uso se encerra. |

## Fluxo Exceção 09 – Tentativa de confirmação em duplicidade

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo alternativo 03, tenta confirmar uma doação já confirmada anteriormente. | |
| | 2. Identifica que o status já é confirmada, recusa a operação e não altera o registro. O caso de uso se encerra. |

## Fluxo Exceção 10 – Associativa sem login com CPF ou e-mail já cadastrado

| Ator (doador) | Sistema |
|---|---|
| 1. No passo 3 do fluxo alternativo 01, sem estar autenticado, informa CPF ou e-mail que já pertence a um doador associado. | |
| | 2. Não gera o QR code nem registra pessoa ou doação e exibe a mesma mensagem neutra que exibiria a qualquer visitante: se já é associado, entre no autoatendimento (CSU09) ou faça a doação espontânea. Não revela se o CPF ou o e-mail está cadastrado. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** A doação está registrada com status pendente, com valor e data/hora, aguardando a conferência do funcionário.
- **Fluxo Alternativo 01 – Primeira doação associativa:** A pessoa está cadastrada com o papel de doador associado, com consentimento registrado, e a doação pendente está vinculada a ela.
- **Fluxo Alternativo 02 – Doador associado já cadastrado:** A doação pendente está vinculada ao doador, sem que ele precisasse informar os dados de novo.
- **Fluxo Alternativo 03 – Conferência: Pix localizado no extrato:** A doação consta como confirmada, com data e conta registradas; se associativa, aparece no autoatendimento do doador.
- **Fluxo Alternativo 04 – Conferência: Pix não localizado no extrato:** A doação consta como não localizada, com o registro preservado; ela não aparece no autoatendimento.
- **Fluxo Exceção 05 – Nenhuma chave Pix ativa:** Nenhuma doação foi registrada.
- **Fluxo Exceção 06 – Valor inválido:** Nenhum QR code foi gerado e nenhuma doação foi registrada.
- **Fluxo Exceção 07 – Dados do doador associado inválidos ou sem aceite:** Nenhuma pessoa nem doação foi registrada.
- **Fluxo Exceção 08 – Doador paga e não clica em "Já fiz o Pix":** A doação não consta no sistema; por isso os totais do Painel não representam a arrecadação da instituição.
- **Fluxo Exceção 09 – Tentativa de confirmação em duplicidade:** O registro permaneceu inalterado.
- **Fluxo Exceção 10 – Associativa sem login com CPF ou e-mail já cadastrado:** Nenhum QR code foi gerado e nenhuma pessoa nem doação foi registrada; o visitante não ficou sabendo se o CPF ou o e-mail está cadastrado.

---

# CSU02 — Manter Campanhas e Eventos

| Código | CSU02 |
|---|---|
| Nome | Manter Campanhas e Eventos |
| Sumário | Este caso de uso descreve os passos percorridos pelo funcionário para cadastrar, alterar e encerrar eventos e campanhas institucionais — o encerramento também acontece automaticamente quando a data do evento ou o período da campanha passa —, que são publicados automaticamente no Portal Público, onde o visitante os consulta sem login. Evento e campanha são tipos diferentes, escolhidos no cadastro: o evento tem data e recursos necessários descritos em texto, e só ele passa pelo aviso de conflito de data; a campanha tem período de arrecadação, os recursos que arrecada (dinheiro ou itens) e meta em dinheiro opcional, com valor arrecadado informado pela equipe, porque as doações via Pix não são vinculadas a campanhas. A equipe também informa quanto foi arrecadado de cada recurso, mesmo depois do encerramento, e gera o relatório da campanha encerrada. Campanha originada de proposta externa (CSU08) arrecada só itens. Os recursos só existem dentro de uma campanha e são mantidos neste caso de uso. |
| Ator Principal | Funcionário |
| Ator Secundário | Visitante |
| Pré-condições | Funcionário deve estar autenticado no Painel Administrativo pela conta institucional. |

## Fluxo Principal

| Ator (funcionário) | Sistema |
|---|---|
| 1. Acessa a gestão de eventos e campanhas do Painel Administrativo. | |
| | 2. Lista os eventos e as campanhas, ativos e encerrados, permitindo ver só eventos ou só campanhas, e oferece as opções cadastrar evento, cadastrar campanha, alterar, registrar arrecadação, encerrar e gerar relatório de campanha. |
| 3. Escolhe cadastrar evento e informa nome, data, objetivo e recursos necessários. | |
| | 4. Verifica se a data já tem outro evento confirmado; havendo conflito, executa o fluxo alternativo 01. |
| | 5. Grava o evento como ativo, publica-o automaticamente no Portal Público e registra a conta e a data na auditoria. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Conflito de data do evento

| Ator (funcionário) | Sistema |
|---|---|
| | 1. No passo 4 do fluxo principal ou no passo 3 do fluxo alternativo 03, avisa que a data do evento coincide com outro evento já confirmado e exibe qual. |
| 2. Opta por alterar a data ou por prosseguir mesmo assim. | |
| | 3. Se a data foi alterada, verifica-a de novo; se o funcionário optou por prosseguir, grava o evento. O aviso é sinalização, nunca bloqueio. |

## Fluxo Alternativo 02 – Cadastrar campanha

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, escolhe cadastrar campanha e informa nome, período de arrecadação, objetivo, os recursos a arrecadar — dinheiro ou itens, ao menos um — e, opcionalmente, meta em dinheiro. | |
| | 2. Grava a campanha como ativa, com seus recursos, sem verificar conflito de data, publica-a automaticamente no Portal Público — sem indicação de progresso, se não houver meta em dinheiro — e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 03 – Alterar evento ou campanha

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, escolhe alterar um evento ou uma campanha existente. | |
| | 2. Exibe os dados atuais e solicita as alterações. |
| 3. Modifica os dados desejados e confirma; se mudou a data de um evento, o sistema executa o fluxo alternativo 01. Na campanha, os recursos são mantidos pelo fluxo alternativo 09. | |
| | 4. Grava as alterações preservando o histórico, atualiza a publicação no Portal Público e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Registrar arrecadação

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, escolhe registrar a arrecadação de uma campanha, ativa ou encerrada, e informa, a partir do controle da secretaria, o valor arrecadado em dinheiro (se a campanha tem meta) e a quantidade arrecadada de cada recurso — com a unidade, no item; em reais, no dinheiro —, deixando em branco o que ainda não foi contado. | |
| | 2. Grava os valores preservando os anteriores no histórico, atualiza o progresso exibido no Portal Público, se houver meta, e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 05 – Encerrar evento ou campanha

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, escolhe encerrar um evento ou uma campanha ativa, a qualquer momento, inclusive antes da data do evento ou do fim do período da campanha. | |
| | 2. Altera o status para encerrado, remove-o da listagem pública sem excluir o registro e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 06 – Encerramento automático por data

| Ator (sistema) | Sistema |
|---|---|
| | 1. Ao começar o dia seguinte à data de um evento ativo, ou ao fim do período de uma campanha ativa, altera o status para encerrado, sem ação do funcionário. |
| | 2. Remove-o da listagem pública sem excluir o registro e registra na auditoria a ação "encerrado automaticamente", com o próprio sistema como autor, e a data/hora. O Portal já não exibe o que passou da data, mesmo antes de o status mudar. O caso de uso se encerra. |

## Fluxo Exceção 07 – Dados inválidos ou data passada

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, no passo 1 do fluxo alternativo 02, no passo 3 do fluxo alternativo 03 ou no passo 1 do fluxo alternativo 09, deixa dado obrigatório em branco, deixa a campanha sem nenhum recurso ativo, informa meta negativa ou informa no cadastro uma data que já passou. | |
| | 2. Não grava, indica cada dado a corrigir e retorna ao passo em que os dados foram informados. |

## Fluxo Exceção 08 – Encerrar o que já está encerrado

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 1 do fluxo alternativo 05, tenta encerrar um evento ou uma campanha que já está encerrada. | |
| | 2. Não altera o registro. O caso de uso se encerra. |

## Fluxo Alternativo 09 – Incluir ou desativar recurso da campanha

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo alternativo 03, sendo uma campanha, inclui um novo recurso a arrecadar (dinheiro ou item) ou desativa um recurso que a campanha deixou de arrecadar. | |
| | 2. Grava o recurso incluído ou marca o recurso como desativado, sem excluí-lo, atualiza a campanha no Portal Público e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 10 – Gerar relatório de campanha

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, escolhe gerar o relatório de campanha. | |
| | 2. Lista as campanhas encerradas para escolha. |
| 3. Escolhe uma campanha. | |
| | 4. Exibe o relatório, pronto para imprimir ou salvar em PDF, com nome, objetivo, período, data de encerramento, origem (quando veio de proposta externa), meta e valor arrecadado em dinheiro (quando houver meta) e a quantidade arrecadada de cada recurso, indicando os que ainda não foram contados e avisando que as quantidades foram informadas pela equipe. O caso de uso se encerra. |

## Fluxo Exceção 11 – Dinheiro em campanha de proposta externa

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo alternativo 03 ou no passo 1 do fluxo alternativo 09, sendo uma campanha originada de proposta externa (CSU08), inclui recurso em dinheiro ou meta em dinheiro. | |
| | 2. Não grava, informa que campanha proposta de fora da instituição arrecada só itens e retorna ao passo em que os dados foram informados. |

## Pós-condições

- **Fluxo principal:** O evento está gravado e publicado no Portal Público.
- **Fluxo Alternativo 01 – Conflito de data do evento:** O funcionário foi avisado do conflito e decidiu conscientemente.
- **Fluxo Alternativo 02 – Cadastrar campanha:** A campanha está gravada, com seus recursos, e publicada no Portal Público.
- **Fluxo Alternativo 03 – Alterar evento ou campanha:** Os dados foram modificados e o histórico da alteração foi preservado.
- **Fluxo Alternativo 04 – Registrar arrecadação:** A campanha tem o valor em dinheiro e as quantidades por recurso informados pela equipe; com meta, o Portal Público exibe o progresso.
- **Fluxo Alternativo 05 – Encerrar evento ou campanha:** O evento ou a campanha saiu da listagem pública e seu registro histórico permanece.
- **Fluxo Alternativo 06 – Encerramento automático por data:** O evento ou a campanha vencido consta como encerrado, fora da listagem pública, com o sistema como autor na auditoria.
- **Fluxo Exceção 07 – Dados inválidos ou data passada:** Nenhuma alteração foi gravada.
- **Fluxo Exceção 08 – Encerrar o que já está encerrado:** O registro permaneceu inalterado.
- **Fluxo Alternativo 09 – Incluir ou desativar recurso da campanha:** A campanha exibe os recursos ativos; o recurso desativado continua registrado.
- **Fluxo Alternativo 10 – Gerar relatório de campanha:** O relatório da campanha encerrada foi exibido para impressão; nada foi alterado.
- **Fluxo Exceção 11 – Dinheiro em campanha de proposta externa:** Nenhuma alteração foi gravada.

---

# CSU04 — Manter Pessoas

| Código | CSU04 |
|---|---|
| Nome | Manter Pessoas |
| Sumário | Este caso de uso descreve os passos percorridos pelo funcionário para consultar, cadastrar, alterar, inativar e reativar as pessoas cadastradas e os seus papéis — funcionário, voluntário e doador associado —, e para atender no sistema os pedidos do titular de dados previstos na LGPD: acesso, correção, revogação do consentimento e anonimização. Cada pessoa tem um único cadastro, pelo CPF, com um ou mais papéis; estar cadastrado não significa ter acesso ao sistema — só o doador associado tem login próprio (CSU09). O sistema não permite exclusão física: a inativação é feita papel por papel, não apaga dados e pode ser desfeita, salvo nos casos do fluxo de exceção 10; dado pessoal só deixa de ser legível por anonimização. Funcionário e voluntário são papéis exclusivos; o de doador associado pode ser acumulado com qualquer um deles e não é cadastrado pelo Painel: nasce com a primeira doação associativa (CSU01). Os pedidos do titular chegam fora do sistema, pelo contato informado no aviso de privacidade (CSU13), e o funcionário confere a identidade de quem pede antes de agir. |
| Ator Principal | Funcionário |
| Ator Secundário | Titular dos dados |
| Pré-condições | Funcionário deve estar autenticado no Painel Administrativo pela conta institucional. |

## Fluxo Principal

| Ator (funcionário) | Sistema |
|---|---|
| 1. Acessa a gestão de pessoas e informa o nome, o CPF ou o e-mail da pessoa que deseja consultar. | |
| | 2. Exibe as pessoas correspondentes, incluindo as inativas, com seus papéis e situação, e a opção de cadastrar nova pessoa. |
| 3. Indica a pessoa desejada. | |
| | 4. Exibe todos os dados cadastrais coletados, os papéis com a situação de cada um, o histórico de correções, as candidaturas e os consentimentos vinculados à pessoa, e as opções alterar dados, adicionar papel, inativar ou reativar cada papel, registrar revogação de consentimento e anonimizar. Quando o titular pede acesso aos seus dados, são estes os dados que o funcionário lhe repassa pelo mesmo contato. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Cadastrar pessoa

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, em vez de indicar uma pessoa, escolhe cadastrar nova pessoa e informa, para o papel de funcionário, nome, CPF, data de nascimento, e-mail e telefone; para o papel de voluntário, os mesmos dados do termo de adesão pedidos no CSU05. | |
| | 2. Verifica se o CPF já existe; existindo, executa o fluxo alternativo 02. |
| | 3. Grava a pessoa com o papel escolhido, sem passar por triagem, porque o cadastro já é ação explícita de um funcionário, e registra a conta e a data. O cadastro de funcionário não registra consentimento nem envia e-mail, porque se baseia no vínculo de trabalho. Funcionário e voluntário maior de idade ficam ativos. Voluntário menor de idade fica pendente, com a autorização do responsável legal pendente, e só é aprovado depois de ela ser marcada como recebida (CSU05, fluxos alternativos 04 e 03). Para o voluntário, maior ou menor, oferece o termo de adesão para imprimir (CSU05, fluxo alternativo 12), que no caso do menor o responsável também assina na sede. O caso de uso se encerra. |

## Fluxo Alternativo 02 – CPF já cadastrado

| Ator (funcionário) | Sistema |
|---|---|
| | 1. No passo 2 do fluxo alternativo 01, identifica que o CPF informado já pertence a uma pessoa cadastrada e exibe o cadastro existente, sem criar outro. |
| 2. Se for o caso, opta por adicionar ao cadastro existente o papel de funcionário ou o de voluntário. | |
| | 3. Se o papel adicionado for o de funcionário e a pessoa for voluntária ativa, avisa que o papel de voluntário será encerrado e pede confirmação. |
| 4. Confirma. | |
| | 5. Adiciona o papel e registra a conta e a data; quando for o caso, encerra o papel de voluntário, sem apagar o registro, porque os dois papéis são exclusivos. Para o papel de voluntário, coleta os dados do termo de adesão (CSU05). O caso de uso se encerra. |

## Fluxo Alternativo 03 – Alterar dados

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 4 do fluxo principal, escolhe alterar os dados da pessoa — por iniciativa da equipe ou a pedido de correção do titular. | |
| | 2. Solicita as alterações. |
| 3. Modifica os dados desejados e confirma. | |
| | 4. Grava as alterações preservando o histórico e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Inativar papel

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 4 do fluxo principal, escolhe inativar um dos papéis da pessoa (por exemplo, deixar de ser voluntária e continuar doadora associada). | |
| | 2. Solicita confirmação, explicando que a inativação não apaga dados e pode ser desfeita; se a pessoa tiver candidatura em triagem, avisa sobre a pendência. |
| 3. Confirma a inativação. | |
| | 4. Altera a situação do papel para inativo, mantém o registro, os dados e o histórico consultáveis e registra a conta e a data. Papel de doador associado inativado perde na hora o acesso ao autoatendimento (CSU09). A pessoa passa a constar como inativa quando nenhum papel está ativo. O caso de uso se encerra. |

## Fluxo Alternativo 05 – Reativar papel

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 4 do fluxo principal, sendo o papel inativo, escolhe reativá-lo. | |
| | 2. Verifica as restrições do fluxo de exceção 10; não havendo impedimento, altera a situação do papel para ativo e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Exceção 06 – Dados inválidos

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 1 do fluxo alternativo 01 ou no passo 3 do fluxo alternativo 03, deixa dado obrigatório em branco ou informa CPF, e-mail ou telefone inválido. | |
| | 2. Não grava, indica cada dado a corrigir e retorna ao passo em que os dados foram informados. |

## Fluxo Exceção 07 – Voluntário que já é funcionário

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 2 do fluxo alternativo 02, tenta adicionar o papel de voluntário a uma pessoa que é funcionária ativa. | |
| | 2. Impede a inclusão e informa que funcionário e voluntário são papéis exclusivos. O caso de uso se encerra. |

## Fluxo Exceção 08 – Tentativa de exclusão definitiva

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 4 do fluxo principal, procura uma forma de excluir definitivamente a pessoa. | |
| | 2. Não oferece exclusão e indica a inativação; informa que dados pessoais só deixam de ser legíveis por anonimização (fluxo alternativo 13). O caso de uso se encerra. |

## Fluxo Exceção 09 – Tentativa de acesso sem permissão

| Ator (visitante ou doador associado) | Sistema |
|---|---|
| 1. Sem estar autenticado pela conta institucional, tenta acessar a gestão de pessoas. | |
| | 2. Nega o acesso sem expor detalhes internos do motivo e registra a tentativa no histórico de auditoria. O caso de uso se encerra. |

## Fluxo Exceção 10 – Reativação não permitida

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 1 do fluxo alternativo 05, tenta reativar um papel encerrado (voluntário efetivado como funcionário, doador associado que revogou o consentimento), o papel de voluntário de quem revogou o consentimento, ou o papel de voluntário de quem é funcionário ativo. | |
| | 2. Impede a reativação e explica o motivo: papel encerrado não volta; quem revogou o consentimento precisa fazer novo cadastro; funcionário e voluntário são papéis exclusivos. O caso de uso se encerra. |

## Fluxo Exceção 11 – Tentativa de cadastrar doador associado

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 1 do fluxo alternativo 01 ou no passo 2 do fluxo alternativo 02, tenta cadastrar uma pessoa como doadora associada. | |
| | 2. Não oferece esse papel e informa que o doador associado nasce com a primeira doação associativa feita no Portal (CSU01). O caso de uso se encerra. |

## Fluxo Alternativo 12 – Registrar revogação do consentimento

| Ator (funcionário) | Sistema |
|---|---|
| 1. A pedido do titular, recebido fora do sistema, e depois de conferir a identidade de quem pede (fluxo de exceção 14), localiza o titular — a pessoa cadastrada ou, se ele nunca foi aprovado, a candidatura ou a solicitação externa que enviou — e registra a revogação do consentimento. | |
| | 2. Altera o consentimento para revogado, com data e conta, e aplica o efeito conforme o que ele cobre: candidatura ou solicitação externa ainda em triagem passa a "encerrada a pedido do titular", sai da fila de triagem e entra no prazo de retenção (CSU05, CSU06, CSU08); voluntário ativo é inativado; doador associado tem o papel encerrado, perde o acesso ao autoatendimento e deixa de poder vincular novas doações, mantidas as já confirmadas. |
| | 3. Não anonimiza nem exclui o registro; se o titular também quiser os dados apagados, é o fluxo alternativo 13. O funcionário informa o titular pelo mesmo contato. O caso de uso se encerra. |

## Fluxo Alternativo 13 – Anonimizar a pedido do titular

| Ator (funcionário) | Sistema |
|---|---|
| 1. A pedido do titular, recebido fora do sistema, e depois de conferir a identidade de quem pede (fluxo de exceção 14), localiza o titular — a pessoa cadastrada ou, se ele nunca foi aprovado, a candidatura ou a solicitação externa que enviou. | |
| | 2. Exibe os registros vinculados ao titular, incluindo as candidaturas ligadas a ele ou feitas com o mesmo CPF e, se ele é doador associado, as doações confirmadas, que serão mantidas sem nenhum dado pessoal. Avisa que a operação não pode ser desfeita. |
| 3. Confirma a anonimização; se parte dos dados for exigida por obrigação legal, executa o fluxo de exceção 15. | |
| | 4. Na mesma operação, torna ilegíveis os dados pessoais da pessoa e de todas essas candidaturas, remove o currículo e os demais documentos anexados, preserva o registro, o histórico e a auditoria sem exclusão física e registra a anonimização com a conta e a data. As doações confirmadas permanecem só com valor, data/hora, tipo e status, vinculadas a "doador anonimizado". |
| 5. Informa o titular, pelo mesmo contato, que o pedido foi atendido. O caso de uso se encerra. | |

## Fluxo Exceção 14 – Identidade do titular não comprovada

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 1 dos fluxos alternativos 12 ou 13, não consegue confirmar que quem pede é o titular dos dados. | |
| | 2. Nenhuma ação é executada no sistema; o funcionário comunica a recusa pelo mesmo contato. O caso de uso se encerra. |

## Fluxo Exceção 15 – Dados sujeitos a obrigação legal

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo alternativo 13, constata que parte dos dados é necessária ao cumprimento de obrigação legal ou regulatória. Não se aplica às doações confirmadas, que já são mantidas sem dado pessoal. | |
| | 2. Permite reter apenas nome, CPF e data de nascimento, um ou mais deles, e exige o registro da justificativa da retenção. Contatos, endereço, RG e currículo nunca podem ser retidos. |
| 3. Marca os dados retidos, registra a justificativa e confirma. | |
| | 4. Armazena a justificativa com a anonimização, anonimiza os demais dados conforme o passo 4 do fluxo alternativo 13 e retorna ao passo 5, em que o funcionário informa ao titular o que foi retido e por quê. |

## Pós-condições

- **Fluxo principal:** Os dados da pessoa foram exibidos à equipe pela conta institucional.
- **Fluxo Alternativo 01 – Cadastrar pessoa:** Uma nova pessoa foi gravada com o papel escolhido, ativo ou, se voluntária menor de idade, pendente da autorização do responsável.
- **Fluxo Alternativo 02 – CPF já cadastrado:** Não há cadastro duplicado; se a pessoa passou de voluntária a funcionária, o papel de voluntário foi encerrado e seu histórico permanece.
- **Fluxo Alternativo 03 – Alterar dados:** Os dados foram modificados e o histórico da alteração foi preservado.
- **Fluxo Alternativo 04 – Inativar papel:** O papel está inativo, com registro, dados e histórico preservados; se era o de doador associado, a pessoa perdeu o acesso ao autoatendimento.
- **Fluxo Alternativo 05 – Reativar papel:** O papel voltou a estar ativo.
- **Fluxo Exceção 06 – Dados inválidos:** Nenhum dado foi gravado.
- **Fluxo Exceção 07 – Voluntário que já é funcionário:** O cadastro permaneceu inalterado.
- **Fluxo Exceção 08 – Tentativa de exclusão definitiva:** Nenhum registro foi excluído.
- **Fluxo Exceção 09 – Tentativa de acesso sem permissão:** O acesso foi negado e a tentativa consta na auditoria.
- **Fluxo Exceção 10 – Reativação não permitida:** O papel permaneceu como estava.
- **Fluxo Exceção 11 – Tentativa de cadastrar doador associado:** Nenhum papel foi adicionado.
- **Fluxo Alternativo 12 – Registrar revogação do consentimento:** O consentimento consta como revogado; a candidatura ou solicitação em triagem está encerrada a pedido do titular, o voluntário está inativo ou o papel de doador associado está encerrado; os dados não foram anonimizados.
- **Fluxo Alternativo 13 – Anonimizar a pedido do titular:** Os dados pessoais do titular deixaram de ser legíveis, enquanto o registro, o histórico, a auditoria e as doações confirmadas — vinculadas a "doador anonimizado" — permanecem íntegros, e a anonimização está registrada.
- **Fluxo Exceção 14 – Identidade do titular não comprovada:** Nenhum dado foi alterado.
- **Fluxo Exceção 15 – Dados sujeitos a obrigação legal:** Os dados retidos possuem justificativa registrada, comunicada ao titular.

---

# CSU05 — Cadastrar Voluntário

| Código | CSU05 |
|---|---|
| Nome | Cadastrar Voluntário |
| Sumário | Este caso de uso descreve os passos percorridos pelo visitante para se candidatar a voluntário e pela equipe para triar essa candidatura, com etapa de entrevista. Não existe autoaprovação: toda candidatura de voluntário feita pelo Portal passa por triagem humana, e só a aprovação final registra a pessoa com o papel de voluntário. Os dados coletados são os do termo de adesão ao serviço voluntário que a instituição já usa (Lei nº 9.608/1998), mais a data de nascimento, que identifica o menor de idade. A equipe imprime pelo Painel o termo já preenchido, que é assinado na sede da instituição; o voluntário não o imprime pelo Portal. O termo é um só para maior e menor: no caso de menor, o responsável legal o assina na sede, no campo próprio, e essa assinatura é a autorização. O cadastro de voluntário feito diretamente pela equipe está no CSU04. |
| Ator Principal | Visitante (candidato a voluntário) |
| Ator Secundário | Funcionário |
| Pré-condições | Visitante deve estar na página pública de voluntariado. O aviso de privacidade deve estar publicado. |

## Fluxo Principal

| Ator (visitante) | Sistema |
|---|---|
| 1. Acessa a página de voluntariado e preenche nome, data de nascimento, RG, CPF, endereço, bairro, CEP, cidade, UF, telefone, e-mail e o tipo de serviço que vai prestar, escolhido numa lista ou descrito em "Outro"; se quiser, também escolaridade, profissão, objetivos e dias e horários disponíveis, que a equipe pode completar na entrevista. | |
| | 2. Verifica a data de nascimento; sendo menor de idade, executa o fluxo alternativo 01. Exibe o resumo do tratamento dos dados e a opção de aceite do aviso de privacidade. |
| 3. Aceita o aviso de privacidade e confirma o envio. | |
| | 4. Registra a candidatura de voluntário com status pendente, registra o consentimento vinculado a ela com data/hora, finalidade e versão do aviso, gera o código de protocolo e sinaliza a candidatura no Painel Administrativo. |
| | 5. Exibe o protocolo, orientando o visitante a anotá-lo, informa que o termo de adesão é preenchido e assinado na sede depois da aprovação e envia e-mail de confirmação informando que a análise pode levar alguns dias. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Voluntário menor de idade

| Ator (visitante) | Sistema |
|---|---|
| | 1. No passo 2 do fluxo principal, identifica que o candidato é menor de idade e informa que o responsável legal precisa ir à sede da instituição assinar o termo de adesão e que a candidatura só é aprovada depois disso. |
| | 2. Retorna ao passo 3 do fluxo principal; a candidatura será registrada com a autorização marcada como pendente. |

## Fluxo Alternativo 02 – Chamar para entrevista

| Ator (funcionário) | Sistema |
|---|---|
| 1. A partir do passo 4 do fluxo principal, com a candidatura sinalizada no Painel, acessa a fila de triagem, avalia a candidatura pendente e chama a pessoa para entrevista. | |
| | 2. Altera o status para chamado para entrevista, registra a conta e a data e envia e-mail ao candidato avisando que a instituição entrará em contato. O caso de uso se encerra. |

## Fluxo Alternativo 03 – Aprovar após entrevista

| Ator (funcionário) | Sistema |
|---|---|
| 1. Depois do fluxo alternativo 02 e da entrevista, aprova a candidatura. | |
| | 2. Sendo menor de idade, verifica se a autorização do responsável foi marcada como recebida; estando pendente, executa o fluxo de exceção 08. Se o CPF pertence a um funcionário ativo, executa o fluxo de exceção 09. |
| | 3. Altera o status para aprovada; registra a pessoa — ou usa o cadastro já existente com o mesmo CPF — com o papel de voluntário ativo, vinculado à candidatura; registra a conta e a data e envia e-mail com o resultado. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Registrar recebimento da autorização

| Ator (funcionário) | Sistema |
|---|---|
| 1. A partir do passo 4 do fluxo principal, sendo candidatura de menor com autorização pendente, imprime o termo de adesão (fluxo alternativo 12), colhe na sede a assinatura do responsável legal e marca a autorização como recebida. | |
| | 2. Registra o recebimento com a data e a conta, sem guardar cópia do documento, e libera a aprovação. O caso de uso se encerra. |

## Fluxo Alternativo 05 – Rejeitar candidatura

| Ator (funcionário) | Sistema |
|---|---|
| 1. A partir do passo 4 do fluxo principal ou depois do fluxo alternativo 02, rejeita a candidatura, informando o motivo, se quiser. | |
| | 2. Altera o status para rejeitada, preserva o registro e, quando informado, o motivo, registra a conta e a data e envia e-mail com o resultado. O caso de uso se encerra. |

## Fluxo Alternativo 06 – Fim do prazo de retenção

| Ator (funcionário) | Sistema |
|---|---|
| | 1. Seis meses após o fluxo alternativo 05, ou após o encerramento a pedido do titular por revogação do consentimento (CSU04, fluxo alternativo 12), com prazo configurável (CSU14), sinaliza a candidatura à equipe para anonimização. |
| 2. Executa a anonimização da candidatura sinalizada. | |
| | 3. Torna ilegíveis os dados pessoais, preservando o registro, o histórico, a auditoria e dados estatísticos não identificáveis, e registra a anonimização com a conta e a data. A anonimização a pedido do titular, antes do prazo, está no CSU04, fluxo alternativo 13. O caso de uso se encerra. |

## Fluxo Exceção 07 – Dados inválidos

| Ator (visitante) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, envia a candidatura com dado obrigatório em branco ou com CPF, CEP, telefone, e-mail ou data de nascimento inválido. | |
| | 2. Impede o envio, indica cada dado a corrigir e retorna ao passo 1 do fluxo principal. |

## Fluxo Exceção 08 – Aprovação de menor sem autorização recebida

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 1 do fluxo alternativo 03, tenta aprovar a candidatura de um menor de idade cuja autorização ainda está pendente. | |
| | 2. Impede a aprovação e informa que a autorização do responsável legal ainda não foi recebida. O caso de uso se encerra. |

## Fluxo Exceção 09 – Pessoa que já é funcionária

| Ator (funcionário) | Sistema |
|---|---|
| | 1. No passo 2 do fluxo alternativo 03, identifica que o CPF da candidatura pertence a um funcionário ativo. |
| | 2. Impede a aprovação e informa que funcionário e voluntário são papéis exclusivos; o funcionário pode rejeitar a candidatura (fluxo alternativo 05). O caso de uso se encerra. |

## Fluxo Exceção 10 – Envio sem aceite do aviso de privacidade

| Ator (visitante) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, tenta enviar a candidatura sem aceitar o aviso de privacidade. | |
| | 2. Impede o envio, explica que o aceite é obrigatório e retorna ao passo 3 do fluxo principal. |

## Fluxo Exceção 11 – Falha no envio de e-mail

| Ator (autor da submissão) | Sistema |
|---|---|
| | 1. No passo 5 do fluxo principal ou ao final dos fluxos alternativos 02, 03 e 05, não consegue enviar o e-mail de confirmação ou de resultado. |
| | 2. Mantém a candidatura e a decisão registradas, tenta reenviar automaticamente uma vez após um intervalo e, persistindo a falha, registra-a para reenvio ou contato manual pela equipe (CSU15). O registro nunca é revertido. O caso de uso se encerra. |

## Fluxo Alternativo 12 – Imprimir o termo de adesão

| Ator (funcionário) | Sistema |
|---|---|
| 1. A partir do passo 4 do fluxo principal, em qualquer etapa da triagem, escolhe imprimir o termo de adesão da candidatura no Painel. | |
| | 2. Exibe o termo de adesão ao serviço voluntário da instituição, o mesmo para maior e menor de idade, preenchido com os dados da candidatura e com os espaços de assinatura do voluntário, do responsável (caso o voluntário seja menor de idade), da presidente da instituição e de duas testemunhas. O termo não é armazenado pelo sistema; registra a conta e a data. |
| 3. Imprime o termo para assinatura na sede. | |
| | 4. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** A candidatura de voluntário está registrada como pendente, com consentimento e protocolo, aguardando triagem; o visitante foi informado de que o termo de adesão é assinado na sede.
- **Fluxo Alternativo 01 – Voluntário menor de idade:** A candidatura do menor fica com a autorização pendente até o responsável assinar o termo na sede; nenhum documento do menor é armazenado no sistema.
- **Fluxo Alternativo 02 – Chamar para entrevista:** A candidatura consta como chamado para entrevista.
- **Fluxo Alternativo 03 – Aprovar após entrevista:** A pessoa está cadastrada com o papel de voluntário ativo, vinculada à candidatura, e a aprovação consta na auditoria.
- **Fluxo Alternativo 04 – Registrar recebimento da autorização:** A autorização consta como recebida e a candidatura do menor pode ser aprovada.
- **Fluxo Alternativo 05 – Rejeitar candidatura:** A candidatura consta como rejeitada e o registro foi preservado.
- **Fluxo Alternativo 06 – Fim do prazo de retenção:** A candidatura rejeitada ou encerrada a pedido do titular foi anonimizada ao fim do prazo de retenção.
- **Fluxo Exceção 07 – Dados inválidos:** Nenhuma candidatura foi registrada.
- **Fluxo Exceção 08 – Aprovação de menor sem autorização recebida:** A candidatura permaneceu sem aprovação.
- **Fluxo Exceção 09 – Pessoa que já é funcionária:** A candidatura permaneceu sem aprovação.
- **Fluxo Exceção 10 – Envio sem aceite do aviso de privacidade:** Nenhuma candidatura foi registrada.
- **Fluxo Exceção 11 – Falha no envio de e-mail:** O registro permanece e a falha de envio está sinalizada à equipe.
- **Fluxo Alternativo 12 – Imprimir o termo de adesão:** O termo preenchido foi impresso; nada foi gravado além do registro da impressão.

---

# CSU06 — Cadastrar Candidato a Vaga

| Código | CSU06 |
|---|---|
| Nome | Cadastrar Candidato a Vaga |
| Sumário | Este caso de uso descreve os passos percorridos pelo visitante para se candidatar a uma vaga de emprego e pela equipe para avaliar a candidatura a vaga, com etapa de entrevista. Só a aprovação final registra a pessoa com o papel de funcionário, sem dar a ela acesso ao sistema. Funcionário e voluntário são papéis exclusivos: quem já é voluntário tem esse papel encerrado ao ser efetivado. |
| Ator Principal | Visitante (candidato) |
| Ator Secundário | Funcionário |
| Pré-condições | Visitante deve estar na página pública de vagas. O aviso de privacidade deve estar publicado. |

## Fluxo Principal

| Ator (visitante) | Sistema |
|---|---|
| 1. Acessa a página de vagas e seleciona um dos cargos: limpeza, cuidador, enfermagem ou cozinha. | |
| | 2. Solicita nome, CPF, data de nascimento, telefone, e-mail e o currículo, em arquivo ou em descrição textual da experiência, e exibe o resumo do tratamento dos dados com a opção de aceite do aviso de privacidade. |
| 3. Preenche os dados, fornece o currículo, aceita o aviso de privacidade e confirma o envio. | |
| | 4. Registra a candidatura a vaga com status em análise, registra o consentimento vinculado a ela, gera o código de protocolo e sinaliza a candidatura no Painel Administrativo. |
| | 5. Exibe o protocolo, orientando o candidato a anotá-lo, e envia e-mail de confirmação. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Chamar para entrevista

| Ator (funcionário) | Sistema |
|---|---|
| 1. A partir do passo 4 do fluxo principal, com a candidatura sinalizada no Painel, acessa a fila de triagem, avalia a candidatura e chama o candidato para entrevista. | |
| | 2. Altera o status para chamado para entrevista, sem registrar o candidato como funcionário, registra a conta e a data e envia e-mail ao candidato avisando que a instituição entrará em contato. O caso de uso se encerra. |

## Fluxo Alternativo 02 – Aprovar após entrevista

| Ator (funcionário) | Sistema |
|---|---|
| 1. Depois do fluxo alternativo 01 e da entrevista, aprova a candidatura. | |
| | 2. Verifica se o CPF do candidato já pertence a uma pessoa com o papel de voluntário; pertencendo, executa o fluxo alternativo 03. |
| | 3. Altera o status para aprovada, registra a pessoa com o papel de funcionário, vinculada à candidatura, sem dar a ela acesso ao sistema, registra a conta e a data e envia e-mail com o resultado. O caso de uso se encerra. |

## Fluxo Alternativo 03 – Candidato já cadastrado como voluntário

| Ator (funcionário) | Sistema |
|---|---|
| | 1. No passo 2 do fluxo alternativo 02, identifica que o CPF do candidato já pertence a uma pessoa com o papel de voluntário. |
| | 2. Altera o status para aprovada, adiciona o papel de funcionário ao cadastro existente, sem criar outro, encerra o papel de voluntário, sem apagar o registro, porque os dois papéis são exclusivos, registra a conta e a data e envia e-mail com o resultado. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Rejeitar candidatura

| Ator (funcionário) | Sistema |
|---|---|
| 1. A partir do passo 4 do fluxo principal ou depois do fluxo alternativo 01, rejeita a candidatura, informando o motivo, se quiser. | |
| | 2. Altera o status para rejeitada, sem registrar o candidato como funcionário, preserva o registro e, quando informado, o motivo, registra a conta e a data e envia e-mail com o resultado. O caso de uso se encerra. |

## Fluxo Alternativo 05 – Fim do prazo de retenção

| Ator (funcionário) | Sistema |
|---|---|
| | 1. Com prazo configurável de seis meses (CSU14), sinaliza à equipe para anonimização: a candidatura inteira, seis meses após o fluxo alternativo 04 ou após o encerramento a pedido do titular por revogação do consentimento (CSU04, fluxo alternativo 12); ou só o currículo, seis meses após a efetivação como funcionário (fluxos alternativos 02 e 03), porque a finalidade do currículo — a seleção — acabou. |
| 2. Executa a anonimização sinalizada. | |
| | 3. Na candidatura rejeitada ou encerrada, torna ilegíveis os dados pessoais e remove o currículo; na aprovada, remove só o currículo (arquivo ou descrição), mantendo a pessoa com o papel de funcionário. Em ambos, preserva o registro, o histórico, a auditoria e dados estatísticos não identificáveis, e registra a anonimização com a conta e a data. A anonimização a pedido do titular, antes do prazo, está no CSU04, fluxo alternativo 13. O caso de uso se encerra. |

## Fluxo Exceção 06 – Dados inválidos

| Ator (visitante) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, envia a candidatura com dado obrigatório em branco ou com CPF, data de nascimento, telefone ou e-mail inválido. | |
| | 2. Impede o envio, indica cada dado a corrigir e retorna ao passo 3 do fluxo principal. |

## Fluxo Exceção 07 – Candidatura sem currículo

| Ator (visitante) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, tenta enviar a candidatura sem anexar arquivo e sem descrever a experiência. | |
| | 2. Impede o envio, explica que é preciso fornecer o currículo em uma das duas formas e retorna ao passo 3 do fluxo principal. |

## Fluxo Exceção 08 – Envio sem aceite do aviso de privacidade

| Ator (visitante) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, tenta enviar a candidatura sem aceitar o aviso de privacidade. | |
| | 2. Impede o envio, explica que o aceite é obrigatório e retorna ao passo 3 do fluxo principal. |

## Fluxo Exceção 09 – Falha no envio de e-mail

| Ator (autor da submissão) | Sistema |
|---|---|
| | 1. No passo 5 do fluxo principal ou ao final dos fluxos alternativos 01 a 04, não consegue enviar o e-mail de confirmação ou de resultado. |
| | 2. Mantém a candidatura e a decisão registradas, tenta reenviar automaticamente uma vez após um intervalo e, persistindo a falha, registra-a para reenvio ou contato manual pela equipe (CSU15). O registro nunca é revertido. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** A candidatura a vaga está registrada como em análise, com consentimento e protocolo, aguardando triagem.
- **Fluxo Alternativo 01 – Chamar para entrevista:** A candidatura consta como chamado para entrevista; ninguém foi registrado como funcionário.
- **Fluxo Alternativo 02 – Aprovar após entrevista:** A pessoa está cadastrada com o papel de funcionário, vinculada à candidatura, sem acesso ao sistema, e a aprovação consta na auditoria.
- **Fluxo Alternativo 03 – Candidato já cadastrado como voluntário:** A pessoa é funcionária no mesmo cadastro, sem duplicação; o papel de voluntário foi encerrado e seu histórico permanece.
- **Fluxo Alternativo 04 – Rejeitar candidatura:** A candidatura consta como rejeitada e o registro foi preservado.
- **Fluxo Alternativo 05 – Fim do prazo de retenção:** A candidatura rejeitada ou encerrada foi anonimizada, com o currículo; ou, na aprovada, só o currículo foi removido e o papel de funcionário permanece.
- **Fluxo Exceção 06 – Dados inválidos:** Nenhuma candidatura foi registrada.
- **Fluxo Exceção 07 – Candidatura sem currículo:** Nenhuma candidatura foi registrada.
- **Fluxo Exceção 08 – Envio sem aceite do aviso de privacidade:** Nenhuma candidatura foi registrada.
- **Fluxo Exceção 09 – Falha no envio de e-mail:** O registro permanece e a falha de envio está sinalizada à equipe.

---

# CSU08 — Solicitar Evento ou Campanha Externa

| Código | CSU08 |
|---|---|
| Nome | Solicitar Evento ou Campanha Externa |
| Sumário | Este caso de uso descreve os passos percorridos por pessoa ou organização externa para propor um evento ou uma campanha à instituição, e pela equipe para avaliar essa proposta. A aprovação não publica nada: a instituição entra em contato com o solicitante e só depois de combinar os detalhes confirma a proposta, que gera um evento ou uma campanha, conforme o tipo, publicado no Portal Público. Os recursos esperados são o que o solicitante pede à instituição (espaço, equipe, horário) e ficam registrados na solicitação. Na campanha, o solicitante lista os itens que ela vai arrecadar; na confirmação, eles se tornam os recursos da campanha, ajustados pelo funcionário. Campanha proposta de fora da instituição arrecada só itens, nunca dinheiro. |
| Ator Principal | Solicitante externo |
| Ator Secundário | Funcionário |
| Pré-condições | Solicitante deve estar na página pública de solicitação de evento/campanha. O aviso de privacidade deve estar publicado. |

## Fluxo Principal

| Ator (solicitante) | Sistema |
|---|---|
| 1. Escolhe se propõe um evento ou uma campanha e preenche nome da pessoa ou organização, e-mail e telefone, nome do evento ou da campanha, objetivo e data do evento ou período da campanha, a partir do dia seguinte; na campanha, lista os itens que ela vai arrecadar, ao menos um; se quiser, informa também os recursos que espera da instituição (como espaço, equipe ou horário), que são opcionais. Aceita o aviso de privacidade e confirma o envio. | |
| | 2. Registra a solicitação externa com status em análise, registra o consentimento vinculado a ela, gera o código de protocolo e sinaliza a solicitação no Painel Administrativo. |
| | 3. Exibe o protocolo, orientando o solicitante a anotá-lo, e envia e-mail de confirmação. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Aprovar solicitação

| Ator (funcionário) | Sistema |
|---|---|
| 1. A partir do passo 2 do fluxo principal, com a solicitação sinalizada no Painel, acessa a fila de triagem, avalia a solicitação e a aprova. | |
| | 2. Na solicitação de evento, se a data pretendida coincide com evento já confirmado, avisa sobre o conflito e permite prosseguir. |
| | 3. Altera o status para aprovada — aguardando contato, sem publicar nada, registra a conta e a data e envia e-mail ao solicitante informando que a instituição entrará em contato para combinar os detalhes. O caso de uso se encerra. |

## Fluxo Alternativo 02 – Confirmar proposta após contato

| Ator (funcionário) | Sistema |
|---|---|
| 1. Depois do fluxo alternativo 01 e de combinar os detalhes com o solicitante, fora do sistema, confirma a proposta, ajustando os dados combinados e, na campanha, os itens a arrecadar, que já vêm da proposta. | |
| | 2. Na solicitação de evento, se a data coincide com evento já confirmado, avisa sobre o conflito e permite prosseguir. |
| | 3. Gera o evento ou a campanha, conforme o tipo da solicitação, com os dados combinados e vinculado à solicitação de origem, publica-o automaticamente no Portal Público (CSU02) e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 03 – Rejeitar solicitação

| Ator (funcionário) | Sistema |
|---|---|
| 1. A partir do passo 2 do fluxo principal ou depois do fluxo alternativo 01, rejeita a solicitação, informando o motivo, se quiser. | |
| | 2. Altera o status para rejeitada, sem gerar evento nem campanha, preserva o registro e, quando informado, o motivo, registra a conta e a data e envia e-mail com o resultado. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Fim do prazo de retenção

| Ator (funcionário) | Sistema |
|---|---|
| | 1. Seis meses após o fluxo alternativo 03, ou após o encerramento a pedido do titular por revogação do consentimento (CSU04, fluxo alternativo 12), com prazo configurável (CSU14), sinaliza a solicitação à equipe para anonimização. |
| 2. Executa a anonimização da solicitação sinalizada. | |
| | 3. Torna ilegíveis os dados pessoais do solicitante, preservando o registro, o histórico, a auditoria e dados estatísticos não identificáveis, e registra a anonimização com a conta e a data. A anonimização a pedido do titular, antes do prazo, está no CSU04, fluxo alternativo 13. O caso de uso se encerra. |

## Fluxo Exceção 05 – Dados inválidos

| Ator (solicitante) | Sistema |
|---|---|
| 1. No passo 1 do fluxo principal, envia a solicitação sem escolher entre evento e campanha, com dado obrigatório em branco, com campanha sem nenhum item a arrecadar, com telefone ou e-mail inválido, ou com data do evento ou início da campanha anterior ao dia seguinte. | |
| | 2. Impede o envio, indica cada dado a corrigir e retorna ao passo 1 do fluxo principal. |

## Fluxo Exceção 06 – Envio sem aceite do aviso de privacidade

| Ator (solicitante) | Sistema |
|---|---|
| 1. No passo 1 do fluxo principal, tenta enviar a solicitação sem aceitar o aviso de privacidade. | |
| | 2. Impede o envio, explica que o aceite é obrigatório e retorna ao passo 1 do fluxo principal. |

## Fluxo Exceção 07 – Falha no envio de e-mail

| Ator (autor da submissão) | Sistema |
|---|---|
| | 1. No passo 3 do fluxo principal ou ao final dos fluxos alternativos 01 e 03, não consegue enviar o e-mail de confirmação ou de resultado. |
| | 2. Mantém a solicitação e a decisão registradas, tenta reenviar automaticamente uma vez após um intervalo e, persistindo a falha, registra-a para reenvio ou contato manual pela equipe (CSU15). O registro nunca é revertido. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** A solicitação externa está registrada como em análise, com consentimento e protocolo, aguardando avaliação.
- **Fluxo Alternativo 01 – Aprovar solicitação:** A solicitação consta como aprovada — aguardando contato; nada foi publicado.
- **Fluxo Alternativo 02 – Confirmar proposta após contato:** O evento ou a campanha foi gerado a partir da solicitação, vinculado a ela, e está publicado no Portal Público.
- **Fluxo Alternativo 03 – Rejeitar solicitação:** A solicitação consta como rejeitada e o registro foi preservado.
- **Fluxo Alternativo 04 – Fim do prazo de retenção:** A solicitação rejeitada ou encerrada a pedido do titular foi anonimizada ao fim do prazo de retenção.
- **Fluxo Exceção 05 – Dados inválidos:** Nenhuma solicitação foi registrada.
- **Fluxo Exceção 06 – Envio sem aceite do aviso de privacidade:** Nenhuma solicitação foi registrada.
- **Fluxo Exceção 07 – Falha no envio de e-mail:** O registro permanece e a falha de envio está sinalizada à equipe.

---

# Apêndice A — Rastreabilidade entre casos de uso e entidades do DER

Mostra em que caso de uso cada entidade do DER (`docs/der-conceitual-recanto.drawio`) é criada ou alterada
(**M**, de mantida) ou apenas consultada (**C**). Os casos de uso usam os nomes de negócio; esta tabela faz a
ligação com o modelo de dados. Toda entidade do DER aparece em pelo menos um caso de uso.

| Entidade do DER | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| doacao | M | | | M | | | | | C | | | | | | |
| pessoa | M | | | M | M | M | | | C | | | | | | |
| papel | M | | | M | M | M | | | C | | | | | | |
| candidatura | | | | M | | | | | | C | | | | | |
| cand_voluntario | | | | M | M | | | | | C | | | | | |
| cand_funcionario | | | | M | | M | | | | C | | | | | |
| consentimento | M | | | M | M | M | | M | M | | | | | | |
| aviso_privacidade | C | | | | C | C | | C | C | | | | M | | |
| solicitacao_externa | | | | M | | | | M | | C | | | | | |
| evento | | M | | | | | | M | | | | | | | |
| campanha | | M | | | | | | M | | | | | | | |
| recurso | | M | | | | | | M | | | | | | | |
| noticia | | | M | | | | | | | | | | | | |
| conteudo_institucional | | | | | | | | | | | M | | | | |
| chave_pix_institucional | C | | | | | | | | | | | M | | | |
| item_necessario | | | | | | | M | | | | | | | | |
| anonimizacao | | | | M | M | M | | M | | | | | | | |

Relacionamentos do DER e onde aparecem: **realiza** (pessoa–doação) no CSU01; **pertence** (pessoa–papel) no
CSU04; **efetiva** (candidatura–pessoa) na aprovação dos CSU05 e CSU06; **aceita** (consentimento com pessoa,
candidatura ou solicitação externa) nos CSU01, CSU05, CSU06, CSU08 e CSU09; **referencia**
(consentimento–aviso) em todo aceite; **arrecada** (campanha–recurso) no CSU02; **decorre**
(solicitação–evento ou campanha) no CSU08, fluxo alternativo 02.

Funcionalidades sem entidade no DER: o CSU10 consulta entidades de outros casos de uso; o CSU14
(configurações) e o CSU15 (auditoria e e-mails não entregues) tratam de dados de operação do sistema, que
não fazem parte do modelo conceitual.

---

# Apêndice B — Descrição completa dos demais casos de uso

Material de apoio: estes casos de uso aparecem no documento do TCC só na lista da seção 1.

---

# CSU03 — Manter Notícias

| Código | CSU03 |
|---|---|
| Nome | Manter Notícias |
| Sumário | Este caso de uso descreve os passos percorridos pelo funcionário para publicar, editar, despublicar e publicar novamente notícias no Portal Público, onde o visitante as consulta sem login. Cada notícia aparece no Portal como um resumo, e o visitante pode lê-la inteira sem sair da página em que está. Não há sincronização com redes sociais, e notícias não são excluídas: são despublicadas. A página institucional é mantida no CSU11. |
| Ator Principal | Funcionário |
| Ator Secundário | Visitante |
| Pré-condições | Funcionário deve estar autenticado no Painel Administrativo pela conta institucional. |

## Fluxo Principal

| Ator (funcionário) | Sistema |
|---|---|
| 1. Acessa a gestão de notícias do Painel Administrativo. | |
| | 2. Lista as notícias, publicadas e despublicadas, e oferece as opções publicar nova notícia, editar, despublicar e publicar novamente. |
| 3. Escolhe publicar nova notícia e informa título, conteúdo e, opcionalmente, uma imagem com seu texto alternativo. | |
| | 4. Publica a notícia no Portal Público e registra a conta e a data na auditoria. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Editar notícia

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, escolhe editar uma notícia existente. | |
| | 2. Exibe os dados atuais e solicita as alterações. |
| 3. Modifica os dados desejados e confirma. | |
| | 4. Grava as alterações preservando o histórico, atualiza a notícia no Portal Público, se publicada, e registra a conta e a data. Imagem trocada ou retirada é apenas desvinculada da notícia, sem ser apagada. O caso de uso se encerra. |

## Fluxo Alternativo 02 – Despublicar notícia

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, escolhe despublicar uma notícia publicada. | |
| | 2. Retira a notícia do Portal Público, mantém-na no Painel como despublicada e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 03 – Publicar novamente notícia despublicada

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, escolhe publicar novamente uma notícia despublicada. | |
| | 2. Volta a exibir a notícia no Portal Público e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Ler notícia no Portal Público

| Ator (visitante) | Sistema |
|---|---|
| 1. A partir do passo 4 do fluxo principal, com a notícia publicada, acessa a página inicial ou a página de notícias do Portal Público, sem login. | |
| | 2. Exibe as notícias publicadas, cada uma com título, data, imagem com seu texto alternativo, se houver, e um resumo do conteúdo. |
| 3. Escolhe ler uma notícia inteira. | |
| | 4. Exibe a notícia completa, com a imagem em tamanho maior e o texto inteiro, sem tirar o visitante da página em que estava. |
| 5. Encerra a leitura. | |
| | 6. Devolve o visitante ao ponto da página em que estava. O caso de uso se encerra. |

## Fluxo Exceção 05 – Imagem sem texto alternativo

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal ou no passo 3 do fluxo alternativo 01, inclui uma imagem sem informar o texto alternativo. | |
| | 2. Impede a publicação, explica que o texto alternativo é obrigatório para leitores de tela e retorna ao passo em que a imagem foi incluída. |

## Fluxo Exceção 06 – Dados inválidos

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal ou no passo 3 do fluxo alternativo 01, deixa título ou conteúdo em branco, ou inclui imagem em formato não aceito ou acima do tamanho máximo. | |
| | 2. Não grava, indica cada dado a corrigir e retorna ao passo em que os dados foram informados. |

## Pós-condições

- **Fluxo principal:** A notícia está publicada no Portal Público.
- **Fluxo Alternativo 01 – Editar notícia:** A notícia foi alterada e o histórico da alteração foi preservado.
- **Fluxo Alternativo 02 – Despublicar notícia:** A notícia não aparece no Portal Público e continua consultável no Painel.
- **Fluxo Alternativo 03 – Publicar novamente notícia despublicada:** A notícia voltou a ser exibida no Portal Público.
- **Fluxo Alternativo 04 – Ler notícia no Portal Público:** O visitante leu a notícia inteira sem sair da página; nada foi gravado no sistema.
- **Fluxo Exceção 05 – Imagem sem texto alternativo:** Nenhuma notícia foi publicada ou alterada.
- **Fluxo Exceção 06 – Dados inválidos:** Nenhuma notícia foi publicada ou alterada.

---

# CSU07 — Manter Itens Necessários

| Código | CSU07 |
|---|---|
| Nome | Manter Itens Necessários |
| Sumário | Este caso de uso descreve os passos percorridos pelo funcionário para manter a lista de necessidades da instituição, exibida no Portal Público, onde o visitante a consulta sem login. Itens supridos saem da listagem pública sem perder o registro histórico, e itens sem atualização há 30 dias ou mais (prazo configurável no CSU14) são sinalizados à equipe. |
| Ator Principal | Funcionário |
| Ator Secundário | Visitante |
| Pré-condições | Funcionário deve estar autenticado no Painel Administrativo pela conta institucional. |

## Fluxo Principal

| Ator (funcionário) | Sistema |
|---|---|
| 1. Acessa a gestão de itens necessários do Painel Administrativo. | |
| | 2. Lista os itens, ativos e supridos, com quantidade, prioridade e data da última atualização, sinaliza os itens sem atualização de quantidade há 30 dias ou mais (prazo configurável) e oferece as opções cadastrar, buscar e atualizar quantidade e dar baixa. |
| 3. Escolhe cadastrar e informa nome, quantidade, unidade de medida e prioridade (alta, média ou baixa) do novo item. | |
| | 4. Grava o item como ativo, publica-o automaticamente na listagem pública e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Buscar e atualizar quantidade

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, busca um item necessário por nome. | |
| | 2. Exibe os itens correspondentes, com quantidade, prioridade e data da última atualização. |
| 3. Indica o item e informa a nova quantidade. | |
| | 4. Grava a nova quantidade, atualiza a data da última atualização — retirando a sinalização de item sem atualização, se houver — e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 02 – Dar baixa em item suprido

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, escolhe dar baixa em um item que foi suprido. | |
| | 2. Altera o status para suprido, remove o item da listagem pública sem excluir seu registro histórico e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Exceção 03 – Dados inválidos

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal ou no passo 3 do fluxo alternativo 01, deixa o nome em branco ou informa quantidade negativa ou não numérica. | |
| | 2. Não grava, indica o erro e retorna ao passo em que os dados foram informados. |

## Pós-condições

- **Fluxo principal:** O item necessário está cadastrado e visível no Portal Público.
- **Fluxo Alternativo 01 – Buscar e atualizar quantidade:** A quantidade e a data da última atualização foram gravadas.
- **Fluxo Alternativo 02 – Dar baixa em item suprido:** O item saiu da listagem pública e seu registro histórico permanece.
- **Fluxo Exceção 03 – Dados inválidos:** Nenhuma alteração foi gravada.

---

# CSU09 — Autoatendimento do Doador Associado

| Código | CSU09 |
|---|---|
| Nome | Autoatendimento do Doador Associado |
| Sumário | Este caso de uso descreve os passos percorridos pelo doador associado para consultar, com login próprio, exclusivamente os seus próprios dados e o histórico das doações já confirmadas, e para doar sem informar os dados de novo. A área é só de consulta: a correção de dados é pedida à secretaria, que a faz no Painel (CSU04), e a troca de senha é feita por "Esqueci minha senha". O voluntário não tem autoatendimento nesta versão. |
| Ator Principal | Doador associado |
| Ator Secundário | — |
| Pré-condições | O doador deve estar cadastrado com o papel de doador associado, criado na primeira doação associativa (CSU01). |

## Fluxo Principal

| Ator (doador associado) | Sistema |
|---|---|
| 1. Acessa a área de autoatendimento e informa e-mail e senha. | |
| | 2. Autentica o doador. |
| | 3. Exibe exclusivamente os seus dados cadastrais e o histórico das doações já confirmadas pelo funcionário, com valor e data, o aviso de que contribuições pagas na sede ou por depósito não aparecem ali e a opção de fazer nova doação. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Doar sem informar os dados de novo

| Ator (doador associado) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, escolhe fazer uma nova doação. | |
| | 2. Se houver versão do aviso de privacidade publicada depois do último aceite do doador (CSU13), apresenta a nova versão e pede que ele confirme que a leu e concorda antes de gerar o QR code; o aceite é registrado como mais um consentimento do doador, com data e versão. |
| | 3. Executa o fluxo alternativo 02 do CSU01, com a doação já vinculada ao doador. O caso de uso se encerra. |

## Fluxo Alternativo 02 – Definir a senha da conta nova

| Ator (doador associado) | Sistema |
|---|---|
| 1. Antes do passo 1 do fluxo principal, no primeiro acesso, abre o link recebido por e-mail após a primeira doação associativa e define a senha. | |
| | 2. Grava a senha, libera o acesso ao autoatendimento e retorna ao passo 1 do fluxo principal. |

## Fluxo Alternativo 03 – Redefinir senha esquecida

| Ator (doador associado) | Sistema |
|---|---|
| 1. No passo 1 do fluxo principal, informa que esqueceu a senha e fornece o e-mail cadastrado. | |
| | 2. Envia um link de redefinição ao e-mail cadastrado, sem intervenção de funcionário, respondendo da mesma forma mesmo para e-mail não cadastrado. |
| 3. Acessa o link e define a nova senha. | |
| | 4. Invalida o link, que é de uso único e tem validade curta, grava a nova senha e retorna ao passo 1 do fluxo principal. |

## Fluxo Exceção 04 – Credenciais inválidas

| Ator (doador associado) | Sistema |
|---|---|
| 1. No passo 1 do fluxo principal, informa e-mail ou senha incorretos, tenta entrar antes de definir a senha pelo link recebido ou tem o papel de doador associado inativado pela equipe. | |
| | 2. No passo 2, nega o acesso com a mesma mensagem em todos os casos, sem informar qual dos dados está errado, e retorna ao passo 1 do fluxo principal. Após cinco tentativas erradas seguidas, bloqueia novas tentativas por 15 minutos. |

## Fluxo Exceção 05 – Tentativa de acessar dados de terceiro

| Ator (doador associado) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, tenta visualizar, por qualquer meio, dados cadastrais ou histórico de outra pessoa. | |
| | 2. Nega o acesso sem expor detalhes internos do motivo e registra a tentativa no histórico de auditoria. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** O doador consultou exclusivamente os próprios dados e doações confirmadas.
- **Fluxo Alternativo 01 – Doar sem informar os dados de novo:** A nova doação pendente está vinculada ao doador e, se havia aviso de privacidade novo, o aceite dessa versão foi registrado.
- **Fluxo Alternativo 02 – Definir a senha da conta nova:** A conta do doador associado está ativa para o autoatendimento.
- **Fluxo Alternativo 03 – Redefinir senha esquecida:** A senha foi redefinida sem intervenção da equipe e o link de uso único foi invalidado.
- **Fluxo Exceção 04 – Credenciais inválidas:** O acesso foi negado.
- **Fluxo Exceção 05 – Tentativa de acessar dados de terceiro:** O acesso foi negado e a tentativa consta na auditoria.

---

# CSU10 — Consultar Status de Solicitação

| Código | CSU10 |
|---|---|
| Nome | Consultar Status de Solicitação |
| Sumário | Este caso de uso descreve os passos percorridos por qualquer pessoa para consultar o andamento de uma candidatura de voluntário, de uma candidatura a vaga ou de uma solicitação externa de evento/campanha informando apenas o código de protocolo, sem login e sem fornecer dados pessoais. Doações não têm protocolo. |
| Ator Principal | Autor da submissão |
| Ator Secundário | — |
| Pré-condições | O autor deve possuir o código de protocolo recebido no momento do envio. |

## Fluxo Principal

| Ator (autor da submissão) | Sistema |
|---|---|
| 1. Acessa a página pública de consulta de status e informa o código de protocolo. | |
| | 2. Localiza a submissão correspondente: candidatura de voluntário, candidatura a vaga ou solicitação externa. |
| | 3. Exibe apenas o tipo, o status atual e a data, sem exigir nem expor nenhum dado pessoal. O caso de uso se encerra. |

## Fluxo Exceção 01 – Protocolo inexistente ou mal formado

| Ator (visitante) | Sistema |
|---|---|
| 1. No passo 1 do fluxo principal, informa um código que não corresponde a nenhum registro ou que está mal formado. | |
| | 2. No passo 2, não localiza a submissão e informa que nenhum registro foi encontrado, respondendo de forma idêntica nos dois casos. O caso de uso se encerra. |

## Fluxo Exceção 02 – Tentativas sucessivas de adivinhação

| Ator (visitante) | Sistema |
|---|---|
| 1. Repete o passo 1 do fluxo principal muitas vezes, com códigos diferentes. | |
| | 2. Limita a quantidade de tentativas por origem e recusa novas consultas por um tempo, impedindo a descoberta de protocolos de terceiros. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** O autor obteve o status atual da própria submissão sem login e sem fornecer dados pessoais.
- **Fluxo Exceção 01 – Protocolo inexistente ou mal formado:** Nenhuma informação foi revelada e as duas situações produziram a mesma resposta.
- **Fluxo Exceção 02 – Tentativas sucessivas de adivinhação:** As tentativas foram limitadas e nenhum dado de terceiro foi exposto.

---

# CSU11 — Manter Página Institucional

| Código | CSU11 |
|---|---|
| Nome | Manter Página Institucional |
| Sumário | Este caso de uso descreve os passos percorridos pelo funcionário para manter atualizada a página institucional — história, missão, equipe, acolhimento de residentes e bazar — e a sua galeria opcional de até seis imagens, cada uma com texto alternativo obrigatório. A página não é notícia: não se publica nem se despublica; cada alteração gera uma nova versão, e as anteriores ficam no histórico. O visitante a consulta no Portal Público sem login. |
| Ator Principal | Funcionário |
| Ator Secundário | Visitante |
| Pré-condições | Funcionário deve estar autenticado no Painel Administrativo pela conta institucional. |

## Fluxo Principal

| Ator (funcionário) | Sistema |
|---|---|
| 1. Acessa a gestão da página institucional do Painel Administrativo. | |
| | 2. Exibe os textos atuais de história, missão, equipe, acolhimento de residentes e bazar e as imagens, com seus textos alternativos. |
| 3. Altera os textos desejados e salva. Uma seção pode ficar em branco. | |
| | 4. Grava a nova versão dos textos preservando a anterior no histórico, atualiza a página institucional no Portal Público — onde a seção em branco não é exibida — e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Incluir imagem

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, inclui uma imagem, informando o texto alternativo. | |
| | 2. Verifica que a página tem menos de seis imagens ativas, grava a imagem, exibe-a na página institucional do Portal Público e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 02 – Corrigir texto alternativo ou retirar imagem

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, corrige o texto alternativo de uma imagem ou retira uma imagem da página. | |
| | 2. Grava a correção ou desativa a imagem retirada, sem apagá-la, atualiza o Portal Público e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Exceção 03 – Imagem sem texto alternativo

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 1 do fluxo alternativo 01 ou 02, deixa o texto alternativo em branco. | |
| | 2. Não grava, explica que o texto alternativo é obrigatório para leitores de tela e retorna ao passo em que a imagem foi informada. |

## Fluxo Exceção 04 – Imagem inválida ou limite de imagens

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 1 do fluxo alternativo 01, inclui imagem em formato não aceito ou acima do tamanho máximo, ou tenta incluir uma sétima imagem. | |
| | 2. Não grava, indica o que corrigir e retorna ao passo em que os dados foram informados. |

## Pós-condições

- **Fluxo principal:** O Portal Público exibe a nova versão da página institucional e a anterior permanece no histórico.
- **Fluxo Alternativo 01 – Incluir imagem:** A imagem aparece na página institucional, com seu texto alternativo.
- **Fluxo Alternativo 02 – Corrigir texto alternativo ou retirar imagem:** O texto alternativo foi corrigido, ou a imagem saiu da página e continua registrada como desativada.
- **Fluxo Exceção 03 – Imagem sem texto alternativo:** Nada foi gravado.
- **Fluxo Exceção 04 – Imagem inválida ou limite de imagens:** Nada foi gravado.

---

# CSU12 — Manter Chave Pix

| Código | CSU12 |
|---|---|
| Nome | Manter Chave Pix |
| Sumário | Este caso de uso descreve os passos percorridos pelo funcionário para cadastrar, trocar ou retirar a chave Pix da instituição, com o nome do recebedor e a cidade, usados para gerar o QR code de cada doação (CSU01). O sistema não acessa a conta bancária: a chave só define para onde o doador paga. A chave preferida é o CNPJ da instituição; CPF e telefone costumam ser chaves de pessoa física e ficariam expostos publicamente. Cada troca guarda a chave anterior no histórico. |
| Ator Principal | Funcionário |
| Ator Secundário | — |
| Pré-condições | Funcionário deve estar autenticado no Painel Administrativo pela conta institucional. |

## Fluxo Principal

| Ator (funcionário) | Sistema |
|---|---|
| 1. Acessa a gestão da chave Pix do Painel Administrativo. | |
| | 2. Exibe a chave ativa, se houver, com o tipo, o nome do recebedor e a cidade. |
| 3. Informa o tipo da chave (CNPJ, e-mail, chave aleatória, CPF ou telefone), a chave, o nome do recebedor e a cidade. | |
| | 4. Valida a chave conforme o tipo e gera um QR code de teste de R$ 10, para o funcionário conferir no aplicativo de um banco se o nome exibido é o da instituição, sem concluir o pagamento. |
| 5. Confere o QR code de teste e salva a chave. | |
| | 6. Grava a nova chave como ativa, mantém a anterior no histórico como inativa, passa a usar a nova chave nas doações do Portal Público e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Chave de pessoa física

| Ator (funcionário) | Sistema |
|---|---|
| | 1. No passo 4 do fluxo principal, sendo o tipo CPF ou telefone, avisa que a chave costuma ser de pessoa física, que ficaria exposta publicamente e que o dinheiro cairia na conta de uma pessoa, não da instituição, e recomenda o CNPJ. |
| 2. Troca a chave ou prossegue mesmo assim. | |
| | 3. Retorna ao passo 4 do fluxo principal. |

## Fluxo Alternativo 02 – Retirar a chave do Portal

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, escolhe retirar a chave do Portal. | |
| | 2. Pede confirmação, informando que a doação digital ficará indisponível até uma nova chave ser cadastrada. |
| 3. Confirma. | |
| | 4. Inativa a chave, sem apagá-la, deixa de oferecer a doação via Pix no Portal Público (CSU01, fluxo de exceção 05) e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Exceção 03 – Dados inválidos

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, deixa dado obrigatório em branco ou informa chave incompatível com o tipo escolhido (por exemplo, CNPJ com dígito verificador errado). | |
| | 2. Não grava, indica cada dado a corrigir e retorna ao passo 3 do fluxo principal. |

## Pós-condições

- **Fluxo principal:** A nova chave está ativa e é usada nas doações; a anterior permanece no histórico.
- **Fluxo Alternativo 01 – Chave de pessoa física:** O funcionário foi avisado do risco e decidiu conscientemente.
- **Fluxo Alternativo 02 – Retirar a chave do Portal:** Não há chave ativa e o Portal informa que a doação digital está indisponível.
- **Fluxo Exceção 03 – Dados inválidos:** A chave ativa permaneceu a mesma.

---

# CSU13 — Manter Aviso de Privacidade

| Código | CSU13 |
|---|---|
| Nome | Manter Aviso de Privacidade |
| Sumário | Este caso de uso descreve os passos percorridos pelo funcionário para publicar o aviso de privacidade da instituição, que informa quais dados são coletados, para quê, por quanto tempo e por qual contato o titular exerce seus direitos, e pelo visitante para consultá-lo sem login. O texto publicado nunca é editado: mudar o aviso é publicar uma nova versão, porque cada consentimento aponta para a versão que a pessoa leu. O texto é aprovado pela instituição antes de ser publicado. |
| Ator Principal | Funcionário |
| Ator Secundário | Visitante |
| Pré-condições | Funcionário deve estar autenticado no Painel Administrativo pela conta institucional. |

## Fluxo Principal

| Ator (funcionário) | Sistema |
|---|---|
| 1. Acessa a gestão do aviso de privacidade do Painel Administrativo. | |
| | 2. Exibe a versão vigente e as versões anteriores, com a data de publicação de cada uma. |
| 3. Informa o texto da nova versão, aprovado pela instituição, e publica. | |
| | 4. Grava a nova versão com sua identificação e data, sem alterar as anteriores, passa a exibi-la no Portal Público e a usá-la nos próximos aceites, e registra a conta e a data. Quem aceitou uma versão anterior continua registrado com ela; o doador associado confirma a nova versão na próxima doação (CSU09, fluxo alternativo 01). O caso de uso se encerra. |

## Fluxo Alternativo 01 – Consultar o aviso no Portal Público

| Ator (visitante) | Sistema |
|---|---|
| 1. Acessa o aviso de privacidade no Portal Público, sem login, diretamente ou a partir de um formulário de coleta de dados. | |
| | 2. Exibe a versão vigente do aviso e o contato da instituição para exercício dos direitos do titular. O caso de uso se encerra. |

## Fluxo Exceção 02 – Texto em branco

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, tenta publicar uma versão sem texto. | |
| | 2. Não publica, informa que o texto é obrigatório e retorna ao passo 3 do fluxo principal. |

## Pós-condições

- **Fluxo principal:** A nova versão está publicada e vale para os próximos aceites; as versões anteriores permanecem inalteradas.
- **Fluxo Alternativo 01 – Consultar o aviso no Portal Público:** O visitante leu a versão vigente; nada foi gravado.
- **Fluxo Exceção 02 – Texto em branco:** Nenhuma versão foi publicada.

---

# CSU14 — Manter Configurações

| Código | CSU14 |
|---|---|
| Nome | Manter Configurações |
| Sumário | Este caso de uso descreve os passos percorridos pelo funcionário para ajustar os valores que regem o funcionamento do sistema sem depender de programador: o número de dias sem atualização a partir do qual um item necessário é sinalizado (CSU07), o prazo de retenção, em meses, dos dados cuja finalidade acabou (CSU05, CSU06 e CSU08) e o contato público da instituição, exibido no Portal junto da doação e do aviso de privacidade. |
| Ator Principal | Funcionário |
| Ator Secundário | — |
| Pré-condições | Funcionário deve estar autenticado no Painel Administrativo pela conta institucional. |

## Fluxo Principal

| Ator (funcionário) | Sistema |
|---|---|
| 1. Acessa as configurações do Painel Administrativo. | |
| | 2. Exibe os valores atuais dos dias de alerta de item sem atualização, do prazo de retenção e do contato da instituição. |
| 3. Altera os valores desejados e salva. | |
| | 4. Grava os novos valores, passa a aplicá-los e registra na auditoria a conta, a data e, para os prazos, o valor anterior. Se o prazo de retenção mudou, lembra que o aviso de privacidade, que informa o prazo ao público, também precisa ser atualizado (CSU13). O caso de uso se encerra. |

## Fluxo Exceção 01 – Valores inválidos

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, deixa um valor em branco ou informa número de dias fora do intervalo de 1 a 365 ou número de meses fora do intervalo de 1 a 60. | |
| | 2. Não grava, indica cada valor a corrigir e retorna ao passo 3 do fluxo principal. |

## Pós-condições

- **Fluxo principal:** O sistema aplica os novos valores, e a alteração consta na auditoria.
- **Fluxo Exceção 01 – Valores inválidos:** Os valores permaneceram os mesmos.

---

# CSU15 — Consultar Auditoria

| Código | CSU15 |
|---|---|
| Nome | Consultar Auditoria |
| Sumário | Este caso de uso descreve os passos percorridos pelo funcionário para consultar o histórico das ações feitas no sistema — quem fez o quê e quando —, por exemplo para esclarecer quando uma doação foi confirmada ou quem aprovou uma candidatura, e para tratar os e-mails que o sistema não conseguiu entregar. Como o acesso ao Painel é por conta institucional compartilhada, a autoria registrada é a conta usada, e não o funcionário. O histórico só recebe inclusões: nada nele pode ser alterado ou apagado. |
| Ator Principal | Funcionário |
| Ator Secundário | — |
| Pré-condições | Funcionário deve estar autenticado no Painel Administrativo pela conta institucional. |

## Fluxo Principal

| Ator (funcionário) | Sistema |
|---|---|
| 1. Acessa o histórico de ações do Painel Administrativo. | |
| | 2. Exibe as ações registradas, das mais recentes para as mais antigas, com data/hora, ação e autor (a conta usada, o doador, o público ou o próprio sistema), e oferece filtro por tipo de ação — por exemplo doações, candidaturas, pessoas, consentimentos, anonimizações e acessos negados. |
| 3. Filtra pelo tipo de ação desejado ou inverte a ordem. | |
| | 4. Exibe as ações correspondentes, sem permitir alterá-las nem excluí-las. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Tratar e-mail não entregue

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 1 do fluxo principal, consulta os e-mails que não puderam ser entregues (CSU05, CSU06 e CSU08). | |
| | 2. Exibe cada e-mail com data, destinatário, assunto, protocolo e telefone de contato, e as opções reenviar e marcar como resolvido. |
| 3. Reenvia o e-mail — depois de corrigir o endereço, se estava errado (CSU04, fluxo alternativo 03, ou correção na triagem) — ou, tendo avisado a pessoa por telefone, marca-o como resolvido. | |
| | 4. Reenvia para o endereço atual ou marca a falha como resolvida, e registra a conta e a data. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** O funcionário consultou o histórico de ações; nada foi alterado.
- **Fluxo Alternativo 01 – Tratar e-mail não entregue:** O e-mail foi reenviado ou a falha consta como resolvida.
