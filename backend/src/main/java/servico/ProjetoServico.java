package servico;

import java.util.List;
import java.util.Optional;

import modelo.Projeto;
import modelo.ResultadoGeracao;

public interface ProjetoServico {

    List<Projeto> buscarTodos();

    Optional<Projeto> buscarPorId(String id);

    Projeto salvar(Projeto projeto);

    void deletarPorId(String id);

    // método especial que aciona o GeradorTemplate
    ResultadoGeracao gerar(String id);
}
