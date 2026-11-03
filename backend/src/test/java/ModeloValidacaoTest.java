import jakarta.validation.*;
import modelo.AtributoDef;
import modelo.ConexaoCloudDef;
import modelo.MetodoDef;
import modelo.ServicoCloudDef;
import modelo.Projeto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

import static org.junit.jupiter.api.Assertions.*;
import java.util.Set;

@AutoConfigureMockMvc(addFilters = false)
public class ModeloValidacaoTest {

    private Validator validator;

    @BeforeEach
    void setup() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void atributoDef_comNomeVazio_deveRetornarViolation() {
        var atributo = new AtributoDef("", "Long");
        Set<ConstraintViolation<AtributoDef>> violations = validator.validate(atributo);
        assertFalse(violations.isEmpty()); // verifique que violations NÃO está vazio
        // verifique que violations NÃO está vazio
    }

    @Test
    void atributoDef_valido_naoDeveRetornarViolations() {
        var atributo = new AtributoDef("email", "String");
        Set<ConstraintViolation<AtributoDef>> violations = validator.validate(atributo);
        assertTrue(violations.isEmpty()); // verifique que violations ESTÁ vazio
    }

    @Test
    void nomesComInjecaoMermaid_devemRetornarViolation() {
        // quebra de linha + diretiva click viraria XSS no diagrama
        var servico = new ServicoCloudDef("A\nclick A href \"javascript:alert(1)\"", "EC2", null, null);
        assertFalse(validator.validate(servico).isEmpty());

        var conexao = new ConexaoCloudDef("api", "db", "x\"| A\nclick A href \"javascript:alert(1)\"");
        assertFalse(validator.validate(conexao).isEmpty());

        assertFalse(validator.validate(new AtributoDef("nome\n}", "String")).isEmpty());
        assertFalse(validator.validate(new ServicoCloudDef("A;click A", "EC2", null, null)).isEmpty());
    }

    @Test
    void nomesDeProjetosAntigos_continuamValidos() {
        // acentos, espaços e genéricos já salvos não podem passar a dar 400
        assertTrue(validator.validate(new AtributoDef("Usuário", "List<String>")).isEmpty());
        assertTrue(validator.validate(new MetodoDef("calcular total", "void")).isEmpty());
        assertTrue(validator.validate(new ServicoCloudDef("db-principal", "aws-rds", "DATA", null)).isEmpty());
        assertTrue(validator.validate(new ConexaoCloudDef("api", "db", "API → Database (SQL)")).isEmpty());
    }

    @Test
    void projeto_comNomeVazio_deveRetornarViolation() {
        var projeto = new Projeto();
        // deixe nome em branco propositalmente
        // projeto.setNome("");
        // valide e verifique que há violations
        Set<ConstraintViolation<Projeto>> violations = validator.validate(projeto);
        assertFalse(violations.isEmpty()); // verifique que violations NÃO está vazio
    }
}