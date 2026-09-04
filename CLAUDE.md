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
e 10 casos de uso (CSU01–CSU10), cobrindo doações, campanhas, divulgação
institucional, gestão de usuários, voluntariado, vagas, itens necessários e
solicitações externas de evento/campanha.

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
- **Fluxo de trabalho:** Spec Kit + Claude Code (VS Code), especificando e
  planejando a partir do PRD antes de implementar.
- **Front-end:** já existe um protótipo estático (`recanto-frontend`) com as
  páginas index, login, institucional, doacoes, campanhas, noticias, vagas,
  voluntariado, autoatendimento, consultar-status, solicitar-evento e uma
  pasta `admin/` separada. Ele será integrado ao projeto Spec Kit como base
  do plano técnico — não é descartável, é ponto de partida.
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

- **Doação só via Pix, com API de pagamentos dinâmica — não simplificada
  para Pix estático.** Chegou a se cogitar reduzir o CSU01 para chave Pix
  fixa/confirmação 100% manual, motivado pela hipótese de custo zero
  permanente. O orientador esclareceu que hospedagem/domínio de produção real
  têm custo assumido pela instituição de qualquer forma, então essa hipótese
  caiu e o CSU01 foi mantido como desenhado originalmente: API de terceiros
  gera QR code, o sistema consulta o status periodicamente, e há confirmação
  manual pelo funcionário como *fallback* quando a automática não chega a
  tempo. Boleto e cartão continuam fora do sistema. Itens físicos e dinheiro
  vivo são tratados manualmente pela administração, fora do sistema.
- **Toda doação gera um código de protocolo ao ser iniciada** (espontânea ou
  associativa), no mesmo padrão já usado para voluntariado/candidatura/
  solicitação externa — permite ao doador consultar o status e recuperar o
  comprovante depois, mesmo tendo saído da página e mesmo sem se identificar.
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
- **Usuários nunca são excluídos, só inativados.** Preserva histórico. Se
  alguma feature nova pedir "deletar usuário", isso é sinal de que fugiu do
  padrão do projeto — parar e confirmar antes de implementar.
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

## Os 10 casos de uso (referência rápida)

CSU01 Doação via Pix · CSU02 Campanhas e Eventos · CSU03 Divulgação
Institucional · CSU04 Manter Usuários (com painel consolidado) · CSU05
Cadastrar Voluntário · CSU06 Cadastrar Candidato a Vaga · CSU07 Manter Itens
Necessários · CSU08 Solicitar Evento/Campanha Externa · CSU09 Autoatendimento
de Voluntário/Doador · CSU10 Consultar Status de Solicitação

Esses 10 continuam sendo o recorte de alto nível do PRD. O detalhamento em
FRs/cenários de aceitação (spec.md e seção 19) já passou de FR-001–FR-044
para FR-001–FR-049, com as adições listadas em "Decisões já tomadas" — ao
consultar requisito por número, usar a versão mais recente do spec.md, não
esta lista resumida.

## Inegociável

- Não implementar nada fora dos 10 CSUs sem antes atualizar o PRD e este
  arquivo — código certo pra escopo errado é o erro mais caro de evitar aqui.
- Não reintroduzir boleto/cartão ou exclusão física de usuário sem decisão
  explícita da equipe registrada aqui.
- Não simplificar novamente o CSU01 para Pix estático/confirmação 100%
  manual sem uma nova decisão explícita — essa rota já foi avaliada e
  descartada pelo orientador.
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
e 10 casos de uso (CSU01–CSU10), cobrindo doações, campanhas, divulgação
institucional, gestão de usuários, voluntariado, vagas, itens necessários e
solicitações externas de evento/campanha.

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
- **Fluxo de trabalho:** Spec Kit + Claude Code (VS Code), especificando e
  planejando a partir do PRD antes de implementar.
- **Front-end:** já existe um protótipo estático (`recanto-frontend`) com as
  páginas index, login, institucional, doacoes, campanhas, noticias, vagas,
  voluntariado, autoatendimento, consultar-status, solicitar-evento e uma
  pasta `admin/` separada. Ele será integrado ao projeto Spec Kit como base
  do plano técnico — não é descartável, é ponto de partida.
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

- **Doação só via Pix, com API de pagamentos dinâmica — não simplificada
  para Pix estático.** Chegou a se cogitar reduzir o CSU01 para chave Pix
  fixa/confirmação 100% manual, motivado pela hipótese de custo zero
  permanente. O orientador esclareceu que hospedagem/domínio de produção real
  têm custo assumido pela instituição de qualquer forma, então essa hipótese
  caiu e o CSU01 foi mantido como desenhado originalmente: API de terceiros
  gera QR code, o sistema consulta o status periodicamente, e há confirmação
  manual pelo funcionário como *fallback* quando a automática não chega a
  tempo. Boleto e cartão continuam fora do sistema. Itens físicos e dinheiro
  vivo são tratados manualmente pela administração, fora do sistema.
- **Toda doação gera um código de protocolo ao ser iniciada** (espontânea ou
  associativa), no mesmo padrão já usado para voluntariado/candidatura/
  solicitação externa — permite ao doador consultar o status e recuperar o
  comprovante depois, mesmo tendo saído da página e mesmo sem se identificar.
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
- **Usuários nunca são excluídos, só inativados.** Preserva histórico. Se
  alguma feature nova pedir "deletar usuário", isso é sinal de que fugiu do
  padrão do projeto — parar e confirmar antes de implementar.
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

## Os 10 casos de uso (referência rápida)

CSU01 Doação via Pix · CSU02 Campanhas e Eventos · CSU03 Divulgação
Institucional · CSU04 Manter Usuários (com painel consolidado) · CSU05
Cadastrar Voluntário · CSU06 Cadastrar Candidato a Vaga · CSU07 Manter Itens
Necessários · CSU08 Solicitar Evento/Campanha Externa · CSU09 Autoatendimento
de Voluntário/Doador · CSU10 Consultar Status de Solicitação

Esses 10 continuam sendo o recorte de alto nível do PRD. O detalhamento em
FRs/cenários de aceitação (spec.md e seção 19) já passou de FR-001–FR-044
para FR-001–FR-049, com as adições listadas em "Decisões já tomadas" — ao
consultar requisito por número, usar a versão mais recente do spec.md, não
esta lista resumida.

## Inegociável

- Não implementar nada fora dos 10 CSUs sem antes atualizar o PRD e este
  arquivo — código certo pra escopo errado é o erro mais caro de evitar aqui.
- Não reintroduzir boleto/cartão ou exclusão física de usuário sem decisão
  explícita da equipe registrada aqui.
- Não simplificar novamente o CSU01 para Pix estático/confirmação 100%
  manual sem uma nova decisão explícita — essa rota já foi avaliada e
  descartada pelo orientador.
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