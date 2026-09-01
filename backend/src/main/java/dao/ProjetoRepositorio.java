// O Repository Pattern define um contrato para persistir dados, desacoplando
// a lógica de negócio do mecanismo de armazenamento. Hoje é um Map em memória;
// amanhã pode ser PostgreSQL — e os serviços não mudam.
package dao;

import modelo.Projeto;

import java.util.List;
import java.util.Optional;

public interface ProjetoRepositorio {
    List<Projeto> buscarTodos();

    // Optional força quem chama a tratar o caso "não encontrado"
    // por que Optional e não Projeto (que pode ser null)?
    Optional<Projeto> buscarPorId(String id);

    // recebe o projeto, persiste e retorna o projeto salvo (pode ter id preenchido)
    Projeto salvar(Projeto projeto);

    void deletarPorId(String id);
}
