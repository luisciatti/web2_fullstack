package dao.jpa;

import dao.jpa.entity.UsuarioEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioEntityJpaRepository extends JpaRepository<UsuarioEntity, String> {
    Optional<UsuarioEntity> findByEmail(String email);

    boolean existsByEmail(String email);
}
