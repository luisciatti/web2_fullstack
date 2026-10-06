package dao.jpa;

import dao.jpa.entity.ProjetoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjetoEntityJpaRepository extends JpaRepository<ProjetoEntity, String> {
}