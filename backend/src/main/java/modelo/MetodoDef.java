package modelo;

import jakarta.validation.constraints.NotBlank;

public record MetodoDef(
    @NotBlank String nome,         // campo 1: nome do método (obrigatório)
    @NotBlank String tipoRetorno)  // campo 2: tipo de retorno do método (obrigatório)
    {}
