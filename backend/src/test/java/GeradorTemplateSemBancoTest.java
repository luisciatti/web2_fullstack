import java.util.List;

import org.junit.jupiter.api.Test;

import gerador.GeradorTemplate;
import modelo.ArtefatoGerado;
import modelo.AtributoDef;
import modelo.ClasseDef;
import modelo.MetodoDef;
import modelo.Projeto;
import modelo.RelacaoDef;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GeradorTemplateSemBancoTest {

    @Test
    void gerarArtefatos_semServicoDeBanco_usaValoresPadrao() {
        Projeto projeto = new Projeto();
        projeto.setNome("Loja Online");
        projeto.setLinguagem("java");
        projeto.setFramework("spring-boot");
        projeto.setProvedorCloud("aws");
        projeto.setClasses(List.of(
                new ClasseDef("Pedido",
                        List.of(new AtributoDef("valor", "BigDecimal")),
                        List.of(new MetodoDef("calcular", "void"))),
                new ClasseDef("Cliente", List.of(), List.of())));
        projeto.setRelacoes(List.of(new RelacaoDef("Pedido", "Cliente", "MANY_TO_ONE")));
        projeto.setServicosCloud(List.of());
        projeto.setConexoesCloud(List.of());

        List<ArtefatoGerado> artefatos = assertDoesNotThrow(
                () -> new GeradorTemplate().gerarArtefatos(projeto));

        String yml = artefatos.stream()
                .filter(artefato -> artefato.nome().equals("application.yml"))
                .findFirst()
                .orElseThrow()
                .conteudo();

        assertTrue(yml.contains("jdbc:mysql://${DB_HOST:localhost}:3306/loja_online"));
        assertTrue(yml.contains("username: app"));

        // Código Java deve ter packages/imports consistentes com a estrutura do ZIP Maven.
        String model = artefatos.stream().filter(a -> a.nome().equals("Pedido.java"))
                .findFirst().orElseThrow().conteudo();
        String repo = artefatos.stream().filter(a -> a.nome().equals("PedidoRepositorio.java"))
                .findFirst().orElseThrow().conteudo();
        String servico = artefatos.stream().filter(a -> a.nome().equals("PedidoServico.java"))
                .findFirst().orElseThrow().conteudo();
        String impl = artefatos.stream().filter(a -> a.nome().equals("PedidoServicoImpl.java"))
                .findFirst().orElseThrow().conteudo();
        String controller = artefatos.stream().filter(a -> a.nome().equals("PedidoControlador.java"))
                .findFirst().orElseThrow().conteudo();
        String app = artefatos.stream().filter(a -> a.nome().equals("Application.java"))
                .findFirst().orElseThrow().conteudo();
        assertTrue(model.startsWith("package com.example.demo.model;"));
        assertTrue(model.contains("import java.math.BigDecimal;"));
        assertTrue(repo.startsWith("package com.example.demo.repositorio;"));
        assertTrue(repo.contains("import com.example.demo.model.Pedido;"));
        assertTrue(servico.startsWith("package com.example.demo.servico;"));
        assertTrue(impl.contains("import com.example.demo.repositorio.PedidoRepositorio;"));
        assertTrue(controller.startsWith("package com.example.demo.controlador;"));
        assertTrue(controller.contains("import com.example.demo.servico.PedidoServico;"));
        assertTrue(app.startsWith("package com.example.demo;"));
    }
}
