package gerador;

import modelo.Projeto;

import org.springframework.stereotype.Component;

import jakarta.validation.constraints.Null;

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
}
