// Usa um `LinkedHashMap` (mantém ordem de inserção) como banco de dados em memória.
// Os dados somem quando o servidor reinicia — aceitável para MVP.
// `@Repository` indica ao Spring que esta classe é um bean de acesso a dados.
package dao;

import modelo.Projeto;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class ProjetoRepositorioEmMemoria implements ProjetoRepositorio {
    private final Map<String, Projeto> armazenamento = new LinkedHashMap<>();

    @Override
    public List<Projeto> buscarTodos() {
        return armazenamento.values().stream().toList();
    }

    @Override
    public Optional<Projeto> buscarPorId(String id) {
        if (armazenamento.containsKey(id)) {
            return Optional.ofNullable(armazenamento.get(id));
        }

        return Optional.empty();
    }

    @Override
    public Projeto salvar(Projeto projeto) {
        String uuid = projeto.getId();

        if (uuid == null || uuid.isBlank()) {
            uuid = UUID.randomUUID().toString();
            projeto.setId(uuid);
        }

        armazenamento.put(uuid, projeto);

        return projeto;
    }

    @Override
    public void deletarPorId(String id) {
        armazenamento.remove(id);
    }
}
