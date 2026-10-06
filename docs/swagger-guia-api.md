# Guia Resumido do Swagger

Use este arquivo como cola rápida para montar requests no Swagger da API.

## Onde abrir

- Swagger UI: `http://localhost:8080/docs`
- JSON da API: `http://localhost:8080/docs/api-docs`

## O que a API oferece

- `GET /api/projetos` = listar projetos
- `GET /api/projetos/{id}` = buscar um projeto
- `POST /api/projetos` = criar um projeto
- `PUT /api/projetos/{id}` = atualizar um projeto
- `DELETE /api/projetos/{id}` = remover um projeto
- `POST /api/projetos/{id}/gerar` = gerar artefatos
- `GET /api/projetos/{id}/artefatos` = ver artefatos gerados
- `GET /api/projetos/{id}/diagrama/uml` = ver diagrama UML

## Como montar no Swagger

1. Abra o endpoint.
2. Clique em `Try it out`.
3. Preencha o `id` quando o caminho tiver `{id}`.
4. Cole o JSON no corpo quando o verbo for `POST` ou `PUT`.
5. Clique em `Execute`.

## JSON mínimo do projeto

O projeto precisa, no mínimo, destes campos:

```json
{
  "nome": "SistemaPedidos",
  "linguagem": "java",
  "framework": "spring-boot",
  "provedorCloud": "aws"
}
```

## JSON completo de exemplo

Se quiser montar tudo de uma vez, use este modelo:

```json
{
  "nome": "SistemaPedidos",
  "linguagem": "java",
  "framework": "spring-boot",
  "provedorCloud": "aws",
  "classes": [
    {
      "nome": "Pedido",
      "atributos": [
        { "nome": "id", "tipo": "Long" },
        { "nome": "valor", "tipo": "BigDecimal" }
      ],
      "metodos": [
        { "nome": "calcularTotal", "tipoRetorno": "BigDecimal" }
      ]
    }
  ],
  "relacoes": [
    {
      "origem": "Pedido",
      "destino": "Cliente",
      "tipo": "MANY_TO_ONE"
    }
  ],
  "servicosCloud": [
    {
      "id": "db",
      "tipo": "RDS",
      "categoria": "DATA",
      "configuracao": {
        "engine": "mysql",
        "instanceType": "db.t3.micro"
      }
    }
  ],
  "conexoesCloud": [
    {
      "de": "api",
      "para": "db",
      "rotulo": "API para banco"
    }
  ]
}
```

## Como o pessoal pode montar o JSON

- `nome`, `linguagem`, `framework` e `provedorCloud` são obrigatórios.
- `classes` serve para listar as classes do sistema.
- Cada `classe` pode ter `atributos` e `metodos`.
- `relacoes` serve para ligar uma classe a outra.
- `servicosCloud` descreve serviços como banco, API, storage ou compute.
- `conexoesCloud` mostra como os serviços se ligam.

## Resumo por verbo

- `GET` = consultar
- `POST` = criar ou gerar
- `PUT` = atualizar
- `DELETE` = apagar

## Ordem prática para testar

1. Criar com `POST /api/projetos`.
2. Listar com `GET /api/projetos`.
3. Buscar com `GET /api/projetos/{id}`.
4. Atualizar com `PUT /api/projetos/{id}`.
5. Gerar com `POST /api/projetos/{id}/gerar`.
6. Excluir com `DELETE /api/projetos/{id}`.

## Observação rápida

Se faltar algum campo obrigatório ou o JSON vier quebrado, o Swagger vai mostrar erro `400`. Se o `id` não existir, a resposta normal é `404`.
