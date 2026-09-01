package modelo;
import java.util.ArrayList;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

public record ClasseDef(
        @NotBlank String nome,
        @Valid List<AtributoDef> atributos, // @Valid cascateia validação para dentro da lista
        @Valid List<MetodoDef> metodos) {

    // Retorna a lista de atributos, mas nunca null
    public List<AtributoDef> atributosSeguro() {
        // se atributos for null, retorne new ArrayList<>()
        // senão, retorne atributos normalmente
        return atributos == null ? new ArrayList<>() : atributos;
    }

    // Retorna a lista de métodos, mas nunca null
    public List<MetodoDef> metodosSeguro() {
        // mesma lógica do método acima
        return metodos == null ? new ArrayList<>() : metodos;
    }
}