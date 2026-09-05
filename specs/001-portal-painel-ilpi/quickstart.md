# Quickstart — validação do Portal Público e Painel Administrativo

**Feature**: `001-portal-painel-ilpi` · **Data**: 2026-09-04 · **Fase**: 1

Guia de execução e validação. Detalhes de modelo estão em `data-model.md`, de endpoints em
`contracts/api.md`. Nenhum código de implementação aqui.

---

## Pré-requisitos

| Item | Observação |
|---|---|
| Node.js 20+ | runtime das funções serverless |
| Conta Neon | projeto PostgreSQL criado, plano gratuito |
| Conta Vercel | com Blob habilitado |
| Vercel CLI | `npm i -g vercel` — roda as funções serverless localmente |
| Protótipo `recanto-frontend` | **ainda não está no repositório** — copiar de `Downloads` antes de começar |

### Variáveis de ambiente (`.env.local`, nunca commitado)

```
DATABASE_URL=postgresql://…            # Neon
BLOB_READ_WRITE_TOKEN=…                # Vercel Blob
SESSION_SECRET=…                       # HMAC do cookie de sessão
RESEND_API_KEY=…                       # e-mail transacional
```

`.gitignore` já cobre `.env`. Confira antes do primeiro commit que nenhuma dessas chaves entrou no
repositório.

---

## Setup

```bash
npm install
node db/migrate.js
node db/seed.js
vercel dev
```

`db/seed.js` popula dados de demonstração: uma conta institucional, uma voluntária aprovada, uma
doadora associada, itens necessários, uma campanha e uma vaga. Nunca rodar em produção.

Aplicação em `http://localhost:3000`.

---

## Cenários de validação

Cada cenário abaixo prova uma User Story de ponta a ponta. Marque como validado só quando o
resultado esperado for observado no navegador, não apenas na API.

### V1 — Portal Público reflete o painel (US1)

Publique um item necessário no Painel → confirme que aparece em `doacoes.html` → dê baixa no item →
recarregue a página pública → o item sumiu da lista.
**Esperado**: conteúdo público espelha o painel, sem exigir login.

### V2 — Declaração de doação e conferência manual (US2) — **BLOQUEADO**

> Não executar até o orientador tomar ciência da reversão do CSU01 para Pix estático. Ver
> `research.md` → D9.

1. Painel → cadastre chave Pix e imagem do QR code.
2. Portal → `doacoes.html` mostra a chave (com botão copiar) e o QR code.
3. Declare uma doação espontânea (valor + data). **Esperado**: protocolo `DOA-…`, status `pendente`,
   aviso claro de que a declaração não confirma o recebimento.
4. Painel → fila de conferência → confirme a doação. **Esperado**: status `confirmada`, declaração
   de doação disponível, auditoria com conta e data.
5. Tente confirmar de novo. **Esperado**: `409`, nada muda, nenhuma nova declaração emitida.
6. Consulte o protocolo em `consultar-status.html`. **Esperado**: status atualizado, sem pedir
   qualquer dado pessoal.
7. Declare outra doação e marque como não localizada **sem** motivo. **Esperado**: recusado.

### V3 — Sem chave Pix cadastrada (FR-007a)

Desative a chave Pix no Painel e acesse a página de doação.
**Esperado**: aviso de indisponibilidade temporária + canal de contato. O formulário de declaração
**não** aparece.

### V4 — Triagem obrigatória (US4, US5, US6)

Envie cadastro de voluntário, candidatura e solicitação de evento.
**Esperado**: os três nascem `pendente`, cada um com protocolo, e cada autor recebe e-mail (FR-049).
Rejeite cada um **sem** motivo → recusado nas três filas. Rejeite com motivo → registrado.
**Esperado**: nenhum caminho aprova automaticamente (Princípio VIII).

### V5 — Voluntário menor de idade (FR-014, FR-058)

Cadastre voluntário com data de nascimento de menor, sem anexar autorização.
**Esperado**: bloqueado. Com anexo: aceito, e o arquivo só é acessível a perfil autorizado — tente
abrir a URL do arquivo sem sessão administrativa e confirme que é negado.

### V6 — Acúmulo de perfis no mesmo CPF (FR-048)

Aprove um cadastro de voluntário; depois aprove uma candidatura a vaga com o **mesmo CPF**.
**Esperado**: um único usuário com os perfis `voluntario` e `funcionario`. Nenhum registro duplicado.

### V7 — Autoatendimento restrito ao próprio titular (US9)

Entre como doadora associada e consulte o histórico.
**Esperado**: só as próprias doações. Tente acessar `/api/me/doacoes` manipulando identificadores de
outra pessoa → negado (o `id` vem da sessão, nunca da requisição).

### V8 — Consentimento e direitos do titular (US11)

1. Envie formulário público sem aceitar o aviso de privacidade. **Esperado**: bloqueado.
2. Aceite e envie. **Esperado**: consentimento gravado com data/hora, finalidade e versão do aviso.
3. Declare doação espontânea **com** anexo de comprovante sem aceitar o aviso. **Esperado**:
   bloqueado, com explicação de que o comprovante identifica o pagador (FR-051).
4. Abra pedido de anonimização e atenda pelo Painel. **Esperado**: dados pessoais ilegíveis, **linha
   preservada**, histórico e auditoria intactos, protocolo consultável.

### V9 — Controle de acesso no servidor (FR-047, Princípio IV)

Com sessão de autoatendimento, chame uma rota `/api/admin/*` direto (curl ou DevTools).
**Esperado**: `403`, corpo sem dados, tentativa registrada na auditoria. Esconder o botão na
interface não é suficiente — o teste é contra a API.

### V10 — Ausência de exclusão física (Princípio III)

Inative um usuário e depois consulte registros inativos no Painel.
**Esperado**: o registro continua existindo e consultável. Confirme que nenhuma rota da API expõe
`DELETE` sobre dado de negócio.

---

## Portões de qualidade da constituição

Nenhuma tela é dada como concluída sem os quatro portões:

- **Acessibilidade (Princípio II)**: contraste verificado, fonte legível sem quebra de layout ao
  ampliar o zoom, navegação completa por teclado com foco visível, `alt` descritivo em imagem
  informativa, rótulo associado a cada campo, mensagem de erro compreensível.
- **Responsividade (Princípio V)**: verificada em ao menos uma resolução móvel e uma desktop, e nos
  navegadores Chrome, Firefox, Edge e Safari.
- **Dados (Princípio III)**: sem exclusão física; campos de status e auditoria presentes.
- **Acesso (Princípio IV)**: autorização verificada no servidor; dado pessoal não trafega para
  perfil não autorizado.

## Testes automatizados

```bash
node --test
```

Cobrem apenas as quatro regras críticas listadas em `contracts/api.md` → "Contratos que os testes
automatizados devem cobrir". O restante é verificado manualmente pelos portões acima.
