# Guia da Collection do Postman

Use esta collection para testar a API do backend com requests prontos.

## O que precisa preencher no Postman

### key

Nome da variável ou campo.

Na collection do projeto, os principais keys são:

- `baseUrl`
- `id`

### value

Valor que a chave vai receber.

Exemplos:

- `baseUrl` = `http://localhost:8080`
- `id` = id do projeto criado na API

### description

Campo de descrição para explicar para que serve a variável ou o request.

Exemplo prático:

- `baseUrl`: endereço onde o backend está rodando
- `id`: identificador do projeto usado nos requests que dependem de um projeto já criado

## Variáveis da collection

### `baseUrl`

- Valor padrão: `http://localhost:8080`
- Uso: monta a URL completa de todos os requests.
- Description: endereço base do backend.

### `id`

- Valor inicial: vazio
- Uso: recebe automaticamente o id retornado no request de criação.
- Description: identificador do projeto usado nos requests que dependem de um projeto já criado.

## Run order

Execute os requests nesta ordem:

1. `01 - Health check`
2. `02 - Criar projeto`
3. `03 - Listar projetos`
4. `04 - Buscar projeto por ID`
5. `05 - Atualizar projeto`
6. `06 - Gerar artefatos`
7. `07 - Listar artefatos`
8. `08 - Diagrama UML`
9. `09 - Diagrama Cloud`
10. `10 - Excluir projeto`

## Lista dos requests da collection

### 1. 01 - Health check

- Método: `GET`
- URL: `{{baseUrl}}/actuator/health`
- Função: verifica se o backend está no ar.

### 2. 03 - Listar projetos

- Método: `GET`
- URL: `{{baseUrl}}/api/projetos`
- Função: lista todos os projetos cadastrados.

### 3. 02 - Criar projeto

- Método: `POST`
- URL: `{{baseUrl}}/api/projetos`
- Função: cria um projeto e salva o `id` retornado na variável `id`.

### 4. 04 - Buscar projeto por ID

- Método: `GET`
- URL: `{{baseUrl}}/api/projetos/{{id}}`
- Função: busca um projeto específico.

### 5. 05 - Atualizar projeto

- Método: `PUT`
- URL: `{{baseUrl}}/api/projetos/{{id}}`
- Função: atualiza os dados do projeto selecionado.

### 6. 06 - Gerar artefatos

- Método: `POST`
- URL: `{{baseUrl}}/api/projetos/{{id}}/gerar`
- Função: gera os artefatos do projeto.

### 7. 07 - Listar artefatos

- Método: `GET`
- URL: `{{baseUrl}}/api/projetos/{{id}}/artefatos`
- Função: mostra os artefatos já gerados.

### 8. 08 - Diagrama UML

- Método: `GET`
- URL: `{{baseUrl}}/api/projetos/{{id}}/diagrama/uml`
- Função: retorna o diagrama UML em formato textual.

### 9. 09 - Diagrama Cloud

- Método: `GET`
- URL: `{{baseUrl}}/api/projetos/{{id}}/diagrama/cloud`
- Função: retorna o diagrama da arquitetura cloud.

### 10. 10 - Excluir projeto

- Método: `DELETE`
- URL: `{{baseUrl}}/api/projetos/{{id}}`
- Função: remove o projeto.

## Como usar a collection

1. Suba o backend em `http://localhost:8080`.
2. Importe o arquivo `postman_collection.json`.
3. Confirme se a variável `baseUrl` está como `http://localhost:8080`.
4. Rode o request **01 - Health check**.
5. Rode o request **02 - Criar projeto**.
6. Confirme que a variável `id` foi preenchida automaticamente.
7. Continue seguindo a ordem `03` até `10`.

## Resumo rápido

- `key` = nome da variável ou campo
- `value` = valor dessa variável ou campo
- `description` = explicação curta do que aquilo faz
