package dao.jpa;

import dao.jpa.entity.RefreshTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, String> {
    Optional<RefreshTokenEntity> findByToken(String token);

    // Apaga todos (não só um): logins simultâneos podem deixar mais de um token
    void deleteByUsuarioId(String usuarioId);
}
