package dao.jpa;

import dao.UsuarioRepositorio;
import dao.jpa.entity.RoleEntity;
import dao.jpa.entity.UsuarioEntity;
import modelo.Role;
import modelo.Usuario;
import org.springframework.stereotype.Repository;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public class UsuarioRepositorioJpa implements UsuarioRepositorio {
    private final UsuarioEntityJpaRepository usuarioEntityJpaRepository;
    private final RoleEntityJpaRepository roleEntityJpaRepository;
    private final AuthJpaMapper mapper;

    public UsuarioRepositorioJpa(
            UsuarioEntityJpaRepository usuarioEntityJpaRepository,
            RoleEntityJpaRepository roleEntityJpaRepository,
            AuthJpaMapper mapper) {
        this.usuarioEntityJpaRepository = usuarioEntityJpaRepository;
        this.roleEntityJpaRepository = roleEntityJpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Optional<Usuario> findByEmail(String email) {
        return usuarioEntityJpaRepository.findByEmail(email).map(mapper::toModel);
    }

    @Override
    public boolean existsByEmail(String email) {
        return usuarioEntityJpaRepository.existsByEmail(email);
    }

    @Override
    public Usuario save(Usuario usuario) {
        UsuarioEntity entity = mapper.toEntity(usuario);

        if (entity.getId() == null || entity.getId().isBlank()) {
            entity.setId(UUID.randomUUID().toString());
        }

        Set<RoleEntity> managedRoles = new HashSet<>();
        if (usuario.getRoles() != null) {
            for (Role role : usuario.getRoles()) {
                RoleEntity roleEntity = null;

                if (role.getId() != null && !role.getId().isBlank()) {
                    roleEntity = roleEntityJpaRepository.findById(role.getId()).orElse(null);
                }

                if (roleEntity == null && role.getNome() != null && !role.getNome().isBlank()) {
                    roleEntity = roleEntityJpaRepository.findByNome(role.getNome()).orElse(null);
                }

                if (roleEntity == null) {
                    roleEntity = mapper.toEntity(role);
                }

                managedRoles.add(roleEntity);
            }
        }

        entity.setRoles(managedRoles);

        UsuarioEntity savedEntity = usuarioEntityJpaRepository.save(entity);
        return mapper.toModel(savedEntity);
    }
}
