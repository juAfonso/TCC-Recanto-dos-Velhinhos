# Casos de Uso para o Documento do TCC

> Conteúdo pronto para ser incorporado ao **PRD** e à **seção 19** do documento do TCC.
> Formato conforme o padrão já adotado pelo grupo: Código/Nome, Sumário, Ator Principal/Secundário,
> Pré-condições, Fluxo (colunas Ator/Sistema), Pós-condições.
>
> **Última atualização:** 2026-09-05
> **Origem:** `specs/001-portal-painel-ilpi/spec.md` (FR-001 a FR-059).
> Em caso de divergência entre este arquivo e o `spec.md`, **o `spec.md` prevalece** — ele é a fonte
> normativa; este documento é a redação para o texto do TCC.

Dois casos de uso constam aqui:

- **CSU01 — Realizar Doação Financeira via Pix**: *substitui* a versão anterior, que descrevia
  integração com API de pagamentos. Reescrito após a decisão de 2026-09-04 (Pix estático), ratificada
  em 2026-09-05 pela emenda ao Princípio VII da constituição do projeto.
- **CSU11 — Exercício de Direitos do Titular de Dados (LGPD)**: **novo**, adicionado em 2026-09-04.

---

# CSU01 — Realizar Doação Financeira via Pix

## Sumário

Permite que um visitante do Portal Público faça uma doação financeira à instituição por meio de Pix
e registre essa doação no sistema para acompanhamento. A instituição divulga sua chave Pix e o QR
code correspondente; o pagamento é efetuado pelo doador no aplicativo do seu próprio banco, fora do
sistema. Após pagar, o doador declara a doação no site e recebe um código de protocolo. A declaração
é registrada com status *pendente* e só se torna *confirmada* após um funcionário conferir a entrada
no extrato bancário da instituição. A declaração do doador, isoladamente, nunca equivale à
confirmação de recebimento.

O sistema não integra nenhuma API de pagamentos, não gera cobrança dinâmica e não tem acesso à conta
bancária da instituição. Doações de itens físicos e de dinheiro em espécie permanecem fora do
sistema, registradas fisicamente pela administração.

## Atores

| Papel | Ator |
|---|---|
| Ator Principal | Visitante do Portal Público (doador), identificado ou não |
| Atores Secundários | Funcionário da administração (conferência e confirmação da doação); Doador associado (quando a doação é vinculada a um cadastro) |

## Pré-condições

1. O Portal Público está acessível, sem exigência de autenticação.
2. Existe uma chave Pix institucional cadastrada e ativa no Painel Administrativo, com a respectiva
   imagem de QR code (FR-007).
3. Para doação associativa, o doador aceita o aviso de privacidade no ato do envio (FR-051).

## Fluxo Principal — Declaração de doação espontânea

| # | Ator | Sistema |
|---|---|---|
| 1 | Acessa a página de doações do Portal Público. | Exibe a chave Pix institucional com opção de copiar, a imagem do QR code e o aviso de que o pagamento é feito no aplicativo do próprio banco (FR-007, FR-010a). |
| 2 | Efetua o pagamento no aplicativo do seu banco, fora do sistema. | — (o sistema não participa desta etapa e não toma conhecimento do pagamento) |
| 3 | Escolhe declarar a doação e seleciona a modalidade espontânea. | Apresenta o formulário de declaração solicitando valor e data do pagamento, e informa explicitamente que a declaração não confirma o recebimento e que a conferência é manual (FR-010a). |
| 4 | Informa valor e data e confirma o envio. | Valida os dados informados. |
| 5 | — | Registra a declaração com status *pendente*, gera código de protocolo único e não sequencial, e o exibe ao doador (FR-005, FR-045). |
| 6 | Anota o código de protocolo. | Disponibiliza a declaração na fila de conferência do Painel Administrativo (FR-036). |
| 7 | *(Funcionário)* Acessa a fila de conferência e localiza a entrada correspondente no extrato bancário da instituição. | Exibe os dados da declaração e sinaliza outras declarações pendentes com valor e data próximos, para avaliação de possível duplicidade (FR-050). |
| 8 | *(Funcionário)* Confirma a doação. | Altera o status para *confirmada*, emite a declaração de doação, e registra autor e data da ação no histórico de auditoria (FR-008, FR-010, FR-035). |
| 9 | Consulta o protocolo na página de acompanhamento. | Exibe o status atualizado e disponibiliza a declaração de doação, sem exigir qualquer dado de identificação (FR-044, FR-010). |

## Fluxo Alternativo A — Declaração de doação associativa

Substitui os passos 3 a 5 do fluxo principal.

| # | Ator | Sistema |
|---|---|---|
| 3a | Seleciona a modalidade associativa. | Apresenta o formulário solicitando, além de valor e data, os dados de identificação do doador, e exige o aceite explícito do aviso de privacidade (FR-006, FR-051). |
| 4a | Preenche os dados, aceita o aviso de privacidade e confirma o envio. | Valida os dados e o aceite. Não havendo aceite, impede o envio e explica que ele é obrigatório. |
| 5a | — | Registra a declaração com status *pendente*, vincula-a ao cadastro do doador, registra o consentimento com data/hora, finalidade e versão do aviso aceito, e gera o código de protocolo (FR-006, FR-052, FR-045). |

A partir daí o fluxo segue no passo 6 do fluxo principal. O doador associado passa a visualizar a
doação no histórico da sua área de autoatendimento (FR-041).

## Fluxo Alternativo B — Anexo do comprovante bancário

Pode ocorrer no passo 4 de qualquer das modalidades.

| # | Ator | Sistema |
|---|---|---|
| 4b | Opta por anexar o comprovante emitido pelo banco. | Adverte que o comprovante contém dados pessoais do pagador e que, por isso, a doação deixa de ser anônima; passa a exigir o aceite do aviso de privacidade mesmo na modalidade espontânea (FR-010b, FR-051). |
| 4c | Aceita o aviso e anexa o arquivo. | Armazena o anexo com acesso restrito a perfis autorizados, sem jamais expô-lo no Portal Público (FR-010b). |

## Fluxo de Exceção C — Nenhuma chave Pix cadastrada

| # | Ator | Sistema |
|---|---|---|
| 1c | Acessa a página de doações. | Verifica que não há chave Pix ativa cadastrada. |
| 2c | — | Informa que a doação digital está temporariamente indisponível, exibe o canal de contato da instituição e **não** apresenta o formulário de declaração (FR-007a). |

## Fluxo de Exceção D — Doação não localizada no extrato

Substitui o passo 8 do fluxo principal.

| # | Ator | Sistema |
|---|---|---|
| 8d | *(Funcionário)* Não localiza a entrada correspondente no extrato bancário e registra o motivo. | Exige o preenchimento do motivo; sem ele, não permite concluir a ação. |
| 9d | *(Funcionário)* Confirma a marcação. | Altera o status para *não localizada*, preserva integralmente o registro sem exclusão física, e registra autor, data e motivo na auditoria (FR-008, FR-024, FR-035). |

## Fluxo de Exceção E — Tentativa de confirmação em duplicidade

| # | Ator | Sistema |
|---|---|---|
| 1e | *(Funcionário)* Tenta confirmar uma doação já confirmada anteriormente. | Identifica que o status já é *confirmada*, recusa a operação, não altera o registro e não emite nova declaração de doação (FR-050). |

## Pós-condições

1. A declaração de doação está registrada no sistema com status *pendente*, *confirmada* ou *não
   localizada*, jamais excluída fisicamente (FR-024).
2. O doador possui um código de protocolo que permite consultar o status a qualquer momento, sem
   login e sem fornecer dados pessoais (FR-044, FR-045).
3. Doações confirmadas possuem declaração de doação disponível ao doador (FR-010).
4. Toda ação de conferência está registrada no histórico de auditoria com a conta institucional
   responsável e a data (FR-035).
5. Doações associativas estão vinculadas ao cadastro do doador e visíveis no seu autoatendimento
   (FR-041), com o respectivo registro de consentimento (FR-052).

## Observações de escopo

- O sistema **não** processa pagamentos, não custodia valores e não armazena dados de cartão ou
  credenciais bancárias (Princípio VII da constituição do projeto).
- Uma doação efetivamente recebida cuja declaração o doador não registre no site **não aparece no
  sistema**. A conciliação contábil completa continua sendo feita pela administração a partir do
  extrato bancário. Esta é uma limitação conhecida e aceita conscientemente.
- Boleto, cartão de crédito e demais meios de pagamento estão fora do escopo.

---

# CSU11 — Exercício de Direitos do Titular de Dados (LGPD)

## Sumário

Permite que uma pessoa cujos dados pessoais estejam registrados no sistema — voluntário, candidato a
vaga, doador associado ou solicitante externo — conheça o tratamento dado aos seus dados e exerça os
direitos previstos na Lei nº 13.709/2018 (LGPD): acesso, correção, anonimização e revogação de
consentimento. O aviso de privacidade fica disponível publicamente, sem exigência de login, e a
solicitação é acompanhada por código de protocolo. A equipe administrativa recebe, avalia e atende
as solicitações pelo Painel Administrativo.

O atendimento a um pedido de anonimização torna os dados pessoais identificáveis ilegíveis, mas
preserva o registro, seu histórico e a trilha de auditoria — conciliando o direito do titular com a
obrigação de prestação de contas da instituição.

## Atores

| Papel | Ator |
|---|---|
| Ator Principal | Titular dos dados pessoais (voluntário, candidato a vaga, doador associado ou solicitante externo) |
| Atores Secundários | Funcionário da administração (avaliação e atendimento da solicitação); Encarregado pelo tratamento de dados (DPO) designado pela instituição, atuando fora do sistema |

## Pré-condições

1. O Portal Público está acessível, sem exigência de autenticação.
2. A instituição forneceu o texto do aviso de privacidade, e ele está publicado com identificação de
   versão (FR-053).
3. Existem dados pessoais do titular registrados no sistema, coletados mediante consentimento
   registrado (FR-051, FR-052).

## Fluxo Principal — Solicitação de anonimização

| # | Ator | Sistema |
|---|---|---|
| 1 | Acessa o Portal Público e consulta o aviso de privacidade. | Exibe, sem exigir login, quais dados são coletados, com que finalidade, por quanto tempo são retidos e por qual canal o titular exerce seus direitos (FR-053). |
| 2 | Acessa o canal de exercício de direitos. | Apresenta o formulário de solicitação com os tipos disponíveis: acesso, correção, anonimização e revogação de consentimento (FR-054). |
| 3 | Seleciona o tipo *anonimização*, informa seus dados de contato e descreve o pedido. | Valida os dados informados. |
| 4 | Confirma o envio. | Registra a solicitação com status *em análise*, gera código de protocolo único e não sequencial, e o exibe ao titular (FR-059, FR-045). |
| 5 | Anota o código de protocolo. | Disponibiliza a solicitação na fila de pendências do Painel Administrativo (FR-036, FR-059). |
| 6 | *(Funcionário)* Acessa a solicitação e verifica a identidade do titular e a existência dos dados. | Exibe os registros vinculados ao titular e sinaliza dados sujeitos a retenção legal, como doações confirmadas (FR-055). |
| 7 | *(Funcionário)* Executa a anonimização. | Torna ilegíveis os dados pessoais identificáveis, remove os arquivos de acesso restrito vinculados, e **preserva** o registro, o histórico e a trilha de auditoria, sem exclusão física (FR-055, FR-024, FR-035). |
| 8 | — | Altera o status da solicitação para *atendida* e registra autor e data da ação (FR-059, FR-035). |
| 9 | Consulta o protocolo na página de acompanhamento. | Exibe o status atualizado, sem exigir login nem expor dados de terceiros (FR-044). |

## Fluxo Alternativo A — Registro do consentimento na coleta

Ocorre em todo formulário público que colete dados pessoais e é pré-requisito deste caso de uso.

| # | Ator | Sistema |
|---|---|---|
| 1a | Preenche um formulário público (cadastro de voluntário, candidatura a vaga, doação associativa ou solicitação externa) e tenta enviar sem aceitar o aviso de privacidade. | Impede o envio e explica que o aceite é obrigatório (FR-051). |
| 2a | Aceita o aviso de privacidade e envia. | Registra o consentimento junto à submissão, com data/hora, finalidade do tratamento e versão do texto aceito (FR-052). |

## Fluxo Alternativo B — Acesso e correção pelo autoatendimento

| # | Ator | Sistema |
|---|---|---|
| 1b | Voluntário ativo ou doador associado acessa a área de autoatendimento com login próprio. | Autentica e apresenta exclusivamente os dados do próprio titular (FR-041, FR-042). |
| 2b | Consulta seus dados cadastrais e solicita correção. | Registra a solicitação de correção, sem exigir abertura de protocolo público (FR-054). |

## Fluxo Alternativo C — Revogação de consentimento

| # | Ator | Sistema |
|---|---|---|
| 1c | Titular solicita a revogação do consentimento previamente concedido. | Registra a revogação com data, altera o status do consentimento para *revogado* (FR-057, FR-052). |
| 2c | — | Interrompe o uso dos dados para as finalidades revogadas e sinaliza o cadastro à equipe administrativa para as providências cabíveis, **sem** exclusão física do registro (FR-057, FR-024). |

## Fluxo de Exceção D — Dados sujeitos a obrigação legal

Substitui o passo 7 do fluxo principal.

| # | Ator | Sistema |
|---|---|---|
| 7d | *(Funcionário)* Constata que parte dos dados é necessária ao cumprimento de obrigação legal ou regulatória, como doações confirmadas sujeitas a prestação de contas. | Permite reter exclusivamente os dados necessários à obrigação legal e anonimizar os demais (FR-055). |
| 8d | *(Funcionário)* Registra a justificativa da retenção. | Armazena a justificativa e possibilita informar ao titular o que foi retido e por quê (FR-055). |

## Fluxo de Exceção E — Solicitação recusada

| # | Ator | Sistema |
|---|---|---|
| 1e | *(Funcionário)* Conclui que a solicitação não pode ser atendida, por exemplo por não se comprovar a titularidade dos dados. | Exige o registro do motivo da recusa; sem ele, não permite concluir a ação. |
| 2e | *(Funcionário)* Confirma a recusa com o motivo. | Altera o status para *recusada*, preserva o motivo e registra autor e data na auditoria (FR-059, FR-035). |

## Fluxo de Exceção F — Fim do prazo de retenção

| # | Ator | Sistema |
|---|---|---|
| 1f | — | Identifica registros que atingiram o fim do prazo de retenção definido pela instituição para a sua categoria de dado, como candidaturas rejeitadas e currículos anexados. |
| 2f | — | Sinaliza esses registros à equipe administrativa para anonimização, preservando dados estatísticos não identificáveis (FR-056). |
| 3f | *(Funcionário)* Avalia e executa a anonimização dos registros sinalizados. | Procede conforme os passos 7 e 8 do fluxo principal. |

## Pós-condições

1. Toda submissão pública que coleta dados pessoais possui registro de consentimento associado, com
   data/hora, finalidade e versão do aviso aceito (FR-051, FR-052).
2. A solicitação do titular está registrada com status *em análise*, *atendida* ou *recusada*, e é
   consultável por protocolo sem login (FR-059, FR-044).
3. Em caso de anonimização atendida, os dados pessoais identificáveis do titular deixam de ser
   legíveis no sistema, enquanto o registro, o histórico e a trilha de auditoria permanecem íntegros
   (FR-055, FR-024, FR-035).
4. Consentimentos revogados constam como tais, e o uso dos dados para as finalidades revogadas está
   interrompido (FR-057).
5. Dados retidos por obrigação legal possuem justificativa registrada e comunicável ao titular
   (FR-055).

## Observações de escopo

Permanecem como responsabilidade organizacional da instituição, **fora do sistema**:

- a designação do encarregado pelo tratamento de dados pessoais (DPO);
- a redação jurídica do texto do aviso de privacidade;
- a definição formal das bases legais e dos prazos de retenção por categoria de dado.

O sistema aplica os textos e os prazos que a instituição fornecer. Enquanto os prazos de retenção do
FR-056 não forem definidos, o sistema apenas **sinaliza** os registros vencidos à equipe, sem
executar anonimização automática por decurso de prazo.

Dados de menores de idade — cadastro de voluntário e anexo de autorização do responsável legal —
recebem tratamento com acesso restrito a perfis autorizados e consentimento específico do
responsável legal registrado no ato do cadastro (FR-058).

---

## Rastreabilidade

| Caso de uso | História de usuário (spec.md) | Requisitos funcionais |
|---|---|---|
| CSU01 | User Story 2 — Doação Financeira via Pix (P1) | FR-005 a FR-010b, FR-036, FR-044, FR-045, FR-050, FR-051 |
| CSU11 | User Story 11 — Exercício de Direitos do Titular (P2) | FR-024, FR-035, FR-041, FR-044, FR-051 a FR-059 |

**Critérios de sucesso associados** (seção Success Criteria do `spec.md`): SC-001, SC-001a e SC-009
para o CSU01; SC-014, SC-015 e SC-016 para o CSU11.
