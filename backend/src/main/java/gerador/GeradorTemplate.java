package gerador;

import modelo.Projeto;

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

}
