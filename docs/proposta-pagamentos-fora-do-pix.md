# Proposta — Pagamentos fora do Pix ficam fora do sistema

**Data:** 2026-10-03 · **Status:** aplicada em 2026-10-03 (opção "só Pix", três status mantidos)

Aplicado: CLAUDE.md, spec.md, casos-de-uso-tcc.md, `autoatendimento.html`, `admin/doacoes.html`
(aviso de conferência e rótulo do total). **Pendente**, porque a tela ainda não existe: o aviso de
`doacoes.html` e o motivo padrão em `admin/doacoes.html` dependem do fluxo de declaração e de
rejeição, que o protótipo ainda não tem (pendência 2 do CLAUDE.md). O texto da área de ajuda
(seção 5) fica guardado até ela ser escrita.

## Contexto

O histórico institucional do Recanto informa que associados pagam a contribuição de três formas:
na sede, por depósito em conta corrente ou por Pix. O SAGE só registra declarações de Pix (CSU01).
Dinheiro em espécie já estava fora por decisão registrada (FR-009). Depósito e transferência
bancária não apareciam em lugar nenhum.

**Decisão proposta:** o sistema continua puramente Pix. Depósito, TED/DOC e pagamento na sede
ficam fora, controlados pela secretaria. Não há mudança de escopo, só redação que torna isso
explícito e evita que o doador associado ou a equipe esperem do sistema o que ele não faz.

Abaixo, o texto de cada lugar a alterar, pronto para colar.

---

## 1. CLAUDE.md — em "Decisões já tomadas", logo após o item do Pix estático

> - **Só Pix entra no sistema; depósito, transferência e pagamento na sede ficam fora
>   (decidido em 2026-10-03).** O histórico do Recanto mostra que associados pagam na sede, por
>   depósito ou por Pix. O SAGE registra apenas declarações de Pix. Contribuições pagas de outra
>   forma são controladas pela secretaria, fora do sistema, como já acontecia com dinheiro vivo.
>   Uma declaração cuja entrada no extrato seja depósito ou TED, e não Pix, **não é confirmada**:
>   o funcionário a marca como não localizada com o motivo padrão (ver FR-008a). Consequências
>   aceitas: o histórico do doador associado (CSU09) e os totais do Painel mostram só o que veio
>   por Pix e foi declarado no site — **não são a arrecadação da instituição** e não servem como
>   prestação de contas. Se alguém propuser registrar depósito "porque aparece no extrato", é
>   reabrir esta decisão.

E, no mesmo arquivo, trocar a frase final do item do Pix estático:

- **De:** "Boleto e cartão continuam fora. Itens físicos e dinheiro vivo continuam tratados
  manualmente, fora do sistema."
- **Para:** "Boleto e cartão continuam fora. Itens físicos, dinheiro vivo, depósito e
  transferência bancária continuam tratados manualmente, fora do sistema (ver item de 2026-10-03)."

---

## 2. spec.md

### FR-009 (substituir)

> - **FR-009**: O sistema NÃO PODE registrar digitalmente doações de itens físicos, de dinheiro
>   em espécie, nem contribuições pagas por depósito ou transferência bancária que não seja Pix
>   (TED, DOC); esses casos permanecem exclusivamente como registro da instituição, fora do
>   sistema (decisão de 2026-10-03).

### FR-008a (novo, logo após o FR-008)

> - **FR-008a**: Quando a entrada correspondente a uma declaração aparecer no extrato como
>   depósito ou transferência que não seja Pix, o funcionário NÃO PODE confirmá-la; DEVE marcá-la
>   como não localizada com o motivo "Pagamento recebido por depósito ou transferência, fora do
>   Pix. Registrado pela secretaria da instituição, fora deste sistema." (FR-009).

### User Story 9 — narrativa (trocar o trecho do doador)

- **De:** "o doador associado consulta seu histórico de doações."
- **Para:** "o doador associado consulta o histórico das contribuições que pagou por Pix e
  declarou no Portal."

### User Story 9 — cenário 2 (substituir)

> 2. Given um doador associado tem doações registradas, When ele acessa a área de autoatendimento
>    com seu login, Then vê o histórico de suas próprias declarações de doação via Pix, com o
>    aviso de que contribuições pagas na sede ou por depósito não aparecem ali e ficam registradas
>    na secretaria da instituição.

### Edge Cases (novo item)

> - O que acontece quando um associado declara no site uma contribuição que pagou por depósito
>   ou TED? → Resolvido via FR-008a: o funcionário vê no extrato que a entrada não é Pix, marca a
>   declaração como não localizada com o motivo padrão, e a contribuição segue registrada pela
>   secretaria, fora do sistema (FR-009).

### FR-060a (acrescentar ao final da lista do que o sistema não faz)

- **De:** "...não aprova nenhuma submissão sem ação humana e não exclui fisicamente cadastros."
- **Para:** "...não aprova nenhuma submissão sem ação humana, não exclui fisicamente cadastros e
  não registra contribuições pagas na sede, em dinheiro ou por depósito — por isso os totais do
  Painel não representam a arrecadação da instituição."

---

## 3. docs/casos-de-uso-tcc.md — CSU01, parágrafo de escopo

- **De:** "Doações de itens físicos e de dinheiro em espécie permanecem fora do sistema,
  registradas fisicamente pela administração."
- **Para:** "Doações de itens físicos, de dinheiro em espécie e contribuições pagas por depósito
  ou transferência bancária que não seja Pix permanecem fora do sistema, registradas pela
  administração."

---

## 4. Textos de tela

### `public/autoatendimento.html` — painel do doador

Rótulo do card de resumo:

- **De:** "Total doado"
- **Para:** "Total doado via Pix"

Aviso logo abaixo do título "Histórico de doações":

> Aqui aparecem só as doações feitas por Pix e declaradas neste site. Contribuições pagas na sede
> ou por depósito ficam registradas na secretaria do Recanto. Em caso de dúvida, fale com a
> secretaria pelo telefone (24) 3016-4023.

### `public/doacoes.html` — antes do formulário de declaração

> Esta declaração vale só para doações feitas por Pix. Se você pagou na sede, por depósito ou
> transferência bancária, não precisa declarar aqui: a secretaria do Recanto registra esses
> pagamentos diretamente.

### `public/admin/doacoes.html` — ajuda contextual na conferência (FR-061)

> **Confira se a entrada no extrato é Pix.** Depósito, TED ou DOC não são confirmados por aqui,
> mesmo que o valor e a data batam. Nesses casos, marque como **não localizada** e use o motivo
> padrão. A secretaria registra esse pagamento fora do sistema.

Motivo padrão (botão ou opção pré-preenchida no campo de motivo):

> Pagamento recebido por depósito ou transferência, fora do Pix. Registrado pela secretaria da
> instituição, fora deste sistema.

---

## 5. Área de ajuda do Painel (FR-060a) — item da seção "O que o sistema não faz"

> **Não registra pagamentos fora do Pix.** Contribuições pagas na sede, em dinheiro, por depósito
> ou por transferência (TED/DOC) não entram no sistema. Continuam sendo anotadas pela secretaria,
> como sempre foram. Por isso os totais que aparecem no Painel mostram só as doações por Pix
> declaradas no site — **não use esses números como prestação de contas** da instituição.

*(A área de ajuda só é escrita depois do sistema pronto, conforme decisão de 2026-09-23; este
texto fica guardado para esse momento.)*

---

## Ponto para o grupo decidir junto

O status **"não localizada"** não descreve bem o caso do depósito: o dinheiro foi localizado,
só não entrou pelo Pix. Para o doador, que consulta pelo protocolo, pode parecer que o pagamento
se perdeu. O motivo padrão e o aviso em `doacoes.html` reduzem isso, mas não eliminam.

A alternativa seria um quarto status (por exemplo, "registrada fora do sistema"), o que muda o
data-model (`doacao.status`), o FR-008 e o fluxo de conferência. **Recomendação:** manter os três
status e confiar no motivo padrão. É a opção sem mudança de modelo e coerente com "puramente
Pix", e o aviso antes da declaração deve fazer o caso ser raro.
