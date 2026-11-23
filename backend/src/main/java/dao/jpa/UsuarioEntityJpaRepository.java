package dao.jpa;

import dao.jpa.entity.UsuarioEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UsuarioEntityJpaRepository extends JpaRepository<UsuarioEntity, String> {
    Optional<UsuarioEntity> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("""
            select u.id as id, u.nome as nome, u.email as email, u.ativo as ativo
            from UsuarioEntity u order by u.nome, u.id
            """)
    List<ResumoUsuario> listarResumos();

    @Query("""
            select u.id as id, u.nome as nome, u.email as email, u.ativo as ativo
            from UsuarioEntity u where u.id = :id
            """)
    Optional<ResumoUsuario> buscarResumo(@Param("id") String id);

    interface ResumoUsuario {
        String getId();
        String getNome();
        String getEmail();
        Boolean getAtivo();
    }
}
