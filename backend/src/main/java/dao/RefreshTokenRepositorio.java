package dao;

import modelo.RefreshToken;

import java.util.Optional;

public interface RefreshTokenRepositorio {
    Optional<RefreshToken> findByToken(String token);

    Optional<RefreshToken> findByUsuarioIdAndRevogadoFalse(Long usuarioId);

    void deleteByUsuarioId(Long usuarioId);
}
