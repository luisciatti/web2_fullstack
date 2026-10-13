package dao.jpa;

import dao.jpa.entity.RoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleEntityJpaRepository extends JpaRepository<RoleEntity, String> {
}
