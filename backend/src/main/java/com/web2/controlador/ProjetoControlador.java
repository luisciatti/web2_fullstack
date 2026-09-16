package com.web2.controlador;

import java.util.List;

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

import jakarta.validation.Valid;
import modelo.Projeto;
import servico.ProjetoServico;

@RestController
@RequestMapping("/api/projetos")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class ProjetoControlador {

    private final ProjetoServico servico;

    // injeção via construtor
    public ProjetoControlador(ProjetoServico servico) {
        this.servico = servico;
    }

    // GET /api/projetos → retorna List<Projeto>
    @GetMapping
    public List<Projeto> buscarTodos() {
        return servico.buscarTodos();
    }

    // GET /api/projetos/{id} → retorna 200 com projeto ou 404
    @GetMapping("/{id}")
    public ResponseEntity<Projeto> buscarPorId(@PathVariable String id) {
        return servico.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/projetos → recebe @Valid @RequestBody, retorna projeto salvo
    @PostMapping
    public Projeto salvar(@Valid @RequestBody Projeto projeto) {
        return servico.salvar(projeto);
    }

    // PUT /api/projetos/{id} → 200 se existe, 404 se não
    @PutMapping("/{id}")
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
    public void deletar(@PathVariable String id) {
        servico.deletarPorId(id);
    }
}