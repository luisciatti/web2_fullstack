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

    // método especial que aciona o GeradorTemplate (conta na métrica projeto_geracao_total)
    ResultadoGeracao gerar(String id);

    // mesmo resultado de gerar, mas só para consulta: não conta na métrica
    ResultadoGeracao visualizar(String id);
}
