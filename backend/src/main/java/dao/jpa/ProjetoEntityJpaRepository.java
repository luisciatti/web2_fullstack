package dao.jpa;

import dao.jpa.entity.ProjetoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjetoEntityJpaRepository extends JpaRepository<ProjetoEntity, String> {
    List<ProjetoEntity> findByUsuarioId(String usuarioId);

    @Query("""
            select p.id as id, p.nome as nome, p.linguagem as linguagem,
                   p.framework as framework, p.provedorCloud as provedorCloud
            from ProjetoEntity p where p.usuarioId = :usuarioId order by p.nome, p.id
            """)
    List<ResumoProjeto> listarResumosPorUsuario(@Param("usuarioId") String usuarioId);

    interface ResumoProjeto {
        String getId();
        String getNome();
        String getLinguagem();
        String getFramework();
        String getProvedorCloud();
    }
}
