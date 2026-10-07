# Portões da constituição — registro de verificação

Feature: 001-portal-painel-ilpi · Fase 14 (T122 a T127)

Este arquivo registra o que foi verificado, como e por quem. **Verificação automática não
substitui a manual**: ela acha os defeitos mais comuns, mas não diz se a tela é fácil de usar.
Cada linha "pendente" precisa de uma pessoa do grupo.

## Princípio III — nada é excluído (T122, quickstart V11)

| Verificação | Resultado | Como | Data |
|---|---|---|---|
| `DELETE` em `rotas/`, `api/`, `db/`, `scripts/` | ✅ só a limpeza de `limite_tentativa` em `rotas/cron/diario.js` | busca no código | 2026-10-07 |
| Handler exportando `DELETE` | ✅ nenhum | busca no código | 2026-10-07 |
| Remoção de arquivo no Blob | ✅ só em `removerArquivo` (anonimização, FR-055); a linha em `arquivo` fica | leitura de `rotas/_lib/blob.js` | 2026-10-07 |

## Princípio IV — acesso no servidor (T123, quickstart V10)

| Verificação | Resultado | Como | Data |
|---|---|---|---|
| Toda rota de `rotas/admin/` começa com `exigirAdmin` | ✅ 68 handlers, 0 problema (exceto login, logout e sessão) | script que lê a primeira instrução de cada handler | 2026-10-07 |
| Toda rota de `rotas/me/` começa com `exigirDoador` | ✅ incluído na conta acima | idem | 2026-10-07 |
| Respostas de `rotas/public/` sem dado pessoal | ✅ chave Pix é o CNPJ; nomes são de eventos e campanhas; consulta de status só tipo, situação e data | leitura de cada rota + `tests/protocolo.test.js` | 2026-10-07 |
| Negação registrada na auditoria (FR-047) | ✅ | `tests/acesso.test.js`, `tests/autoatendimento.test.js` | 2026-10-07 |

## Princípio II — acessibilidade (T124)

### Automático, nas 27 telas (Portal e Painel), com o `npm run dev`

| Verificação | Resultado | Data |
|---|---|---|
| Imagem sem `alt` | ✅ nenhuma | 2026-10-07 |
| Campo sem rótulo (`label`, `aria-label` ou `title`) | ✅ nenhum | 2026-10-07 |
| Botão ou link sem nome acessível | ✅ nenhum | 2026-10-07 |
| Contraste do botão "Fazer uma doação" (campanhas, início, institucional) | ✅ corrigido: o texto ficava verde sobre magenta; agora branco (7,3:1) | 2026-10-07 |
| Zoom de 200% em todas as telas | ✅ conferido pelo grupo. Achado e corrigido: o menu do celular passava da altura da tela e os últimos itens ficavam inalcançáveis; agora ele rola por dentro | 2026-10-07 |

A checagem olha a tela como ela carrega. Textos que só aparecem depois de uma ação (modais,
mensagens de erro) foram revistos no código de cada fase, não por este script.

### Manual — pendente

Para cada tela: zoom de 200% sem perder conteúdo; navegar só com o teclado (Tab, Enter, Esc)
com o foco sempre visível; mensagens de erro junto do campo; contraste dos textos claros.
Sugestão: usar o leitor de tela NVDA (gratuito) em pelo menos doação, voluntariado e login.

Zoom de 200%: conferido em todas as telas em 2026-10-07 (ver acima). Falta o resto:

| Tela | Zoom 200% | Teclado e foco | Erros junto do campo | Quem / data |
|---|---|---|---|---|
| Portal: início, institucional, campanhas, notícias | | | | |
| Portal: doações (os quatro passos) | | | | |
| Portal: voluntariado, vagas, proposta externa | | | | |
| Portal: consultar status, aviso, login, definir senha, área do doador | | | | |
| Painel: visão geral, itens, campanhas, doações, chave Pix | | | | |
| Painel: três triagens | | | | |
| Painel: usuários, notícias, página institucional | | | | |
| Painel: privacidade, registros, configurações, ajuda | | | | |

## Princípio V — responsividade (T125)

### Automático: largura de celular (375 px), nas 28 telas

| Verificação | Resultado | Data |
|---|---|---|
| Rolagem horizontal | ✅ nenhuma. Achado e corrigido: `aviso-privacidade.html` ficava 8 px mais larga por causa do e-mail longo; agora o texto quebra a linha | 2026-10-07 |

As tabelas do Painel rolam de lado dentro do próprio quadro (`.table-wrap`), de propósito.

### Manual — pendente: quatro navegadores, celular e computador

| Navegador | Celular | Computador | Quem / data |
|---|---|---|---|
| Chrome | | | |
| Firefox | | | |
| Edge | | | |
| Safari (iPhone) | | | |

## Cenários do quickstart (T126) — pendente

Rodar V1 a V12 de `quickstart.md`. Os previews da Vercel estão desligados desde 2026-10-06
(só a `main` é publicada), então rodar no `npm run dev` com o banco `dev`, e o que depende de
e-mail real ou de imagem, no site publicado.

| Cenário | Resultado | Quem / data |
|---|---|---|
| V1 Portal reflete o Painel | | |
| V2 Doação espontânea e conferência | | |
| V3 Doação associativa e conta do doador | | |
| V4 Sem chave Pix | | |
| V5 Triagem com entrevista | | |
| V6 Voluntário menor de idade | | |
| V7 Papéis exclusivos no mesmo CPF | | |
| V8 Encerramento automático | | |
| V9 LGPD | | |
| V10 Controle de acesso | ✅ coberto pelos testes automáticos | 2026-10-07 |
| V11 Nada é excluído | ✅ ver Princípio III acima | 2026-10-07 |
| V12 Página institucional editável | | |

## QR Pix com a chave real (T127)

| Verificação | Resultado | Quem / data |
|---|---|---|
| QR de teste com a chave real (CNPJ) lido em três aplicativos de banco, com nome e valor certos | ✅ informado pelo grupo (CLAUDE.md) | grupo, 2026-10-06 |
| Repetir sempre que a chave for trocada, pelo QR de teste de `admin/pix.html` | regra permanente | — |
