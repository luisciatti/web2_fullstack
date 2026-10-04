![Build Status](https://github.com/luisciatti/web2_fullstack/actions/workflows/test.yml/badge.svg)
# web2_fullstack

## Validação

Collection do Postman: [postman_collection.json](postman_collection.json)

### Como testar no Postman

1. Abra o Postman no seu computador.
2. Clique em **Import** e selecione o arquivo [postman_collection.json](postman_collection.json).
3. Importe a collection e abra a pasta **Projetos**.
4. Verifique se a variável `baseUrl` está como `http://localhost:8080`.
5. Inicie o backend com o Spring Boot rodando na porta `8080`.
6. Execute primeiro o request **Health check** para confirmar que a API subiu.
7. Execute o request **Criar projeto**.
8. Depois disso, a collection preenche automaticamente a variável `id` com o projeto criado.
9. Use os próximos requests, nesta ordem, para testar o restante da API:
	- **Buscar projeto por ID**
	- **Atualizar projeto**
	- **Gerar artefatos**
	- **Listar artefatos**
	- **Diagrama UML**
	- **Diagrama Cloud**
	- **Excluir projeto**
10. Se algum request retornar erro, confira se o backend está rodando e se o `id` foi preenchido após a criação.
