// Representa uma seta no diagrama cloud, por exemplo: `api → database (SQL)`.
package modelo;

import jakarta.validation.constraints.NotBlank;

public record ConexaoCloudDef(
        @NotBlank String de, // serviço de origem
        @NotBlank String para, // serviço de destino
        String rotulo // rótulo da conexão (ex: "API → Database (SQL)") - Pode ser null
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
