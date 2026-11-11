package dao.jpa;

import dao.jpa.entity.ProjetoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjetoEntityJpaRepository extends JpaRepository<ProjetoEntity, String> {
    List<ProjetoEntity> findByUsuarioId(String usuarioId);
}