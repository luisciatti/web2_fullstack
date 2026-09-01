// Representa uma linha no diagrama UML entre duas classes.
// Exemplo: `Usuario → Pedido (ONE_TO_MANY)`.
// Tipos válidos: `ONE_TO_ONE`, `ONE_TO_MANY`, `MANY_TO_ONE`, `MANY_TO_MANY`.
package modelo;

import jakarta.validation.constraints.NotBlank;

public record RelacaoDef(
                @NotBlank String origem, // nome da classe de origem
                @NotBlank String destino, // nome da classe de destino
                @NotBlank String tipo // tipo da relação (ONE_TO_MANY etc.)
) {
        public String getOrigem() {
                return origem;
        }

        public String getDestino() {
                return destino;
        }

        public String getTipo() {
                return tipo;
        }
}
