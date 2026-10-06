![Build Status](https://github.com/luisciatti/web2_fullstack/actions/workflows/test.yml/badge.svg)
# web2_fullstack

## Validação

Collection do Postman: [postman_collection.json](postman_collection.json)

Documentação da collection: [docs/postman-collection-guia.md](docs/postman-collection-guia.md)

### Como testar no Postman

1. Abra o Postman no seu computador.
2. No terminal, entre na pasta `backend` e suba a aplicação na porta `8080` com `mvn spring-boot:run`.
3. Aguarde o backend subir e confirme no navegador ou no Postman que `http://localhost:8080/actuator/health` responde com status OK.
4. Clique em **Import** no Postman e selecione o arquivo [postman_collection.json](postman_collection.json).
5. Abra a collection **web2_fullstack - Back-end APIs** e confira a variável `baseUrl`.
6. A variável `baseUrl` deve estar como `http://localhost:8080` e a variável `id` pode começar vazia.
7. Execute os requests nesta ordem: **01 - Health check**, **02 - Criar projeto**, **03 - Listar projetos**, **04 - Buscar projeto por ID**, **05 - Atualizar projeto**, **06 - Gerar artefatos**, **07 - Listar artefatos**, **08 - Diagrama UML**, **09 - Diagrama Cloud** e **10 - Excluir projeto**.
8. Depois do request **02 - Criar projeto**, a collection salva automaticamente o `id` do projeto.
9. Se algum request falhar, verifique se o backend ainda está rodando na porta `8080`, se a variável `baseUrl` está correta e se o `id` foi preenchido após a criação.

### Swagger

Abra o Swagger em `http://localhost:8080/docs`.
