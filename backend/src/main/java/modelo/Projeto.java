package modelo;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor // gera o construtor vazio exigido pelo Jackson
public class Projeto {

    private String id; // sem @NotBlank: será gerado pelo sistema

    @NotBlank
    private String nome;

    @NotBlank
    private String linguagem; // ex: "java"

    @NotBlank
    private String framework; // ex: "spring-boot"

    @NotBlank
    private String provedorCloud; // ex: "aws", "azure", "gcp", "oci"

    @Valid
    private List<ClasseDef> classes = new ArrayList<>();

    @Valid
    private List<RelacaoDef> relacoes = new ArrayList<>();

    @Valid
    private List<ServicoCloudDef> servicosCloud = new ArrayList<>();

    @Valid
    private List<ConexaoCloudDef> conexoesCloud = new ArrayList<>();

    // getters defensivos para listas (Lombok gera os normais, mas aqui
    // sobrescrevemos)
    public List<ClasseDef> getClasses() {
        return classes == null ? new ArrayList<>() : classes;
    }

    public List<RelacaoDef> getRelacoes() {
        return relacoes == null ? new ArrayList<>() : relacoes;
    }

    public List<ServicoCloudDef> getServicosCloud() {
        return servicosCloud == null ? new ArrayList<>() : servicosCloud;
    }

    public List<ConexaoCloudDef> getConexoesCloud() {
        return conexoesCloud == null ? new ArrayList<>() : conexoesCloud;
    }

    public String getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getLinguagem() {
        return linguagem;
    }

    public String getFramework() {
        return framework;
    }

    public String getProvedorCloud() {
        return provedorCloud;
    }
}
