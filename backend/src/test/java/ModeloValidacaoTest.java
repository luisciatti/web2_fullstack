import jakarta.validation.*;
import modelo.AtributoDef;
import modelo.Projeto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import java.util.Set;

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
    void projeto_comNomeVazio_deveRetornarViolation() {
        var projeto = new Projeto();
        // deixe nome em branco propositalmente
        // projeto.setNome("");
        // valide e verifique que há violations
        Set<ConstraintViolation<Projeto>> violations = validator.validate(projeto);
        assertFalse(violations.isEmpty()); // verifique que violations NÃO está vazio
    }
}