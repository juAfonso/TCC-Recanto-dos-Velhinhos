<!--
Sync Impact Report
==================
Mudança de versão: 3.0.0 → 3.0.1
Data: 2026-10-06
Tipo de bump: PATCH (esclarecimentos de redação nos Princípios VII e VIII, sem mudança de regra)

STATUS DESTA EMENDA: RATIFICADA em 2026-10-06, aprovada pelo grupo a partir do
/speckit-analyze de 2026-10-05.

Princípios alterados:
  - VII: "chave Pix e/ou imagem de QR code fornecidas pela própria instituição" →
    "chave Pix fornecida pela própria instituição [...], a partir da qual o Portal gera o QR
    code estático". Alinha o texto à decisão de 2026-10-03 (QR gerado no navegador a partir
    da chave); a imagem de QR enviada pela equipe deixou de existir.
  - VIII: nova regra esclarecendo que a conta de autoatendimento do doador associado não é
    cadastro sujeito a triagem. A regra "nenhum envio de acesso antes da aprovação humana"
    podia ser lida como proibindo o link de definição de senha do FR-006a. O princípio
    existe para proteger quem tem contato com os residentes; o doador não tem esse contato,
    e a doação dele continua dependendo de conferência humana.

Impacto sobre trabalho já realizado: nenhum. spec.md, plan.md e tasks.md já seguiam este
entendimento; a emenda só torna a leitura inequívoca.

Princípios inalterados: I, II, III, IV, V, VI.

Emenda anterior (3.0.0, ratificada em 2026-10-05) — registro mantido abaixo
==========================================================================
Mudança de versão: 2.0.0 → 3.0.0
Data: 2026-10-05
Tipo de bump: MAJOR (redefinição incompatível de regra do Princípio IV)

STATUS DESTA EMENDA: RATIFICADA em 2026-10-05.
Aprovada pelo responsável pelo projeto (autor do TCC), com ciência da orientação, conforme
exige a Governança. O texto 2.0.0 do Princípio IV fica transcrito em "Antes" como histórico.

Princípio alterado:
  - IV. "Separação Clara de Contextos e Proteção de Dados Pessoais" (título mantido)
    Antes: "O Painel Administrativo DEVE aplicar controle de acesso por perfil: funcionário,
    voluntário e doador associado. Cada perfil enxerga apenas o que sua função exige." e
    "Dados pessoais de voluntários, candidatos e doadores — incluindo autorizações de menores
    de idade — SÃO acessíveis somente a perfis autorizados e nunca são expostos no Portal
    Público." O parágrafo de abertura citava só dois módulos: Portal Público e Painel.
    Depois: controle de acesso por tipo de acesso autenticado — conta institucional do Painel
    e doador associado (autoatendimento); funcionários e voluntários são cadastros sem login;
    o dado protegido do menor é o registro do recebimento da autorização, não o documento; o
    autoatendimento é nomeado como terceiro contexto.

Justificativa: o texto 2.0.0 descrevia o desenho de agosto, com três perfis entrando no
sistema. Duas decisões já registradas no CLAUDE.md e no spec.md o mudaram: acesso ao Painel
por conta institucional compartilhada, sem login individual de funcionário (2026-08-13,
FR-040), e fim do autoatendimento de voluntário (2026-10-03, FR-041). Desde 2026-10-03 a
autorização do responsável legal é entregue em papel e o sistema só registra o recebimento
(FR-012, FR-058). A emenda não muda o desenho do sistema; alinha o princípio a ele. Sem ela,
o Constitution Check do /speckit-plan reprovaria o desenho decidido, ou induziria a
reintroduzir logins de funcionário e voluntário fora do escopo.
O bump é MAJOR porque a regra de versionamento classifica assim a redefinição incompatível
de regra, embora o efeito prático seja apenas de alinhamento.

Regras mantidas sem alteração: verificação de autorização no servidor, LGPD (coleta mínima,
finalidade declarada, acesso restrito), nenhuma exposição de dado pessoal no Portal Público.

Impacto sobre trabalho já realizado:
  - spec.md: nenhum; FR-025, FR-038, FR-040, FR-041, FR-042 e FR-058 já descrevem os dois
    acessos (alinhados em 2026-10-05).
  - plan.md: o Constitution Check já desenhava três zonas de acesso (pública,
    autoatendimento, admin); será refeito no próximo /speckit-plan.
  - Protótipo e código: nenhum impacto.

Princípios inalterados: I, II, III, V, VI, VII, VIII.

TODOs pendentes: nenhum.

Emenda anterior (2.0.0, ratificada em 2026-09-05) — registro mantido abaixo
==========================================================================
Mudança de versão: 1.0.0 → 2.0.0
Data: 2026-09-04
Tipo de bump: MAJOR (redefinição incompatível do Princípio VII)

STATUS DESTA EMENDA: RATIFICADA em 2026-09-05.
A Governança exige aprovação do responsável pelo projeto "com ciência da orientação".
Esta emenda esteve registrada como proposta pendente entre 2026-09-04 e 2026-09-05, porque
a rota de Pix estático constava como descartada pelo orientador. O responsável pelo projeto
esclareceu em 2026-09-05 o alcance real daquela objeção: o orientador não se opõe a mudanças
de rota em si — ele objetou especificamente a adotar Pix estático **tendo como única
justificativa a ausência de custo**, hipótese que ele mesmo derrubou ao mostrar que
hospedagem e domínio de produção têm custo assumido pela instituição de qualquer forma.

A justificativa desta emenda é outra e não foi alcançada por aquela objeção: o que se elimina
não é custo, e sim a **dependência externa** de a instituição abrir e ter aprovada uma conta
PJ em provedor de pagamentos — dependência cujo prazo é controlado por terceiros e colocaria
o cronograma do TCC nas mãos da burocracia de um gateway. O argumento do orientador sobre
custo permanece válido e não é contestado aqui.

Bloqueio de implementação do CSU01: LEVANTADO.

Princípio alterado:
  - VII. "Pix como Único Meio de Doação Digital"
      → "Pix como Único Meio de Doação Digital, sem Custódia nem Integração de Pagamento"
    Antes: doações DEVEM ser processadas via API de pagamentos de terceiros compatível com Pix.
    Depois: doações usam chave Pix/QR code estáticos cadastrados pela instituição; o sistema
    NÃO integra API de pagamentos; o doador declara a doação e um humano confirma contra o
    extrato bancário.

Justificativa: eliminar a dependência de contratação de provedor de pagamentos e de conta PJ
habilitada, viabilizando a operação real da instituição sem custo nem vínculo contratual.
Custo aceito: a conciliação passa a ser trabalho humano e a confirmação deixa de ser
automática.

Seções alteradas:
  - Restrições de Escopo e Conformidade → "Integrações externas" não inclui mais API de
    pagamentos; passa a listar e-mail transacional e armazenamento de arquivos.

Impacto sobre trabalho já realizado:
  - spec.md: reescritos FR-007, FR-007a, FR-008, FR-010, FR-045, FR-050, SC-001 e SC-009;
    User Story 2 e a entidade Doação redesenhadas; Assumptions e Edge Cases ajustados.
  - CLAUDE.md: decisão de 2026-09-04 registrada, revertendo a decisão anterior do orientador.
  - Protótipo recanto-frontend: a tela de doação e a de gestão de doações precisam refletir
    o novo fluxo (declaração + confirmação manual), já próximo do que o mock simula.
  - Nenhum código de aplicação foi escrito ainda — o impacto é integralmente documental.

Princípios inalterados: I, II, III, IV, V, VI, VIII.

TODOs pendentes: nenhum.
-->

# Constituição do Sistema Web do Recanto dos Velhinhos Francisco Gonçalves Barbosa

Aplicação web para a ILPI (Instituição de Longa Permanência para Idosos) "Recanto dos
Velhinhos Francisco Gonçalves Barbosa", em Pinheiral/RJ, desenvolvida como Trabalho de
Conclusão de Curso no IFRJ — Campus Pinheiral.

## Core Principles

### I. Simplicidade Acima de Sofisticação

A interface DEVE ser utilizável por funcionários e voluntários com baixa familiaridade
tecnológica — muitos deles idosos — sem exigir treinamento extenso. Diante de duas soluções
que atendam ao mesmo requisito, a mais simples DEVE ser escolhida.

Regras não negociáveis:

- Toda tarefa administrativa frequente DEVE ser concluível sem consultar documentação externa.
- Fluxos DEVEM usar linguagem cotidiana em português; jargão técnico é proibido em textos
  visíveis ao usuário final.
- Novas dependências, abstrações ou camadas arquiteturais DEVEM ser justificadas por escrito
  no plano da feature; ausência de justificativa reprova a entrega.
- Configurabilidade especulativa ("pode ser útil depois") NÃO PODE ser implementada.

Justificativa: o público operador do sistema é o fator limitante de adoção. Um recurso que
ninguém da instituição consegue usar tem valor zero, independentemente de sua qualidade técnica.

### II. Acessibilidade como Requisito de Qualidade

Acessibilidade É requisito funcional, nunca item opcional ou "melhoria futura". Toda tela nova
DEVE atender, antes de ser considerada pronta:

- Contraste adequado entre texto e fundo, verificado explicitamente.
- Fontes legíveis, com tamanho base confortável para leitores idosos e sem quebra de layout
  quando o usuário amplia o zoom do navegador.
- Navegação completa por teclado, com foco visível e ordem de tabulação coerente.
- Texto alternativo descritivo em toda imagem que transmita informação.
- Rótulos associados a todos os campos de formulário e mensagens de erro compreensíveis.

Uma tela que não cumpra todos os itens acima NÃO PODE ser marcada como concluída.

Justificativa: o público do portal inclui idosos, familiares de residentes e voluntários com
necessidades diversas; barreiras de acesso excluem exatamente as pessoas que o sistema serve.

### III. Integridade e Rastreabilidade de Dados

Nenhum registro do sistema — usuário, doação, candidatura, item necessário, solicitação de
evento — PODE ser excluído fisicamente. Todo histórico DEVE ser preservado.

Regras não negociáveis:

- Exclusão é substituída por inativação (soft delete) ou por mudança de status
  (pendente, aprovado, rejeitado, inativo).
- Operações `DELETE` destrutivas sobre dados de negócio NÃO PODEM existir na API nem na
  camada de persistência.
- Toda mudança de status DEVE registrar quem efetuou a ação e quando.
- Interfaces administrativas DEVEM permitir consultar registros inativos, nunca escondê-los
  em definitivo.

Justificativa: a instituição precisa prestar contas de doações e de vínculos com voluntários;
dado apagado é prestação de contas perdida.

### IV. Separação Clara de Contextos e Proteção de Dados Pessoais

O Portal Público (sem login), o autoatendimento do doador associado e o Painel Administrativo
são contextos distintos, com regras de acesso próprias e fronteiras explícitas no código.

Regras não negociáveis:

- O sistema DEVE aplicar controle de acesso por tipo de acesso autenticado: a conta
  institucional do Painel Administrativo, compartilhada pela equipe, e o doador associado, no
  autoatendimento. Cada acesso enxerga apenas o que sua função exige; o doador associado vê
  exclusivamente os próprios dados. Funcionários e voluntários existem como cadastros, sem
  login individual.
- Dados pessoais de voluntários, candidatos, solicitantes e doadores — incluindo o registro
  do recebimento da autorização de menores de idade — SÃO acessíveis somente à conta
  institucional do Painel e ao próprio titular, quando doador associado, e nunca são
  expostos no Portal Público.
- Autorização DEVE ser verificada no servidor. Ocultar um elemento na interface NÃO constitui
  controle de acesso.
- O tratamento de dados pessoais DEVE observar a LGPD (Lei nº 13.709/2018): coleta mínima
  necessária, finalidade declarada ao titular e acesso restrito.

Justificativa: o sistema custodia dados sensíveis de menores e de pessoas vulneráveis; um
vazamento é dano jurídico e reputacional direto à instituição.

### V. Responsividade Obrigatória e Compatibilidade entre Navegadores

Toda funcionalidade voltada ao público externo (Portal Público) DEVE funcionar corretamente em
desktop, tablet e smartphone, com abordagem mobile-first.

Regras não negociáveis:

- O layout DEVE ser projetado primeiro para telas pequenas e depois ampliado.
- Nenhuma funcionalidade pública pode depender de recurso indisponível em dispositivos móveis.
- Compatibilidade obrigatória com as versões mais recentes de Chrome, Firefox, Edge e Safari.
- Verificação em ao menos uma resolução móvel e uma desktop é condição de conclusão de
  qualquer tela pública.

Justificativa: doadores e candidatos a voluntariado chegam predominantemente pelo celular;
uma página quebrada no smartphone é uma doação perdida.

### VI. Escopo Fechado da Versão Intermediária

Funcionalidades declaradas fora de escopo NÃO PODEM ser implementadas sem validação explícita
prévia do responsável pelo projeto. Estão fora de escopo nesta versão:

- Cadastro completo de residentes.
- Prontuário, exames ou qualquer dado de saúde.
- Integração automática com redes sociais.
- Uso de IA para geração de conteúdo.
- Aplicativo nativo.
- Gateway de pagamento próprio.
- Módulo financeiro completo.
- BI avançado.

Ao encontrar demanda por qualquer item acima, o trabalho DEVE parar e a decisão DEVE ser
levada ao responsável antes de qualquer implementação.

Justificativa: o projeto é um TCC com prazo fixo; escopo aberto é o principal risco de
não entrega.

### VII. Pix como Único Meio de Doação Digital, sem Custódia nem Integração de Pagamento

Doações financeiras DEVEM ser realizadas exclusivamente via Pix, por meio da chave Pix
fornecida pela própria instituição e cadastrada como conteúdo institucional no Painel
Administrativo, a partir da qual o Portal gera o QR code estático. O sistema NÃO integra API
de pagamentos.

Regras não negociáveis:

- Nenhum outro meio de pagamento digital pode ser implementado.
- O sistema NÃO PODE armazenar dados de cartão, credenciais de pagamento ou credenciais
  bancárias da instituição.
- O sistema NÃO PODE integrar API de pagamentos de terceiros, gerar cobrança Pix dinâmica,
  nem receber notificação automática (webhook) de confirmação de pagamento.
- O pagamento ocorre inteiramente fora do sistema, no aplicativo bancário do doador. O
  sistema registra apenas a **declaração** do doador de que doou; essa declaração NUNCA
  equivale a confirmação de recebimento.
- A confirmação de uma doação é ato humano de perfil autorizado, conferido contra o extrato
  bancário da instituição, e fica registrada com autor e data (Princípios III e VIII).
- Doações de itens físicos ou de dinheiro vivo NUNCA são registradas digitalmente; seu
  registro é exclusivamente físico, feito pela instituição.
- Telas que mencionem doação DEVEM deixar claras ao doador ambas as distinções: que o
  pagamento acontece no banco dele, e que a declaração fica pendente até conferência humana.

Justificativa: manter o sistema fora do fluxo de dinheiro vivo, de dados de cartão e de
credenciais bancárias elimina responsabilidade de custódia financeira que a instituição não
tem estrutura para assumir. A ausência de integração de pagamento remove também a dependência
de contratação de provedor e de conta PJ habilitada, viabilizando a operação real da
instituição sem custo nem vínculo contratual — ao preço de tornar a conciliação um trabalho
humano, aceito conscientemente.

### VIII. Triagem Humana Obrigatória em Cadastros Externos

Toda ação de cadastro originada do público externo — voluntário, candidato a vaga, solicitação
de evento — DEVE passar por triagem humana antes de qualquer efetivação no sistema.

Regras não negociáveis:

- Submissões externas entram sempre com status `pendente`.
- O sistema NUNCA aprova automaticamente, sob nenhuma regra, contagem ou critério calculado.
- Aprovação e rejeição são ações executadas por perfil autorizado e ficam registradas com
  autor e data.
- Nenhum efeito colateral (envio de acesso, publicação, vínculo ativo) pode ocorrer antes da
  aprovação humana.
- A conta de autoatendimento do doador associado não é cadastro sujeito a triagem: não cria
  vínculo de trabalho ou voluntariado com a instituição, não dá contato com os residentes e
  só é ativada por link enviado ao e-mail informado. A doação vinculada a ela continua
  pendente até a conferência humana (Princípio VII).

Justificativa: a instituição responde legal e moralmente por quem tem contato com os idosos;
essa decisão é humana e indelegável.

## Restrições de Escopo e Conformidade

- **Domínio**: sistema institucional para ILPI, contemplando Portal Público (institucional,
  doações via Pix, itens necessários, voluntariado, eventos) e Painel Administrativo
  (gestão desses conteúdos e triagem de cadastros).
- **Conformidade legal**: LGPD é requisito vinculante. Dados de menores exigem autorização
  registrada e acesso restrito a perfis autorizados.
- **Persistência**: modelagem DEVE prever campos de status e de auditoria (autor e data da
  ação) desde a primeira versão de cada entidade, em coerência com o Princípio III.
- **Segurança mínima**: autenticação no Painel Administrativo, autorização verificada no
  servidor, senhas nunca armazenadas em texto claro.
- **Idioma**: toda interface de usuário DEVE estar em português do Brasil.
- **Integrações externas**: limitadas ao envio de e-mail transacional e ao armazenamento de
  arquivos enviados pelo público. Não há integração com API de pagamentos (Princípio VII).
  Qualquer outra integração exige validação prévia (Princípio VI).

## Fluxo de Desenvolvimento e Portões de Qualidade

1. **Especificação**: toda feature começa por uma especificação que declara explicitamente
   quais princípios a governam e como serão verificados.
2. **Planejamento**: o plano DEVE registrar justificativa para qualquer nova dependência,
   abstração ou desvio de simplicidade (Princípio I).
3. **Portão de acessibilidade**: nenhuma tela é aceita sem verificação dos itens do
   Princípio II.
4. **Portão de responsividade**: telas públicas são verificadas em resolução móvel e
   desktop antes da conclusão (Princípio V).
5. **Portão de dados**: revisão confirma ausência de exclusão física e presença de campos
   de status e auditoria (Princípio III).
6. **Portão de acesso**: revisão confirma que dados pessoais só trafegam para perfis
   autorizados e que a autorização é verificada no servidor (Princípio IV).
7. **Portão de escopo**: qualquer trabalho que toque um item fora de escopo é bloqueado até
   validação explícita (Princípio VI).
8. **Revisão**: alterações DEVEM ser revisadas quanto à conformidade com esta constituição
   antes de serem integradas.

## Governance

Esta constituição supera qualquer outra prática, convenção ou preferência técnica adotada no
projeto. Em caso de conflito entre um princípio aqui definido e uma decisão de implementação,
o princípio prevalece.

**Emendas**: alterações a este documento DEVEM ser propostas por escrito, aprovadas pelo
responsável pelo projeto (autor do TCC, com ciência da orientação) e registradas no Sync
Impact Report no topo do arquivo, incluindo justificativa e impacto sobre trabalho já
realizado.

**Versionamento** (semântico):

- **MAJOR**: remoção ou redefinição incompatível de princípio ou regra de governança.
- **MINOR**: adição de princípio ou seção, ou expansão material de orientação existente.
- **PATCH**: esclarecimentos, correções de redação e refinamentos sem efeito semântico.

**Conformidade**: toda especificação, plano e revisão de código DEVE verificar aderência aos
princípios. Violações identificadas DEVEM ser corrigidas antes da integração ou registradas
formalmente como exceção aprovada, com prazo de correção. Complexidade não justificada é
motivo suficiente para reprovar uma entrega.

**Version**: 3.0.1 | **Ratified**: 2026-08-12 | **Last Amended**: 2026-10-06
