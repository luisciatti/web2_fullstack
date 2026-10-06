package dao.jpa;

import dao.ProjetoRepositorio;
import dao.jpa.entity.ProjetoEntity;
import jakarta.transaction.Transactional;
import modelo.Projeto;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class ProjetoRepositorioJpa implements ProjetoRepositorio {

    private final ProjetoEntityJpaRepository jpaRepository;
    private final ProjetoMapper mapper;

    public ProjetoRepositorioJpa(ProjetoEntityJpaRepository jpaRepository, ProjetoMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public List<Projeto> buscarTodos() {
        return jpaRepository.findAll().stream()
                .map(mapper::toModel)
                .toList();
    }

    @Override
    @Transactional
    public Optional<Projeto> buscarPorId(String id) {
        return jpaRepository.findById(id)
                .map(mapper::toModel);
    }

    @Override
    @Transactional
    public Projeto salvar(Projeto projeto) {
        String id = projeto.getId();

        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
            projeto.setId(id);
        }

        if (jpaRepository.existsById(id)) {
            jpaRepository.deleteById(id);
            jpaRepository.flush();
        }

        ProjetoEntity salvo = jpaRepository.save(mapper.toEntity(projeto));
        return mapper.toModel(salvo);
    }

    @Override
    @Transactional
    public void deletarPorId(String id) {
        if (jpaRepository.existsById(id)) {
            jpaRepository.deleteById(id);
        }
    }
}