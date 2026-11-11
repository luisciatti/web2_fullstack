package modelo;

import java.util.ArrayList;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ClasseDef(
        @NotBlank @Pattern(regexp = Projeto.TEXTO_DIAGRAMA) String nome,
        @Valid @Size(max = Projeto.MAX_ITENS) List<AtributoDef> atributos, // @Valid cascateia validação para dentro da lista
        @Valid @Size(max = Projeto.MAX_ITENS) List<MetodoDef> metodos) {

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

    public String getName() {
        return nome;
    }

    public List<AtributoDef> getAtributos() {
        return atributosSeguro();
    }

    public List<MetodoDef> getMetodos() {
        return metodosSeguro();
    }
}