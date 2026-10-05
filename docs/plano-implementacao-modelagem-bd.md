# Plano de Implementação - Modelagem do Banco de Dados

## Objetivo

Transformar a persistência atual em memória em persistência relacional, começando pela estrutura do banco e pelos relacionamentos do domínio.

## Visão geral do que precisa ser feito

Antes de codar, é necessário definir:

- qual banco será usado em desenvolvimento e produção;
- quais tabelas existirão e como elas se relacionam;
- quais entidades vão virar persistência real;
- o que será salvo no banco e o que continuará sendo gerado em tempo de execução;
- a ordem certa para implementar sem quebrar os endpoints já existentes.

## Sequência recomendada

1. Definir a estratégia do banco.
2. Fechar o diagrama das tabelas e relacionamentos.
3. Mapear as entidades do domínio para JPA.
4. Definir o que fazer com artefatos gerados.
5. Preparar os repositórios e serviços para a troca da persistência.
6. Validar os endpoints com testes.

## T-01 - Definir a estratégia do banco

### Conceito

Escolher um banco relacional para suportar o modelo do projeto.

### O que é necessário fazer

- decidir a base local de testes;
- decidir a base de produção;
- definir se o projeto vai começar com H2, PostgreSQL ou ambos;
- anotar quais campos precisam de tipos especiais, como JSON ou texto grande.

### Passo a passo

1. Usar H2 no ambiente local e de testes.
2. Usar PostgreSQL no ambiente de produção.
3. Definir quais entidades serão persistidas com tabela própria.
4. Definir quais campos serão apenas dados calculados ou gerados sob demanda.
5. Registrar a decisão no projeto antes de começar a implementação.

### Critério de aceite

- O banco escolhido deve suportar os relacionamentos do projeto.
- O modelo deve permitir consultas por projeto, classe, artefatos e serviços cloud.
- A decisão do banco deve estar documentada e ser reproduzível por outro dev.

## T-02 - Criar o diagrama das tabelas e relacionamentos

### Conceito

Desenhar a estrutura lógica do banco antes de criar as entidades JPA.

### O que é necessário fazer

- definir a tabela principal;
- definir as tabelas filhas;
- identificar chaves primárias e estrangeiras;
- decidir quais relações serão 1:N;
- decidir quais dados vão para tabelas próprias e quais vão para colunas simples.

### Passo a passo

1. Criar a entidade central `Projeto`.
2. Criar as tabelas filhas para classes, atributos e métodos.
3. Modelar as relações UML do projeto.
4. Modelar os serviços cloud e as conexões entre eles.
5. Definir a tabela de artefatos gerados caso seja necessário guardar histórico.
6. Revisar se o diagrama cobre todos os dados que a API já recebe hoje.

### Critério de aceite

- O diagrama deve mostrar as chaves primárias e estrangeiras.
- O diagrama deve mostrar a cardinalidade entre as tabelas.
- O diagrama deve ser suficiente para orientar a implementação das entidades.

## T-03 - Mapear o domínio para entidades persistentes

### Conceito

Converter o modelo atual em memória para entidades JPA.

### O que é necessário fazer

- identificar quais classes atuais viram entidades;
- definir quais campos viram `@Column`;
- definir quais listas viram `@OneToMany`;
- definir quais referências viram `@ManyToOne`;
- revisar o impacto disso no serviço e no repositório.

### Passo a passo

1. Criar as classes de entidade para cada tabela.
2. Aplicar `@OneToMany` e `@ManyToOne` onde houver dependência clara.
3. Garantir cascata apenas onde fizer sentido para o ciclo de vida dos dados.
4. Manter o identificador do projeto gerado pela aplicação.
5. Ajustar o mapeamento para não perder a estrutura que já existe no modelo atual.

### Critério de aceite

- As entidades precisam representar o diagrama definido.
- O relacionamento entre as tabelas precisa ficar consistente com o domínio atual.
- O modelo persistente deve permitir salvar e carregar um projeto completo.

## T-04 - Planejar a persistência dos artefatos gerados

### Conceito

Definir se os artefatos serão salvos no banco ou gerados apenas em tempo de execução.

### O que é necessário fazer

- decidir se existe histórico de artefatos;
- decidir se cada geração deve ser armazenada;
- decidir se o conteúdo completo do arquivo precisa ficar salvo;
- decidir como localizar os artefatos gerados por projeto.

### Passo a passo

1. Avaliar se o histórico de artefatos é necessário.
2. Se for necessário, criar tabela específica para armazenamento.
3. Se não for necessário, manter a geração sob demanda.
4. Documentar a decisão final para não haver dúvida na implementação.

### Critério de aceite

- A decisão precisa estar documentada antes da implementação.
- O comportamento escolhido deve ser compatível com os endpoints de geração.

## T-05 - Preparar a base para a próxima etapa

### Conceito

Organizar o projeto para que a implementação do banco aconteça com menos risco.

### O que é necessário fazer

- revisar os pacotes do backend;
- separar domínio, persistência e serviço;
- definir nomes finais para entidades e tabelas;
- apontar o que será removido ou adaptado do repositório em memória.

### Passo a passo

1. Separar os arquivos de domínio que vão virar entidades.
2. Definir nomes finais das tabelas.
3. Documentar as colunas obrigatórias.
4. Validar se o modelo cobre os endpoints já existentes.
5. Identificar o que precisa mudar primeiro para não quebrar a API.

### Critério de aceite

- O time deve conseguir implementar JPA a partir deste documento sem precisar redefinir o modelo.
- A base do projeto deve estar pronta para a troca de persistência.

## T-06 - Planejar os repositórios JPA

### Conceito

Definir como cada entidade será acessada, salva e consultada no banco.

### O que é necessário fazer

- decidir quais entidades terão `JpaRepository` próprio;
- decidir se haverá repositório customizado para projeções mais complexas;
- definir consultas básicas por projeto e por relacionamento;
- preparar a transição do repositório em memória para o banco real.

### Passo a passo

1. Listar os repositórios necessários.
2. Definir a chave de busca principal de cada entidade.
3. Identificar consultas que vão precisar de `findBy...` ou `@Query`.
4. Garantir que o projeto continue conseguindo buscar, salvar e excluir dados.

### Critério de aceite

- Cada entidade persistente precisa ter uma forma clara de leitura e escrita.
- O desenho dos repositórios precisa cobrir os fluxos existentes na API.

## T-07 - Planejar migração do serviço atual

### Conceito

Adaptar a camada de serviço para usar os novos repositórios sem mudar o contrato da API.

### O que é necessário fazer

- manter os métodos públicos do serviço;
- trocar a implementação interna para persistência real;
- preservar a geração de artefatos;
- revisar validações e mensagens de erro.

### Passo a passo

1. Identificar quais métodos do serviço serão afetados.
2. Mapear a lógica que hoje depende do repositório em memória.
3. Planejar as mudanças sem alterar os endpoints existentes.
4. Separar o que é persistência do que é geração de conteúdo.

### Critério de aceite

- A API externa deve continuar estável.
- O serviço deve continuar funcionando depois da troca do armazenamento.

## T-08 - Validar a modelagem antes da implementação final

### Conceito

Revisar o modelo inteiro antes de começar a codificação pesada.

### O que é necessário fazer

- conferir se todas as tabelas têm chave primária;
- conferir se todas as relações estão representadas;
- conferir se o modelo cobre os dados recebidos pela API;
- conferir se o diagrama faz sentido para manutenção futura.

### Passo a passo

1. Revisar o documento de modelagem.
2. Revisar o diagrama Mermaid.
3. Conferir se a modelagem cobre os endpoints e o fluxo atual.
4. Ajustar o documento antes de implementar código.

### Critério de aceite

- Não deve existir dúvida estrutural antes de partir para o código.
- O documento deve servir como base única de referência para a implementação.
