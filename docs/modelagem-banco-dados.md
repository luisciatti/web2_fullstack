# Modelagem do Banco de Dados

## 1. Definir o banco de dados

Para a próxima etapa do projeto, o banco mais adequado é um banco relacional.

### Sugestão de tecnologia

- **Desenvolvimento local/testes:** H2
- **Produção:** PostgreSQL

### Por que usar banco relacional

- O sistema possui entidades com relacionamento claro entre si.
- Há necessidade de persistir projetos, classes, atributos, métodos, relações e artefatos.
- O modelo relacional facilita integridade, consultas e evolução futura.

### Entidades principais

- Projeto
- Classe
- Atributo
- Método
- Relação UML
- Serviço Cloud
- Conexão Cloud
- Artefato Gerado

## 2. Criar o diagrama das tabelas e relacionamentos

```mermaid
erDiagram
    PROJETO ||--o{ CLASSE : possui
    CLASSE ||--o{ ATRIBUTO : contem
    CLASSE ||--o{ METODO : contem
    PROJETO ||--o{ RELACAO : possui
    PROJETO ||--o{ SERVICO_CLOUD : possui
    PROJETO ||--o{ CONEXAO_CLOUD : possui
    PROJETO ||--o{ ARTEFATO_GERADO : gera
    SERVICO_CLOUD ||--o{ CONEXAO_CLOUD : origem_destino

    PROJETO {
        uuid id PK
        string nome
        string linguagem
        string framework
        string provedor_cloud
    }

    CLASSE {
        uuid id PK
        uuid projeto_id FK
        string nome
        int ordem
    }

    ATRIBUTO {
        uuid id PK
        uuid classe_id FK
        string nome
        string tipo
        int ordem
    }

    METODO {
        uuid id PK
        uuid classe_id FK
        string nome
        string tipo_retorno
        int ordem
    }

    RELACAO {
        uuid id PK
        uuid projeto_id FK
        string origem
        string destino
        string tipo
    }

    SERVICO_CLOUD {
        uuid id PK
        uuid projeto_id FK
        string identificador
        string tipo
        string categoria
        json configuracao_json
    }

    CONEXAO_CLOUD {
        uuid id PK
        uuid projeto_id FK
        uuid origem_servico_id FK
        uuid destino_servico_id FK
        string rotulo
    }

    ARTEFATO_GERADO {
        uuid id PK
        uuid projeto_id FK
        string tipo
        string nome
        text conteudo
        datetime criado_em
    }
```

### Leitura do diagrama

- Um projeto pode ter várias classes.
- Uma classe pode ter vários atributos e métodos.
- Um projeto pode ter várias relações UML.
- Um projeto pode ter vários serviços cloud.
- Um projeto pode ter várias conexões cloud.
- Um projeto pode ter vários artefatos gerados.
