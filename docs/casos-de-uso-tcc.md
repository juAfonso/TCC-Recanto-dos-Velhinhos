# SAGE — Casos de Uso

Sistema web para a ILPI Recanto dos Velhinhos Francisco Gonçalves Barbosa — CSU01 a CSU11

> Revisão de 2026-10-05: alinhada ao `specs/001-portal-painel-ilpi/spec.md` e às decisões do grupo de 03 e 04/10.
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
| | 2. Exibe os valores sugeridos (R$ 10, 20, 50 e 100), o campo para outro valor e o aviso de que o pagamento é feito no aplicativo do próprio banco, de que sem o clique em "Já fiz o Pix" a doação não é registrada e de que a doação espontânea não pode ser acompanhada depois. |
| 3. Mantendo a modalidade espontânea, escolhe um valor sugerido ou digita outro valor, de no mínimo R$ 1. | |
| | 4. Gera o QR code Pix estático e o código copia e cola com a chave da instituição e o valor escolhido, com opção de copiar o código. |
| 5. Efetua o pagamento no aplicativo do seu banco, fora do sistema, e clica em "Já fiz o Pix". | |
| | 6. Registra a declaração com status pendente, com o valor do QR code e a data/hora do clique, sem nenhum dado de identificação, e a coloca na fila de conferência do Painel Administrativo. |
| | 7. Exibe um agradecimento explicando que a equipe confere a doação manualmente. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Primeira doação associativa

| Ator (doador) | Sistema |
|---|---|
| 1. Executa o fluxo principal até o passo 2 e seleciona a modalidade associativa. | |
| | 2. Solicita nome, CPF, e-mail e telefone, e o aceite explícito do aviso de privacidade. |
| 3. Preenche os dados, aceita o aviso de privacidade e escolhe o valor. | |
| | 4. Gera o QR code Pix estático e o código copia e cola com o valor escolhido. |
| 5. Efetua o pagamento no aplicativo do seu banco e clica em "Já fiz o Pix". | |
| | 6. Registra a declaração com status pendente, com valor e data/hora do clique, cria o cadastro de doador associado, vincula a declaração a ele e registra o consentimento com data/hora, finalidade e versão do aviso aceito. |
| | 7. Envia ao e-mail informado um link para definir a senha — a conta só dá acesso ao autoatendimento depois que a senha é definida — e retorna ao passo 7 do fluxo principal. |

## Fluxo Alternativo 02 – Doador associado já cadastrado

| Ator (doador associado) | Sistema |
|---|---|
| 1. Entra na área de autoatendimento (CSU09) e escolhe fazer uma doação. | |
| | 2. Apresenta a página de doação já vinculada ao seu cadastro, sem pedir os dados de identificação. |
| 3. Escolhe o valor, efetua o pagamento no aplicativo do banco e clica em "Já fiz o Pix". | |
| | 4. Registra a declaração com status pendente, com valor e data/hora do clique, vinculada ao cadastro, e retorna ao passo 7 do fluxo principal. |

## Fluxo Alternativo 03 – Conferência: Pix localizado no extrato

| Ator (funcionário) | Sistema |
|---|---|
| 1. Acessa a fila de conferência no Painel Administrativo. | |
| | 2. Exibe, para cada declaração pendente, o valor, a data/hora do clique e, se associativa, o nome do doador, e sinaliza declarações com valor e data próximos como possível duplicidade. |
| 3. Localiza no extrato bancário um Pix com o mesmo valor e data/hora próximos — na doação associativa, também pelo nome do doador, como critério auxiliar — e confirma a doação. | |
| | 4. Altera o status para confirmada e registra a data da confirmação e a conta institucional na auditoria. Se a doação é associativa, passa a exibi-la no histórico do doador no autoatendimento. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Conferência: Pix não localizado no extrato

| Ator (funcionário) | Sistema |
|---|---|
| 1. Executa o fluxo alternativo 03 até o passo 2 e não localiza o Pix correspondente no extrato bancário. | |
| | 2. Oferece a marcação como não localizada, com campo de motivo opcional e, como opção pronta, o motivo padrão para pagamento recebido por depósito ou transferência que não seja Pix. |
| 3. Informa o motivo, se quiser, e confirma a marcação. | |
| | 4. Altera o status para não localizada, preserva o registro sem exclusão física e registra a conta, a data e, quando informado, o motivo na auditoria. O caso de uso se encerra. |

## Fluxo Exceção 05 – Valor inválido

| Ator (doador) | Sistema |
|---|---|
| 1. Deixa o valor em branco ou informa valor não numérico, negativo ou menor que R$ 1. | |
| | 2. Não gera o QR code, indica o erro no campo de valor — informando o mínimo, quando for o caso — e retorna ao passo 3 do fluxo principal. |

## Fluxo Exceção 06 – Dados do doador associado inválidos ou sem aceite

| Ator (doador) | Sistema |
|---|---|
| 1. No fluxo alternativo 01, deixa campo obrigatório em branco, informa CPF ou e-mail inválido ou não aceita o aviso de privacidade. | |
| | 2. Impede o prosseguimento, indica cada campo a corrigir ou explica que o aceite é obrigatório, e retorna ao passo 3 do fluxo alternativo 01. |

## Fluxo Exceção 07 – Nenhuma chave Pix cadastrada

| Ator (doador) | Sistema |
|---|---|
| 1. Acessa a página pública de doações. | |
| | 2. Verifica que não há chave Pix ativa cadastrada, informa que a doação digital está temporariamente indisponível, exibe o contato da instituição e não apresenta o QR code nem o botão "Já fiz o Pix". O caso de uso se encerra. |

## Fluxo Exceção 08 – Doador paga e não clica em "Já fiz o Pix"

| Ator (doador) | Sistema |
|---|---|
| 1. Executa o fluxo principal até o passo 4, paga no aplicativo do banco e sai da página sem clicar em "Já fiz o Pix". | |
| | 2. Não registra nenhuma declaração: o pagamento existe apenas no extrato bancário e é controlado pela secretaria, fora do sistema, como os pagamentos feitos na sede. O caso de uso se encerra. |

## Fluxo Exceção 09 – Tentativa de confirmação em duplicidade

| Ator (funcionário) | Sistema |
|---|---|
| 1. Tenta confirmar uma doação já confirmada anteriormente. | |
| | 2. Identifica que o status já é confirmada, recusa a operação e não altera o registro. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** A declaração de doação está registrada com status pendente, com valor e data/hora, aguardando a conferência do funcionário.
- **Fluxo Alternativo 01 – Primeira doação associativa:** O doador associado está cadastrado, com consentimento registrado, e a declaração pendente está vinculada ao seu cadastro.
- **Fluxo Alternativo 02 – Doador associado já cadastrado:** A declaração pendente está vinculada ao cadastro do doador, sem que ele precisasse informar os dados de novo.
- **Fluxo Alternativo 03 – Conferência: Pix localizado no extrato:** A doação consta como confirmada, com data e conta registradas; se associativa, aparece no autoatendimento do doador.
- **Fluxo Alternativo 04 – Conferência: Pix não localizado no extrato:** A declaração consta como não localizada, com o registro preservado; ela não aparece no autoatendimento.
- **Fluxo Exceção 05 – Valor inválido:** Nenhum QR code foi gerado e nenhuma declaração foi registrada.
- **Fluxo Exceção 06 – Dados do doador associado inválidos ou sem aceite:** Nenhum cadastro nem declaração foi registrado.
- **Fluxo Exceção 07 – Nenhuma chave Pix cadastrada:** Nenhuma declaração de doação foi registrada.
- **Fluxo Exceção 08 – Doador paga e não clica em "Já fiz o Pix":** A doação não consta no sistema; por isso os totais do Painel não representam a arrecadação da instituição.
- **Fluxo Exceção 09 – Tentativa de confirmação em duplicidade:** O registro permaneceu inalterado.

---

# CSU02 — Manter Campanhas e Eventos

| Código | CSU02 |
|---|---|
| Nome | Manter Campanhas e Eventos |
| Sumário | Este caso de uso descreve os passos percorridos pelo funcionário para cadastrar, alterar e encerrar campanhas e eventos institucionais, que são publicados automaticamente no Portal Público. A meta em dinheiro é opcional e o valor arrecadado é informado pela equipe, porque as doações via Pix não são vinculadas a campanhas. |
| Ator Principal | Funcionário |
| Ator Secundário | Visitante |
| Pré-condições | Funcionário deve estar autenticado no Painel Administrativo pela conta institucional. |

## Fluxo Principal

| Ator (funcionário) | Sistema |
|---|---|
| 1. Informa o cadastro de uma nova campanha/evento com nome, data, descrição, recursos necessários e, opcionalmente, meta em dinheiro. | |
| | 2. Verifica se a data já tem outro evento confirmado; havendo conflito, executa o fluxo alternativo 01. |
| | 3. Grava a campanha/evento como ativa, publica-a automaticamente no Portal Público — sem barra de arrecadação, se não houver meta em dinheiro — e registra a conta e a data na auditoria. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Conflito de data

| Ator (funcionário) | Sistema |
|---|---|
| | 1. Avisa que a data pretendida coincide com outro evento já confirmado e exibe qual. |
| 2. Opta por alterar a data ou por prosseguir mesmo assim. | |
| | 3. Se a data foi alterada, retorna ao passo 2 do fluxo principal; se o funcionário optou por prosseguir, retorna ao passo 3. O aviso é sinalização, nunca bloqueio. |

## Fluxo Alternativo 02 – Alterar campanha/evento

| Ator (funcionário) | Sistema |
|---|---|
| 1. Informa a alteração de uma campanha/evento existente. | |
| | 2. Exibe os dados atuais e solicita as alterações. |
| 3. Modifica os dados desejados e confirma. | |
| | 4. Grava as alterações preservando o histórico, atualiza a publicação no Portal Público e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 03 – Atualizar valor arrecadado

| Ator (funcionário) | Sistema |
|---|---|
| 1. Informa o valor arrecadado de uma campanha com meta em dinheiro, a partir do controle da secretaria. | |
| | 2. Grava o valor, atualiza o progresso exibido no Portal Público e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Encerrar campanha/evento

| Ator (funcionário) | Sistema |
|---|---|
| 1. Informa o encerramento de uma campanha/evento ativa. | |
| | 2. Altera o status para encerrado, remove-a da listagem pública sem excluir o registro e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Exceção 05 – Dados inválidos ou data passada

| Ator (funcionário) | Sistema |
|---|---|
| 1. Deixa campo obrigatório em branco, informa meta negativa ou informa uma data que já passou. | |
| | 2. Não grava, indica cada campo a corrigir e retorna ao passo 1 do fluxo principal. |

## Fluxo Exceção 06 – Encerrar campanha já encerrada

| Ator (funcionário) | Sistema |
|---|---|
| 1. Tenta encerrar uma campanha/evento que já está encerrada. | |
| | 2. Não altera o registro. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** A campanha/evento está gravada e publicada no Portal Público.
- **Fluxo Alternativo 01 – Conflito de data:** O funcionário foi avisado do conflito e decidiu conscientemente.
- **Fluxo Alternativo 02 – Alterar campanha/evento:** Os dados foram modificados e o histórico da alteração foi preservado.
- **Fluxo Alternativo 03 – Atualizar valor arrecadado:** O Portal Público exibe o progresso da campanha com o valor informado pela equipe.
- **Fluxo Alternativo 04 – Encerrar campanha/evento:** A campanha/evento saiu da listagem pública e seu registro histórico permanece.
- **Fluxo Exceção 05 – Dados inválidos ou data passada:** Nenhuma campanha/evento foi gravada.
- **Fluxo Exceção 06 – Encerrar campanha já encerrada:** O registro permaneceu inalterado.

---

# CSU03 — Divulgação Institucional

| Código | CSU03 |
|---|---|
| Nome | Divulgação Institucional |
| Sumário | Este caso de uso descreve os passos percorridos pelo funcionário para publicar, editar e despublicar notícias, informações institucionais e necessidades da instituição no Portal Público. Não há sincronização com redes sociais, e notícias não são excluídas: são despublicadas. |
| Ator Principal | Funcionário |
| Ator Secundário | Visitante |
| Pré-condições | Funcionário deve estar autenticado no Painel Administrativo pela conta institucional. |

## Fluxo Principal

| Ator (funcionário) | Sistema |
|---|---|
| 1. Informa a publicação de uma nova notícia com título, conteúdo e, opcionalmente, uma imagem com seu texto alternativo. | |
| | 2. Publica a notícia no Portal Público e registra a conta e a data na auditoria. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Editar notícia

| Ator (funcionário) | Sistema |
|---|---|
| 1. Informa a edição de uma notícia existente. | |
| | 2. Exibe os dados atuais e solicita as alterações. |
| 3. Modifica os dados desejados e confirma. | |
| | 4. Grava as alterações preservando o histórico, atualiza a notícia no Portal Público, se publicada, e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 02 – Despublicar notícia

| Ator (funcionário) | Sistema |
|---|---|
| 1. Informa a despublicação de uma notícia publicada. | |
| | 2. Retira a notícia do Portal Público, mantém-na no Painel como despublicada e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 03 – Publicar novamente notícia despublicada

| Ator (funcionário) | Sistema |
|---|---|
| 1. Informa a nova publicação de uma notícia despublicada. | |
| | 2. Volta a exibir a notícia no Portal Público e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Consultar página institucional

| Ator (visitante) | Sistema |
|---|---|
| 1. Acessa a página institucional do Portal Público. | |
| | 2. Exibe a história, a missão e a equipe da instituição, sem exigir autenticação. O caso de uso se encerra. |

## Fluxo Exceção 05 – Imagem sem texto alternativo

| Ator (funcionário) | Sistema |
|---|---|
| 1. Anexa uma imagem à notícia sem preencher o texto alternativo. | |
| | 2. Impede a publicação, explica que o texto alternativo é obrigatório para leitores de tela e retorna ao passo 1 do fluxo principal. |

## Fluxo Exceção 06 – Dados inválidos

| Ator (funcionário) | Sistema |
|---|---|
| 1. Deixa título ou conteúdo em branco, ou anexa imagem em formato não aceito ou acima do tamanho máximo. | |
| | 2. Não publica, indica cada campo a corrigir e retorna ao passo 1 do fluxo principal. |

## Pós-condições

- **Fluxo principal:** A notícia está publicada no Portal Público.
- **Fluxo Alternativo 01 – Editar notícia:** A notícia foi alterada e o histórico da alteração foi preservado.
- **Fluxo Alternativo 02 – Despublicar notícia:** A notícia não aparece no Portal Público e continua consultável no Painel.
- **Fluxo Alternativo 03 – Publicar novamente notícia despublicada:** A notícia voltou a ser exibida no Portal Público.
- **Fluxo Alternativo 04 – Consultar página institucional:** O visitante obteve o conteúdo institucional sem login.
- **Fluxo Exceção 05 – Imagem sem texto alternativo:** Nenhuma notícia foi publicada.
- **Fluxo Exceção 06 – Dados inválidos:** Nenhuma notícia foi publicada.

---

# CSU04 — Manter Usuários

| Código | CSU04 |
|---|---|
| Nome | Manter Usuários |
| Sumário | Este caso de uso descreve os passos percorridos pelo funcionário para consultar, cadastrar, alterar, inativar e reativar usuários dos perfis funcionário, voluntário e doador associado. O sistema não permite exclusão física de nenhum usuário: a inativação só remove o acesso, não apaga dados e pode ser desfeita. |
| Ator Principal | Funcionário |
| Ator Secundário | — |
| Pré-condições | Funcionário deve estar autenticado no Painel Administrativo pela conta institucional, com nível de permissão para gestão de usuários. |

## Fluxo Principal

| Ator (funcionário) | Sistema |
|---|---|
| 1. Informa o nome, o CPF ou o e-mail do usuário que deseja consultar. | |
| | 2. Exibe os usuários correspondentes, incluindo os inativos, com seus perfis e status. |
| 3. Indica o usuário desejado. | |
| | 4. Exibe todos os dados cadastrais coletados, o histórico e as submissões vinculadas ao usuário. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Cadastrar usuário

| Ator (funcionário) | Sistema |
|---|---|
| 1. Informa o cadastro de um novo usuário do perfil funcionário ou voluntário, com nome, CPF, data de nascimento, e-mail e telefone. | |
| | 2. Verifica se o CPF já existe; existindo, executa o fluxo alternativo 02. |
| | 3. Grava o usuário como ativo, sem passar por triagem, porque o cadastro já é ação explícita de um funcionário, e registra a conta e a data. Sendo voluntário menor de idade, o cadastro fica com a autorização do responsável legal pendente até ser marcada como recebida (CSU05). O caso de uso se encerra. |

## Fluxo Alternativo 02 – CPF já cadastrado

| Ator (funcionário) | Sistema |
|---|---|
| | 1. Identifica que o CPF informado já pertence a um usuário e exibe o registro existente, sem criar outro. |
| 2. Se for o caso, opta por adicionar o novo perfil ao cadastro existente. | |
| | 3. Adiciona o perfil ao cadastro e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 03 – Alterar dados

| Ator (funcionário) | Sistema |
|---|---|
| 1. Executa o fluxo principal até o passo 4 e informa a alteração de dados. | |
| | 2. Solicita as alterações. |
| 3. Modifica os dados desejados e confirma. | |
| | 4. Grava as alterações preservando o histórico e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Inativar usuário

| Ator (funcionário) | Sistema |
|---|---|
| 1. Executa o fluxo principal até o passo 4 e informa a inativação do usuário. | |
| | 2. Solicita confirmação, explicando que a inativação remove o acesso, não apaga dados e pode ser desfeita; se o usuário tiver submissão em triagem, avisa sobre a pendência. |
| 3. Confirma a inativação. | |
| | 4. Altera o status para inativo, mantém o registro, os dados e o histórico consultáveis e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 05 – Reativar usuário

| Ator (funcionário) | Sistema |
|---|---|
| 1. Executa o fluxo principal até o passo 4 e informa a reativação de um usuário inativo. | |
| | 2. Altera o status para ativo e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Exceção 06 – Dados inválidos

| Ator (funcionário) | Sistema |
|---|---|
| 1. No fluxo alternativo 01 ou 03, deixa campo obrigatório em branco ou informa CPF, e-mail ou telefone inválido. | |
| | 2. Não grava, indica cada campo a corrigir e retorna ao passo em que os dados foram informados. |

## Fluxo Exceção 07 – Tentativa de exclusão definitiva

| Ator (funcionário) | Sistema |
|---|---|
| 1. Procura uma forma de excluir definitivamente um usuário. | |
| | 2. Não oferece exclusão e indica a inativação; informa que dados pessoais só deixam de ser legíveis por anonimização (CSU11). O caso de uso se encerra. |

## Fluxo Exceção 08 – Tentativa de acesso sem permissão

| Ator (usuário autenticado) | Sistema |
|---|---|
| 1. Solicita uma ação ou dado de gestão de usuários fora do seu nível de permissão. | |
| | 2. Nega o acesso sem expor detalhes internos do motivo e registra a tentativa no histórico de auditoria. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** Os dados do usuário foram exibidos a um perfil autorizado.
- **Fluxo Alternativo 01 – Cadastrar usuário:** Um novo usuário ativo foi gravado no sistema.
- **Fluxo Alternativo 02 – CPF já cadastrado:** Não há registro duplicado; a pessoa pode acumular mais de um perfil no mesmo cadastro.
- **Fluxo Alternativo 03 – Alterar dados:** Os dados foram modificados e o histórico da alteração foi preservado.
- **Fluxo Alternativo 04 – Inativar usuário:** O usuário está inativo, sem acesso, com registro, dados e histórico preservados.
- **Fluxo Alternativo 05 – Reativar usuário:** O usuário voltou a estar ativo.
- **Fluxo Exceção 06 – Dados inválidos:** Nenhum dado foi gravado.
- **Fluxo Exceção 07 – Tentativa de exclusão definitiva:** Nenhum registro foi excluído.
- **Fluxo Exceção 08 – Tentativa de acesso sem permissão:** O acesso foi negado e a tentativa consta na auditoria.

---

# CSU05 — Cadastrar Voluntário

| Código | CSU05 |
|---|---|
| Nome | Cadastrar Voluntário |
| Sumário | Este caso de uso descreve os passos percorridos pelo visitante para se cadastrar como voluntário e pela equipe para triar esse cadastro, com etapa de entrevista. Não existe autoaprovação: todo cadastro passa por triagem humana. Os dados coletados são os do termo de adesão da Lei nº 9.608/1998. A autorização do responsável legal de menor de idade é entregue em papel na sede da instituição. |
| Ator Principal | Visitante (candidato a voluntário) |
| Ator Secundário | Funcionário |
| Pré-condições | Visitante deve estar na página pública de voluntariado. O aviso de privacidade deve estar publicado. |

## Fluxo Principal

| Ator (visitante) | Sistema |
|---|---|
| 1. Acessa a página de voluntariado e preenche nome, data de nascimento, escolaridade, profissão, RG, CPF, endereço, bairro, CEP, cidade, UF, telefone, e-mail e o tipo de serviço que vai prestar, com seus objetivos e condições. | |
| | 2. Verifica a data de nascimento; sendo menor de idade, executa o fluxo alternativo 01. |
| 3. Aceita o aviso de privacidade e confirma o envio. | |
| | 4. Registra o cadastro com status pendente, grava o consentimento com data/hora, finalidade e versão do aviso, gera o código de protocolo e sinaliza o cadastro no Painel Administrativo. |
| | 5. Exibe o protocolo, orientando o visitante a anotá-lo, e envia e-mail de confirmação informando que a análise pode levar alguns dias. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Voluntário menor de idade

| Ator (visitante) | Sistema |
|---|---|
| | 1. Identifica que o cadastrando é menor de idade, informa que a autorização do responsável legal deve ser entregue assinada na sede da instituição e oferece a página de autorização pronta para impressão, preenchida com os dados informados. |
| 2. Imprime a autorização ou a salva em PDF pelo navegador. | |
| | 3. Retorna ao passo 3 do fluxo principal; o cadastro será registrado com a autorização marcada como pendente. |

## Fluxo Alternativo 02 – Chamar para entrevista

| Ator (funcionário) | Sistema |
|---|---|
| 1. Acessa a fila de triagem, avalia um cadastro pendente e chama a pessoa para entrevista. | |
| | 2. Altera o status para chamado para entrevista, registra a conta e a data e envia e-mail ao voluntário avisando que a instituição entrará em contato. O caso de uso se encerra. |

## Fluxo Alternativo 03 – Aprovar após entrevista

| Ator (funcionário) | Sistema |
|---|---|
| 1. Depois da entrevista, aprova o cadastro. | |
| | 2. Sendo menor de idade, verifica se a autorização do responsável foi marcada como recebida; estando pendente, executa o fluxo de exceção 07. |
| | 3. Efetiva a pessoa como voluntária ativa, registra a conta e a data e envia e-mail com o resultado. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Registrar recebimento da autorização

| Ator (funcionário) | Sistema |
|---|---|
| 1. Recebe na sede a autorização assinada pelo responsável legal e a marca como recebida no cadastro. | |
| | 2. Registra o recebimento com a data e a conta, sem guardar cópia do documento, e libera a aprovação. O caso de uso se encerra. |

## Fluxo Alternativo 05 – Rejeitar cadastro

| Ator (funcionário) | Sistema |
|---|---|
| 1. Rejeita um cadastro pendente ou chamado para entrevista, informando o motivo, se quiser. | |
| | 2. Altera o status para rejeitado, preserva o registro e, quando informado, o motivo, registra a conta e a data, envia e-mail com o resultado e inicia a contagem do prazo de retenção de 6 meses (CSU11). O caso de uso se encerra. |

## Fluxo Exceção 06 – Dados inválidos

| Ator (visitante) | Sistema |
|---|---|
| 1. Deixa campo obrigatório em branco ou informa CPF, CEP, telefone, e-mail ou data de nascimento inválido. | |
| | 2. Impede o envio, indica cada campo a corrigir e retorna ao passo 1 do fluxo principal. |

## Fluxo Exceção 07 – Aprovação de menor sem autorização recebida

| Ator (funcionário) | Sistema |
|---|---|
| 1. Tenta aprovar o cadastro de um menor de idade cuja autorização ainda está pendente. | |
| | 2. Impede a aprovação e informa que a autorização do responsável legal ainda não foi recebida. O caso de uso se encerra. |

## Fluxo Exceção 08 – Envio sem aceite do aviso de privacidade

| Ator (visitante) | Sistema |
|---|---|
| 1. Tenta enviar o cadastro sem aceitar o aviso de privacidade. | |
| | 2. Impede o envio, explica que o aceite é obrigatório e retorna ao passo 3 do fluxo principal. |

## Fluxo Exceção 09 – Falha no envio de e-mail

| Ator (visitante) | Sistema |
|---|---|
| | 1. Não consegue enviar o e-mail de confirmação ou de resultado. |
| | 2. Mantém o cadastro e a decisão registrados, tenta reenviar automaticamente uma vez após um intervalo e, persistindo a falha, registra-a para reenvio ou contato manual pela equipe. O registro nunca é revertido. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** O cadastro está registrado como pendente, com consentimento e protocolo, aguardando triagem.
- **Fluxo Alternativo 01 – Voluntário menor de idade:** O cadastro do menor fica com a autorização pendente; nenhum documento do menor é armazenado no sistema.
- **Fluxo Alternativo 02 – Chamar para entrevista:** O cadastro consta como chamado para entrevista.
- **Fluxo Alternativo 03 – Aprovar após entrevista:** A pessoa está cadastrada como voluntária ativa e a aprovação consta na auditoria.
- **Fluxo Alternativo 04 – Registrar recebimento da autorização:** A autorização consta como recebida e o cadastro do menor pode ser aprovado.
- **Fluxo Alternativo 05 – Rejeitar cadastro:** O cadastro consta como rejeitado e será anonimizado ao fim do prazo de retenção.
- **Fluxo Exceção 06 – Dados inválidos:** Nenhum cadastro foi registrado.
- **Fluxo Exceção 07 – Aprovação de menor sem autorização recebida:** O cadastro permaneceu sem aprovação.
- **Fluxo Exceção 08 – Envio sem aceite do aviso de privacidade:** Nenhum cadastro foi registrado.
- **Fluxo Exceção 09 – Falha no envio de e-mail:** O cadastro permanece registrado e a falha de envio está sinalizada à equipe.

---

# CSU06 — Cadastrar Candidato a Vaga

| Código | CSU06 |
|---|---|
| Nome | Cadastrar Candidato a Vaga |
| Sumário | Este caso de uso descreve os passos percorridos pelo visitante para se candidatar a uma vaga de emprego e pela equipe para avaliar a candidatura, com etapa de entrevista. Só a aprovação final efetiva o candidato como funcionário nos registros administrativos. |
| Ator Principal | Visitante (candidato) |
| Ator Secundário | Funcionário |
| Pré-condições | Visitante deve estar na página pública de vagas. O aviso de privacidade deve estar publicado. |

## Fluxo Principal

| Ator (visitante) | Sistema |
|---|---|
| 1. Acessa a página de vagas e seleciona um dos cargos: limpeza, cuidador, enfermagem ou cozinha. | |
| | 2. Solicita nome, CPF, data de nascimento, telefone, e-mail e o currículo, em arquivo ou em descrição textual da experiência. |
| 3. Preenche os dados, fornece o currículo, aceita o aviso de privacidade e confirma o envio. | |
| | 4. Registra a candidatura com status em análise, grava o consentimento, gera o código de protocolo e sinaliza a candidatura no Painel Administrativo. |
| | 5. Exibe o protocolo, orientando o candidato a anotá-lo, e envia e-mail de confirmação. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Chamar para entrevista

| Ator (funcionário) | Sistema |
|---|---|
| 1. Acessa a fila de triagem, avalia uma candidatura em análise e chama o candidato para entrevista. | |
| | 2. Altera o status para chamado para entrevista, sem criar cadastro de funcionário, registra a conta e a data e envia e-mail ao candidato avisando que a instituição entrará em contato. O caso de uso se encerra. |

## Fluxo Alternativo 02 – Aprovar após entrevista

| Ator (funcionário) | Sistema |
|---|---|
| 1. Depois da entrevista, aprova a candidatura. | |
| | 2. Verifica se o CPF do candidato já pertence a um voluntário cadastrado; pertencendo, executa o fluxo alternativo 03. |
| | 3. Altera o status para aprovada, efetiva o cadastro do candidato como funcionário nos registros administrativos, sem gerar credencial de acesso individual, registra a conta e a data e envia e-mail com o resultado. O caso de uso se encerra. |

## Fluxo Alternativo 03 – Candidato já cadastrado como voluntário

| Ator (funcionário) | Sistema |
|---|---|
| | 1. Identifica que o CPF do candidato já pertence a um voluntário cadastrado. |
| | 2. Adiciona o perfil de funcionário ao cadastro existente, sem criar um segundo registro, registra a conta e a data e envia e-mail com o resultado. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Rejeitar candidatura

| Ator (funcionário) | Sistema |
|---|---|
| 1. Rejeita uma candidatura em análise ou com candidato chamado para entrevista, informando o motivo, se quiser. | |
| | 2. Altera o status para rejeitada, sem criar cadastro de funcionário, preserva o registro e, quando informado, o motivo, registra a conta e a data, envia e-mail com o resultado e inicia a contagem do prazo de retenção de 6 meses (CSU11). O caso de uso se encerra. |

## Fluxo Exceção 05 – Dados inválidos

| Ator (visitante) | Sistema |
|---|---|
| 1. Deixa campo obrigatório em branco, não seleciona o cargo ou informa CPF, data de nascimento, telefone ou e-mail inválido. | |
| | 2. Impede o envio, indica cada campo a corrigir e retorna ao passo 3 do fluxo principal. |

## Fluxo Exceção 06 – Candidatura sem currículo

| Ator (visitante) | Sistema |
|---|---|
| 1. Tenta enviar a candidatura sem anexar arquivo e sem descrever a experiência. | |
| | 2. Impede o envio, explica que é preciso fornecer o currículo em uma das duas formas e retorna ao passo 3 do fluxo principal. |

## Fluxo Exceção 07 – Envio sem aceite do aviso de privacidade

| Ator (visitante) | Sistema |
|---|---|
| 1. Tenta enviar a candidatura sem aceitar o aviso de privacidade. | |
| | 2. Impede o envio, explica que o aceite é obrigatório e retorna ao passo 3 do fluxo principal. |

## Fluxo Exceção 08 – Falha no envio de e-mail

| Ator (visitante) | Sistema |
|---|---|
| | 1. Não consegue enviar o e-mail de confirmação ou de resultado. |
| | 2. Mantém a candidatura e a decisão registradas, tenta reenviar automaticamente uma vez após um intervalo e, persistindo a falha, registra-a para reenvio ou contato manual pela equipe. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** A candidatura está registrada como em análise, com consentimento e protocolo, aguardando triagem.
- **Fluxo Alternativo 01 – Chamar para entrevista:** A candidatura consta como chamado para entrevista; nenhum funcionário foi criado.
- **Fluxo Alternativo 02 – Aprovar após entrevista:** O candidato está efetivado como funcionário, sem credencial individual, e a aprovação consta na auditoria.
- **Fluxo Alternativo 03 – Candidato já cadastrado como voluntário:** A pessoa acumula os perfis de voluntário e funcionário no mesmo cadastro, sem duplicação.
- **Fluxo Alternativo 04 – Rejeitar candidatura:** A candidatura consta como rejeitada e será anonimizada, com o currículo, ao fim do prazo de retenção.
- **Fluxo Exceção 05 – Dados inválidos:** Nenhuma candidatura foi registrada.
- **Fluxo Exceção 06 – Candidatura sem currículo:** Nenhuma candidatura foi registrada.
- **Fluxo Exceção 07 – Envio sem aceite do aviso de privacidade:** Nenhuma candidatura foi registrada.
- **Fluxo Exceção 08 – Falha no envio de e-mail:** A candidatura permanece registrada e a falha de envio está sinalizada à equipe.

---

# CSU07 — Manter Itens Necessários

| Código | CSU07 |
|---|---|
| Nome | Manter Itens Necessários |
| Sumário | Este caso de uso descreve os passos percorridos pelo funcionário para manter a lista de necessidades da instituição, exibida no Portal Público. Itens supridos saem da listagem pública sem perder o registro histórico, e itens sem atualização há 30 dias ou mais são sinalizados à equipe. |
| Ator Principal | Funcionário |
| Ator Secundário | Visitante |
| Pré-condições | Funcionário deve estar autenticado no Painel Administrativo pela conta institucional. |

## Fluxo Principal

| Ator (funcionário) | Sistema |
|---|---|
| 1. Informa o cadastro de um novo item necessário com nome, quantidade e prioridade. | |
| | 2. Grava o item como ativo, publica-o automaticamente na listagem pública e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Buscar e atualizar quantidade

| Ator (funcionário) | Sistema |
|---|---|
| 1. Busca um item necessário por nome. | |
| | 2. Exibe os itens correspondentes, com quantidade, prioridade e data da última atualização. |
| 3. Indica o item e informa a nova quantidade. | |
| | 4. Grava a nova quantidade, atualiza a data da última atualização e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 02 – Dar baixa em item suprido

| Ator (funcionário) | Sistema |
|---|---|
| 1. Informa a baixa de um item que foi suprido. | |
| | 2. Altera o status para suprido, remove o item da listagem pública sem excluir seu registro histórico e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 03 – Consultar necessidades no Portal Público

| Ator (visitante) | Sistema |
|---|---|
| 1. Acessa a página pública de necessidades. | |
| | 2. Exibe os itens vigentes, refletindo a última atualização da equipe e omitindo os já supridos. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Item sem atualização há 30 dias

| Ator (funcionário) | Sistema |
|---|---|
| | 1. Identifica itens que não recebem atualização de quantidade há 30 dias ou mais (prazo configurável pela equipe). |
| | 2. Sinaliza esses itens no Painel Administrativo para revisão. O caso de uso se encerra. |

## Fluxo Exceção 05 – Dados inválidos

| Ator (funcionário) | Sistema |
|---|---|
| 1. Deixa o nome em branco ou informa quantidade negativa ou não numérica. | |
| | 2. Não grava, indica o erro e retorna ao passo em que os dados foram informados. |

## Pós-condições

- **Fluxo principal:** O item necessário está cadastrado e visível no Portal Público.
- **Fluxo Alternativo 01 – Buscar e atualizar quantidade:** A quantidade e a data da última atualização foram gravadas.
- **Fluxo Alternativo 02 – Dar baixa em item suprido:** O item saiu da listagem pública e seu registro histórico permanece.
- **Fluxo Alternativo 03 – Consultar necessidades no Portal Público:** O visitante viu as necessidades vigentes sem login.
- **Fluxo Alternativo 04 – Item sem atualização há 30 dias:** Os itens sem atualização estão sinalizados à equipe.
- **Fluxo Exceção 05 – Dados inválidos:** Nenhuma alteração foi gravada.

---

# CSU08 — Solicitar Evento ou Campanha Externa

| Código | CSU08 |
|---|---|
| Nome | Solicitar Evento ou Campanha Externa |
| Sumário | Este caso de uso descreve os passos percorridos por pessoa ou organização externa para propor um evento ou campanha à instituição, e pela equipe para avaliar essa proposta. A aprovação não publica nada: a instituição entra em contato com o solicitante e só depois de combinar os detalhes confirma o evento, que então é publicado no Portal Público. |
| Ator Principal | Solicitante externo |
| Ator Secundário | Funcionário |
| Pré-condições | Solicitante deve estar na página pública de solicitação de evento/campanha. O aviso de privacidade deve estar publicado. |

## Fluxo Principal

| Ator (solicitante) | Sistema |
|---|---|
| 1. Preenche dados de contato, nome do evento, tipo, objetivo, data pretendida e recursos esperados, aceita o aviso de privacidade e confirma o envio. | |
| | 2. Registra a solicitação com status em análise, grava o consentimento, gera o código de protocolo e sinaliza a solicitação no Painel Administrativo. |
| | 3. Exibe o protocolo, orientando o solicitante a anotá-lo, e envia e-mail de confirmação. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Aprovar solicitação

| Ator (funcionário) | Sistema |
|---|---|
| 1. Acessa a fila de triagem, avalia uma solicitação em análise e a aprova. | |
| | 2. Se a data pretendida coincide com evento já confirmado, avisa sobre o conflito e permite prosseguir. |
| | 3. Altera o status para aprovada — aguardando contato, sem publicar nada, registra a conta e a data e envia e-mail ao solicitante informando que a instituição entrará em contato para combinar o evento. O caso de uso se encerra. |

## Fluxo Alternativo 02 – Confirmar evento após contato

| Ator (funcionário) | Sistema |
|---|---|
| 1. Depois de combinar os detalhes com o solicitante, fora do sistema, confirma o evento, ajustando os dados combinados. | |
| | 2. Se a data coincide com evento já confirmado, avisa sobre o conflito e permite prosseguir. |
| | 3. Gera o evento/campanha com os dados combinados, publica-o automaticamente no Portal Público (CSU02) e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 03 – Rejeitar solicitação

| Ator (funcionário) | Sistema |
|---|---|
| 1. Rejeita uma solicitação em análise ou aguardando contato, informando o motivo, se quiser. | |
| | 2. Altera o status para rejeitada, sem gerar evento, preserva o registro e, quando informado, o motivo, registra a conta e a data e envia e-mail com o resultado. O caso de uso se encerra. |

## Fluxo Exceção 04 – Dados inválidos

| Ator (solicitante) | Sistema |
|---|---|
| 1. Deixa campo obrigatório em branco ou informa telefone, e-mail ou data inválidos. | |
| | 2. Impede o envio, indica cada campo a corrigir e retorna ao passo 1 do fluxo principal. |

## Fluxo Exceção 05 – Envio sem aceite do aviso de privacidade

| Ator (solicitante) | Sistema |
|---|---|
| 1. Tenta enviar a solicitação sem aceitar o aviso de privacidade. | |
| | 2. Impede o envio, explica que o aceite é obrigatório e retorna ao passo 1 do fluxo principal. |

## Fluxo Exceção 06 – Falha no envio de e-mail

| Ator (solicitante) | Sistema |
|---|---|
| | 1. Não consegue enviar o e-mail de confirmação ou de resultado. |
| | 2. Mantém a solicitação e a decisão registradas, tenta reenviar automaticamente uma vez após um intervalo e, persistindo a falha, registra-a para reenvio ou contato manual pela equipe. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** A solicitação está registrada como em análise, com consentimento e protocolo, aguardando avaliação.
- **Fluxo Alternativo 01 – Aprovar solicitação:** A solicitação consta como aprovada — aguardando contato; nada foi publicado.
- **Fluxo Alternativo 02 – Confirmar evento após contato:** O evento/campanha foi gerado a partir da solicitação e está publicado no Portal Público.
- **Fluxo Alternativo 03 – Rejeitar solicitação:** A solicitação consta como rejeitada e o registro foi preservado.
- **Fluxo Exceção 04 – Dados inválidos:** Nenhuma solicitação foi registrada.
- **Fluxo Exceção 05 – Envio sem aceite do aviso de privacidade:** Nenhuma solicitação foi registrada.
- **Fluxo Exceção 06 – Falha no envio de e-mail:** A solicitação permanece registrada e a falha de envio está sinalizada à equipe.

---

# CSU09 — Autoatendimento do Doador Associado

| Código | CSU09 |
|---|---|
| Nome | Autoatendimento do Doador Associado |
| Sumário | Este caso de uso descreve os passos percorridos pelo doador associado para consultar, com login próprio, exclusivamente os seus próprios dados e o histórico das doações já confirmadas, e para doar sem informar os dados de novo. O voluntário não tem autoatendimento nesta versão. |
| Ator Principal | Doador associado |
| Ator Secundário | — |
| Pré-condições | O doador deve possuir cadastro de doador associado, criado na primeira doação associativa (CSU01), com a senha definida pelo link recebido por e-mail. |

## Fluxo Principal

| Ator (doador associado) | Sistema |
|---|---|
| 1. Acessa a área de autoatendimento e informa e-mail e senha. | |
| | 2. Autentica o doador. |
| | 3. Exibe exclusivamente os seus dados cadastrais e o histórico das doações já confirmadas pelo funcionário, com valor e data, e o aviso de que contribuições pagas na sede ou por depósito não aparecem ali. O caso de uso se encerra. |

## Fluxo Alternativo 01 – Doar sem informar os dados de novo

| Ator (doador associado) | Sistema |
|---|---|
| 1. Executa o fluxo principal até o passo 3 e escolhe fazer uma doação. | |
| | 2. Executa o fluxo alternativo 02 do CSU01, com a doação já vinculada ao cadastro. O caso de uso se encerra. |

## Fluxo Alternativo 02 – Definir a senha da conta nova

| Ator (doador associado) | Sistema |
|---|---|
| 1. Acessa o link recebido por e-mail após a primeira doação associativa e define a senha. | |
| | 2. Grava a senha, libera o acesso ao autoatendimento e retorna ao passo 1 do fluxo principal. |

## Fluxo Alternativo 03 – Redefinir senha esquecida

| Ator (doador associado) | Sistema |
|---|---|
| 1. Informa que esqueceu a senha e fornece o e-mail cadastrado. | |
| | 2. Envia um link de redefinição ao e-mail cadastrado, sem intervenção de funcionário, respondendo da mesma forma mesmo para e-mail não cadastrado. |
| 3. Acessa o link e define a nova senha. | |
| | 4. Consome o link, que é de uso único e expiração curta, grava a nova senha e retorna ao passo 1 do fluxo principal. |

## Fluxo Exceção 04 – Credenciais inválidas

| Ator (doador associado) | Sistema |
|---|---|
| 1. Informa e-mail ou senha incorretos, ou tenta entrar antes de definir a senha pelo link recebido. | |
| | 2. Nega o acesso, sem informar qual dos dados está errado, e retorna ao passo 1 do fluxo principal. |

## Fluxo Exceção 05 – Tentativa de acessar dados de terceiro

| Ator (doador associado) | Sistema |
|---|---|
| 1. Autenticado, tenta visualizar dados cadastrais ou histórico de outro usuário. | |
| | 2. Nega o acesso sem expor detalhes internos do motivo e registra a tentativa no histórico de auditoria. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** O doador consultou exclusivamente os próprios dados e doações confirmadas.
- **Fluxo Alternativo 01 – Doar sem informar os dados de novo:** A nova declaração pendente está vinculada ao cadastro do doador.
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
| 1. Informa um código que não corresponde a nenhum registro ou que está mal formado. | |
| | 2. Informa que nenhum registro foi encontrado, respondendo de forma idêntica nos dois casos. O caso de uso se encerra. |

## Fluxo Exceção 02 – Tentativas sucessivas de adivinhação

| Ator (visitante) | Sistema |
|---|---|
| 1. Faz consultas repetidas com códigos diferentes. | |
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
| Sumário | Este caso de uso descreve como o titular de dados pessoais exerce os direitos previstos na LGPD — acesso, correção, anonimização e revogação do consentimento — e como o sistema registra o consentimento na coleta. Os pedidos do titular são feitos fora do sistema, pelo contato da instituição informado no aviso de privacidade; o funcionário confere a identidade de quem pede e executa no Painel Administrativo o que depende do sistema. |
| Ator Principal | Titular dos dados |
| Ator Secundário | Funcionário |
| Pré-condições | O aviso de privacidade deve estar publicado, com identificação de versão e o contato para exercício de direitos. |

## Fluxo Principal

| Ator (titular / funcionário) | Sistema |
|---|---|
| 1. Pede a anonimização dos seus dados pelo contato da instituição informado no aviso de privacidade (fora do sistema). | |
| 2. (Funcionário) Confere a identidade do titular, fora do sistema, e localiza o cadastro no Painel Administrativo. | |
| | 3. Exibe os registros vinculados ao titular e sinaliza os dados sujeitos a retenção por obrigação legal, como doações confirmadas. |
| 4. (Funcionário) Executa a anonimização. | |
| | 5. Torna ilegíveis os dados pessoais identificáveis, remove os arquivos restritos vinculados, preserva o registro, o histórico e a auditoria sem exclusão física, e registra a conta e a data. |
| 6. (Funcionário) Informa o titular, pelo mesmo contato, que o pedido foi atendido. O caso de uso se encerra. | |

## Fluxo Alternativo 01 – Consentimento na coleta de dados

| Ator (visitante) | Sistema |
|---|---|
| 1. Preenche um formulário público que coleta dados pessoais (voluntário, candidatura, doação associativa ou solicitação externa). | |
| | 2. Exibe, antes do envio, o resumo do tratamento dos dados, o link para o aviso de privacidade e a opção de aceite. |
| 3. Aceita o aviso de privacidade e envia. | |
| | 4. Registra o consentimento junto à submissão, com data/hora, finalidade do tratamento e versão do texto aceito. O caso de uso se encerra. |

## Fluxo Alternativo 02 – Consultar o aviso de privacidade

| Ator (visitante) | Sistema |
|---|---|
| 1. Acessa o aviso de privacidade pelo Portal Público. | |
| | 2. Exibe, sem exigir login, quais dados são coletados, com que finalidade, por quanto tempo são retidos e o contato para o exercício de direitos. O caso de uso se encerra. |

## Fluxo Alternativo 03 – Correção de dados

| Ator (titular / funcionário) | Sistema |
|---|---|
| 1. Pede a correção de um dado pelo contato da instituição. | |
| 2. (Funcionário) Confere a identidade, localiza o cadastro e corrige o dado no Painel. | |
| | 3. Grava a correção preservando o histórico da alteração e registra a conta e a data. O caso de uso se encerra. |

## Fluxo Alternativo 04 – Acesso aos dados

| Ator (titular / funcionário) | Sistema |
|---|---|
| 1. Pede acesso aos seus dados pelo contato da instituição. | |
| 2. (Funcionário) Confere a identidade e consulta o cadastro no Painel. | |
| | 3. Exibe todos os dados do titular, que o funcionário repassa pelo mesmo contato. O doador associado também pode consultar os próprios dados no autoatendimento (CSU09). O caso de uso se encerra. |

## Fluxo Alternativo 05 – Revogação de consentimento

| Ator (titular / funcionário) | Sistema |
|---|---|
| 1. Pede a revogação do consentimento pelo contato da instituição. | |
| 2. (Funcionário) Confere a identidade e registra a revogação no Painel. | |
| | 3. Altera o status do consentimento para revogado, com data e conta, e interrompe o uso dos dados para as finalidades revogadas, sem exclusão física do registro. O caso de uso se encerra. |

## Fluxo Alternativo 06 – Fim do prazo de retenção

| Ator (funcionário) | Sistema |
|---|---|
| | 1. Identifica candidaturas e cadastros de voluntário não aprovados cuja triagem foi concluída há 6 meses ou mais (prazo configurável). |
| | 2. Sinaliza esses registros à equipe para anonimização, preservando dados estatísticos não identificáveis. |
| 3. Executa a anonimização dos registros sinalizados. | |
| | 4. Procede conforme o passo 5 do fluxo principal. O caso de uso se encerra. |

## Fluxo Exceção 07 – Envio sem aceite do aviso de privacidade

| Ator (visitante) | Sistema |
|---|---|
| 1. No fluxo alternativo 01, tenta enviar o formulário sem aceitar o aviso de privacidade. | |
| | 2. Impede o envio, explica que o aceite é obrigatório e retorna ao passo 3 do fluxo alternativo 01. |

## Fluxo Exceção 08 – Dados sujeitos a obrigação legal

| Ator (funcionário) | Sistema |
|---|---|
| 1. Executa o fluxo principal até o passo 3 e constata que parte dos dados é necessária ao cumprimento de obrigação legal, como doações confirmadas sujeitas a prestação de contas. | |
| | 2. Permite reter exclusivamente esses dados e anonimizar os demais, exigindo o registro da justificativa da retenção. |
| 3. Registra a justificativa e executa a anonimização dos demais dados. | |
| | 4. Armazena a justificativa, procede conforme o passo 5 do fluxo principal e retorna ao passo 6, em que o funcionário informa ao titular o que foi retido e por quê. |

## Fluxo Exceção 09 – Identidade do titular não comprovada

| Ator (funcionário) | Sistema |
|---|---|
| 1. Não consegue confirmar que quem pede é o titular dos dados. | |
| | 2. Nenhuma ação é executada no sistema; o funcionário comunica a recusa pelo mesmo contato. O caso de uso se encerra. |

## Pós-condições

- **Fluxo principal:** Os dados pessoais identificáveis do titular deixaram de ser legíveis, enquanto o registro, o histórico e a trilha de auditoria permanecem íntegros.
- **Fluxo Alternativo 01 – Consentimento na coleta de dados:** A submissão possui consentimento associado, com data/hora, finalidade e versão do aviso aceito.
- **Fluxo Alternativo 02 – Consultar o aviso de privacidade:** O visitante conheceu o tratamento dos dados e o contato para exercer seus direitos.
- **Fluxo Alternativo 03 – Correção de dados:** O dado foi corrigido e o histórico da alteração foi preservado.
- **Fluxo Alternativo 04 – Acesso aos dados:** O titular recebeu os seus dados.
- **Fluxo Alternativo 05 – Revogação de consentimento:** O consentimento consta como revogado e o uso dos dados para as finalidades revogadas está interrompido.
- **Fluxo Alternativo 06 – Fim do prazo de retenção:** Os registros vencidos foram anonimizados, preservando dados estatísticos não identificáveis.
- **Fluxo Exceção 07 – Envio sem aceite do aviso de privacidade:** Nenhuma submissão foi registrada.
- **Fluxo Exceção 08 – Dados sujeitos a obrigação legal:** Os dados retidos possuem justificativa registrada, comunicada ao titular.
- **Fluxo Exceção 09 – Identidade do titular não comprovada:** Nenhum dado foi alterado.
