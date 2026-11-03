// Representa uma seta no diagrama cloud, por exemplo: `api → database (SQL)`.
package modelo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ConexaoCloudDef(
        @NotBlank @Pattern(regexp = Projeto.TEXTO_DIAGRAMA) String de, // serviço de origem
        @NotBlank @Pattern(regexp = Projeto.TEXTO_DIAGRAMA) String para, // serviço de destino
        @Pattern(regexp = Projeto.TEXTO_DIAGRAMA) String rotulo // rótulo da conexão (ex: "API → Database (SQL)") - Pode ser null
) {
    public String getDe() {
        return de;
    }

    public String getPara() {
        return para;
    }

    public String getRotulo() {
        return rotulo;
    }
}
