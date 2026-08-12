package modelo;

import java.util.Map;

import jakarta.validation.constraints.NotBlank;

public record ServicoCloudDef(
    @NotBlank String id, // identificador do serviço ("API, DATA, STORAGE, COMPUTE, etc")
    @NotBlank String tipo, // tipo do serviço ("AWS, GCP, AZURE, etc")
    String categoria, // categoria do serviço  ("API, DATA, STORAGE, COMPUTE, etc") - Pode ser null
    Map<String, String> configuracao // configurações do serviço (ex: "region", "accessKey", "secretKey", etc) - Pode ser null
) {}
