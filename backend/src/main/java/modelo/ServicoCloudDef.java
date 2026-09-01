// Representa um serviço cloud como EC2, RDS ou S3.
// O campo `configuracao` é um `Map<String, String>` porque cada tipo de serviço
// tem configurações diferentes (EC2 tem `instanceType`, RDS tem `engine`, etc.).
package modelo;

import java.util.Map;

import jakarta.validation.constraints.NotBlank;

public record ServicoCloudDef(
        @NotBlank String id, // identificador do serviço ("API, DATA, STORAGE, COMPUTE, etc")
        @NotBlank String tipo, // tipo do serviço ("AWS, GCP, AZURE, etc")
        String categoria, // categoria do serviço ("API, DATA, STORAGE, COMPUTE, etc") - Pode ser null
        Map<String, String> configuracao // configurações do serviço (ex: "region", "accessKey", "secretKey", etc) -
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
