CREATE TABLE IF NOT EXISTS projeto (
    id VARCHAR(64) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    linguagem VARCHAR(255) NOT NULL,
    framework VARCHAR(255) NOT NULL,
    provedor_cloud VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS classe (
    id BIGINT NOT NULL AUTO_INCREMENT,
    projeto_id VARCHAR(64) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    ordem INTEGER NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_classe_projeto FOREIGN KEY (projeto_id) REFERENCES projeto(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS atributo (
    id BIGINT NOT NULL AUTO_INCREMENT,
    classe_id BIGINT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(255) NOT NULL,
    ordem INTEGER NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_atributo_classe FOREIGN KEY (classe_id) REFERENCES classe(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS metodo (
    id BIGINT NOT NULL AUTO_INCREMENT,
    classe_id BIGINT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    tipo_retorno VARCHAR(255) NOT NULL,
    ordem INTEGER NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_metodo_classe FOREIGN KEY (classe_id) REFERENCES classe(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS relacao (
    id BIGINT NOT NULL AUTO_INCREMENT,
    projeto_id VARCHAR(64) NOT NULL,
    origem VARCHAR(255) NOT NULL,
    destino VARCHAR(255) NOT NULL,
    tipo VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_relacao_projeto FOREIGN KEY (projeto_id) REFERENCES projeto(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS servico_cloud (
    id BIGINT NOT NULL AUTO_INCREMENT,
    projeto_id VARCHAR(64) NOT NULL,
    identificador VARCHAR(255) NOT NULL,
    tipo VARCHAR(255) NOT NULL,
    categoria VARCHAR(255),
    configuracao_json TEXT,
    PRIMARY KEY (id),
    CONSTRAINT fk_servico_cloud_projeto FOREIGN KEY (projeto_id) REFERENCES projeto(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conexao_cloud (
    id BIGINT NOT NULL AUTO_INCREMENT,
    projeto_id VARCHAR(64) NOT NULL,
    origem_servico_id VARCHAR(255) NOT NULL,
    destino_servico_id VARCHAR(255) NOT NULL,
    rotulo VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT fk_conexao_cloud_projeto FOREIGN KEY (projeto_id) REFERENCES projeto(id) ON DELETE CASCADE
);

CREATE TABLE usuario (
    id VARCHAR(64) NOT NULL,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE app_role (
    id VARCHAR(64) NOT NULL,
    nome VARCHAR(50) NOT NULL UNIQUE,
    PRIMARY KEY (id)
);

CREATE TABLE usuario_role (
    usuario_id VARCHAR(64) NOT NULL,
    role_id VARCHAR(64) NOT NULL,
    PRIMARY KEY (usuario_id, role_id),
    CONSTRAINT fk_usuario_role_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_role_role FOREIGN KEY (role_id) REFERENCES app_role(id) ON DELETE CASCADE
);

CREATE TABLE refresh_token (
    id VARCHAR(64) NOT NULL,
    token VARCHAR(512) NOT NULL UNIQUE,
    usuario_id VARCHAR(64) NOT NULL,
    expira_em DATETIME(6) NOT NULL,
    revogado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_refresh_token_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
);
