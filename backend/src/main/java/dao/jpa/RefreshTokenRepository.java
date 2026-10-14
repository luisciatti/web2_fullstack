package dao.jpa;

import dao.jpa.entity.RefreshTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, String> {
    Optional<RefreshTokenEntity> findByToken(String token);

    Optional<RefreshTokenEntity> findByUsuarioIdAndRevogadoFalse(String usuarioId);

    void deleteByUsuarioId(String usuarioId);
}
