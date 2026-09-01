// Quando o usuário clica em "Gerar Projeto", o sistema retorna este objeto
// contendo os diagramas e todos os artefatos gerados.
package modelo;

import java.util.List;

public record ResultadoGeracao(
        String idProjeto,               // ID do projeto que originou a geração
        String uml,                     // código Mermaid do diagrama UML
        String cloud,                   // código Mermaid do diagrama cloud
        List<ArtefatoGerado> artefatos  // lista de todos os arquivos gerados
) {}
