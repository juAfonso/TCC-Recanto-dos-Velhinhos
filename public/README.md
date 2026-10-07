# SAGE — páginas do Portal Público e do Painel Administrativo

Front-end do sistema web da ILPI Recanto dos Velhinhos Francisco Gonçalves Barbosa
(Pinheiral/RJ), TCC do IFRJ Campus Pinheiral. São páginas HTML, CSS e JavaScript estáticos,
sem framework e sem etapa de build. Todos os dados vêm da API do próprio projeto
(funções em `rotas/`, servidas por `api/index.js`), com banco PostgreSQL no Neon e arquivos
no Vercel Blob.

> Até 2026-10-06 este front era um protótipo com dados simulados em `localStorage`
> (`assets/js/data.js`). Essa camada foi substituída pela API fase a fase e **removida em
> 2026-10-07**. Se encontrar instrução falando em Live Server, `localStorage` ou
> `data.js`, é texto desatualizado.

## Como rodar

Não abra o `index.html` direto, nem use Live Server: as páginas precisam da API. Na raiz do
repositório:

```
npm install
npm run dev
```

O passo a passo completo (Node 24, `.env.local`, bancos do Neon, seed de demonstração e
roteiro de validação) está em [`specs/001-portal-painel-ilpi/quickstart.md`](../specs/001-portal-painel-ilpi/quickstart.md).

Não há credenciais fixas no código. No banco de desenvolvimento, `npm run seed -- --demo`
cria a conta do Painel e uma doadora de demonstração (valores em `db/seed.js`). Em produção,
a senha do Painel é gerada pelo seed e mostrada uma única vez; a do doador associado é criada
por ele, pelo link enviado ao e-mail.

## Páginas

```
public/
├── index.html               → Início: campanhas, itens mais urgentes e notícias
├── institucional.html       → História, missão, equipe, acolhimento e bazar (FR-001)
├── campanhas.html           → Eventos e campanhas em andamento (FR-002)
├── doacoes.html             → Itens necessários e doação por Pix estático (FR-003 a FR-010)
├── voluntariado.html        → Cadastro de voluntário (FR-011 a FR-015)
├── termo-adesao.html        → Termo de adesão para imprimir (FR-012a)
├── autorizacao-menor.html   → Autorização do responsável para imprimir (FR-012)
├── vagas.html               → Candidatura a vaga (FR-016 a FR-019)
├── solicitar-evento.html    → Proposta externa de evento ou campanha (FR-020 a FR-022)
├── consultar-status.html    → Consulta pelo protocolo (FR-044)
├── noticias.html            → Notícias (FR-032)
├── aviso-privacidade.html   → Aviso de privacidade vigente (FR-053)
├── login.html               → Entrada no Painel e na área do doador
├── definir-senha.html       → Criar ou trocar a senha do doador associado (FR-046)
├── autoatendimento.html     → Área do doador associado (FR-041)
└── admin/                   → Painel Administrativo (conta institucional compartilhada)
    ├── dashboard.html       → Visão geral e alertas (FR-036)
    ├── itens.html, campanhas.html, doacoes.html, pix.html
    ├── usuarios.html        → Pessoas e papéis; inativar, nunca excluir (FR-023, FR-024)
    ├── triagem-voluntarios.html, triagem-vagas.html, triagem-eventos.html
    ├── noticias.html, institucional.html
    ├── lgpd.html            → Revogação, anonimização, retenção e aviso de privacidade
    ├── auditoria.html       → Histórico de ações e e-mails que falharam
    ├── configuracoes.html   → Prazos e contato da instituição
    └── ajuda.html           → Como operar o Painel e o que o sistema não faz (FR-060)
```

Em `assets/js/`: `api.js` (chamadas à API), `auth.js` (sessões, sempre decididas pelo
servidor), `utils.js`, `mascaras.js`, `consentimento.js`, `pix.js` (BR Code do Pix estático)
e um arquivo `page-*.js` ou `admin-*.js` por tela. `assets/vendor/qrcode.js` desenha o QR code
(ver `research.md` D9).

## Identidade visual

Paleta herdada do modelo MANAS: `--magenta: #8E3B46` · `--cyclamen: #F28CAB` ·
`--fairy: #F7D6E0` · `--tea: #CDE7BE` · `--viridian: #40826D`. O hero é a fachada real do
Recanto (`assets/img/newNewHero.jpg`). O vídeo do modelo saiu em 2026-09-05 (peso, dados
móveis e autoplay atrapalhando leitor de tela).

## Pendente

- **Fotos reais** da instituição, equipe e campanhas, cada uma com texto alternativo
  (Princípio II). A equipe inclui pela tela "Página institucional" do Painel.
