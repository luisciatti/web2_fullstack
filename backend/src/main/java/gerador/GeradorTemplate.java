package gerador;

import java.util.Map;
import java.util.Optional;
import modelo.*;

import org.springframework.stereotype.Component;


@Component
public class GeradorTemplate {
    public String gerarUml(Projeto projeto) {
        StringBuilder sb = new StringBuilder("classDiagram\n");

        for (modelo.ClasseDef classe : projeto.getClasses()) {
            sb.append("  class ").append(classe.getName()).append(" {\n");

            for (modelo.AtributoDef atributo : classe.atributosSeguro()) {
                sb.append("    ").append(atributo.getTipo()).append(" ").append(atributo.getName()).append("\n");
            }

            for (modelo.MetodoDef metodo : classe.metodosSeguro()) {
                sb.append("    ").append(metodo.getTipoRetorno()).append(" ").append(metodo.getName()).append("()\n");
            }

            sb.append("  }\n");
        }

        for (modelo.RelacaoDef relacao : projeto.getRelacoes()) {
            sb.append("  ").append(relacao.getOrigem()).append(" --> ").append(relacao.getDestino()).append(" : ")
                    .append(relacao.getTipo()).append("\n");
        }

        return sb.toString();
    }

    private String capitalizar(String valor) {
        if (valor == null || valor.isEmpty()) {
            return "";
        }

        return valor.substring(0, 1).toUpperCase() + valor.substring(1);
    }

    private String snake(String valor) {
        if (valor == null || valor.isEmpty()) {
            return "";
        }

        return valor
                .replaceAll("([A-Z])", "_$1")
                .toLowerCase()
                .replaceAll("^_", "");
    }

    private String gerarModel(ClasseDef classe) {
        StringBuilder sb = new StringBuilder();

        // imports
        sb.append("import jakarta.persistence.*;\n");
        sb.append("import java.util.Objects;\n\n");

        // anotações JPA
        sb.append("@Entity\n");
        sb.append("@Table(name = \"")
                .append(snake(classe.nome()))
                .append("\")\n");

        sb.append("public class ")
                .append(classe.nome())
                .append(" {\n\n");

        // ID
        sb.append("    @Id\n");
        sb.append("    @GeneratedValue(strategy = GenerationType.IDENTITY)\n");
        sb.append("    private Long id;\n\n");

        // atributos
        for (AtributoDef atributo : classe.atributosSeguro()) {

            if ("id".equals(atributo.nome())) {
                continue;
            }

            sb.append("    @Column(nullable = false)\n");

            sb.append("    private ")
                    .append(atributo.tipo())
                    .append(" ")
                    .append(atributo.nome())
                    .append(";\n\n");
        }

        // construtor vazio
        sb.append("    public ")
                .append(classe.nome())
                .append("() {}\n\n");

        // getter ID
        sb.append("    public Long getId() {\n");
        sb.append("        return id;\n");
        sb.append("    }\n\n");

        // setter ID
        sb.append("    public void setId(Long id) {\n");
        sb.append("        this.id = id;\n");
        sb.append("    }\n\n");

        // getters e setters dos atributos
        for (AtributoDef atributo : classe.atributosSeguro()) {

            if ("id".equals(atributo.nome())) {
                continue;
            }

            String nomeCapitalizado = capitalizar(atributo.nome());

            // getter
            sb.append("    public ")
                    .append(atributo.tipo())
                    .append(" get")
                    .append(nomeCapitalizado)
                    .append("() {\n");

            sb.append("        return ")
                    .append(atributo.nome())
                    .append(";\n");

            sb.append("    }\n\n");

            // setter
            sb.append("    public void set")
                    .append(nomeCapitalizado)
                    .append("(")
                    .append(atributo.tipo())
                    .append(" ")
                    .append(atributo.nome())
                    .append(") {\n");

            sb.append("        this.")
                    .append(atributo.nome())
                    .append(" = ")
                    .append(atributo.nome())
                    .append(";\n");

            sb.append("    }\n\n");
        }

        // métodos customizados
        for (MetodoDef metodo : classe.metodosSeguro()) {

            sb.append("    public ")
                    .append(metodo.tipoRetorno())
                    .append(" ")
                    .append(metodo.nome())
                    .append("() {\n");

            sb.append("        // TODO: implementar\n");

            String tipo = metodo.tipoRetorno();

            if ("boolean".equals(tipo)) {
                sb.append("        return false;\n");

            } else if ("int".equals(tipo)
                    || "long".equals(tipo)
                    || "double".equals(tipo)
                    || "float".equals(tipo)) {

                sb.append("        return 0;\n");

            } else if (!"void".equals(tipo)) {
                sb.append("        return null;\n");
            }

            sb.append("    }\n\n");
        }

        // equals baseado no id
        sb.append("    @Override\n");
        sb.append("    public boolean equals(Object o) {\n");
        sb.append("        if (this == o) return true;\n");
        sb.append("        if (o == null || getClass() != o.getClass()) return false;\n");

        sb.append("        ")
                .append(classe.nome())
                .append(" that = (")
                .append(classe.nome())
                .append(") o;\n");

        sb.append("        return Objects.equals(id, that.id);\n");
        sb.append("    }\n\n");

        // hashCode
        sb.append("    @Override\n");
        sb.append("    public int hashCode() {\n");
        sb.append("        return Objects.hash(id);\n");
        sb.append("    }\n\n");

        // toString
        sb.append("    @Override\n");
        sb.append("    public String toString() {\n");

        sb.append("        return \"")
                .append(classe.nome())
                .append("{id=\" + id + \"}\";\n");

        sb.append("    }\n");

        sb.append("}\n");
        return sb.toString();
    }

    public String gerarDiagramaCloud(Projeto projeto) {
        StringBuilder sb = new StringBuilder("flowchart LR\n");

        for (modelo.ServicoCloudDef servico : projeto.getServicosCloud()) {
            sb.append("  ").append(servico.getId()).append("[\"").append(servico.getTipo())
                    .append("\\n").append(servico.getId()).append("\"]\n");
        }

        for (modelo.ConexaoCloudDef conexao : projeto.getConexoesCloud()) {
            sb.append("  ").append(conexao.getDe()).append(" -->|\"").append(conexao.getRotulo())
                    .append("\"| ").append(conexao.getPara()).append("\n");
        }

        return sb.toString();
    }

    private String gerarRepositorio(ClasseDef classe) {
        StringBuilder sb = new StringBuilder();

        // imports
        sb.append("import org.springframework.data.jpa.repository.JpaRepository;\n");
        sb.append("import org.springframework.stereotype.Repository;\n");
        sb.append("import java.util.Optional;\n\n");

        // anotação Repository
        sb.append("@Repository\n");

        // interface NomeRepositorio
        String nomeClasse = classe.nome();
        String nomeRepositorio = nomeClasse + "Repositorio";
        sb.append("public interface ")
          .append(nomeRepositorio)
          .append(" extends JpaRepository<")
          .append(nomeClasse)
          .append(", Long> {\n\n");

        // pegar os dois primeiros atributos (exceto id)
        int count = 0;
        for (AtributoDef atributo : classe.atributosSeguro()) {
            if ("id".equalsIgnoreCase(atributo.nome())) {
                continue;
            }
            if (count < 2) {
                sb.append("    // Optional<")
                  .append(nomeClasse)
                  .append("> findBy")
                  .append(capitalizar(atributo.nome()))
                  .append("(")
                  .append(atributo.tipo())
                  .append(" ")
                  .append(atributo.nome())
                  .append(");\n");
                count++;
            }
        }

        sb.append("}\n");

        return sb.toString();
    }


    private String gerarServico(ClasseDef classe) {
        StringBuilder sb = new StringBuilder();

        // imports
        sb.append("import java.util.List;\n");
        sb.append("import java.util.Optional;\n\n");

        // interface NomeServico
        String nomeClasse = classe.nome();
        String nomeServico = nomeClasse + "Servico";

        sb.append("public interface ")
          .append(nomeServico)
          .append(" {\n\n");

        // métodos
        sb.append("    List<").append(nomeClasse).append("> buscarTodos();\n\n");
        sb.append("    Optional<").append(nomeClasse).append("> buscarPorId(Long id);\n\n");
        sb.append("    ").append(nomeClasse).append(" salvar(").append(nomeClasse).append(" entidade);\n\n");
        sb.append("    void deletarPorId(Long id);\n\n");

        sb.append("}\n");

        return sb.toString();
    }


    private String gerarServicoImpl(ClasseDef classe) {
        StringBuilder sb = new StringBuilder();

        // imports
        sb.append("import org.springframework.stereotype.Service;\n");
        sb.append("import org.springframework.transaction.annotation.Transactional;\n");
        sb.append("import java.util.List;\n");
        sb.append("import java.util.Optional;\n\n");

        // anotação Service e Transactional
        sb.append("@Service\n");
        sb.append("@Transactional\n");

        // nome da classe
        String nomeClasse = classe.nome();
        String nomeServico = nomeClasse + "Servico";
        String nomeRepositorio = nomeClasse + "Repositorio";
        String nomeImpl = nomeClasse + "ServicoImpl";

        sb.append("public class ")
          .append(nomeImpl)
          .append(" implements ")
          .append(nomeServico)
          .append(" {\n\n");

        // campo final repositorio
        sb.append("    private final ")
          .append(nomeRepositorio)
          .append(" repositorio;\n\n");

        // construtor com injeção
        sb.append("    public ")
          .append(nomeImpl)
          .append("(")
          .append(nomeRepositorio)
          .append(" repositorio) {\n");
        sb.append("        this.repositorio = repositorio;\n");
        sb.append("    }\n\n");

        // métodos delegando para repositorio
        sb.append("    @Override\n");
        sb.append("    public List<").append(nomeClasse).append("> buscarTodos() {\n");
        sb.append("        return repositorio.findAll();\n");
        sb.append("    }\n\n");

        sb.append("    @Override\n");
        sb.append("    public Optional<").append(nomeClasse).append("> buscarPorId(Long id) {\n");
        sb.append("        return repositorio.findById(id);\n");
        sb.append("    }\n\n");

        sb.append("    @Override\n");
        sb.append("    public ").append(nomeClasse).append(" salvar(").append(nomeClasse).append(" entidade) {\n");
        sb.append("        return repositorio.save(entidade);\n");
        sb.append("    }\n\n");

        sb.append("    @Override\n");
        sb.append("    public void deletarPorId(Long id) {\n");
        sb.append("        repositorio.deleteById(id);\n");
        sb.append("    }\n\n");

        sb.append("}\n");

        return sb.toString();
    }

    private String slug(String valor) {
        if (valor == null) {
            return "";
        }
        return valor.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+", "")
                .replaceAll("-+$", "");
    }

    private String gerarAplicacao(String nomeProjeto) {
        return """
                package com.example.demo;

                import org.springframework.boot.SpringApplication;
                import org.springframework.boot.autoconfigure.SpringBootApplication;

                @SpringBootApplication
                public class Application {

                    public static void main(String[] args) {
                        SpringApplication.run(Application.class, args);
                    }

                }
                """;
    }

    // localiza o serviço de banco: prioriza categoria "DATA",
    // mas cai para "tem engine na configuração" como fallback
    private Optional<ServicoCloudDef> encontrarServicoBanco(Projeto projeto) {
        return projeto.getServicosCloud().stream()
                .filter(s -> "DATA".equalsIgnoreCase(s.getCategoria())
                        || configValor(s, "engine") != null)
                .findFirst();
    }

    private String configValor(ServicoCloudDef servico, String chave) {
        Map<String, String> config = servico.getConfiguracao();
        return config != null ? config.get(chave) : null;
    }

    private boolean usaSomentePostgres(Projeto projeto) {
        return encontrarServicoBanco(projeto)
                .map(s -> configValor(s, "engine"))
                .filter(engine -> engine != null)
                .map(engine -> engine.toLowerCase().contains("postgres"))
                .orElse(false);
    }

    private String gerarPom(Projeto projeto) {
        String artifactId = slug(projeto.getNome());
        boolean somentePostgres = usaSomentePostgres(projeto);

        String dependenciasBanco = somentePostgres
                ? """
                        <dependency>
                            <groupId>org.postgresql</groupId>
                            <artifactId>postgresql</artifactId>
                            <scope>runtime</scope>
                        </dependency>
                """
                : """
                        <dependency>
                            <groupId>com.mysql</groupId>
                            <artifactId>mysql-connector-j</artifactId>
                            <scope>runtime</scope>
                        </dependency>
                        <dependency>
                            <groupId>org.postgresql</groupId>
                            <artifactId>postgresql</artifactId>
                            <scope>runtime</scope>
                        </dependency>
                """;

        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <project xmlns="http://maven.apache.org/POM/4.0.0"
                         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
                    <modelVersion>4.0.0</modelVersion>

                    <parent>
                        <groupId>org.springframework.boot</groupId>
                        <artifactId>spring-boot-starter-parent</artifactId>
                        <version>3.3.2</version>
                        <relativePath/>
                    </parent>

                    <groupId>com.example</groupId>
                    <artifactId>%s</artifactId>
                    <version>0.0.1-SNAPSHOT</version>
                    <packaging>jar</packaging>

                    <properties>
                        <java.version>17</java.version>
                    </properties>

                    <dependencies>
                        <dependency>
                            <groupId>org.springframework.boot</groupId>
                            <artifactId>spring-boot-starter-web</artifactId>
                        </dependency>
                        <dependency>
                            <groupId>org.springframework.boot</groupId>
                            <artifactId>spring-boot-starter-data-jpa</artifactId>
                        </dependency>
                        <dependency>
                            <groupId>org.springframework.boot</groupId>
                            <artifactId>spring-boot-starter-validation</artifactId>
                        </dependency>
                        <dependency>
                            <groupId>org.springframework.boot</groupId>
                            <artifactId>spring-boot-starter-actuator</artifactId>
                        </dependency>
                %s
                    </dependencies>

                    <build>
                        <plugins>
                            <plugin>
                                <groupId>org.springframework.boot</groupId>
                                <artifactId>spring-boot-maven-plugin</artifactId>
                            </plugin>
                        </plugins>
                    </build>

                </project>
                """.formatted(artifactId, dependenciasBanco);
    }

    private String gerarApplicationYml(Projeto projeto) {
        ServicoCloudDef servico = encontrarServicoBanco(projeto)
                .orElseThrow(() -> new IllegalStateException(
                        "Nenhum serviço de banco de dados encontrado no projeto."));

        String dbName = configValor(servico, "dbName");
        String username = configValor(servico, "username");
        String engine = configValor(servico, "engine");

        boolean postgres = engine != null && engine.toLowerCase().contains("postgres");

        String url = postgres
                ? "jdbc:postgresql://${DB_HOST:localhost}:5432/" + dbName
                : "jdbc:mysql://${DB_HOST:localhost}:3306/" + dbName;

        String driverClassName = postgres
                ? "org.postgresql.Driver"
                : "com.mysql.cj.jdbc.Driver";

        return """
                spring:
                  datasource:
                    url: %s
                    username: %s
                    password: ${DB_PASSWORD:troque_esta_senha}
                    driver-class-name: %s
                  jpa:
                    hibernate:
                      ddl-auto: update
                    show-sql: false

                management:
                  endpoints:
                    web:
                      exposure:
                        include: health,info
                """.formatted(url, username, driverClassName);
    }

}
