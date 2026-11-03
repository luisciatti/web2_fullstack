package modelo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record MetodoDef(
    @NotBlank @Pattern(regexp = Projeto.TEXTO_DIAGRAMA) String nome,         // campo 1: nome do método (obrigatório)
    @NotBlank @Pattern(regexp = Projeto.TEXTO_DIAGRAMA) String tipoRetorno)  // campo 2: tipo de retorno do método (obrigatório)
    {
        public String getName() {
            return nome;
        }
        public String getTipoRetorno() {
            return tipoRetorno;
        }
    }
