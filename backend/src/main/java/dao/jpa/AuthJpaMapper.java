package dao.jpa;

import dao.jpa.entity.RefreshTokenEntity;
import dao.jpa.entity.RoleEntity;
import dao.jpa.entity.UsuarioEntity;
import modelo.RefreshToken;
import modelo.Role;
import modelo.Usuario;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.stream.Collectors;

@Component
public class AuthJpaMapper {

    public Usuario toModel(UsuarioEntity entity) {
        if (entity == null) {
            return null;
        }

        Usuario model = new Usuario();
        model.setId(entity.getId());
        model.setNome(entity.getNome());
        model.setEmail(entity.getEmail());
        model.setSenhaHash(entity.getSenhaHash());
        model.setAtivo(entity.getAtivo());

        if (entity.getRoles() != null) {
            model.setRoles(entity.getRoles().stream()
                    .map(this::toModel)
                    .collect(Collectors.toCollection(HashSet::new)));
        }

        return model;
    }

    public Role toModel(RoleEntity entity) {
        if (entity == null) {
            return null;
        }

        Role model = new Role();
        model.setId(entity.getId());
        model.setNome(entity.getNome());
        return model;
    }

    public RefreshToken toModel(RefreshTokenEntity entity) {
        if (entity == null) {
            return null;
        }

        RefreshToken model = new RefreshToken();
        model.setId(entity.getId());
        model.setToken(entity.getToken());
        model.setUsuario(toModel(entity.getUsuario()));
        model.setExpiraEm(entity.getExpiraEm());
        model.setRevogado(entity.getRevogado());
        return model;
    }

    public UsuarioEntity toEntity(Usuario model) {
        if (model == null) {
            return null;
        }

        UsuarioEntity entity = new UsuarioEntity();
        entity.setId(model.getId());
        entity.setNome(model.getNome());
        entity.setEmail(model.getEmail());
        entity.setSenhaHash(model.getSenhaHash());
        entity.setAtivo(model.getAtivo());

        if (model.getRoles() != null) {
            entity.setRoles(model.getRoles().stream()
                    .map(this::toEntity)
                    .collect(Collectors.toCollection(HashSet::new)));
        }

        return entity;
    }

    public RoleEntity toEntity(Role model) {
        if (model == null) {
            return null;
        }

        RoleEntity entity = new RoleEntity();
        entity.setId(model.getId());
        entity.setNome(model.getNome());
        return entity;
    }

    public RefreshTokenEntity toEntity(RefreshToken model) {
        if (model == null) {
            return null;
        }

        RefreshTokenEntity entity = new RefreshTokenEntity();
        entity.setId(model.getId());
        entity.setToken(model.getToken());
        entity.setUsuario(toEntity(model.getUsuario()));
        entity.setExpiraEm(model.getExpiraEm());
        entity.setRevogado(model.getRevogado());
        return entity;
    }
}
