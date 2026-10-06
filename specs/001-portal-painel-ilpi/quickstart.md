# Quickstart — validação do Portal Público e Painel Administrativo

**Feature**: `001-portal-painel-ilpi` · **Data**: 2026-10-05 (refeito; versão anterior de 2026-09-04)
· **Fase**: 1

Guia de execução e validação. Entidades em [data-model.md](./data-model.md), rotas em
[contracts/api.md](./contracts/api.md), decisões D1–D18 em [research.md](./research.md). Nenhum
código de implementação aqui.

---

## Pré-requisitos

| Item | Observação |
|---|---|
| Node.js 24 LTS | **na máquina de quem programa** (`winget install OpenJS.NodeJS.LTS`) |
| Conta Neon | projeto PostgreSQL gratuito, com uma **branch de teste** separada (D8) |
| Conta Vercel | com Blob habilitado |
| Vercel CLI | `npm i -g vercel` — roda funções e cron localmente |
| Gmail institucional | com verificação em duas etapas e senha de aplicativo (D5) |

### Variáveis de ambiente (`.env.local`, nunca commitado)

```
DATABASE_URL=postgresql://…            # Neon — produção/desenvolvimento
DATABASE_URL_TESTE=postgresql://…      # Neon — branch de teste (node --test)
BLOB_READ_WRITE_TOKEN=…                # Vercel Blob
SESSION_SECRET=…                       # HMAC do cookie (32+ bytes aleatórios)
CRON_SECRET=…                          # protege /api/cron/diario
GMAIL_USER=…@gmail.com                 # conta INSTITUCIONAL, nunca pessoal
GMAIL_APP_PASSWORD=…                   # senha de aplicativo
APP_URL=https://….vercel.app           # base dos links de senha enviados por e-mail
```

> A senha de aplicativo e o `SESSION_SECRET` são credenciais reais. Confira antes do primeiro
> commit que `.env*` está no `.gitignore`. A chave Pix **nunca** vai em variável nem em arquivo:
> é cadastrada pela tela `admin/pix.html`.

---

## Setup

```bash
npm install
node db/migrate.js
node db/seed.js --demo
vercel dev
```

- `--demo` popula dados fictícios (conta institucional de teste, itens, campanha, voluntária,
  doadora associada, chave Pix fictícia em domínio `.invalid`). **Nunca rodar em produção.**
- Em produção, `node db/seed.js` sem `--demo` cria só a configuração inicial e a conta
  institucional, com **senha gerada na hora e mostrada uma única vez**. As credenciais do
  protótipo (`admin`/`admin123`) não podem existir fora do ambiente local.
- Aplicação em `http://localhost:3000`.

---

## Cenários de validação

Cada cenário prova uma história de ponta a ponta. Marque como validado só quando o resultado for
observado **no navegador**, não apenas na API.

### V1 — Portal reflete o Painel (US1, US3)

1. Painel → cadastre três itens com prioridades alta, média e baixa.
   **Esperado**: no Portal aparecem na ordem alta → média → baixa.
2. Dê baixa no de prioridade alta. **Esperado**: some do Portal; continua no histórico do Painel.
3. Cadastre um evento para amanhã e outro na mesma data. **Esperado**: aviso de conflito;
   seguindo, os dois ficam gravados.
4. Cadastre uma campanha sem meta. **Esperado**: no Portal, nenhuma barra de arrecadação.

### V2 — Doação espontânea e conferência (US2)

1. Painel → `admin/pix.html` → cadastre chave, recebedor e cidade.
2. Portal → `doacoes.html` → escolha R$ 10. **Esperado**: QR e copia e cola gerados; lido no app do
   banco, abre com a chave e o valor. Teste **pelo menos três bancos**. Valor R$ 0,50: recusado.
3. Clique em "Já fiz o Pix". **Esperado**: agradecimento explicando a conferência manual; **nenhum
   protocolo**; a página avisava antes que a espontânea não pode ser acompanhada.
4. Clique de novo com o mesmo valor. Painel → conferência. **Esperado**: as duas marcadas como
   possível duplicata (D18).
5. Confirme uma; tente confirmar de novo. **Esperado**: segunda vez recusada, nada muda (FR-050).
6. Marque a outra como não localizada **sem** motivo. **Esperado**: aceito (motivo opcional).

### V3 — Doação associativa e conta do doador (US2, US9)

1. Doação associativa com CPF e e-mail novos, aceitando o aviso. **Esperado**: link de definição de
   senha chega ao e-mail; antes de usá-lo, o login é negado com a mensagem de senha errada.
2. Use o link. **Esperado**: senha definida, login funciona; o histórico **não** mostra a doação
   enquanto pendente.
3. Painel → confirme a doação. **Esperado**: aparece no autoatendimento, com valor e data.
4. Saia e tente a associativa de novo com o mesmo CPF, sem login. **Esperado**: mensagem neutra
   pedindo login; QR não gerado (FR-006b).
5. Peça "esqueci minha senha" com um e-mail inexistente. **Esperado**: resposta idêntica à de um
   e-mail cadastrado; nada é enviado.
6. Use um link de redefinição depois de 1 hora (ou um link já usado). **Esperado**: "link inválido
   ou expirado", com orientação para pedir outro.

### V4 — Sem chave Pix (FR-007a)

Desative a chave. **Esperado**: aviso de indisponibilidade e contato; sem QR nem botão.

### V5 — Triagem com entrevista (US4, US5, US6)

1. Envie voluntário, candidatura (uma com arquivo, outra só com texto) e solicitação de evento.
   **Esperado**: protocolo na tela com "anote este código"; e-mail ao autor; aparecem no painel
   consolidado em até 1 minuto (SC-007).
2. Tente aprovar direto da fila pendente. **Esperado**: recusado — antes vem a entrevista.
3. Chame para entrevista e aprove o voluntário. **Esperado**: e-mail a cada decisão (FR-049b).
4. Rejeite a candidatura **sem** motivo. **Esperado**: aceito; e-mail diz só "não aprovada".
5. Aprove a solicitação. **Esperado**: status "aprovada — aguardando contato", **nada** no Portal.
   Confirme com os dados combinados. **Esperado**: evento publicado.
6. Consulte cada protocolo em `consultar-status.html`. **Esperado**: tipo, status e data, nada mais.

### V6 — Voluntário menor de idade (FR-012)

Cadastre com data de nascimento de 16 anos. **Esperado**: página de autorização pronta para
imprimir, com os dados preenchidos; no Painel, "autorização pendente" e aprovação bloqueada. Marque
como recebida → aprovação liberada. Nenhum arquivo foi enviado ao Blob.

### V7 — Papéis exclusivos no mesmo CPF (FR-048)

1. Aprove um voluntário. Depois, aprove uma candidatura com o **mesmo CPF**.
   **Esperado**: uma única pessoa; papel de voluntário `encerrado`, papel de funcionário `ativo`.
2. Tente aprovar um novo cadastro de voluntário com esse CPF. **Esperado**: recusado (funcionário
   ativo).

### V8 — Encerramento automático (FR-029c)

Cadastre um evento para hoje. No dia seguinte (ou rodando `GET /api/cron/diario` com o
`CRON_SECRET` e a data do banco ajustada): **Esperado**: some do Portal mesmo antes do cron; depois
do cron, status `encerrado` e auditoria com autor `sistema`.

### V9 — LGPD (US11)

1. Envie formulário sem aceitar o aviso. **Esperado**: bloqueado.
2. Aceite. **Esperado**: consentimento com data/hora, finalidade e versão.
3. Revogue o consentimento de uma submissão em triagem. **Esperado**: "encerrada a pedido do
   titular", fora da fila; dados **não** anonimizados.
4. Anonimize um doador com doações confirmadas. **Esperado**: nome, CPF, e-mail e telefone
   ilegíveis em todas as telas, inclusive no histórico de alterações; doações com valor, data,
   tipo e status; auditoria intacta (SC-016).
5. Fila de retenção com `retencao_meses` = 0 (só em teste): **Esperado**: lista o rejeitado, o
   encerrado e o currículo do aprovado; o doador inativo **não** aparece.

### V10 — Controle de acesso no servidor (FR-047, Princípio IV)

Com sessão de doador, chame `/api/admin/doacoes` direto (DevTools ou curl).
**Esperado**: `403`, corpo sem dados, tentativa na auditoria. Repita sem sessão.

### V11 — Nada é excluído (Princípio III)

Inative e reative uma pessoa; despublique e republique uma notícia; encerre uma campanha.
**Esperado**: tudo consultável no Painel. Confirme por busca no código que não há rota `DELETE` nem
`DELETE FROM` sobre tabela de negócio (a única ocorrência permitida é `limite_tentativa`).

### V12 — Página institucional editável (FR-001a)

Altere o texto da missão e inclua uma imagem sem texto alternativo. **Esperado**: bloqueado até
preencher o texto alternativo; depois de salvo, o Portal mostra o novo texto e o Painel guarda a
versão anterior.

---

## Portões de qualidade da constituição

Nenhuma tela é dada como concluída sem:

- **Acessibilidade (II)**: contraste verificado; zoom de 200% sem quebra; navegação completa por
  teclado com foco visível; texto alternativo em toda imagem informativa; rótulo em todo campo;
  erro compreensível ao lado do campo.
- **Responsividade (V)**: uma resolução móvel e uma desktop; Chrome, Firefox, Edge e Safari.
- **Dados (III)**: sem exclusão física; status e auditoria presentes.
- **Acesso (IV)**: autorização no servidor; dado pessoal não trafega para a zona pública.
- **Escopo (VI)**: nada fora dos 11 CSUs.

## Testes automatizados

```bash
node --test
```

Rodam contra `DATABASE_URL_TESTE`. Cobrem as quatro regras de `contracts/api.md` → "Contratos
cobertos pelos testes automatizados". O resto é verificado pelos cenários e portões acima.
