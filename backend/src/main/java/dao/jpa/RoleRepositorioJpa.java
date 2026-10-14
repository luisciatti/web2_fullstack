package dao.jpa;

import dao.RoleRepositorio;
import modelo.Role;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class RoleRepositorioJpa implements RoleRepositorio {
    private final RoleEntityJpaRepository roleEntityJpaRepository;
    private final AuthJpaMapper mapper;

    public RoleRepositorioJpa(RoleEntityJpaRepository roleEntityJpaRepository, AuthJpaMapper mapper) {
        this.roleEntityJpaRepository = roleEntityJpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Optional<Role> findByNome(String nome) {
        return roleEntityJpaRepository.findByNome(nome).map(mapper::toModel);
    }
}
