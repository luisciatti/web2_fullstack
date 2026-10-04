import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import com.web2.DiagramCodeBackendApplication;

import modelo.AtributoDef;
import modelo.ClasseDef;
import modelo.Projeto;
import modelo.ServicoCloudDef;
import modelo.ResultadoGeracao;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(classes = DiagramCodeBackendApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ProjetoControladorTest {

    @Autowired
    private TestRestTemplate restTemplate;

    private Projeto criarProjetoValido() {
        Projeto projeto = new Projeto();
        projeto.setNome("Projeto de Teste");
        projeto.setLinguagem("java");
        projeto.setFramework("spring-boot");
        projeto.setProvedorCloud("aws");
        projeto.setClasses(List.of(
                new ClasseDef(
                        "Usuario",
                        List.of(new AtributoDef("nome", "String")),
                        List.of())));
        projeto.setServicosCloud(List.of(
                new ServicoCloudDef(
                        "db-principal",
                        "aws-rds",
                        "DATA",
                        Map.of(
                                "engine", "postgres",
                                "dbName", "projeto_teste",
                                "username", "usuario_teste",
                                "password", "senha_teste"))));
        return projeto;
    }

    @Test
    void postProjeto_retornaIdGerado() {
        ResponseEntity<Projeto> resposta = restTemplate.postForEntity(
                "/api/projetos",
                criarProjetoValido(),
                Projeto.class);

        assertEquals(200, resposta.getStatusCode().value());
        assertNotNull(resposta.getBody());
        assertNotNull(resposta.getBody().getId());
    }

    @Test
    void getPorIdInexistente_retorna404() {
        ResponseEntity<Projeto> resposta = restTemplate.getForEntity(
                "/api/projetos/id-que-nao-existe",
                Projeto.class);

        assertEquals(404, resposta.getStatusCode().value());
    }

    @Test
    void postGerar_comProjetoValido_retornaArtefatos() {
        ResponseEntity<Projeto> respostaCriacao = restTemplate.postForEntity(
                "/api/projetos",
                criarProjetoValido(),
                Projeto.class);

        assertNotNull(respostaCriacao.getBody());
        String id = respostaCriacao.getBody().getId();

        ResponseEntity<ResultadoGeracao> respostaGeracao = restTemplate.postForEntity(
                "/api/projetos/" + id + "/gerar",
                null,
                ResultadoGeracao.class);

        assertEquals(200, respostaGeracao.getStatusCode().value());
        assertNotNull(respostaGeracao.getBody());
        assertFalse(respostaGeracao.getBody().artefatos().isEmpty());
    }

    @Test
    void getArtefatos_comProjetoValido_retornaLista() {
        ResponseEntity<Projeto> respostaCriacao = restTemplate.postForEntity(
                "/api/projetos",
                criarProjetoValido(),
                Projeto.class);

        assertNotNull(respostaCriacao.getBody());

        ResponseEntity<modelo.ArtefatoGerado[]> respostaArtefatos = restTemplate.getForEntity(
                "/api/projetos/" + respostaCriacao.getBody().getId() + "/artefatos",
                modelo.ArtefatoGerado[].class);

        assertEquals(200, respostaArtefatos.getStatusCode().value());
        assertNotNull(respostaArtefatos.getBody());
        assertTrue(respostaArtefatos.getBody().length > 0);
    }

    @Test
    void getDiagramaUml_comProjetoValido_retornaMermaid() {
        ResponseEntity<Projeto> respostaCriacao = restTemplate.postForEntity(
                "/api/projetos",
                criarProjetoValido(),
                Projeto.class);

        assertNotNull(respostaCriacao.getBody());

        ResponseEntity<Map> respostaDiagrama = restTemplate.getForEntity(
                "/api/projetos/" + respostaCriacao.getBody().getId() + "/diagrama/uml",
                Map.class);

        assertEquals(200, respostaDiagrama.getStatusCode().value());
        assertNotNull(respostaDiagrama.getBody());
        assertTrue(((String) respostaDiagrama.getBody().get("uml")).contains("classDiagram"));
    }

    @Test
    void getDiagramaCloud_comProjetoValido_retornaMermaid() {
        ResponseEntity<Projeto> respostaCriacao = restTemplate.postForEntity(
                "/api/projetos",
                criarProjetoValido(),
                Projeto.class);

        assertNotNull(respostaCriacao.getBody());

        ResponseEntity<Map> respostaDiagrama = restTemplate.getForEntity(
                "/api/projetos/" + respostaCriacao.getBody().getId() + "/diagrama/cloud",
                Map.class);

        assertEquals(200, respostaDiagrama.getStatusCode().value());
        assertNotNull(respostaDiagrama.getBody());
        assertFalse(((String) respostaDiagrama.getBody().get("cloud")).isBlank());
    }

    @Test
    void putProjeto_existente_retornaProjetoAtualizado() {
        ResponseEntity<Projeto> respostaCriacao = restTemplate.postForEntity(
                "/api/projetos",
                criarProjetoValido(),
                Projeto.class);

        assertNotNull(respostaCriacao.getBody());

        Projeto atualizado = criarProjetoValido();
        atualizado.setNome("Projeto Atualizado");

        ResponseEntity<Projeto> respostaAtualizacao = restTemplate.exchange(
                "/api/projetos/" + respostaCriacao.getBody().getId(),
                HttpMethod.PUT,
                new HttpEntity<>(atualizado),
                Projeto.class);

        assertEquals(200, respostaAtualizacao.getStatusCode().value());
        assertNotNull(respostaAtualizacao.getBody());
        assertEquals("Projeto Atualizado", respostaAtualizacao.getBody().getNome());
    }

    @Test
    void deleteProjeto_existente_retorna204() {
        ResponseEntity<Projeto> respostaCriacao = restTemplate.postForEntity(
                "/api/projetos",
                criarProjetoValido(),
                Projeto.class);

        assertNotNull(respostaCriacao.getBody());

        ResponseEntity<Void> respostaDelete = restTemplate.exchange(
                "/api/projetos/" + respostaCriacao.getBody().getId(),
                HttpMethod.DELETE,
                HttpEntity.EMPTY,
                Void.class);

        assertEquals(204, respostaDelete.getStatusCode().value());
    }

    @Test
    void postComBodyVazio_retorna400() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> request = new HttpEntity<>("{}", headers);

        ResponseEntity<String> resposta = restTemplate.exchange(
                "/api/projetos",
                HttpMethod.POST,
                request,
                String.class);

        assertEquals(400, resposta.getStatusCode().value());
    }
}
