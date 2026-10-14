CREATE INDEX idx_classe_projeto_id ON classe (projeto_id);
CREATE UNIQUE INDEX uk_classe_projeto_ordem ON classe (projeto_id, ordem);

CREATE INDEX idx_atributo_classe_id ON atributo (classe_id);
CREATE UNIQUE INDEX uk_atributo_classe_ordem ON atributo (classe_id, ordem);

CREATE INDEX idx_metodo_classe_id ON metodo (classe_id);
CREATE UNIQUE INDEX uk_metodo_classe_ordem ON metodo (classe_id, ordem);

CREATE INDEX idx_relacao_projeto_id ON relacao (projeto_id);

CREATE INDEX idx_servico_cloud_projeto_id ON servico_cloud (projeto_id);
CREATE UNIQUE INDEX uk_servico_cloud_identificador ON servico_cloud (projeto_id, identificador);

CREATE INDEX idx_conexao_cloud_projeto_id ON conexao_cloud (projeto_id);

CREATE INDEX idx_usuario_email ON usuario(email);
CREATE INDEX idx_usuario_ativo ON usuario(ativo);

CREATE INDEX idx_role_nome ON role(nome);


CREATE INDEX idx_usuario_role_usuario_id ON usuario_role(usuario_id);
CREATE INDEX idx_usuario_role_role_id ON usuario_role(role_id);

CREATE INDEX idx_refresh_token_token ON refresh_token(token);
CREATE INDEX idx_refresh_token_usuario_id ON refresh_token(usuario_id);
CREATE INDEX idx_refresh_token_expira_em ON refresh_token(expira_em);
CREATE INDEX idx_refresh_token_revogado ON refresh_token(revogado);