import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.*;
import dao.ProjetoRepositorioEmMemoria;
import modelo.Projeto;

public class ProjetoRepositorioEmMemoriaTest {

    private ProjetoRepositorioEmMemoria repositorio;

    @BeforeEach
    void setup() {
        repositorio = new ProjetoRepositorioEmMemoria();
    }

    @AfterEach
    void tearDown() {
        repositorio = null;
    }

    @Test
    void salvarSemId_deveGerarIdAutomaticamente() {
        var projeto = new Projeto();
        projeto.setNome("Teste");
        projeto.setLinguagem("java");
        projeto.setFramework("spring-boot");
        projeto.setProvedorCloud("aws");

        var salvo = repositorio.salvar(projeto);

        // verifique que salvo.getId() não é null e não está vazio
        assertNotNull(salvo.getId());
        assertFalse(salvo.getId().isEmpty());
    }

    @Test
    void buscarPorIdInexistente_deveRetornarOptionalVazio() {
        var resultado = repositorio.buscarPorId("id-que-nao-existe");
        // verifique que resultado.isEmpty() é verdadeiro
        assertTrue(resultado.isEmpty());
    }

    @Test
    void deletar_deveRemoverDaLista() {
        // 1. salve um projeto
        // 2. pegue o id retornado
        // 3. delete pelo id
        // 4. verifique que buscarTodos() retorna lista vazia
        var projeto = new Projeto();
        projeto.setNome("Teste");
        projeto.setLinguagem("java");
        projeto.setFramework("spring-boot");
        projeto.setProvedorCloud("aws");
        var salvo = repositorio.salvar(projeto);
        var id = salvo.getId();
        repositorio.deletarPorId(id);
        var todos = repositorio.buscarTodos();
        assertTrue(todos.isEmpty());
    }

    @Test
    void deletarIdInexistente_naoDeveLancarExcecao() {
        // chame deletarPorId com um id aleatório
        repositorio.deletarPorId("id-que-nao-existe");
        // não é necessário nenhum assert — só não pode jogar exceção
    }
}