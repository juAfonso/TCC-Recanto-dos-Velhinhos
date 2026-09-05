# SAGE — Recanto dos Velhinhos Francisco Gonçalves Barbosa

Front-end completo (Portal Público + Painel Administrativo) do sistema web da ILPI
Recanto dos Velhinhos Francisco Gonçalves Barbosa (Pinheiral/RJ), desenvolvido para o
TCC do IFRJ Campus Pinheiral.

> ⚠️ **Este pacote contém apenas o FRONT-END.** Não há backend/API real: todos os
> dados (itens, campanhas, doações, usuários, cadastros, notícias etc.) são
> simulados em `localStorage`, no arquivo `assets/js/data.js`. Isso permite navegar
> por todas as telas e fluxos descritos no roteiro do TCC sem depender de um
> servidor. Quando o backend for implementado, essa camada mock deve ser
> substituída por chamadas reais à API.

## Como rodar no VS Code

1. Extraia o `.zip` e abra a pasta `recanto-frontend` no VS Code.
2. Instale a extensão **Live Server** (Ritwick Dey) caso ainda não tenha.
3. Clique com o botão direito em `index.html` → **"Open with Live Server"**
   (ou clique em "Go Live" na barra inferior do VS Code).
4. O navegador abrirá em `http://127.0.0.1:5500` (ou porta similar).

> Um servidor local (Live Server, `npx serve`, etc.) é recomendado porque algumas
> telas usam `localStorage`/upload de arquivo, que funcionam melhor sob `http://`
> do que abrindo o `index.html` diretamente como arquivo (`file://`). Se preferir,
> também é possível apenas abrir `index.html` no navegador — a navegação
> funciona, mas o ideal é usar um servidor local.

## Estrutura do projeto

```
recanto-frontend/
├── index.html                  → Home do Portal Público
├── institucional.html          → História, missão e equipe (FR-001)
├── campanhas.html               → Campanhas e eventos ativos (FR-002)
├── doacoes.html                 → Itens necessários + doação Pix (FR-003 a FR-010)
├── voluntariado.html            → Cadastro de voluntário com triagem (FR-011 a FR-015)
├── vagas.html                   → Candidatura a vaga de emprego (FR-016 a FR-019)
├── solicitar-evento.html        → Solicitação externa de evento/campanha (FR-020 a FR-022)
├── consultar-status.html        → Consulta pública de status por protocolo (FR-043, FR-044)
├── noticias.html                → Notícias e divulgação institucional (FR-032, FR-033)
├── login.html                   → Login (Painel Administrativo + Autoatendimento)
├── autoatendimento.html         → Área restrita de voluntários/doadores (FR-041, FR-042)
├── admin/
│   ├── dashboard.html           → Indicadores e alertas prioritários (FR-036)
│   ├── itens.html                → Gestão de itens necessários (FR-026 a FR-028)
│   ├── campanhas.html            → Gestão de campanhas/eventos (FR-029 a FR-031)
│   ├── doacoes.html              → Gestão de doações e confirmação de pagamento (FR-008)
│   ├── usuarios.html             → Gestão de usuários — busca, edição, inativação (FR-023 a FR-025)
│   ├── triagem-voluntarios.html  → Triagem de cadastros de voluntários
│   ├── triagem-vagas.html        → Triagem de candidaturas a vaga
│   ├── triagem-eventos.html      → Triagem de solicitações externas
│   └── noticias.html             → Publicação de notícias institucionais
└── assets/
    ├── css/style.css             → Design system (cores, componentes, layout)
    ├── js/
    │   ├── data.js                → "Banco de dados" mock (localStorage)
    │   ├── auth.js                → Autenticação simulada (admin + autoatendimento)
    │   ├── utils.js                → Helpers (toasts, formatação, protocolo, badges)
    │   ├── nav.js / admin-guard.js / admin-modal.js → comportamento de UI
    │   └── page-*.js / admin-*.js  → lógica específica de cada tela
    ├── video/hero-video.mp4       → Vídeo de fundo do hero (herdado do modelo MANAS)
    └── img/
```

## Identidade visual

A paleta de cores, a navbar, o hero em vídeo e os principais componentes visuais
foram herdados e estendidos a partir do modelo estético fornecido (pasta MANAS),
mantendo a mesma identidade em todas as novas telas criadas:

- `--magenta: #8E3B46` · `--cyclamen: #F28CAB` · `--fairy: #F7D6E0`
- `--tea: #CDE7BE` · `--viridian: #40826D`

## Credenciais de demonstração

**Painel Administrativo** (conta administrativa compartilhada — FR-040):
- Usuário: `admin`
- Senha: `admin123`

**Autoatendimento** (voluntário e doador associado — FR-041):
- Voluntária: `isadora.voluntaria@gmail.com` / senha `voluntario123`
- Doadora: `ana.doadora@gmail.com` / senha `doador123`

## Fluxos já implementados no front-end

- Doação financeira via Pix (espontânea/associativa) com geração de QR simulado,
  status pendente → confirmada, e comprovante.
- Cadastro de voluntário com exigência de anexo de autorização para menores de
  18 anos, geração de protocolo e triagem (aprovar/rejeitar) no Painel.
- Candidatura a vaga exigindo currículo em arquivo OU descrição textual, com
  aprovação que efetiva o cadastro como funcionário.
- Solicitação externa de evento/campanha com verificação de conflito de data e
  rejeição com motivo **obrigatório** (demais rejeições têm motivo opcional).
- Consulta pública de status por código de protocolo, sem exigir login e sem
  expor dados de terceiros.
- Gestão de itens necessários com busca, baixa e sinalização de itens sem
  atualização há mais de 30 dias.
- Gestão de campanhas/eventos com checagem de conflito de datas e publicação
  automática no Portal Público.
- Painel de indicadores com alertas prioritários e registro de auditoria
  (autor + data/hora de cada ação administrativa — FR-035).
- Gestão de usuários com busca por CPF/e-mail, edição e **inativação** (nunca
  exclusão definitiva — FR-024).
- Publicação de notícias com tentativa de sincronização simulada com rede
  social, sem nunca bloquear a publicação no site (FR-033).

## Reiniciar os dados de demonstração

Os dados ficam salvos no `localStorage` do navegador. Para restaurar o estado
inicial de demonstração, abra o console do navegador (F12) na página do site e
execute:

```js
localStorage.removeItem('sage_db_v1');
sessionStorage.removeItem('sage_session_v1');
location.reload();
```

## Próximos passos (fora do escopo deste front-end)

Integração com backend real (API C#/MySQL conforme especificado no TCC),
autenticação segura, upload real de arquivos, integração com API de pagamentos
Pix e sincronização real com redes sociais.
