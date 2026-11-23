package com.web2.controlador;

import dao.jpa.ProjetoEntityJpaRepository;
import dao.jpa.ProjetoEntityJpaRepository.ResumoProjeto;
import dao.jpa.UsuarioEntityJpaRepository;
import dao.jpa.UsuarioEntityJpaRepository.ResumoUsuario;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/usuarios")
public class AdminUsuariosController {
    private final UsuarioEntityJpaRepository usuarios;
    private final ProjetoEntityJpaRepository projetos;

    public AdminUsuariosController(UsuarioEntityJpaRepository usuarios, ProjetoEntityJpaRepository projetos) {
        this.usuarios = usuarios;
        this.projetos = projetos;
    }

    @GetMapping
    public List<ResumoUsuario> listarUsuarios() {
        return usuarios.listarResumos();
    }

    @GetMapping("/{id}/projetos")
    public ProjetosDoUsuario listarProjetos(@PathVariable String id) {
        ResumoUsuario usuario = usuarios.buscarResumo(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
        return new ProjetosDoUsuario(usuario, projetos.listarResumosPorUsuario(id));
    }

    public record ProjetosDoUsuario(ResumoUsuario usuario, List<ResumoProjeto> projetos) {}
}
