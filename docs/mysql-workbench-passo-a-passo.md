# Passo a Passo no MySQL Workbench

Este guia mostra exatamente o que você precisa fazer no MySQL Workbench para preparar o banco do projeto.

## Objetivo

Ao final desse processo, você deve ter:

- uma conexão funcionando no MySQL Workbench;
- um banco criado para o projeto;
- um usuário próprio para a aplicação;
- permissões liberadas para esse usuário;
- os dados que eu preciso para configurar o projeto.

## 1. Abrir o MySQL Workbench

1. Abra o MySQL Workbench.
2. Na tela inicial, localize a área **MySQL Connections**.
3. Se você já tiver uma conexão pronta, pode usá-la.
4. Se não tiver, crie uma nova conexão.

## 2. Criar uma conexão no MySQL Workbench

1. Clique no botão `+` ao lado de **MySQL Connections**.
2. No campo **Connection Name**, coloque um nome, por exemplo:
   - `MySQL Local`
3. Em **Connection Method**, deixe `Standard (TCP/IP)`.
4. Em **Hostname**, use:
   - `localhost`
5. Em **Port**, use normalmente:
   - `3306`
6. Em **Username**, coloque o usuário administrador do MySQL, por exemplo:
   - `root`
7. Clique em **Test Connection**.
8. Digite a senha do MySQL se for solicitado.
9. Se der certo, clique em **OK** para salvar.

## 3. Abrir a conexão

1. Clique duas vezes na conexão criada.
2. Aguarde abrir a área principal do Workbench.
3. No painel esquerdo, localize a aba **Schemas**.

## 4. Criar o banco do projeto

Você pode fazer isso pela interface ou por SQL.

### Opção mais simples: via SQL

No editor do Workbench, execute:

```sql
CREATE DATABASE web2_fullstack;
```

Depois atualize a lista de schemas.

### Verificar se o banco foi criado

Execute:

```sql
SHOW DATABASES;
```

Você deve ver o banco `web2_fullstack` na lista.

## 5. Criar um usuário para a aplicação

No editor SQL, execute:

```sql
CREATE USER 'web2_user'@'localhost' IDENTIFIED BY 'sua_senha_aqui';
```

Troque `sua_senha_aqui` por uma senha segura.

Exemplo:

```sql
CREATE USER 'web2_user'@'localhost' IDENTIFIED BY 'web2@123';
```

## 6. Dar permissão ao usuário no banco

Execute:

```sql
GRANT ALL PRIVILEGES ON web2_fullstack.* TO 'web2_user'@'localhost';
FLUSH PRIVILEGES;
```

Isso libera o usuário da aplicação para usar o banco criado.

## 7. Testar se o usuário consegue acessar

Você pode criar uma nova conexão no Workbench usando esse novo usuário.

1. Volte para a tela inicial.
2. Clique em `+` para criar uma nova conexão.
3. Preencha assim:
   - **Connection Name**: `web2_fullstack`
   - **Hostname**: `localhost`
   - **Port**: `3306`
   - **Username**: `web2_user`
4. Clique em **Test Connection**.
5. Informe a senha criada para esse usuário.
6. Se funcionar, a parte do banco está pronta.

## 8. Confirmar os dados que serão usados no projeto

No final, você precisa ter estes valores:

- **Host**: `localhost`
- **Porta**: `3306`
- **Banco**: `web2_fullstack`
- **Usuário**: `web2_user`
- **Senha**: a senha que você definiu

## 9. O que você precisa me mandar depois

Quando terminar no MySQL Workbench, me envie estes dados:

- nome do banco criado;
- usuário criado;
- host;
- porta;
- se a conexão funcionou.

Nao precisa me mandar a senha em texto se não quiser. Se preferir, você pode só dizer que a senha já está definida e eu deixo o arquivo preparado para você preencher localmente.

## 9.1 Dados já definidos neste projeto

Neste momento, os dados informados para a configuração são:

- **Host**: `localhost`
- **Porta**: `3306`
- **Banco**: `web2_fullstack`
- **Usuário**: `web2_user`
- **Senha**: `123qwe`

## 10. O que eu vou fazer depois disso

Com essas informações, eu posso fazer no projeto:

1. adicionar o driver MySQL no `backend/pom.xml`;
2. criar um profile como `application-mysql.yml`;
3. configurar a URL do datasource;
4. ajustar usuário e senha para leitura por configuração;
5. preparar a base para migrations.

## 10.1 Como rodar o projeto usando MySQL

### Antes da primeira subida com Flyway

Se esse banco já foi usado antes com tabelas criadas pelo Hibernate ou por testes anteriores, faça uma limpeza uma única vez para deixar o schema 100% controlado pelo Flyway.

Use este bloco no MySQL Workbench:

```sql
DROP DATABASE IF EXISTS web2_fullstack;
CREATE DATABASE web2_fullstack;
```

Depois disso, rode a aplicação normalmente com o profile MySQL. O Flyway vai criar a tabela de histórico e aplicar a migration inicial do projeto.

Depois da configuração, rode o backend com o profile MySQL:

```powershell
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=mysql
```

Se preferir executar o `.jar`, use:

```powershell
java -jar target/backend-Snapshot_v1.jar --spring.profiles.active=mysql
```

### O que deve acontecer

Na primeira execução após limpar o banco:

- o Flyway cria a tabela `flyway_schema_history`;
- o Flyway aplica a migration `V1__create_schema.sql`;
- o Hibernate apenas valida o schema, sem criar tabelas por conta própria.

## 11. SQL completo para copiar no Workbench

Se quiser fazer tudo mais rápido, você pode executar este bloco:

```sql
CREATE DATABASE web2_fullstack;
CREATE USER 'web2_user'@'localhost' IDENTIFIED BY 'web2@123';
GRANT ALL PRIVILEGES ON web2_fullstack.* TO 'web2_user'@'localhost';
FLUSH PRIVILEGES;
```

Se o usuário já existir, me avise antes de rodar esse bloco para eu te passar a versão correta.
