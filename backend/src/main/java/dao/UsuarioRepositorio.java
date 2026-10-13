package dao;

import modelo.Usuario;

import java.util.Optional;

public interface UsuarioRepositorio {
    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);
}
