package dao.jpa;

import dao.jpa.entity.RefreshTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, String> {
    Optional<RefreshTokenEntity> findByToken(String token);

    // Revoga todos de uma vez: logins simultâneos podem deixar mais de um token ativo.
    // flush/clear: o update vai direto ao banco, então limpa entidades já carregadas com revogado=false
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update RefreshTokenEntity t set t.revogado = true where t.usuario.id = :usuarioId and t.revogado = false")
    int revokeAllActive(@Param("usuarioId") String usuarioId);

    void deleteByUsuarioId(String usuarioId);
}
