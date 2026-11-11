package modelo;

import jakarta.persistence.Id;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

@Getter
@Setter
@NoArgsConstructor // gera o construtor vazio exigido pelo Jackson
public class Projeto {
    // Nomes viram texto Mermaid: bloqueia só o que fecha a linha/bloco e permite injetar diretivas
    // (quebra de linha, aspas, ;, |, { }). Acentos, espaços e List<String> continuam válidos.
    // Máximo 255 = tamanho das colunas VARCHAR(255).
    public static final String TEXTO_DIAGRAMA = "[^\\r\\n\";|{}]{0,255}";

    // Limita o tamanho de um projeto: sem isso um usuário pode salvar milhares de linhas
    public static final int MAX_ITENS = 100;

    @Id
    private String id; // sem @NotBlank: será gerado pelo sistema

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private String usuarioId;

    @NotBlank @Size(max = 255)
    private String nome;

    @NotBlank @Size(max = 255)
    private String linguagem; // ex: "java"

    @NotBlank @Size(max = 255)
    private String framework; // ex: "spring-boot"

    @NotBlank @Size(max = 255)
    private String provedorCloud; // ex: "aws", "azure", "gcp", "oci"

    @Valid @Size(max = MAX_ITENS)
    private List<ClasseDef> classes = new ArrayList<>();

    @Valid @Size(max = MAX_ITENS)
    private List<RelacaoDef> relacoes = new ArrayList<>();

    @Valid @Size(max = MAX_ITENS)
    private List<ServicoCloudDef> servicosCloud = new ArrayList<>();

    @Valid @Size(max = MAX_ITENS)
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
}
