# SAGE — Memória do Projeto

> Última atualização: 2026-09-04
> TCC do IFRJ Campus Pinheiral — sistema web para a ILPI "Recanto dos Velhinhos
> Francisco Gonçalves Barbosa". Repositório: `TCC-Recanto-dos-Velhinhos`
> (GitHub, usuário juAfonso).
>
> **Regra de manutenção:** ao tomar uma decisão nova ou reverter uma antiga,
> atualize este arquivo no mesmo commit. Decisão sem data aqui é decisão que
> alguém vai redescutir do zero na próxima sessão.

---

## O que é o projeto

Sistema web para apoiar a gestão da ILPI (Instituição de Longa Permanência
para Idosos) Recanto dos Velhinhos, em Pinheiral/RJ. Escopo definido por PRD
e 11 casos de uso (CSU01–CSU11), cobrindo doações, campanhas, divulgação
institucional, gestão de usuários, voluntariado, vagas, itens necessários,
solicitações externas de evento/campanha e exercício de direitos do titular
de dados (LGPD).

**O Recanto dos Velhinhos vai efetivamente usar em operação a versão que o
grupo está produzindo no TCC** — não se trata de um protótipo acadêmico à
parte do produto real que a instituição usaria depois. Isso importa porque
qualquer limitação da infraestrutura gratuita escolhida (ver Stack técnica)
afeta o sistema que a instituição vai usar de fato, não só uma demo de
entrega.

**Escopo fora do sistema:** cadastro de residentes, controle de medicamentos,
controle de estoque e IA generativa aparecem num resumo de proposta separado
(mais amplo, para submissão de evento), mas **não fazem parte do PRD/TCC**.
Se alguém trouxer essas features achando que estão no escopo, a referência
correta é o PRD + os 10 CSUs, não o resumo de proposta.

## Stack técnica

- **Hospedagem:** Vercel, no plano gratuito, nesta fase. Implicações
  conhecidas e já registradas no spec.md: sem domínio próprio, sem SLA/suporte
  pago, e possível hibernação do banco após inatividade (pode afetar
  pontualmente prazos como o de disponibilização do comprovante Pix).
- **Banco:** Neon (PostgreSQL) — relacional, plano gratuito, confirmado que
  não exige cartão de crédito. Mantém o modelo relacional já implícito no PRD.
- ~~C#, MySQL, Visual Studio~~ — stack original do TCC, **abandonada** em
  favor de Vercel + Neon para viabilizar hospedagem sem custo algum (nem
  hospedagem nem domínio, nesta fase). Se alguém reintroduzir suposição de
  C#/MySQL num plano técnico, é sinal de que está partindo de uma versão
  desatualizada deste arquivo.
- **Banco NoSQL descartado explicitamente pelo orientador** — não se encaixa
  no tipo de dado do SAGE (mais adequado a mídia/dados desestruturados); rota
  Firebase/Firestore está fora de cogitação.
- **Arquitetura (decidida em 2026-09-04):** HTML/CSS/JS estáticos + funções
  serverless em `/api` na Vercel. **Não** usar Next.js/React — a decisão foi
  manter as páginas do protótipo praticamente como estão e trocar apenas a
  camada mock (`assets/js/data.js`) por chamadas `fetch` à API. Justificativa
  registrada no Princípio I (simplicidade) da constituição: sem build step e
  sem curva de React para um time de 6 pessoas com prazo fixo. Custo aceito:
  sem componentização, algum HTML repetido entre páginas.
- **Upload de arquivos:** Vercel Blob, com URLs privadas/assinadas. Cobre
  currículos, autorização de responsável legal de menores (FR-058) e o anexo
  opcional de comprovante bancário (FR-010b). A Vercel não tem disco
  persistente, então salvar em pasta local não é opção.
- **Testes (decidido em 2026-09-04):** automatizados só nas regras críticas —
  não-duplicação de confirmação de doação (FR-050), geração de protocolo,
  anonimização (FR-055) e controle de acesso por perfil (FR-047). O restante
  é verificado manualmente pelos portões da constituição (acessibilidade,
  responsividade, dados, acesso).
- **Sem API de pagamentos.** Ver a decisão de Pix estático em "Decisões já
  tomadas" — nenhum provedor de pagamentos será contratado ou integrado.
- **Fluxo de trabalho:** Spec Kit + Claude Code (VS Code), especificando e
  planejando a partir do PRD antes de implementar.
- **Front-end:** já existe um protótipo estático (`recanto-frontend`) com as
  páginas index, login, institucional, doacoes, campanhas, noticias, vagas,
  voluntariado, autoatendimento, consultar-status, solicitar-evento e uma
  pasta `admin/` separada. Ele será integrado ao projeto Spec Kit como base
  do plano técnico — não é descartável, é ponto de partida.
  **Atenção (2026-09-04): o protótipo ainda NÃO está no repositório.** Ele
  vive em `C:\Users\afons\Downloads\recanto-frontend\recanto-frontend` na
  máquina da Julia — 21 páginas HTML, `assets/css/style.css` (design system,
  1267 linhas) e 24 módulos JS com dados mock em `localStorage`. Copiar para
  dentro do repo e commitar é pré-requisito da implementação. Cuidado: a
  pasta tem ~9,6 MB por causa de `assets/video/hero-video.mp4`.
- **Se a operação exigir recursos além do plano gratuito no futuro** (mais
  tráfego, domínio próprio), migrar para um plano pago é decisão e custo da
  instituição — não uma obrigação de manutenção contínua do grupo depois da
  entrega.

## Equipe

Ana Carolina, Isadora, Julia, Lara, Maria Fernanda, Richelle.

**Ainda em aberto:** este arquivo não define quem tem autoridade final para
editar decisões aqui. Até decidirem isso formalmente, tratem qualquer edição
deste arquivo como algo a avisar no grupo antes de commitar, não a resolver
sozinho — reduz o risco de duas pessoas reescreverem a mesma decisão em
paralelo.

## Decisões já tomadas (e por quê)

- **Doação só via Pix, com chave/QR code ESTÁTICOS e confirmação manual
  (revertido em 2026-09-04, ratificado em 2026-09-05).** Esta
  decisão **reverte** a decisão anterior descrita logo abaixo. A instituição
  cadastra sua chave Pix e a imagem do QR code no Painel Administrativo; o
  Portal Público apenas as exibe. O pagamento acontece no aplicativo do banco
  do doador, fora do sistema. Depois de pagar, o doador **declara** a doação
  no site (valor, data e, opcionalmente, anexo do comprovante bancário) e
  recebe um protocolo; a declaração nasce **pendente** e só vira confirmada
  quando um funcionário confere a entrada no extrato bancário e confirma no
  Painel. Não há API de pagamentos, cobrança dinâmica nem webhook.
  Motivação: eliminar a dependência de contratar provedor de pagamentos e de
  ter conta PJ habilitada. Custo aceito conscientemente: a conciliação vira
  trabalho humano, e uma doação real cujo doador não declare nada no site
  simplesmente não aparece no sistema. Boleto e cartão continuam fora. Itens
  físicos e dinheiro vivo continuam tratados manualmente, fora do sistema.
  Exigiu emenda ao Princípio VII da constituição (versão 2.0.0), **ratificada
  em 2026-09-05**.
- **Por que a objeção anterior do orientador não alcança esta decisão
  (esclarecido em 2026-09-05).** Ponto importante, porque é o que distingue
  esta reversão de uma desobediência à orientação. O orientador **não se opõe
  a mudanças de rota**; ele objetou especificamente a adotar Pix estático
  **tendo como única justificativa a ausência de custo** — e derrubou essa
  justificativa mostrando que hospedagem e domínio de produção têm custo
  assumido pela instituição de qualquer forma. Esse argumento dele continua
  válido e não está sendo contestado. A justificativa desta decisão é outra:
  elimina a **dependência externa** de a instituição abrir e ter aprovada uma
  conta PJ em provedor de pagamentos, cujo prazo é controlado por terceiros e
  colocaria o cronograma do TCC na mão da burocracia de um gateway. Custo
  nunca foi o argumento aqui. Se alguém reabrir esse assunto, é este o
  raciocínio a apresentar — não "sai mais barato".
- ~~**Doação via Pix com API de pagamentos dinâmica.**~~ **Decisão anterior,
  revertida em 2026-09-04 pelos itens acima.** Registro do histórico: chegou
  a se cogitar reduzir o CSU01 para chave Pix fixa/confirmação 100% manual,
  motivado pela hipótese de custo zero permanente. Essa hipótese caiu, e na
  ocasião o CSU01 foi mantido como desenhado originalmente: API de terceiros
  gerando QR code, consulta periódica de status e confirmação manual apenas
  como *fallback*.
- **Toda declaração de doação gera um código de protocolo** (espontânea ou
  associativa), no mesmo padrão já usado para voluntariado/candidatura/
  solicitação externa — permite ao doador consultar o status e obter a
  declaração de doação depois, mesmo tendo saído da página e mesmo sem se
  identificar.
- **Voluntários e candidatos a vaga passam por triagem/aprovação obrigatória**
  da administração antes de ficarem ativos. Não há autoaprovação. **Rejeição
  exige motivo registrado nas três triagens** (voluntário, candidatura,
  solicitação externa) — não só na solicitação externa, como estava antes.
- **Pessoa que já é voluntária e tem candidatura a vaga aprovada acumula o
  perfil de funcionário no mesmo cadastro** (mesmo CPF), em vez de gerar um
  usuário duplicado.
- **Toda submissão pública (voluntariado, candidatura, solicitação externa)
  dispara e-mail automático de confirmação** para o autor, com o código de
  protocolo e aviso de que a análise pode levar alguns dias.
- **Usuários nunca são excluídos fisicamente, só inativados.** Preserva
  histórico. Se alguma feature nova pedir "deletar usuário" no sentido de
  apagar a linha do banco, isso é sinal de que fugiu do padrão do projeto —
  parar e confirmar antes de implementar. **Exceção acordada em 2026-09-04:**
  anonimização a pedido do titular (LGPD, FR-055) torna os dados pessoais
  ilegíveis mas mantém o registro, o histórico e a auditoria — é o mecanismo
  que concilia o direito do titular com a preservação de histórico.
- **A conformidade com a LGPD entrou no escopo desta versão (2026-09-04).**
  Foi avaliada a alternativa de deixar a LGPD como responsabilidade jurídica
  da instituição, fora do sistema, e ela foi descartada: como o Recanto vai
  operar de verdade com este sistema, coletando CPF, endereço, dados de
  menores e currículos, a operação real ficaria em desconformidade desde o
  primeiro cadastro. O que o sistema passa a garantir: consentimento
  explícito registrado nos formulários públicos (com data/hora, finalidade e
  versão do aviso), aviso de privacidade público, canal de exercício de
  direitos por protocolo, anonimização, revogação de consentimento e prazos
  de retenção (FR-051 a FR-059, CSU11/User Story 11 do spec.md). Continua
  fora do sistema, como responsabilidade organizacional da instituição: a
  designação do encarregado (DPO), a redação jurídica do aviso de privacidade
  e a definição formal das bases legais e dos prazos de retenção — o sistema
  apenas aplica os textos e prazos que a instituição fornecer.
- **Falhas de serviços externos não derrubam o registro do usuário
  (2026-09-04).** Se o e-mail de confirmação falhar, o cadastro/candidatura/
  solicitação é mantido, o sistema tenta reenviar uma vez e, persistindo a
  falha, registra internamente para reenvio manual (FR-049a). Do lado da
  doação, a reversão para Pix estático eliminou a dependência de API: se
  nenhuma chave Pix estiver cadastrada, o fluxo de declaração simplesmente
  não é oferecido (FR-007a). Uma doação já confirmada não pode ser confirmada
  de novo, e declarações pendentes com valor/data próximos são sinalizadas ao
  funcionário como possível duplicata (FR-050). Não existe mais janela de 15
  minutos: toda declaração nasce pendente e assim fica até a conferência
  humana.
- **Acesso ao Painel Administrativo é por conta institucional compartilhada**,
  não por login individual por funcionário. Como consequência, **a auditoria
  registra qual conta institucional executou cada ação, não qual funcionário
  específico** — rastreabilidade individual não é possível nesse desenho, e
  isso foi aceito conscientemente, não é lacuna.
- **Tentativa de acesso a uma funcionalidade fora do nível de permissão do
  perfil é negada e registrada** no histórico de auditoria.
- **Autoatendimento de voluntário/doador associado permite redefinição de
  senha por e-mail**, sem depender de um funcionário.
- **Padrão de documentação dos casos de uso:** Código/Nome, Sumário, Ator
  Principal/Secundário, Pré-condições, Fluxo (colunas Ator/Sistema),
  Pós-condições — mesmo formato das seções 19.1/19.2 (Histórias de Usuário +
  Testes de Aceitação) do modelo do TCC. Qualquer caso de uso novo segue esse
  mesmo formato, sem inventar estrutura própria. Essa seção já foi expandida
  de 19 para 21 histórias, incorporando os itens acima (protocolo de doação,
  redefinição de senha, controle de acesso por permissão, entre outros).

## Os 11 casos de uso (referência rápida)

CSU01 Doação via Pix · CSU02 Campanhas e Eventos · CSU03 Divulgação
Institucional · CSU04 Manter Usuários (com painel consolidado) · CSU05
Cadastrar Voluntário · CSU06 Cadastrar Candidato a Vaga · CSU07 Manter Itens
Necessários · CSU08 Solicitar Evento/Campanha Externa · CSU09 Autoatendimento
de Voluntário/Doador · CSU10 Consultar Status de Solicitação · **CSU11
Exercício de Direitos do Titular (LGPD)** — adicionado em 2026-09-04, ver
"Decisões já tomadas".

Esses 11 são o recorte de alto nível do PRD. O detalhamento em
FRs/cenários de aceitação (spec.md e seção 19) já passou de FR-001–FR-044
para FR-001–FR-059 (incluindo FR-007a e FR-049a), com as adições listadas em
"Decisões já tomadas" — ao consultar requisito por número, usar a versão mais
recente do spec.md, não esta lista resumida.

**Pendências (atualizado em 2026-09-05):**

1. O CSU01 reescrito (Pix estático) e o CSU11 novo (LGPD) já estão redigidos
   no formato de caso de uso do TCC em `docs/casos-de-uso-tcc.md`. **Falta
   colar no PRD e na seção 19** do documento do TCC — o arquivo é a redação,
   não o documento final. Lembrar que o CSU01 lá **substitui** a versão
   antiga, não se soma a ela.
2. O protótipo em `public/` ainda tem `doacoes.html` e `admin/doacoes.html`
   descrevendo o fluxo com API de pagamentos, e o `public/README.md` ainda
   cita a stack abandonada (C#/MySQL) e as credenciais de demonstração
   `admin`/`admin123` — que não podem sobreviver ao `db/seed.js` real.
3. `assets/img` do protótipo está vazia: todas as fotos institucionais ainda
   precisam vir do Recanto, cada uma com texto alternativo (Princípio II).

## Inegociável

- Não implementar nada fora dos 11 CSUs sem antes atualizar o PRD e este
  arquivo — código certo pra escopo errado é o erro mais caro de evitar aqui.
- Não reintroduzir boleto/cartão ou exclusão física de usuário sem decisão
  explícita da equipe registrada aqui. Anonimização a pedido do titular
  (FR-055) **não** é exclusão física e é permitida — a linha do registro, o
  histórico e a auditoria continuam existindo.
- Não reintroduzir API de pagamentos/cobrança Pix dinâmica/webhook no CSU01
  sem uma nova decisão explícita. **Esta regra inverteu de sinal em
  2026-09-04:** antes ela proibia o Pix estático; agora o Pix estático é a
  decisão vigente (ver "Decisões já tomadas"). Se alguém propuser API de
  pagamentos partindo do spec antigo, é sinal de que está lendo uma versão
  desatualizada.
- Não justificar o Pix estático por "custo zero" — essa justificativa
  específica já foi derrubada pelo orientador e reabri-la reabre a discussão
  toda. O argumento correto é a eliminação da dependência de conta PJ em
  gateway (ver "Decisões já tomadas").
- Não tratar a declaração do doador como confirmação de recebimento. Sem API,
  só um funcionário conferindo o extrato bancário pode confirmar uma doação.
- Não assumir C#/MySQL em nenhum plano técnico novo — a stack de hospedagem
  e banco já está decidida (Vercel + Neon/PostgreSQL).

## Harness — peças que já existem / ainda faltam

- [x] Memória do projeto — este arquivo.
- [ ] Regra por área — ainda não há pasta com restrição própria documentada.
      Candidata natural: uma regra em `admin/` sobre quem pode aprovar
      voluntário/candidato (liga com a triagem obrigatória acima).
- [ ] Hook — nenhum definido ainda. Só criar quando um erro real acontecer
      duas vezes (ex.: alguém commitar sem seguir o formato de caso de uso).
- [ ] Skill / Agente — não neste estágio do projeto (Parte 8 do kit de
      harness: só depois de um procedimento se repetir de fato).

---

*Atualizado a partir das decisões tomadas com o orientador e das definições
de escopo do grupo. Revisem, corrijam o que estiver errado ou desatualizado,
e datem qualquer mudança.*