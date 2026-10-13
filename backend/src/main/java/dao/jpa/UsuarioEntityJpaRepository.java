package dao.jpa;

import dao.jpa.entity.UsuarioEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioEntityJpaRepository extends JpaRepository<UsuarioEntity, String> {
}
