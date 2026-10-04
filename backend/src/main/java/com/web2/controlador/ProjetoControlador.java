package com.web2.controlador;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import modelo.ArtefatoGerado;
import modelo.Projeto;
import modelo.ResultadoGeracao;
import servico.ProjetoServico;

@RestController
@RequestMapping("/api/projetos")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
@Tag(name = "Projetos", description = "CRUD de projetos, geração de artefatos e diagramas Mermaid")
public class ProjetoControlador {

    private final ProjetoServico servico;

    // injeção via construtor
    public ProjetoControlador(ProjetoServico servico) {
        this.servico = servico;
    }

    // GET /api/projetos → retorna List<Projeto>
    @GetMapping
    @Operation(summary = "Lista todos os projetos")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de projetos retornada com sucesso")
    })
    public List<Projeto> buscarTodos() {
        return servico.buscarTodos();
    }

    // GET /api/projetos/{id} → retorna 200 com projeto ou 404
    @GetMapping("/{id}")
    @Operation(summary = "Consulta um projeto pelo ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Projeto encontrado"),
            @ApiResponse(responseCode = "404", description = "Projeto não encontrado")
    })
    public ResponseEntity<Projeto> buscarPorId(@PathVariable String id) {
        return servico.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/projetos → recebe @Valid @RequestBody, retorna projeto salvo
    @PostMapping
    @Operation(summary = "Cria um novo projeto")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Projeto criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Payload inválido")
    })
    public Projeto salvar(@Valid @RequestBody Projeto projeto) {
        return servico.salvar(projeto);
    }

    // PUT /api/projetos/{id} → 200 se existe, 404 se não
    @PutMapping("/{id}")
    @Operation(summary = "Atualiza um projeto existente")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Projeto atualizado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Projeto não encontrado"),
            @ApiResponse(responseCode = "400", description = "Payload inválido")
    })
    public ResponseEntity<Projeto> atualizar(
            @PathVariable String id,
            @Valid @RequestBody Projeto projeto) {

        return servico.buscarPorId(id)
                .map(existente -> {
                    projeto.setId(id);
                    return ResponseEntity.ok(servico.salvar(projeto));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/projetos/{id} → 204 sem corpo
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Exclui um projeto")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Projeto excluído com sucesso"),
            @ApiResponse(responseCode = "404", description = "Projeto não encontrado")
    })
    public void deletar(@PathVariable String id) {
        servico.deletarPorId(id);
    }

    // POST /api/projetos/{id}/gerar
    @PostMapping("/{id}/gerar")
    @Operation(summary = "Gera os artefatos do projeto")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Artefatos gerados com sucesso"),
            @ApiResponse(responseCode = "404", description = "Projeto não encontrado")
    })
    public ResultadoGeracao gerar(@PathVariable String id) {
        return servico.gerar(id);
    }

    // GET /api/projetos/{id}/artefatos
    @GetMapping("/{id}/artefatos")
    @Operation(summary = "Lista os artefatos gerados de um projeto")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Artefatos retornados com sucesso"),
            @ApiResponse(responseCode = "404", description = "Projeto não encontrado")
    })
    public List<ArtefatoGerado> artefatos(@PathVariable String id) {
        return servico.gerar(id).artefatos();
    }

    // GET /api/projetos/{id}/diagrama/uml
    @GetMapping("/{id}/diagrama/uml")
    @Operation(summary = "Retorna o diagrama UML em Mermaid")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Diagrama UML retornado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Projeto não encontrado")
    })
    public Map<String, String> diagramaUml(@PathVariable String id) {
        return Map.of("uml", servico.gerar(id).uml());
    }

    // GET /api/projetos/{id}/diagrama/cloud
    @GetMapping("/{id}/diagrama/cloud")
    @Operation(summary = "Retorna o diagrama Cloud em Mermaid")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Diagrama Cloud retornado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Projeto não encontrado")
    })
    public Map<String, String> diagramaCloud(@PathVariable String id) {
        return Map.of("cloud", servico.gerar(id).cloud());
    }

    // Trata projeto não encontrado
    @org.springframework.web.bind.annotation.ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, String> tratarNaoEncontrado(IllegalArgumentException ex) {
        return Map.of("erro", ex.getMessage());
    }
}