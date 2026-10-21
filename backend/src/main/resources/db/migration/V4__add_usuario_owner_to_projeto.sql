ALTER TABLE projeto
    ADD COLUMN usuario_id VARCHAR(64) NOT NULL;

ALTER TABLE projeto
    ADD CONSTRAINT fk_projeto_usuario
    FOREIGN KEY (usuario_id)
    REFERENCES usuario(id)
    ON DELETE CASCADE;

CREATE INDEX idx_projeto_usuario_id
    ON projeto(usuario_id);