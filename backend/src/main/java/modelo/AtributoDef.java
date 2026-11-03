package modelo;

// importe @NotBlank do pacote jakarta.validation.constraints
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AtributoDef(
        @NotBlank @Pattern(regexp = Projeto.TEXTO_DIAGRAMA) String nome, // validação: não pode ser vazio
        @NotBlank @Pattern(regexp = Projeto.TEXTO_DIAGRAMA) String tipo // validação: não pode ser vazio
) {
    public String getName() {
        return nome;
    }

    public String getTipo() {
        return tipo;
    }
}