# SAGE — Casos de Uso

Sistema web para a ILPI Recanto dos Velhinhos Francisco Gonçalves Barbosa — CSU01 a CSU11

> Revisão de 2026-10-05: alinhada ao `specs/001-portal-painel-ilpi/spec.md` e às decisões do grupo de 03 e 04/10.
> Atualizada em 2026-10-07 com as decisões das fases 10 a 14: inativação por papel e Painel sem criação de
> doador associado (CSU04), termo de adesão para imprimir (CSU05), área do doador só de consulta e aceite de
> nova versão do aviso (CSU09), retirada da chave Pix (CSU01) e galeria de até seis imagens (CSU03).
> Em todos os casos, o fluxo principal descreve só o caminho em que nada dá errado e termina quando o sistema
> registra a submissão; decisões humanas com mais de um resultado possível (aprovar, rejeitar, confirmar, não
> localizar) são fluxos alternativos; validações e erros são fluxos de exceção. Em caso de divergência, o
> `spec.md` prevalece.

---

# CSU01 — Doação via Pix

| Código | CSU01 |
|---|---|
| Nome | Doação via Pix |
| Sumário | Este caso de uso descreve os passos percorridos pelo doador para fazer uma doação financeira via Pix e declará-la no sistema, e pelo funcionário para conferi-la. O pagamento ocorre fora do sistema, no aplicativo bancário do doador. O sistema registra apenas a declaração feita pelo clique em "Já fiz o Pix", que só se torna confirmada após conferência humana no extrato bancário da instituição. A declaração não gera código de protocolo nem recibo. |
| Ator Principal | Doador |
| Ator Secundário | Funcionário |
| Pré-condições | Doador deve estar na página pública de doações do sistema. |

## Fluxo Principal

| Ator (doador) | Sistema |
|---|---|
| 1. Acessa a página pública de doações. | |
| | 2. Exibe os valores sugeridos (R$ 10, 20, 50 e 100), o campo para outro valor, a escolha entre doação espontânea e associativa e o aviso de que o pagamento é feito no aplicativo do próprio banco, de que sem o clique em "Já fiz o Pix" a doação não é registrada e de que a doação espontânea não pode ser acompanhada depois. |
| 3. Mantém a modalidade espontânea e escolhe um valor sugerido ou digita outro valor, de no mínimo R$ 1. | |
| | 4. Gera o QR code Pix estático e o código copia e cola com a chave da instituição e o valor escolhido, com opção de copiar o código. |
| 5. Efetua o pagamento no aplicativo do seu banco, fora do sistema, e clica em "Já fiz o Pix". | |
| | 6. Registra a declaração com status pendente, com o valor do QR code e a data/hora do clique, sem nenhum dado de identificação, e a coloca na fila de conferência do Painel Administrativo. |
| | 7. Exibe um agradecimento explicando que a equipe confere a doação manualmente. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Primeira doação associativa

| Ator (doador) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, seleciona a modalidade associativa. | |
| | 2. Solicita nome, CPF, e-mail e telefone, e o aceite explícito do aviso de privacidade. |
| 3. Preenche os dados, aceita o aviso de privacidade e escolhe o valor. | |
| | 4. Gera o QR code Pix estático e o código copia e cola com o valor escolhido. |
| 5. Efetua o pagamento no aplicativo do seu banco e clica em "Já fiz o Pix". | |
| | 6. Registra a declaração com status pendente, com valor e data/hora do clique, cria o cadastro de doador associado, vincula a declaração a ele e registra o consentimento com data/hora, finalidade e versão do aviso aceito. |
| | 7. Envia ao e-mail informado um link para definir a senha — a conta só dá acesso ao autoatendimento depois que a senha é definida — e retorna ao passo 7 do fluxo principal. |

## Fluxo Alternativo 02 – Doador associado já cadastrado

| Ator (doador associado) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, estando autenticado no autoatendimento (CSU09), escolhe o valor. | |
| | 2. Identifica o doador associado, vincula a doação ao seu cadastro sem pedir os dados de identificação e gera o QR code com o valor escolhido. |
| 3. Efetua o pagamento no aplicativo do banco e clica em "Já fiz o Pix". | |
| | 4. Registra a declaração com status pendente, com valor e data/hora do clique, vinculada ao cadastro, e retorna ao passo 7 do fluxo principal. |

## Fluxo Alternativo 03 – Conferência: Pix localizado no extrato

| Ator (funcionário) | Sistema |
|---|---|
| 1. A partir do passo 6 do fluxo principal, com a declaração na fila, acessa a fila de conferência no Painel Administrativo. | |
| | 2. Exibe, para cada declaração pendente, o valor, a data/hora do clique e, se associativa, o nome do doador, e sinaliza declarações com valor e data próximos como possível duplicidade. |
| 3. Localiza no extrato bancário um Pix com o mesmo valor e data/hora próximos — na doação associativa, também pelo nome do doador, como critério auxiliar — e confirma a doação. | |
| | 4. Altera o status para confirmada e registra a data da confirmação e a conta institucional na auditoria. Se a doação é associativa, passa a exibi-la no histórico do doador no autoatendimento. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Conferência: Pix não localizado no extrato

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo alternativo 03, não localiza o Pix correspondente no extrato bancário. | |
| | 2. Oferece a marcação como não localizada, com campo de motivo opcional e, como opção pronta, o motivo padrão para pagamento recebido por depósito ou transferência que não seja Pix. |
| 3. Informa o motivo, se quiser, e confirma a marcação. | |
| | 4. Altera o status para não localizada, preserva o registro sem exclusão física e registra a conta, a data e, quando informado, o motivo na auditoria. O caso de uso se encerra. |

## Fluxo Exceção 05 – Nenhuma chave Pix ativa

| Ator (doador) | Sistema |
|---|---|
| 1. No passo 1 do fluxo principal, acessa a página pública de doações. | |
| | 2. Verifica que não há chave Pix ativa — nunca cadastrada ou retirada do Portal pelo funcionário na tela da chave Pix —, informa que a doação digital está temporariamente indisponível, exibe o contato da instituição e não apresenta o QR code nem o botão "Já fiz o Pix". O caso de uso se encerra. |

## Fluxo Exceção 06 – Valor inválido

| Ator (doador) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, deixa o valor em branco ou informa valor não numérico, negativo ou menor que R$ 1. | |
| | 2. Não gera o QR code, indica o erro no campo de valor — informando o mínimo, quando for o caso — e retorna ao passo 3 do fluxo principal. |

## Fluxo Exceção 07 – Dados do doador associado inválidos ou sem aceite

| Ator (doador) | Sistema |
|---|---|
| 1. No passo 3 do fluxo alternativo 01, deixa campo obrigatório em branco, informa CPF ou e-mail inválido ou não aceita o aviso de privacidade. | |
| | 2. Impede o prosseguimento, indica cada campo a corrigir ou explica que o aceite é obrigatório, e retorna ao passo 3 do fluxo alternativo 01. |

## Fluxo Exceção 08 – Doador paga e não clica em "Já fiz o Pix"

| Ator (doador) | Sistema |
|---|---|
| 1. No passo 5 do fluxo principal, paga no aplicativo do banco e sai da página sem clicar em "Já fiz o Pix". | |
| | 2. Não registra nenhuma declaração: o pagamento existe apenas no extrato bancário e é controlado pela secretaria, fora do sistema, como os pagamentos feitos na sede. O caso de uso se encerra. |

## Fluxo Exceção 09 – Tentativa de confirmação em duplicidade

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo alternativo 03, tenta confirmar uma doação já confirmada anteriormente. | |
| | 2. Identifica que o status já é confirmada, recusa a operação e não altera o registro. O caso de uso se encerra. |

## Fluxo Exceção 10 – Associativa sem login com CPF ou e-mail já cadastrado

| Ator (doador) | Sistema |
|---|---|
| 1. No passo 3 do fluxo alternativo 01, sem estar autenticado, informa CPF ou e-mail que já pertence a um doador associado. | |
| | 2. Não gera o QR code nem registra cadastro ou declaração e exibe a mesma mensagem neutra que exibiria a qualquer visitante: se já é associado, entre no autoatendimento (CSU09) ou faça a doação espontânea. Não revela se o CPF ou o e-mail está cadastrado. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** A declaração de doação está registrada com status pendente, com valor e data/hora, aguardando a conferência do funcionário.
- **Fluxo Alternativo 01 – Primeira doação associativa:** O doador associado está cadastrado, com consentimento registrado, e a declaração pendente está vinculada ao seu cadastro.
- **Fluxo Alternativo 02 – Doador associado já cadastrado:** A declaração pendente está vinculada ao cadastro do doador, sem que ele precisasse informar os dados de novo.
- **Fluxo Alternativo 03 – Conferência: Pix localizado no extrato:** A doação consta como confirmada, com data e conta registradas; se associativa, aparece no autoatendimento do doador.
- **Fluxo Alternativo 04 – Conferência: Pix não localizado no extrato:** A declaração consta como não localizada, com o registro preservado; ela não aparece no autoatendimento.
- **Fluxo Exceção 05 – Nenhuma chave Pix cadastrada:** Nenhuma declaração de doação foi registrada.
- **Fluxo Exceção 06 – Valor inválido:** Nenhum QR code foi gerado e nenhuma declaração foi registrada.
- **Fluxo Exceção 07 – Dados do doador associado inválidos ou sem aceite:** Nenhum cadastro nem declaração foi registrado.
- **Fluxo Exceção 08 – Doador paga e não clica em "Já fiz o Pix":** A doação não consta no sistema; por isso os totais do Painel não representam a arrecadação da instituição.
- **Fluxo Exceção 09 – Tentativa de confirmação em duplicidade:** O registro permaneceu inalterado.
- **Fluxo Exceção 10 – Associativa sem login com CPF ou e-mail já cadastrado:** Nenhum QR code foi gerado e nenhum cadastro nem declaração foi registrado; o visitante não ficou sabendo se o CPF ou o e-mail está cadastrado.

---

# CSU02 — Manter Campanhas e Eventos

| Código | CSU02 |
|---|---|
| Nome | Manter Campanhas e Eventos |
| Sumário | Este caso de uso descreve os passos percorridos pelo funcionário para cadastrar, alterar e encerrar eventos e campanhas institucionais — o encerramento também acontece automaticamente quando a data do evento ou o período da campanha passa —, que são publicados automaticamente no Portal Público, onde o visitante os consulta sem login. Evento e campanha são tipos diferentes, cadastrados na mesma tela: o evento tem data e recursos necessários descritos em texto, e só ele passa pelo aviso de conflito de data; a campanha tem período de arrecadação, os recursos a arrecadar (dinheiro ou itens) e meta em dinheiro opcional, com valor arrecadado informado pela equipe, porque as doações via Pix não são vinculadas a campanhas. |
| Ator Principal | Funcionário |
| Ator Secundário | Visitante |
| Pré-condições | Funcionário deve estar autenticado no Painel Administrativo pela conta institucional. |

## Fluxo Principal

| Ator (funcionário) | Sistema |
|---|---|
| 1. Acessa a tela de eventos e campanhas do Painel Administrativo. | |
| | 2. Lista os eventos e as campanhas, ativos e encerrados, e oferece as opções cadastrar evento, cadastrar campanha, alterar, atualizar valor arrecadado e encerrar. |
| 3. Escolhe cadastrar evento e informa nome, data, descrição e recursos necessários. | |
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
| 1. No passo 3 do fluxo principal, escolhe cadastrar campanha e informa nome, período de arrecadação, descrição, os recursos a arrecadar — dinheiro ou itens, ao menos um — e, opcionalmente, meta em dinheiro. | |
| | 2. Grava a campanha como ativa, sem verificar conflito de data, publica-a automaticamente no Portal Público — sem barra de arrecadação, se não houver meta em dinheiro — e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 03 – Alterar evento ou campanha

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, escolhe alterar um evento ou uma campanha existente. | |
| | 2. Exibe os dados atuais e solicita as alterações. |
| 3. Modifica os dados desejados e confirma; se mudou a data de um evento, o sistema executa o fluxo alternativo 01. | |
| | 4. Grava as alterações preservando o histórico, atualiza a publicação no Portal Público e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Atualizar valor arrecadado

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, escolhe atualizar o valor arrecadado de uma campanha com meta em dinheiro e informa o valor, a partir do controle da secretaria. | |
| | 2. Grava o valor, atualiza o progresso exibido no Portal Público e registra a conta e a data. O caso de uso se encerra. |

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
| 1. No passo 3 do fluxo principal, no passo 1 do fluxo alternativo 02 ou no passo 3 do fluxo alternativo 03, deixa campo obrigatório em branco, cadastra campanha sem nenhum recurso, informa meta negativa ou informa no cadastro uma data que já passou. | |
| | 2. Não grava, indica cada campo a corrigir e retorna ao passo em que os dados foram informados. |

## Fluxo Exceção 08 – Encerrar o que já está encerrado

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 1 do fluxo alternativo 05, tenta encerrar um evento ou uma campanha que já está encerrada. | |
| | 2. Não altera o registro. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** O evento está gravado e publicado no Portal Público.
- **Fluxo Alternativo 01 – Conflito de data do evento:** O funcionário foi avisado do conflito e decidiu conscientemente.
- **Fluxo Alternativo 02 – Cadastrar campanha:** A campanha está gravada, com seus recursos, e publicada no Portal Público.
- **Fluxo Alternativo 03 – Alterar evento ou campanha:** Os dados foram modificados e o histórico da alteração foi preservado.
- **Fluxo Alternativo 04 – Atualizar valor arrecadado:** O Portal Público exibe o progresso da campanha com o valor informado pela equipe.
- **Fluxo Alternativo 05 – Encerrar evento ou campanha:** O evento ou a campanha saiu da listagem pública e seu registro histórico permanece.
- **Fluxo Alternativo 06 – Encerramento automático por data:** O evento ou a campanha vencido consta como encerrado, fora da listagem pública, com o sistema como autor na auditoria.
- **Fluxo Exceção 07 – Dados inválidos ou data passada:** Nenhuma alteração foi gravada.
- **Fluxo Exceção 08 – Encerrar o que já está encerrado:** O registro permaneceu inalterado.

---

# CSU03 — Divulgação Institucional

| Código | CSU03 |
|---|---|
| Nome | Divulgação Institucional |
| Sumário | Este caso de uso descreve os passos percorridos pelo funcionário para publicar, editar e despublicar notícias, informações institucionais e necessidades da instituição no Portal Público, onde o visitante as consulta sem login, e para manter a página institucional (história, missão, equipe, acolhimento de residentes e bazar), editada por tela própria do Painel. Não há sincronização com redes sociais, e notícias não são excluídas: são despublicadas. |
| Ator Principal | Funcionário |
| Ator Secundário | Visitante |
| Pré-condições | Funcionário deve estar autenticado no Painel Administrativo pela conta institucional. |

## Fluxo Principal

| Ator (funcionário) | Sistema |
|---|---|
| 1. Acessa a tela de notícias do Painel Administrativo. | |
| | 2. Lista as notícias, publicadas e despublicadas, e oferece as opções publicar nova notícia, editar, despublicar e publicar novamente. |
| 3. Escolhe publicar nova notícia e informa título, conteúdo e, opcionalmente, uma imagem com seu texto alternativo. | |
| | 4. Publica a notícia no Portal Público e registra a conta e a data na auditoria. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Editar notícia

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, escolhe editar uma notícia existente. | |
| | 2. Exibe os dados atuais e solicita as alterações. |
| 3. Modifica os dados desejados e confirma. | |
| | 4. Grava as alterações preservando o histórico, atualiza a notícia no Portal Público, se publicada, e registra a conta e a data. Imagem trocada ou retirada é apenas desvinculada da notícia, sem apagar o arquivo. O caso de uso se encerra. |

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

## Fluxo Alternativo 04 – Editar página institucional

| Ator (funcionário) | Sistema |
|---|---|
| 1. Em vez do passo 1 do fluxo principal, acessa a tela da página institucional no Painel Administrativo. | |
| | 2. Exibe os textos atuais de história, missão, equipe, acolhimento de residentes e bazar e as imagens, com seus textos alternativos. |
| 3. Altera os textos e salva. Se quiser, inclui imagens, uma por vez e até seis, informando o texto alternativo de cada uma, corrige o texto alternativo de uma imagem ou retira uma imagem da página. As imagens são opcionais. | |
| | 4. Grava a nova versão dos textos preservando a anterior no histórico, atualiza a página institucional no Portal Público e registra a conta e a data. Imagem retirada é desativada, sem apagar o arquivo. O caso de uso se encerra. |

## Fluxo Exceção 05 – Imagem sem texto alternativo

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal ou no passo 3 dos fluxos alternativos 01 e 04, anexa uma imagem sem preencher o texto alternativo. | |
| | 2. Impede a publicação, explica que o texto alternativo é obrigatório para leitores de tela e retorna ao passo em que a imagem foi anexada. |

## Fluxo Exceção 06 – Dados inválidos

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal ou no passo 3 dos fluxos alternativos 01 e 04, deixa título ou conteúdo em branco, ou anexa imagem em formato não aceito ou acima do tamanho máximo. | |
| | 2. Não grava, indica cada campo a corrigir e retorna ao passo em que os dados foram informados. |

## Pós-condições

- **Fluxo principal:** A notícia está publicada no Portal Público.
- **Fluxo Alternativo 01 – Editar notícia:** A notícia foi alterada e o histórico da alteração foi preservado.
- **Fluxo Alternativo 02 – Despublicar notícia:** A notícia não aparece no Portal Público e continua consultável no Painel.
- **Fluxo Alternativo 03 – Publicar novamente notícia despublicada:** A notícia voltou a ser exibida no Portal Público.
- **Fluxo Alternativo 04 – Editar página institucional:** O Portal Público exibe a nova versão da página institucional e a anterior permanece no histórico.
- **Fluxo Exceção 05 – Imagem sem texto alternativo:** Nenhuma notícia nem página institucional foi publicada ou alterada.
- **Fluxo Exceção 06 – Dados inválidos:** Nenhuma notícia nem página institucional foi publicada ou alterada.

---

# CSU04 — Manter Usuários

| Código | CSU04 |
|---|---|
| Nome | Manter Usuários |
| Sumário | Este caso de uso descreve os passos percorridos pelo funcionário para consultar, cadastrar, alterar, inativar e reativar usuários dos perfis funcionário, voluntário e doador associado. Cada pessoa tem um único cadastro, pelo CPF, com um ou mais papéis. O sistema não permite exclusão física de nenhum usuário: a inativação é feita papel por papel, não apaga dados e pode ser desfeita. Funcionário e voluntário são papéis exclusivos; o de doador associado pode ser acumulado com qualquer um deles e não é cadastrado pelo Painel: nasce com a primeira doação associativa (CSU01). |
| Ator Principal | Funcionário |
| Ator Secundário | — |
| Pré-condições | Funcionário deve estar autenticado no Painel Administrativo pela conta institucional. |

## Fluxo Principal

| Ator (funcionário) | Sistema |
|---|---|
| 1. Acessa a gestão de usuários e informa o nome, o CPF ou o e-mail do usuário que deseja consultar. | |
| | 2. Exibe os usuários correspondentes, incluindo os inativos, com seus perfis e status, e a opção de cadastrar novo usuário. |
| 3. Indica o usuário desejado. | |
| | 4. Exibe todos os dados cadastrais coletados, os papéis com a situação de cada um, o histórico de correções, as submissões e os consentimentos vinculados ao usuário, e as opções alterar dados, adicionar papel e, para cada papel, inativar ou reativar. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Cadastrar usuário

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, em vez de indicar um usuário, escolhe cadastrar novo usuário e informa, para o perfil funcionário, nome, CPF, data de nascimento, e-mail e telefone; para o perfil voluntário, os mesmos dados do termo de adesão pedidos no CSU05. | |
| | 2. Verifica se o CPF já existe; existindo, executa o fluxo alternativo 02. |
| | 3. Grava o usuário sem passar por triagem, porque o cadastro já é ação explícita de um funcionário, e registra a conta e a data. O cadastro de funcionário não registra consentimento nem envia e-mail, porque se baseia no vínculo de trabalho. Funcionário e voluntário maior de idade ficam ativos. Voluntário menor de idade fica pendente, com a autorização do responsável legal pendente, e só é aprovado depois de ela ser marcada como recebida (CSU05, fluxos alternativos 04 e 03). Para o voluntário, oferece a impressão do termo de adesão e, se menor, da autorização do responsável. O caso de uso se encerra. |

## Fluxo Alternativo 02 – CPF já cadastrado

| Ator (funcionário) | Sistema |
|---|---|
| | 1. No passo 2 do fluxo alternativo 01, identifica que o CPF informado já pertence a um usuário e exibe o registro existente, sem criar outro. |
| 2. Se for o caso, opta por adicionar ao cadastro existente o papel de funcionário ou o de voluntário. | |
| | 3. Se o papel adicionado for o de funcionário e a pessoa for voluntária ativa, avisa que o papel de voluntário será encerrado e pede confirmação. |
| 4. Confirma. | |
| | 5. Adiciona o papel e registra a conta e a data; quando for o caso, encerra o papel de voluntário, sem apagar o registro, porque os dois papéis são exclusivos. Para o papel de voluntário, coleta os dados do termo de adesão (CSU05). O caso de uso se encerra. |

## Fluxo Alternativo 03 – Alterar dados

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 4 do fluxo principal, escolhe alterar os dados do usuário. | |
| | 2. Solicita as alterações. |
| 3. Modifica os dados desejados e confirma. | |
| | 4. Grava as alterações preservando o histórico e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Inativar papel

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 4 do fluxo principal, escolhe inativar um dos papéis do usuário (por exemplo, deixar de ser voluntário e continuar doador associado). | |
| | 2. Solicita confirmação, explicando que a inativação não apaga dados e pode ser desfeita; se o usuário tiver submissão em triagem, avisa sobre a pendência. |
| 3. Confirma a inativação. | |
| | 4. Altera a situação do papel para inativo, mantém o registro, os dados e o histórico consultáveis e registra a conta e a data. Papel de doador associado inativado perde na hora o acesso ao autoatendimento (CSU09). O usuário passa a constar como inativo quando nenhum papel está ativo. O caso de uso se encerra. |

## Fluxo Alternativo 05 – Reativar papel

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 4 do fluxo principal, sendo o papel inativo, escolhe reativá-lo. | |
| | 2. Verifica as restrições do fluxo de exceção 10; não havendo impedimento, altera a situação do papel para ativo e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Exceção 06 – Dados inválidos

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 1 do fluxo alternativo 01 ou no passo 3 do fluxo alternativo 03, deixa campo obrigatório em branco ou informa CPF, e-mail ou telefone inválido. | |
| | 2. Não grava, indica cada campo a corrigir e retorna ao passo em que os dados foram informados. |

## Fluxo Exceção 07 – Voluntário que já é funcionário

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 2 do fluxo alternativo 02, tenta adicionar o perfil de voluntário a uma pessoa que é funcionária ativa. | |
| | 2. Impede a inclusão e informa que funcionário e voluntário são papéis exclusivos. O caso de uso se encerra. |

## Fluxo Exceção 08 – Tentativa de exclusão definitiva

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 4 do fluxo principal, procura uma forma de excluir definitivamente o usuário. | |
| | 2. Não oferece exclusão e indica a inativação; informa que dados pessoais só deixam de ser legíveis por anonimização (CSU11). O caso de uso se encerra. |

## Fluxo Exceção 09 – Tentativa de acesso sem permissão

| Ator (visitante ou doador associado) | Sistema |
|---|---|
| 1. Sem estar autenticado pela conta institucional, tenta acessar a gestão de usuários. | |
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
| | 2. Não oferece esse papel e informa que o cadastro de doador associado nasce com a primeira doação associativa feita no Portal (CSU01). O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** Os dados do usuário foram exibidos à equipe pela conta institucional.
- **Fluxo Alternativo 01 – Cadastrar usuário:** Um novo usuário foi gravado no sistema, ativo ou, se voluntário menor de idade, pendente da autorização do responsável.
- **Fluxo Alternativo 02 – CPF já cadastrado:** Não há registro duplicado; se a pessoa passou de voluntária a funcionária, o papel de voluntário foi encerrado e seu histórico permanece.
- **Fluxo Alternativo 03 – Alterar dados:** Os dados foram modificados e o histórico da alteração foi preservado.
- **Fluxo Alternativo 04 – Inativar papel:** O papel está inativo, com registro, dados e histórico preservados; se era o de doador associado, a pessoa perdeu o acesso ao autoatendimento.
- **Fluxo Alternativo 05 – Reativar papel:** O papel voltou a estar ativo.
- **Fluxo Exceção 06 – Dados inválidos:** Nenhum dado foi gravado.
- **Fluxo Exceção 07 – Voluntário que já é funcionário:** O cadastro permaneceu inalterado.
- **Fluxo Exceção 08 – Tentativa de exclusão definitiva:** Nenhum registro foi excluído.
- **Fluxo Exceção 09 – Tentativa de acesso sem permissão:** O acesso foi negado e a tentativa consta na auditoria.
- **Fluxo Exceção 10 – Reativação não permitida:** O papel permaneceu como estava.
- **Fluxo Exceção 11 – Tentativa de cadastrar doador associado:** Nenhum papel foi adicionado.

---

# CSU05 — Cadastrar Voluntário

| Código | CSU05 |
|---|---|
| Nome | Cadastrar Voluntário |
| Sumário | Este caso de uso descreve os passos percorridos pelo visitante para se cadastrar como voluntário e pela equipe para triar esse cadastro, com etapa de entrevista. Não existe autoaprovação: todo cadastro feito pelo Portal passa por triagem humana. Os dados coletados são os do termo de adesão da Lei nº 9.608/1998, que o sistema oferece já preenchido para impressão e assinatura. A autorização do responsável legal de menor de idade é entregue em papel na sede da instituição. O cadastro feito diretamente pela equipe no Painel está no CSU04. |
| Ator Principal | Visitante (candidato a voluntário) |
| Ator Secundário | Funcionário |
| Pré-condições | Visitante deve estar na página pública de voluntariado. O aviso de privacidade deve estar publicado. |

## Fluxo Principal

| Ator (visitante) | Sistema |
|---|---|
| 1. Acessa a página de voluntariado e preenche nome, data de nascimento, RG, CPF, endereço, bairro, CEP, cidade, UF, telefone, e-mail e o tipo de serviço que vai prestar, escolhido numa lista ou descrito em "Outro"; se quiser, também escolaridade, profissão, objetivos e dias e horários disponíveis, que a equipe pode completar na entrevista. | |
| | 2. Verifica a data de nascimento; sendo menor de idade, executa o fluxo alternativo 01. Exibe o resumo do tratamento dos dados e a opção de aceite do aviso de privacidade. |
| 3. Aceita o aviso de privacidade e confirma o envio. | |
| | 4. Registra o cadastro com status pendente, grava o consentimento com data/hora, finalidade e versão do aviso, gera o código de protocolo e sinaliza o cadastro no Painel Administrativo. |
| | 5. Exibe o protocolo, orientando o visitante a anotá-lo, oferece o termo de adesão já preenchido para impressão e assinatura e envia e-mail de confirmação informando que a análise pode levar alguns dias. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Voluntário menor de idade

| Ator (visitante) | Sistema |
|---|---|
| | 1. No passo 2 do fluxo principal, identifica que o cadastrando é menor de idade, informa que a autorização do responsável legal deve ser entregue assinada na sede da instituição e oferece a página de autorização pronta para impressão, preenchida com os dados informados. |
| 2. Imprime a autorização ou a salva em PDF pelo navegador. | |
| | 3. Retorna ao passo 3 do fluxo principal; o cadastro será registrado com a autorização marcada como pendente. |

## Fluxo Alternativo 02 – Chamar para entrevista

| Ator (funcionário) | Sistema |
|---|---|
| 1. A partir do passo 4 do fluxo principal, com o cadastro sinalizado no Painel, acessa a fila de triagem, avalia o cadastro pendente e chama a pessoa para entrevista. | |
| | 2. Altera o status para chamado para entrevista, registra a conta e a data e envia e-mail ao voluntário avisando que a instituição entrará em contato. O caso de uso se encerra. |

## Fluxo Alternativo 03 – Aprovar após entrevista

| Ator (funcionário) | Sistema |
|---|---|
| 1. Depois do fluxo alternativo 02 e da entrevista, aprova o cadastro. | |
| | 2. Sendo menor de idade, verifica se a autorização do responsável foi marcada como recebida; estando pendente, executa o fluxo de exceção 08. Se o CPF pertence a um funcionário ativo, executa o fluxo de exceção 09. |
| | 3. Efetiva a pessoa como voluntária ativa, registra a conta e a data e envia e-mail com o resultado. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Registrar recebimento da autorização

| Ator (funcionário) | Sistema |
|---|---|
| 1. A partir do passo 4 do fluxo principal, sendo cadastro de menor com autorização pendente, recebe na sede a autorização assinada pelo responsável legal e a marca como recebida. | |
| | 2. Registra o recebimento com a data e a conta, sem guardar cópia do documento, e libera a aprovação. O caso de uso se encerra. |

## Fluxo Alternativo 05 – Rejeitar cadastro

| Ator (funcionário) | Sistema |
|---|---|
| 1. A partir do passo 4 do fluxo principal ou depois do fluxo alternativo 02, rejeita o cadastro, informando o motivo, se quiser. | |
| | 2. Altera o status para rejeitado, preserva o registro e, quando informado, o motivo, registra a conta e a data e envia e-mail com o resultado. O caso de uso se encerra. |

## Fluxo Alternativo 06 – Fim do prazo de retenção

| Ator (funcionário) | Sistema |
|---|---|
| | 1. Seis meses após o fluxo alternativo 05, ou após o encerramento a pedido do titular por revogação do consentimento (CSU11), com prazo configurável, sinaliza o cadastro à equipe para anonimização. |
| 2. Executa a anonimização do cadastro sinalizado. | |
| | 3. Torna ilegíveis os dados pessoais, preservando o registro, o histórico, a auditoria e dados estatísticos não identificáveis, e registra a conta e a data (CSU11). O caso de uso se encerra. |

## Fluxo Exceção 07 – Dados inválidos

| Ator (visitante) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, envia o cadastro com campo obrigatório em branco ou com CPF, CEP, telefone, e-mail ou data de nascimento inválido. | |
| | 2. Impede o envio, indica cada campo a corrigir e retorna ao passo 1 do fluxo principal. |

## Fluxo Exceção 08 – Aprovação de menor sem autorização recebida

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 1 do fluxo alternativo 03, tenta aprovar o cadastro de um menor de idade cuja autorização ainda está pendente. | |
| | 2. Impede a aprovação e informa que a autorização do responsável legal ainda não foi recebida. O caso de uso se encerra. |

## Fluxo Exceção 09 – Pessoa que já é funcionária

| Ator (funcionário) | Sistema |
|---|---|
| | 1. No passo 2 do fluxo alternativo 03, identifica que o CPF do cadastro pertence a um funcionário ativo. |
| | 2. Impede a aprovação e informa que funcionário e voluntário são papéis exclusivos; o funcionário pode rejeitar o cadastro (fluxo alternativo 05). O caso de uso se encerra. |

## Fluxo Exceção 10 – Envio sem aceite do aviso de privacidade

| Ator (visitante) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, tenta enviar o cadastro sem aceitar o aviso de privacidade. | |
| | 2. Impede o envio, explica que o aceite é obrigatório e retorna ao passo 3 do fluxo principal. |

## Fluxo Exceção 11 – Falha no envio de e-mail

| Ator (autor da submissão) | Sistema |
|---|---|
| | 1. No passo 5 do fluxo principal ou ao final dos fluxos alternativos 02, 03 e 05, não consegue enviar o e-mail de confirmação ou de resultado. |
| | 2. Mantém o cadastro e a decisão registrados, tenta reenviar automaticamente uma vez após um intervalo e, persistindo a falha, registra-a para reenvio ou contato manual pela equipe. O registro nunca é revertido. O caso de uso se encerra. |

## Fluxo Alternativo 12 – Imprimir o termo de adesão pelo Painel

| Ator (funcionário) | Sistema |
|---|---|
| 1. A partir do passo 4 do fluxo principal, em qualquer etapa da triagem, escolhe imprimir o termo de adesão do cadastro e, se menor de idade, a autorização do responsável legal. | |
| | 2. Exibe os documentos já preenchidos com os dados do cadastro, prontos para impressão e assinatura, e registra a conta e a data. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** O cadastro está registrado como pendente, com consentimento e protocolo, aguardando triagem; o termo de adesão foi oferecido para impressão.
- **Fluxo Alternativo 01 – Voluntário menor de idade:** O cadastro do menor fica com a autorização pendente; nenhum documento do menor é armazenado no sistema.
- **Fluxo Alternativo 02 – Chamar para entrevista:** O cadastro consta como chamado para entrevista.
- **Fluxo Alternativo 03 – Aprovar após entrevista:** A pessoa está cadastrada como voluntária ativa e a aprovação consta na auditoria.
- **Fluxo Alternativo 04 – Registrar recebimento da autorização:** A autorização consta como recebida e o cadastro do menor pode ser aprovado.
- **Fluxo Alternativo 05 – Rejeitar cadastro:** O cadastro consta como rejeitado e o registro foi preservado.
- **Fluxo Alternativo 06 – Fim do prazo de retenção:** O cadastro rejeitado ou encerrado a pedido do titular foi anonimizado ao fim do prazo de retenção.
- **Fluxo Exceção 07 – Dados inválidos:** Nenhum cadastro foi registrado.
- **Fluxo Exceção 08 – Aprovação de menor sem autorização recebida:** O cadastro permaneceu sem aprovação.
- **Fluxo Exceção 09 – Pessoa que já é funcionária:** O cadastro permaneceu sem aprovação.
- **Fluxo Exceção 10 – Envio sem aceite do aviso de privacidade:** Nenhum cadastro foi registrado.
- **Fluxo Exceção 11 – Falha no envio de e-mail:** O registro permanece e a falha de envio está sinalizada à equipe.
- **Fluxo Alternativo 12 – Imprimir o termo de adesão pelo Painel:** Os documentos do voluntário foram impressos para assinatura em papel; nenhum documento assinado é guardado no sistema.

---

# CSU06 — Cadastrar Candidato a Vaga

| Código | CSU06 |
|---|---|
| Nome | Cadastrar Candidato a Vaga |
| Sumário | Este caso de uso descreve os passos percorridos pelo visitante para se candidatar a uma vaga de emprego e pela equipe para avaliar a candidatura, com etapa de entrevista. Só a aprovação final efetiva o candidato como funcionário nos registros administrativos. Funcionário e voluntário são papéis exclusivos: quem já é voluntário tem esse papel encerrado ao ser efetivado. |
| Ator Principal | Visitante (candidato) |
| Ator Secundário | Funcionário |
| Pré-condições | Visitante deve estar na página pública de vagas. O aviso de privacidade deve estar publicado. |

## Fluxo Principal

| Ator (visitante) | Sistema |
|---|---|
| 1. Acessa a página de vagas e seleciona um dos cargos: limpeza, cuidador, enfermagem ou cozinha. | |
| | 2. Solicita nome, CPF, data de nascimento, telefone, e-mail e o currículo, em arquivo ou em descrição textual da experiência, e exibe o resumo do tratamento dos dados com a opção de aceite do aviso de privacidade. |
| 3. Preenche os dados, fornece o currículo, aceita o aviso de privacidade e confirma o envio. | |
| | 4. Registra a candidatura com status em análise, grava o consentimento, gera o código de protocolo e sinaliza a candidatura no Painel Administrativo. |
| | 5. Exibe o protocolo, orientando o candidato a anotá-lo, e envia e-mail de confirmação. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Chamar para entrevista

| Ator (funcionário) | Sistema |
|---|---|
| 1. A partir do passo 4 do fluxo principal, com a candidatura sinalizada no Painel, acessa a fila de triagem, avalia a candidatura e chama o candidato para entrevista. | |
| | 2. Altera o status para chamado para entrevista, sem criar cadastro de funcionário, registra a conta e a data e envia e-mail ao candidato avisando que a instituição entrará em contato. O caso de uso se encerra. |

## Fluxo Alternativo 02 – Aprovar após entrevista

| Ator (funcionário) | Sistema |
|---|---|
| 1. Depois do fluxo alternativo 01 e da entrevista, aprova a candidatura. | |
| | 2. Verifica se o CPF do candidato já pertence a um voluntário cadastrado; pertencendo, executa o fluxo alternativo 03. |
| | 3. Altera o status para aprovada, efetiva o cadastro do candidato como funcionário nos registros administrativos, sem gerar credencial de acesso individual, registra a conta e a data e envia e-mail com o resultado. O caso de uso se encerra. |

## Fluxo Alternativo 03 – Candidato já cadastrado como voluntário

| Ator (funcionário) | Sistema |
|---|---|
| | 1. No passo 2 do fluxo alternativo 02, identifica que o CPF do candidato já pertence a um voluntário cadastrado. |
| | 2. Altera o status para aprovada, adiciona o perfil de funcionário ao cadastro existente, sem criar um segundo registro, encerra o papel de voluntário, sem apagar o registro, porque os dois papéis são exclusivos, registra a conta e a data e envia e-mail com o resultado. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Rejeitar candidatura

| Ator (funcionário) | Sistema |
|---|---|
| 1. A partir do passo 4 do fluxo principal ou depois do fluxo alternativo 01, rejeita a candidatura, informando o motivo, se quiser. | |
| | 2. Altera o status para rejeitada, sem criar cadastro de funcionário, preserva o registro e, quando informado, o motivo, registra a conta e a data e envia e-mail com o resultado. O caso de uso se encerra. |

## Fluxo Alternativo 05 – Fim do prazo de retenção

| Ator (funcionário) | Sistema |
|---|---|
| | 1. Com prazo configurável de seis meses, sinaliza à equipe para anonimização: a candidatura inteira, seis meses após o fluxo alternativo 04 ou após o encerramento a pedido do titular por revogação do consentimento (CSU11); ou só o currículo, seis meses após a efetivação como funcionário (fluxos alternativos 02 e 03), porque a finalidade do currículo — a seleção — acabou. |
| 2. Executa a anonimização sinalizada. | |
| | 3. Na candidatura rejeitada ou encerrada, torna ilegíveis os dados pessoais e remove o currículo; na aprovada, remove só o currículo (arquivo ou descrição), mantendo o cadastro de funcionário. Em ambos, preserva o registro, o histórico, a auditoria e dados estatísticos não identificáveis, e registra a conta e a data (CSU11). O caso de uso se encerra. |

## Fluxo Exceção 06 – Dados inválidos

| Ator (visitante) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, envia a candidatura com campo obrigatório em branco ou com CPF, data de nascimento, telefone ou e-mail inválido. | |
| | 2. Impede o envio, indica cada campo a corrigir e retorna ao passo 3 do fluxo principal. |

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
| | 2. Mantém a candidatura e a decisão registrados, tenta reenviar automaticamente uma vez após um intervalo e, persistindo a falha, registra-a para reenvio ou contato manual pela equipe. O registro nunca é revertido. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** A candidatura está registrada como em análise, com consentimento e protocolo, aguardando triagem.
- **Fluxo Alternativo 01 – Chamar para entrevista:** A candidatura consta como chamado para entrevista; nenhum funcionário foi criado.
- **Fluxo Alternativo 02 – Aprovar após entrevista:** O candidato está efetivado como funcionário, sem credencial individual, e a aprovação consta na auditoria.
- **Fluxo Alternativo 03 – Candidato já cadastrado como voluntário:** A pessoa é funcionária no mesmo cadastro, sem duplicação; o papel de voluntário foi encerrado e seu histórico permanece.
- **Fluxo Alternativo 04 – Rejeitar candidatura:** A candidatura consta como rejeitada e o registro foi preservado.
- **Fluxo Alternativo 05 – Fim do prazo de retenção:** A candidatura rejeitada ou encerrada foi anonimizada, com o currículo; ou, na aprovada, só o currículo foi removido e o cadastro de funcionário permanece.
- **Fluxo Exceção 06 – Dados inválidos:** Nenhuma candidatura foi registrada.
- **Fluxo Exceção 07 – Candidatura sem currículo:** Nenhuma candidatura foi registrada.
- **Fluxo Exceção 08 – Envio sem aceite do aviso de privacidade:** Nenhuma candidatura foi registrada.
- **Fluxo Exceção 09 – Falha no envio de e-mail:** O registro permanece e a falha de envio está sinalizada à equipe.

---

# CSU07 — Manter Itens Necessários

| Código | CSU07 |
|---|---|
| Nome | Manter Itens Necessários |
| Sumário | Este caso de uso descreve os passos percorridos pelo funcionário para manter a lista de necessidades da instituição, exibida no Portal Público, onde o visitante a consulta sem login. Itens supridos saem da listagem pública sem perder o registro histórico, e itens sem atualização há 30 dias ou mais são sinalizados à equipe. |
| Ator Principal | Funcionário |
| Ator Secundário | Visitante |
| Pré-condições | Funcionário deve estar autenticado no Painel Administrativo pela conta institucional. |

## Fluxo Principal

| Ator (funcionário) | Sistema |
|---|---|
| 1. Acessa a tela de itens necessários do Painel Administrativo. | |
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

# CSU08 — Solicitar Evento ou Campanha Externa

| Código | CSU08 |
|---|---|
| Nome | Solicitar Evento ou Campanha Externa |
| Sumário | Este caso de uso descreve os passos percorridos por pessoa ou organização externa para propor um evento ou uma campanha à instituição, e pela equipe para avaliar essa proposta. A aprovação não publica nada: a instituição entra em contato com o solicitante e só depois de combinar os detalhes confirma a proposta, que gera um evento ou uma campanha, conforme o tipo, publicado no Portal Público. Os recursos esperados são o que o solicitante pede à instituição (espaço, equipe, horário) e ficam registrados na solicitação; os recursos a arrecadar de uma campanha são definidos pelo funcionário na confirmação. |
| Ator Principal | Solicitante externo |
| Ator Secundário | Funcionário |
| Pré-condições | Solicitante deve estar na página pública de solicitação de evento/campanha. O aviso de privacidade deve estar publicado. |

## Fluxo Principal

| Ator (solicitante) | Sistema |
|---|---|
| 1. Escolhe se propõe um evento ou uma campanha e preenche dados de contato, nome do evento ou da campanha, objetivo, data ou período pretendido e os recursos que espera da instituição (como espaço, equipe ou horário), aceita o aviso de privacidade e confirma o envio. | |
| | 2. Registra a solicitação com status em análise, grava o consentimento, gera o código de protocolo e sinaliza a solicitação no Painel Administrativo. |
| | 3. Exibe o protocolo, orientando o solicitante a anotá-lo, e envia e-mail de confirmação. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Aprovar solicitação

| Ator (funcionário) | Sistema |
|---|---|
| 1. A partir do passo 2 do fluxo principal, com a solicitação sinalizada no Painel, acessa a fila de triagem, avalia a solicitação e a aprova. | |
| | 2. Na solicitação de evento, se a data pretendida coincide com evento já confirmado, avisa sobre o conflito e permite prosseguir. |
| | 3. Altera o status para aprovada — aguardando contato, sem publicar nada, registra a conta e a data e envia e-mail ao solicitante informando que a instituição entrará em contato para combinar o evento. O caso de uso se encerra. |

## Fluxo Alternativo 02 – Confirmar proposta após contato

| Ator (funcionário) | Sistema |
|---|---|
| 1. Depois do fluxo alternativo 01 e de combinar os detalhes com o solicitante, fora do sistema, confirma a proposta, ajustando os dados combinados e, na campanha, informando os recursos a arrecadar. | |
| | 2. Na solicitação de evento, se a data coincide com evento já confirmado, avisa sobre o conflito e permite prosseguir. |
| | 3. Gera o evento ou a campanha, conforme o tipo da solicitação, com os dados combinados, publica-o automaticamente no Portal Público (CSU02) e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 03 – Rejeitar solicitação

| Ator (funcionário) | Sistema |
|---|---|
| 1. A partir do passo 2 do fluxo principal ou depois do fluxo alternativo 01, rejeita a solicitação, informando o motivo, se quiser. | |
| | 2. Altera o status para rejeitada, sem gerar evento nem campanha, preserva o registro e, quando informado, o motivo, registra a conta e a data e envia e-mail com o resultado. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Fim do prazo de retenção

| Ator (funcionário) | Sistema |
|---|---|
| | 1. Seis meses após o fluxo alternativo 03, ou após o encerramento a pedido do titular por revogação do consentimento (CSU11), com prazo configurável, sinaliza a solicitação à equipe para anonimização. |
| 2. Executa a anonimização da solicitação sinalizada. | |
| | 3. Torna ilegíveis os dados pessoais do solicitante, preservando o registro, o histórico, a auditoria e dados estatísticos não identificáveis, e registra a conta e a data (CSU11). O caso de uso se encerra. |

## Fluxo Exceção 05 – Dados inválidos

| Ator (solicitante) | Sistema |
|---|---|
| 1. No passo 1 do fluxo principal, envia a solicitação sem escolher entre evento e campanha, com campo obrigatório em branco ou com telefone, e-mail ou data inválidos. | |
| | 2. Impede o envio, indica cada campo a corrigir e retorna ao passo 1 do fluxo principal. |

## Fluxo Exceção 06 – Envio sem aceite do aviso de privacidade

| Ator (solicitante) | Sistema |
|---|---|
| 1. No passo 1 do fluxo principal, tenta enviar a solicitação sem aceitar o aviso de privacidade. | |
| | 2. Impede o envio, explica que o aceite é obrigatório e retorna ao passo 1 do fluxo principal. |

## Fluxo Exceção 07 – Falha no envio de e-mail

| Ator (autor da submissão) | Sistema |
|---|---|
| | 1. No passo 3 do fluxo principal ou ao final dos fluxos alternativos 01 e 03, não consegue enviar o e-mail de confirmação ou de resultado. |
| | 2. Mantém a solicitação e a decisão registrados, tenta reenviar automaticamente uma vez após um intervalo e, persistindo a falha, registra-a para reenvio ou contato manual pela equipe. O registro nunca é revertido. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** A solicitação está registrada como em análise, com consentimento e protocolo, aguardando avaliação.
- **Fluxo Alternativo 01 – Aprovar solicitação:** A solicitação consta como aprovada — aguardando contato; nada foi publicado.
- **Fluxo Alternativo 02 – Confirmar proposta após contato:** O evento ou a campanha foi gerado a partir da solicitação e está publicado no Portal Público.
- **Fluxo Alternativo 03 – Rejeitar solicitação:** A solicitação consta como rejeitada e o registro foi preservado.
- **Fluxo Alternativo 04 – Fim do prazo de retenção:** A solicitação rejeitada ou encerrada a pedido do titular foi anonimizada ao fim do prazo de retenção.
- **Fluxo Exceção 05 – Dados inválidos:** Nenhuma solicitação foi registrada.
- **Fluxo Exceção 06 – Envio sem aceite do aviso de privacidade:** Nenhuma solicitação foi registrada.
- **Fluxo Exceção 07 – Falha no envio de e-mail:** O registro permanece e a falha de envio está sinalizada à equipe.

---

# CSU09 — Autoatendimento do Doador Associado

| Código | CSU09 |
|---|---|
| Nome | Autoatendimento do Doador Associado |
| Sumário | Este caso de uso descreve os passos percorridos pelo doador associado para consultar, com login próprio, exclusivamente os seus próprios dados e o histórico das doações já confirmadas, e para doar sem informar os dados de novo. A área é só de consulta: a correção de dados é pedida à secretaria, que a faz no Painel (CSU04), e a troca de senha é feita por "Esqueci minha senha". O voluntário não tem autoatendimento nesta versão. |
| Ator Principal | Doador associado |
| Ator Secundário | — |
| Pré-condições | O doador deve possuir cadastro de doador associado, criado na primeira doação associativa (CSU01). |

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
| | 2. Se houver versão do aviso de privacidade publicada depois do último aceite do doador, exibe o link da nova versão e pede que ele confirme que a leu e concorda antes de gerar o QR code; o aceite é registrado como mais um consentimento do doador, com data e versão. |
| | 3. Executa o fluxo alternativo 02 do CSU01, com a doação já vinculada ao cadastro. O caso de uso se encerra. |

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
| | 4. Consome o link, que é de uso único e expiração curta, grava a nova senha e retorna ao passo 1 do fluxo principal. |

## Fluxo Exceção 04 – Credenciais inválidas

| Ator (doador associado) | Sistema |
|---|---|
| 1. No passo 1 do fluxo principal, informa e-mail ou senha incorretos, tenta entrar antes de definir a senha pelo link recebido ou tem o papel de doador associado inativado pela equipe. | |
| | 2. No passo 2, nega o acesso com a mesma mensagem em todos os casos, sem informar qual dos dados está errado, e retorna ao passo 1 do fluxo principal. Após cinco tentativas erradas seguidas, bloqueia novas tentativas por 15 minutos. |

## Fluxo Exceção 05 – Tentativa de acessar dados de terceiro

| Ator (doador associado) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, tenta visualizar, por qualquer meio, dados cadastrais ou histórico de outro usuário. | |
| | 2. Nega o acesso sem expor detalhes internos do motivo e registra a tentativa no histórico de auditoria. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** O doador consultou exclusivamente os próprios dados e doações confirmadas.
- **Fluxo Alternativo 01 – Doar sem informar os dados de novo:** A nova declaração pendente está vinculada ao cadastro do doador e, se havia aviso de privacidade novo, o aceite dessa versão foi registrado.
- **Fluxo Alternativo 02 – Definir a senha da conta nova:** A conta do doador associado está ativa para o autoatendimento.
- **Fluxo Alternativo 03 – Redefinir senha esquecida:** A senha foi redefinida sem intervenção da equipe e o link de uso único foi consumido.
- **Fluxo Exceção 04 – Credenciais inválidas:** O acesso foi negado.
- **Fluxo Exceção 05 – Tentativa de acessar dados de terceiro:** O acesso foi negado e a tentativa consta na auditoria.

---

# CSU10 — Consultar Status de Solicitação

| Código | CSU10 |
|---|---|
| Nome | Consultar Status de Solicitação |
| Sumário | Este caso de uso descreve os passos percorridos por qualquer pessoa para consultar o andamento de um cadastro de voluntário, de uma candidatura a vaga ou de uma solicitação de evento/campanha informando apenas o código de protocolo, sem login e sem fornecer dados pessoais. Doações não têm protocolo. |
| Ator Principal | Autor da submissão |
| Ator Secundário | — |
| Pré-condições | O autor deve possuir o código de protocolo recebido no momento do envio. |

## Fluxo Principal

| Ator (autor da submissão) | Sistema |
|---|---|
| 1. Acessa a página pública de consulta de status e informa o código de protocolo. | |
| | 2. Localiza a submissão correspondente: cadastro de voluntário, candidatura a vaga ou solicitação de evento/campanha. |
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

# CSU11 — Exercício de Direitos do Titular de Dados (LGPD)

| Código | CSU11 |
|---|---|
| Nome | Exercício de Direitos do Titular de Dados (LGPD) |
| Sumário | Este caso de uso descreve como o titular de dados pessoais exerce os direitos previstos na LGPD — anonimização, correção, acesso e revogação do consentimento. Os pedidos são feitos fora do sistema, pelo contato da instituição informado no aviso de privacidade; o funcionário confere a identidade de quem pede e executa no Painel Administrativo o que depende do sistema. O consentimento é registrado nos próprios formulários de coleta (CSU01, CSU05, CSU06 e CSU08), e a anonimização por fim do prazo de retenção está nos CSU05, CSU06 e CSU08. Revogar o consentimento e anonimizar são pedidos distintos: a revogação interrompe o tratamento, mas não apaga os dados. |
| Ator Principal | Titular dos dados |
| Ator Secundário | Funcionário |
| Pré-condições | O aviso de privacidade deve estar publicado, com identificação de versão e o contato para exercício de direitos. Devem existir dados pessoais do titular no sistema. |

## Fluxo Principal

| Ator (titular / funcionário) | Sistema |
|---|---|
| 1. Consulta o aviso de privacidade no Portal Público, sem login, e, pelo contato informado nele, pede à instituição a anonimização dos seus dados (fora do sistema). | |
| 2. (Funcionário) Confere a identidade do titular, fora do sistema, e localiza o cadastro no Painel Administrativo. | |
| | 3. Exibe os registros vinculados ao titular e, se ele é doador associado, as doações confirmadas, que serão mantidas sem nenhum dado pessoal. |
| 4. (Funcionário) Executa a anonimização. | |
| | 5. Torna ilegíveis os dados pessoais identificáveis, remove os arquivos restritos vinculados, preserva o registro, o histórico e a auditoria sem exclusão física, e registra a conta e a data. As doações confirmadas permanecem só com valor, data/hora, tipo e status, vinculadas a "doador anonimizado", sem justificativa de retenção. |
| 6. (Funcionário) Informa o titular, pelo mesmo contato, que o pedido foi atendido. O caso de uso se encerra. | |

## Fluxo Alternativo 01 – Correção de dados

| Ator (titular / funcionário) | Sistema |
|---|---|
| 1. No passo 1 do fluxo principal, pede a correção de um dado em vez da anonimização. | |
| 2. (Funcionário) Executa o passo 2 do fluxo principal e corrige o dado no Painel. | |
| | 3. Grava a correção preservando o histórico da alteração e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 02 – Acesso aos dados

| Ator (titular / funcionário) | Sistema |
|---|---|
| 1. No passo 1 do fluxo principal, pede acesso aos seus dados em vez da anonimização. | |
| 2. (Funcionário) Executa o passo 2 do fluxo principal e consulta o cadastro. | |
| | 3. Exibe todos os dados do titular, que o funcionário repassa pelo mesmo contato. O doador associado também pode consultar os próprios dados no autoatendimento (CSU09). O caso de uso se encerra. |

## Fluxo Alternativo 03 – Revogação de consentimento

| Ator (titular / funcionário) | Sistema |
|---|---|
| 1. No passo 1 do fluxo principal, pede a revogação do consentimento em vez da anonimização. | |
| 2. (Funcionário) Executa o passo 2 do fluxo principal e registra a revogação no Painel. | |
| | 3. Altera o status do consentimento para revogado, com data e conta, e aplica o efeito conforme o que ele cobre: submissão ainda em triagem (cadastro de voluntário, candidatura ou solicitação externa) passa a "encerrada a pedido do titular", sai da fila de triagem e entra no prazo de retenção (CSU05, CSU06, CSU08); voluntário ativo é inativado; doador associado tem o papel encerrado, perde o acesso ao autoatendimento e deixa de poder vincular novas doações, mantidas as já confirmadas. Não anonimiza nem exclui o registro; se o titular também quiser os dados apagados, é o fluxo principal. O caso de uso se encerra. |

## Fluxo Exceção 04 – Identidade do titular não comprovada

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 2 do fluxo principal, não consegue confirmar que quem pede é o titular dos dados. | |
| | 2. Nenhuma ação é executada no sistema; o funcionário comunica a recusa pelo mesmo contato. O caso de uso se encerra. |

## Fluxo Exceção 05 – Dados sujeitos a obrigação legal

| Ator (funcionário) | Sistema |
|---|---|
| 1. No passo 3 do fluxo principal, constata que parte dos dados de um cadastro é necessária ao cumprimento de obrigação legal ou regulatória. Não se aplica às doações confirmadas, que já são mantidas sem dado pessoal (passo 5). | |
| | 2. Permite reter exclusivamente esses dados e anonimizar os demais, exigindo o registro da justificativa da retenção. |
| 3. Registra a justificativa e executa a anonimização dos demais dados. | |
| | 4. Armazena a justificativa, procede conforme o passo 5 do fluxo principal e retorna ao passo 6, em que o funcionário informa ao titular o que foi retido e por quê. |

## Pós-condições

- **Fluxo principal:** Os dados pessoais identificáveis do titular deixaram de ser legíveis, enquanto o registro, o histórico, a trilha de auditoria e as doações confirmadas — vinculadas a "doador anonimizado" — permanecem íntegros.
- **Fluxo Alternativo 01 – Correção de dados:** O dado foi corrigido e o histórico da alteração foi preservado.
- **Fluxo Alternativo 02 – Acesso aos dados:** O titular recebeu os seus dados.
- **Fluxo Alternativo 03 – Revogação de consentimento:** O consentimento consta como revogado; a submissão em triagem está encerrada a pedido do titular, o voluntário está inativo ou a conta do doador associado está inativa; os dados não foram anonimizados.
- **Fluxo Exceção 04 – Identidade do titular não comprovada:** Nenhum dado foi alterado.
- **Fluxo Exceção 05 – Dados sujeitos a obrigação legal:** Os dados retidos possuem justificativa registrada, comunicada ao titular.
