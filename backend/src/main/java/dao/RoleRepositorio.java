package dao;

import modelo.Role;

import java.util.Optional;

public interface RoleRepositorio {
    Optional<Role> findByNome(String nome);
}
