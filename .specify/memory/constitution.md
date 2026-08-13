<!--
Sync Impact Report
==================
Mudança de versão: (nenhuma / template não preenchido) → 1.0.0
Tipo de bump: MAJOR (ratificação inicial — primeira definição completa de governança)

Princípios definidos (novos):
  - I. Simplicidade Acima de Sofisticação
  - II. Acessibilidade como Requisito de Qualidade
  - III. Integridade e Rastreabilidade de Dados
  - IV. Separação Clara de Contextos e Proteção de Dados Pessoais
  - V. Responsividade Obrigatória e Compatibilidade entre Navegadores
  - VI. Escopo Fechado da Versão Intermediária
  - VII. Pix como Único Meio de Doação Digital
  - VIII. Triagem Humana Obrigatória em Cadastros Externos

Seções adicionadas:
  - Restrições de Escopo e Conformidade (SECTION_2)
  - Fluxo de Desenvolvimento e Portões de Qualidade (SECTION_3)
  - Governança

Seções removidas: nenhuma (placeholders do template substituídos)

Notas:
  - O template padrão previa 5 princípios; o projeto adotou 8 conforme entrada explícita
    do responsável. Estrutura de cabeçalhos do template preservada.
  - Nenhum token entre colchetes permanece no documento.

TODOs pendentes: nenhum
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

O Portal Público (sem login) e o Painel Administrativo (autenticado) são módulos distintos,
com regras de acesso próprias e fronteiras explícitas no código.

Regras não negociáveis:

- O Painel Administrativo DEVE aplicar controle de acesso por perfil: funcionário, voluntário
  e doador associado. Cada perfil enxerga apenas o que sua função exige.
- Dados pessoais de voluntários, candidatos e doadores — incluindo autorizações de menores de
  idade — SÃO acessíveis somente a perfis autorizados e nunca são expostos no Portal Público.
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

### VII. Pix como Único Meio de Doação Digital

Doações financeiras DEVEM ser processadas exclusivamente via API de pagamentos de terceiros
compatível com Pix.

Regras não negociáveis:

- Nenhum outro meio de pagamento digital pode ser implementado.
- O sistema NÃO PODE armazenar dados de cartão nem credenciais de pagamento.
- Doações de itens físicos ou de dinheiro vivo NUNCA são registradas digitalmente; seu
  registro é exclusivamente físico, feito pela instituição.
- Telas que mencionem doação DEVEM deixar clara essa distinção ao doador.

Justificativa: manter o sistema fora do fluxo de dinheiro vivo e de dados de cartão elimina
responsabilidade de custódia financeira que a instituição não tem estrutura para assumir.

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
- **Integrações externas**: limitadas à API de pagamentos compatível com Pix. Qualquer outra
  integração exige validação prévia (Princípio VI).

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

**Version**: 1.0.0 | **Ratified**: 2026-08-12 | **Last Amended**: 2026-08-12
