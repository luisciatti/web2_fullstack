package dao;

import modelo.RefreshToken;

import java.util.Optional;

public interface RefreshTokenRepositorio {
    Optional<RefreshToken> findByToken(String token);

    void deleteByUsuarioId(String usuarioId);

    RefreshToken save(RefreshToken refreshToken);
}
