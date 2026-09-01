package modelo;

   // importe @NotBlank do pacote jakarta.validation.constraints
import jakarta.validation.constraints.NotBlank;

   public record AtributoDef(
       @NotBlank  String nome,   // validação: não pode ser vazio
       @NotBlank  String tipo    // validação: não pode ser vazio
   ) {}