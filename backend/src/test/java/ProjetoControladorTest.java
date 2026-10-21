import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import com.web2.Web2BackendApplication;
import java.io.IOException;
import java.util.Set;
import dao.RoleRepositorio;
import dao.UsuarioRepositorio;
import org.junit.jupiter.api.BeforeEach;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import modelo.Role;
import modelo.Usuario;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import modelo.AtributoDef;
import modelo.ClasseDef;
import modelo.Projeto;
import modelo.ServicoCloudDef;
import modelo.ResultadoGeracao;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@AutoConfigureMockMvc(addFilters = false)
@SpringBootTest(classes = Web2BackendApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(ProjetoControladorTest.TestSecurityConfig.class)
class ProjetoControladorTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UsuarioRepositorio usuarioRepositorio;

    @Autowired
    private RoleRepositorio roleRepositorio;

    
    @BeforeEach
    void prepararUsuarioTeste() {
        if (!usuarioRepositorio.existsByEmail("teste@teste.com")) {
                Role role = roleRepositorio.findByNome("ROLE_USER")
                        .orElseThrow();

                Usuario usuario = new Usuario();
                usuario.setId("usuario-teste");
                usuario.setNome("Usuário Teste");
                usuario.setEmail("teste@teste.com");
                usuario.setSenhaHash("senha");
                usuario.setAtivo(true);
                usuario.setRoles(Set.of(role));

                usuarioRepositorio.save(usuario);
        }
}

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

    @TestConfiguration
        static class TestSecurityConfig {

        @Bean
        @Order(0)
        SecurityFilterChain testSecurityFilterChain(HttpSecurity http)
                throws Exception {

                http
                        .securityMatcher("/api/projetos/**")
                        .csrf(csrf -> csrf.disable())
                        .authorizeHttpRequests(authorize ->
                                authorize.anyRequest().permitAll())
                        .addFilterBefore(
                                new OncePerRequestFilter() {

                                @Override
                                protected void doFilterInternal(
                                        HttpServletRequest request,
                                        HttpServletResponse response,
                                        FilterChain filterChain)
                                        throws ServletException, IOException {

                                        Role role = new Role();
                                        role.setId("role-user");
                                        role.setNome("ROLE_USER");

                                        Usuario usuario = new Usuario();
                                        usuario.setId("usuario-teste");
                                        usuario.setNome("Usuário Teste");
                                        usuario.setEmail("teste@teste.com");
                                        usuario.setSenhaHash("senha");
                                        usuario.setAtivo(true);
                                        usuario.setRoles(Set.of(role));

                                        UsernamePasswordAuthenticationToken authentication =
                                                new UsernamePasswordAuthenticationToken(
                                                        usuario,
                                                        null,
                                                        usuario.getAuthorities()
                                                );

                                        SecurityContextHolder.getContext()
                                                .setAuthentication(authentication);

                                        filterChain.doFilter(request, response);
                                }
                                },
                                AnonymousAuthenticationFilter.class
                        );

                return http.build();
        }
        }
}
