# Casos de Uso para o Documento do TCC

> Conteúdo pronto para ser incorporado ao **PRD** e à **seção 19** do documento do TCC.
> Formato conforme o padrão já adotado pelo grupo: Código/Nome, Sumário, Ator Principal/Secundário,
> Pré-condições, Fluxo (colunas Ator/Sistema), Pós-condições.
>
> **Última atualização:** 2026-10-04
> **Origem:** `specs/001-portal-painel-ilpi/spec.md` (FR-001 a FR-061).
> Em caso de divergência entre este arquivo e o `spec.md`, **o `spec.md` prevalece** — ele é a fonte
> normativa; este documento é a redação para o texto do TCC.

Dois casos de uso constam aqui:

- **CSU01 — Realizar Doação Financeira via Pix**: *substitui* a versão anterior, que descrevia
  integração com API de pagamentos. Reescrito após a decisão de 2026-09-04 (Pix estático), ratificada
  em 2026-09-05 pela emenda ao Princípio VII da constituição do projeto. Reescrito de novo em
  2026-10-04: a declaração passou a ser só o clique em "Já fiz o Pix", sem protocolo e sem anexo.
- **CSU11 — Exercício de Direitos do Titular de Dados (LGPD)**: **novo**, adicionado em 2026-09-04.
  Reescrito em 2026-10-03: os pedidos do titular passaram a ser feitos por contato com a
  instituição, fora do sistema, e o canal público com protocolo foi retirado.

---

# CSU01 — Realizar Doação Financeira via Pix

## Sumário

Permite que um visitante do Portal Público faça uma doação financeira à instituição por meio de Pix
e registre essa doação no sistema. O Portal gera o QR code Pix estático com a chave da instituição e
o valor escolhido; o pagamento é feito pelo doador no aplicativo do seu próprio banco, fora do
sistema. Depois de pagar, o doador clica em "Já fiz o Pix", e o sistema registra uma declaração com
status *pendente*, com o valor do QR code e a data/hora do clique. A declaração só se torna
*confirmada* quando um funcionário localiza o Pix correspondente no extrato bancário da instituição
— pelo valor e pela data/hora e, na doação associativa, também pelo nome do doador. A declaração do
doador, isoladamente, nunca equivale à confirmação de recebimento.

A declaração de doação não gera código de protocolo, e o sistema não emite recibo (decisões de
2026-10-04). A confirmação fica registrada no Painel Administrativo, com data e conta. A doação
associativa só aparece no autoatendimento do doador depois de confirmada; o doador espontâneo não
acompanha nada.

O sistema não integra nenhuma API de pagamentos, não gera cobrança dinâmica e não tem acesso à conta
bancária da instituição. Doações de itens físicos, de dinheiro em espécie e contribuições pagas por
depósito ou transferência bancária que não seja Pix permanecem fora do sistema, registradas pela
administração.

## Atores

| Papel | Ator |
|---|---|
| Ator Principal | Visitante do Portal Público (doador), identificado ou não |
| Atores Secundários | Funcionário da administração (conferência e confirmação da doação); Doador associado (quando a doação é vinculada a um cadastro) |

## Pré-condições

1. O Portal Público está acessível, sem exigência de autenticação.
2. Existe uma chave Pix institucional cadastrada e ativa no Painel Administrativo, com nome do
   recebedor e cidade (FR-007).
3. Para a primeira doação associativa, o doador aceita o aviso de privacidade no ato do envio
   (FR-051).

## Fluxo Principal — Doação espontânea

| # | Ator | Sistema |
|---|---|---|
| 1 | Acessa a página de doações do Portal Público e escolhe um valor sugerido (R$ 10, 20, 50 ou 100) ou digita outro valor, de no mínimo R$ 1. | Valida o valor (obrigatório, numérico, positivo, mínimo R$ 1). Gera o QR code Pix estático e o código copia e cola com a chave institucional e o valor escolhido, com opção de copiar o código, e avisa que o pagamento é feito no aplicativo do próprio banco, que o clique em "Já fiz o Pix" não confirma o recebimento e que a doação espontânea não pode ser acompanhada depois (FR-007, FR-010a). |
| 2 | Efetua o pagamento no aplicativo do seu banco, fora do sistema. | — (o sistema não participa desta etapa e não toma conhecimento do pagamento) |
| 3 | Mantendo a modalidade espontânea, clica em "Já fiz o Pix" logo após pagar. | Registra a declaração com status *pendente*, com o valor do QR code e a data/hora do clique, sem nenhum dado de identificação (FR-005, FR-008). |
| 4 | — | Exibe um agradecimento explicando que a equipe confere a doação manualmente, e coloca a declaração na fila de conferência do Painel Administrativo (FR-036). |

O fluxo principal termina com a declaração *pendente*. O resultado da conferência pelo funcionário
não é garantido — a doação pode ser confirmada ou não — e por isso está descrito nos Fluxos
Alternativos C e D.

## Fluxo Alternativo A — Primeira doação associativa

Substitui o passo 3 do fluxo principal.

| # | Ator | Sistema |
|---|---|---|
| 3a | Seleciona a modalidade associativa. | Apresenta o formulário com os dados de identificação do doador (nome, CPF, e-mail, telefone) e exige o aceite explícito do aviso de privacidade (FR-006, FR-051). |
| 4a | Preenche os dados, aceita o aviso e clica em "Já fiz o Pix". | Valida os dados e o aceite. Com CPF inválido ou sem aceite, impede o envio e indica a correção. |
| 5a | — | Registra a declaração com status *pendente*, com valor e data/hora do clique, cria o cadastro de doador associado, vincula a declaração a ele e registra o consentimento com data/hora, finalidade e versão do aviso aceito (FR-006, FR-052). |
| 6a | — | Envia ao e-mail informado um link para definir a senha; a conta só dá acesso ao autoatendimento depois que a senha é definida por esse link (FR-006a). |

A partir daí o fluxo segue no passo 4 do fluxo principal.

## Fluxo Alternativo B — Doador associado já cadastrado

Substitui o passo 3 do fluxo principal.

| # | Ator | Sistema |
|---|---|---|
| 3b | Entra no autoatendimento, gera o QR code e paga. | Autentica e apresenta a página de doação já vinculada ao seu cadastro (FR-041, FR-006a). |
| 4b | Clica em "Já fiz o Pix". | Registra a declaração com status *pendente*, com valor e data/hora do clique, vinculada ao cadastro, sem pedir os dados de novo (FR-006a, FR-008). |

A partir daí o fluxo segue no passo 4 do fluxo principal.

## Fluxo Alternativo C — Conferência: Pix localizado no extrato

Ocorre depois do passo 4, quando o funcionário faz a conferência.

| # | Ator | Sistema |
|---|---|---|
| 1c | *(Funcionário)* Acessa a fila de conferência. | Exibe, para cada declaração pendente, o valor, a data/hora do clique e, se associativa, o nome do doador, e sinaliza declarações com valor e data próximos, para avaliação de possível duplicidade (FR-008, FR-050). |
| 2c | *(Funcionário)* Localiza no extrato bancário um Pix com o mesmo valor e data/hora próximos — e, na associativa, com o nome do doador, como critério auxiliar — e confirma a doação. | Altera o status para *confirmada* e registra a data da confirmação e a conta institucional no Painel e no histórico de auditoria (FR-008, FR-035). |
| 3c | — | Se a doação é associativa, passa a exibi-la no histórico do doador no autoatendimento (FR-041). |

## Fluxo Alternativo D — Conferência: Pix não localizado no extrato

Substitui o passo 2c do Fluxo Alternativo C.

| # | Ator | Sistema |
|---|---|---|
| 2d | *(Funcionário)* Não localiza o Pix correspondente no extrato bancário e marca a declaração como não localizada, informando o motivo se quiser. | Altera o status para *não localizada*, preserva integralmente o registro sem exclusão física, e registra a conta, a data e, quando informado, o motivo na auditoria (FR-008, FR-024, FR-035). A doação não aparece no autoatendimento. |

Se a entrada encontrada no extrato for depósito ou transferência que não seja Pix, o funcionário
marca a declaração como não localizada e pode usar o motivo padrão oferecido pelo sistema (FR-008a).

## Fluxo Alternativo E — Histórico do doador associado

| # | Ator | Sistema |
|---|---|---|
| 1e | *(Doador associado)* Entra no autoatendimento. | Exibe o histórico das suas doações já confirmadas por um funcionário, com valor e data. Declarações pendentes ou não localizadas não aparecem, e o sistema não emite recibo (FR-041). |

## Fluxo de Exceção F — Nenhuma chave Pix cadastrada

| # | Ator | Sistema |
|---|---|---|
| 1f | Acessa a página de doações. | Verifica que não há chave Pix ativa cadastrada. |
| 2f | — | Informa que a doação digital está temporariamente indisponível, exibe o contato da instituição e **não** apresenta o QR code nem o botão "Já fiz o Pix" (FR-007a). |

## Fluxo de Exceção G — Tentativa de confirmação em duplicidade

| # | Ator | Sistema |
|---|---|---|
| 1g | *(Funcionário)* Tenta confirmar uma doação já confirmada anteriormente. | Identifica que o status já é *confirmada*, recusa a operação e não altera o registro (FR-050). |

## Fluxo de Exceção H — Doador paga e não clica em "Já fiz o Pix"

Substitui o passo 3 do fluxo principal.

| # | Ator | Sistema |
|---|---|---|
| 3h | Paga no aplicativo do banco e sai da página sem clicar em "Já fiz o Pix". | — (nenhuma declaração é registrada; o sistema não fica sabendo do pagamento) |
| 4h | *(Funcionário)* Encontra no extrato um Pix sem declaração correspondente. | — (o Pix é controlado pela secretaria, fora do sistema, como os pagamentos feitos na sede; FR-009) |

Para reduzir esse caso, a página de doação avisa, antes do pagamento, que a doação só é registrada
com o clique em "Já fiz o Pix" (FR-010a). É por isso que os totais do Painel não representam a
arrecadação da instituição (FR-060a).

## Pós-condições

1. A declaração de doação está registrada no sistema com status *pendente*, *confirmada* ou *não
   localizada*, com valor e data/hora, jamais excluída fisicamente (FR-024).
2. Doações associativas estão vinculadas ao cadastro do doador, com o respectivo registro de
   consentimento (FR-052); as confirmadas aparecem no autoatendimento (FR-041). O sistema não emite
   recibo.
3. Toda ação de conferência está registrada no histórico de auditoria com a conta institucional
   responsável e a data (FR-035).

## Observações de escopo

- O sistema **não** processa pagamentos, não custodia valores e não armazena dados de cartão ou
  credenciais bancárias (Princípio VII da constituição do projeto).
- Uma doação efetivamente recebida cujo doador não clique em "Já fiz o Pix" **não aparece no
  sistema**. A conciliação contábil completa continua sendo feita pela administração a partir do
  extrato bancário. Esta é uma limitação conhecida e aceita conscientemente.
- Declarações de doação não têm código de protocolo e não geram recibo (decisões de 2026-10-04).
- Boleto, cartão de crédito e demais meios de pagamento estão fora do escopo.

---

# CSU11 — Exercício de Direitos do Titular de Dados (LGPD)

## Sumário

Garante que toda pessoa cujos dados pessoais sejam coletados pelo sistema — voluntário, candidato a
vaga, doador associado ou solicitante externo — conheça o tratamento dado a esses dados antes de
enviá-los, registre seu consentimento explícito e consiga exercer os direitos previstos na Lei nº
13.709/2018 (LGPD): acesso, correção, anonimização e revogação do consentimento.

Os pedidos do titular são feitos **fora do sistema**, pelo contato da instituição informado no aviso
de privacidade (e-mail ou telefone). Um funcionário confere a identidade de quem pede e executa no
Painel Administrativo o que depende do sistema: corrigir os dados, anonimizá-los ou registrar a
revogação. A anonimização torna os dados pessoais identificáveis ilegíveis, mas preserva o
registro, seu histórico e a trilha de auditoria — conciliando o direito do titular com a obrigação
de prestação de contas da instituição.

## Atores

| Papel | Ator |
|---|---|
| Ator Principal | Titular dos dados pessoais (voluntário, candidato a vaga, doador associado ou solicitante externo) |
| Atores Secundários | Funcionário da administração (conferência da identidade e execução do pedido no Painel); Encarregado pelo tratamento de dados (DPO) designado pela instituição, atuando fora do sistema |

## Pré-condições

1. O Portal Público está acessível, sem exigência de autenticação.
2. A instituição aprovou o texto do aviso de privacidade, e ele está publicado com identificação de
   versão e com o contato para exercício de direitos (FR-053).
3. Para os fluxos de atendimento: existem dados pessoais do titular registrados no sistema,
   coletados mediante consentimento registrado (FR-051, FR-052).

## Fluxo Principal — Consentimento na coleta de dados

Ocorre em todo formulário público que colete dados pessoais.

| # | Ator | Sistema |
|---|---|---|
| 1 | Preenche um formulário público (cadastro de voluntário, candidatura a vaga, doação associativa ou solicitação externa). | Exibe, antes do envio, o resumo do tratamento dos dados e o link para o aviso de privacidade completo (FR-051, FR-053). |
| 2 | Tenta enviar sem aceitar o aviso de privacidade. | Impede o envio e explica que o aceite é obrigatório (FR-051). |
| 3 | Aceita o aviso de privacidade e envia. | Registra o consentimento junto à submissão, com data/hora, finalidade do tratamento e versão do texto aceito (FR-052). |

## Fluxo Alternativo A — Consulta do aviso de privacidade

| # | Ator | Sistema |
|---|---|---|
| 1a | Acessa o aviso de privacidade pelo Portal Público. | Exibe, sem exigir login, quais dados são coletados, com que finalidade, por quanto tempo são retidos e o contato da instituição para o exercício de direitos (FR-053). |

## Fluxo Alternativo B — Atendimento de pedido de anonimização

| # | Ator | Sistema |
|---|---|---|
| 1b | Entra em contato com a instituição, pelo canal informado no aviso de privacidade, e pede a anonimização dos seus dados. | — (o pedido chega fora do sistema; FR-054) |
| 2b | *(Funcionário)* Confere a identidade do titular e localiza o cadastro no Painel. | Exibe os registros vinculados ao titular e sinaliza dados sujeitos a retenção legal, como doações confirmadas (FR-055). |
| 3b | *(Funcionário)* Executa a anonimização. | Torna ilegíveis os dados pessoais identificáveis, remove os arquivos de acesso restrito vinculados, e **preserva** o registro, o histórico e a trilha de auditoria, sem exclusão física; registra a ação, a conta institucional e a data (FR-055, FR-024, FR-035). |
| 4b | *(Funcionário)* Informa o titular, pelo mesmo contato, que o pedido foi atendido. | — |

## Fluxo Alternativo C — Revogação de consentimento

| # | Ator | Sistema |
|---|---|---|
| 1c | Pede à instituição, pelo contato, a revogação do consentimento. | — (fora do sistema; FR-054) |
| 2c | *(Funcionário)* Confere a identidade e registra a revogação no Painel. | Altera o status do consentimento para *revogado*, com data e conta, e interrompe o uso dos dados para as finalidades revogadas, **sem** exclusão física do registro (FR-057, FR-024). |

## Fluxo Alternativo D — Acesso e correção

| # | Ator | Sistema |
|---|---|---|
| 1d | Pede à instituição, pelo contato, acesso aos seus dados ou a correção deles. | — (fora do sistema; FR-054) |
| 2d | *(Funcionário)* Confere a identidade, consulta o cadastro e, se for o caso, corrige os dados no Painel. | Grava a correção preservando o histórico da alteração e registra a ação na auditoria (FR-037, FR-035). |

O doador associado também pode consultar seus próprios dados a qualquer momento pela área de
autoatendimento (FR-041).

## Fluxo de Exceção E — Dados sujeitos a obrigação legal

Substitui o passo 3b do Fluxo Alternativo B.

| # | Ator | Sistema |
|---|---|---|
| 3e | *(Funcionário)* Constata que parte dos dados é necessária ao cumprimento de obrigação legal ou regulatória, como doações confirmadas sujeitas a prestação de contas. | Permite reter exclusivamente esses dados e anonimizar os demais (FR-055). |
| 4e | *(Funcionário)* Registra a justificativa da retenção. | Exige e armazena a justificativa; a instituição a comunica ao titular pelo mesmo contato em que recebeu o pedido (FR-055). |

## Fluxo de Exceção F — Fim do prazo de retenção

| # | Ator | Sistema |
|---|---|---|
| 1f | — | Identifica candidaturas e cadastros de voluntário não aprovados cuja triagem foi concluída há 6 meses ou mais (prazo configurável), com seus anexos (FR-056). |
| 2f | — | Sinaliza esses registros à equipe administrativa para anonimização, preservando dados estatísticos não identificáveis (FR-056). |
| 3f | *(Funcionário)* Executa a anonimização dos registros sinalizados. | Procede conforme o passo 3b do Fluxo Alternativo B. |

## Pós-condições

1. Toda submissão pública que coleta dados pessoais possui registro de consentimento associado, com
   data/hora, finalidade e versão do aviso aceito (FR-051, FR-052).
2. Em caso de anonimização, os dados pessoais identificáveis do titular deixam de ser legíveis no
   sistema, enquanto o registro, o histórico e a trilha de auditoria permanecem íntegros (FR-055,
   FR-024, FR-035).
3. Consentimentos revogados constam como tais, com data, e o uso dos dados para as finalidades
   revogadas está interrompido (FR-057).
4. Dados retidos por obrigação legal possuem justificativa registrada (FR-055).
5. Toda ação executada no Painel em resposta a um pedido do titular consta da trilha de auditoria
   com a conta institucional e a data (FR-035).

## Observações de escopo

Permanecem **fora do sistema**, como responsabilidade da instituição:

- o recebimento dos pedidos do titular e a conferência de sua identidade (decisão de 2026-10-03,
  que substituiu o canal público de solicitação com protocolo);
- o prazo de resposta ao titular (15 dias corridos para pedidos de acesso);
- a designação do encarregado pelo tratamento de dados pessoais (DPO);
- a aprovação do texto do aviso de privacidade (o grupo redige o rascunho);
- a definição formal das bases legais.

O sistema aplica os textos e os prazos que a instituição aprovar. Ao fim do prazo de retenção, ele
**sinaliza** os registros vencidos à equipe, sem executar anonimização automática.

Dados de voluntários menores de idade recebem acesso restrito a perfis autorizados. A autorização do
responsável legal é entregue em papel, assinada, na sede: o sistema só registra o recebimento e não
guarda cópia do documento (FR-012, FR-058).

---

## Rastreabilidade

| Caso de uso | História de usuário (spec.md) | Requisitos funcionais |
|---|---|---|
| CSU01 | User Story 2 — Doação Financeira via Pix (P1) | FR-005 a FR-009, FR-010a (incl. FR-006a), FR-036, FR-041, FR-050, FR-051 |
| CSU11 | User Story 11 — Proteção de Dados Pessoais e Direitos do Titular (P2) | FR-024, FR-035, FR-037, FR-041, FR-051 a FR-058 |

**Critérios de sucesso associados** (seção Success Criteria do `spec.md`): SC-001, SC-001a e SC-009
para o CSU01; SC-014, SC-015 e SC-016 para o CSU11.

> **Nota de 2026-10-03:** o FR-059 e a entidade *Solicitação de Titular de Dados* foram removidos do
> spec. Em 2026-10-04 saíram também o FR-010 (recibo), o FR-010b (anexo do comprovante) e o FR-045
> (protocolo de doação). Os números FR-010, FR-010b, FR-033, FR-045 e FR-059 ficam reservados para
> não renumerar os demais.
