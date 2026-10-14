INSERT INTO app_role (nome)
SELECT 'ROLE_USER'
    WHERE NOT EXISTS (
    SELECT 1
    FROM app_role
    WHERE nome = 'ROLE_USER'
);

INSERT INTO app_role (nome)
SELECT 'ROLE_ADMIN'
    WHERE NOT EXISTS (
    SELECT 1
    FROM app_role
    WHERE nome = 'ROLE_ADMIN'
);