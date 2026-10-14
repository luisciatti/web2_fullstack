package dao.jpa;

import dao.jpa.entity.RoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleEntityJpaRepository extends JpaRepository<RoleEntity, String> {
    Optional<RoleEntity> findByNome(String nome);
}
