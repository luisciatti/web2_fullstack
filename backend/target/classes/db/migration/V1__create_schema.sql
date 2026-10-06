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