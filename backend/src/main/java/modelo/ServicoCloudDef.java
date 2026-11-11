// Representa um serviço cloud como EC2, RDS ou S3.
// O campo `configuracao` é um `Map<String, String>` porque cada tipo de serviço
// tem configurações diferentes (EC2 tem `instanceType`, RDS tem `engine`, etc.).
package modelo;

import java.util.Map;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ServicoCloudDef(
        @NotBlank @Pattern(regexp = Projeto.TEXTO_DIAGRAMA) String id, // identificador do serviço ("API, DATA, STORAGE, COMPUTE, etc")
        @NotBlank @Pattern(regexp = Projeto.TEXTO_DIAGRAMA) String tipo, // tipo do serviço ("AWS, GCP, AZURE, etc")
        @Size(max = 255) String categoria, // categoria do serviço ("API, DATA, STORAGE, COMPUTE, etc") - Pode ser null
        // vira JSON numa coluna TEXT (64 KB): 50 entradas de até 255 caracteres cabem
        @Size(max = 50) Map<@Size(max = 255) String, @Size(max = 255) String> configuracao // configurações do serviço (ex: "region", "accessKey", "secretKey", etc) -
                                         // Pode ser null
) {
    public String getId() {
        return id;
    }

    public String getTipo() {
        return tipo;
    }

    public String getCategoria() {
        return categoria;
    }

    public Map<String, String> getConfiguracao() {
        return configuracao;
    }
}
