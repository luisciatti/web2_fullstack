![Build Status](https://github.com/luisciatti/web2_fullstack/actions/workflows/test.yml/badge.svg)
# web2_fullstack

## Validação

Collection do Postman: [postman_collection.json](postman_collection.json)

### Como testar no Postman

1. Abra o Postman no seu computador.
2. No terminal, entre na pasta `backend` e suba a aplicação na porta `8080` com `mvn spring-boot:run`.
3. Aguarde o backend subir e confirme no navegador ou no Postman que `http://localhost:8080/actuator/health` responde com status OK.
4. Clique em **Import** no Postman e selecione o arquivo [postman_collection.json](postman_collection.json).
5. Abra a collection **web2_fullstack - Back-end APIs** e confira a variável `baseUrl`.
6. A variável `baseUrl` deve estar como `http://localhost:8080`.
7. Execute primeiro o request **Health check**.
8. Execute em seguida o request **Criar projeto**.
9. Depois do request de criação, a collection salva automaticamente o `id` do projeto.
10. Use esse `id` nos requests **Buscar projeto por ID**, **Atualizar projeto**, **Gerar artefatos**, **Listar artefatos**, **Diagrama UML**, **Diagrama Cloud** e **Excluir projeto**.
11. Se algum request falhar, verifique se o backend ainda está rodando na porta `8080` e se o `id` foi preenchido após a criação.
