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
