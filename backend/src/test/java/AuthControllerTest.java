package com.web2.controlador;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.web2.Web2BackendApplication;
import dao.RoleRepositorio;
import dao.UsuarioRepositorio;
import dto.LoginRequest;
import dto.RegistroRequest;
import java.util.UUID;
import modelo.Role;
import modelo.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = Web2BackendApplication.class)
@AutoConfigureMockMvc
@Transactional
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsuarioRepositorio usuarioRepositorio;

    @Autowired
    private RoleRepositorio roleRepositorio;

    @BeforeEach
    void setUp() {
        Role roleUser = roleRepositorio.findByNome("ROLE_USER")
                .orElseThrow(() -> new IllegalStateException("ROLE_USER não encontrada"));

        String unique = UUID.randomUUID().toString();
        String email = "teste." + unique + "@example.com";

        Usuario usuario = new Usuario();
        usuario.setId("user-" + unique);
        usuario.setNome("Usuario Teste");
        usuario.setEmail(email);
        usuario.setSenhaHash("$2a$10$Q2Xg.............");
        usuario.setAtivo(true);
        usuario.setRoles(java.util.Set.of(roleUser));

        if (!usuarioRepositorio.existsByEmail(email)) {
            usuarioRepositorio.save(usuario);
        }
    }

    @Test
    void registerValido_retorna201ComTokens() throws Exception {
        String email = "novo." + UUID.randomUUID() + "@example.com";
        RegistroRequest request = new RegistroRequest();
        request.setNome("Novo Usuário");
        request.setEmail(email);
        request.setSenha("senhaValida123");

        String responseJson = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode node = objectMapper.readTree(responseJson);
        assertThat(node.get("accessToken").asText()).isNotBlank();
        assertThat(node.get("refreshToken").asText()).isNotBlank();
    }

    @Test
    void registerComRolesNoJson_criaUsuarioComRoleUserApenas() throws Exception {
        String email = "adminpayload." + UUID.randomUUID() + "@example.com";

        String payload = "{\"nome\":\"Payload\",\"email\":\"" + email
                + "\",\"senha\":\"senhaValida123\",\"roles\":[\"ROLE_ADMIN\"]}";

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isCreated());

        Usuario salvo = usuarioRepositorio.findByEmail(email).orElseThrow();
        assertThat(salvo.getRoles()).extracting("nome").containsExactly("ROLE_USER");
    }

    @Test
    void registerEmailDuplicado_retorna409() throws Exception {
        String email = "duplicado." + UUID.randomUUID() + "@example.com";
        RegistroRequest request = new RegistroRequest();
        request.setNome("Teste");
        request.setEmail(email);
        request.setSenha("senhaValida123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(content().json("{\"erro\":\"Email já está em uso\"}"));
    }

    @Test
    void registerEmailDuplicadoEmCaixaDiferente_retorna409() throws Exception {
        String base = "caixa." + UUID.randomUUID();
        String email = base + "@example.com";
        RegistroRequest request = new RegistroRequest();
        request.setNome("Teste");
        request.setEmail(email);
        request.setSenha("senhaValida123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        request.setEmail(email.toUpperCase());
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(content().json("{\"erro\":\"Email já está em uso\"}"));
    }

    @Test
    void registerSenha7Caracteres_retorna400() throws Exception {
        RegistroRequest request = new RegistroRequest();
        request.setNome("Teste");
        request.setEmail("curta." + UUID.randomUUID() + "@example.com");
        request.setSenha("1234567");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerEmailInvalido_retorna400() throws Exception {
        RegistroRequest request = new RegistroRequest();
        request.setNome("Teste");
        request.setEmail("email-invalido");
        request.setSenha("senhaValida123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerCorpoVazio_retorna400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void loginCorreto_retorna200() throws Exception {
        String email = "login." + UUID.randomUUID() + "@example.com";
        RegistroRequest criar = new RegistroRequest();
        criar.setNome("Login");
        criar.setEmail(email);
        criar.setSenha("senhaValida123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(criar)))
                .andExpect(status().isCreated());

        LoginRequest login = new LoginRequest();
        login.setEmail(email);
        login.setSenha("senhaValida123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    void loginSenhaErrada_retorna401() throws Exception {
        String email = "login-errado." + UUID.randomUUID() + "@example.com";
        RegistroRequest criar = new RegistroRequest();
        criar.setNome("Login");
        criar.setEmail(email);
        criar.setSenha("senhaValida123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(criar)))
                .andExpect(status().isCreated());

        LoginRequest login = new LoginRequest();
        login.setEmail(email);
        login.setSenha("senhaErrada");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized())
                .andExpect(content().json("{\"erro\":\"Credenciais inválidas\"}"));
    }

    @Test
    void getProjetosSemToken_retornaStatusAtual() throws Exception {
        mockMvc.perform(get("/api/projetos"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registerDesabilitado_retorna403() throws Exception {
        String email = "desabilitado." + UUID.randomUUID() + "@example.com";
        RegistroRequest request = new RegistroRequest();
        request.setNome("Teste");
        request.setEmail(email);
        request.setSenha("senhaValida123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .header("X-Registration-Override", "nope"))
                .andExpect(status().isForbidden())
                .andExpect(content().json("{\"erro\":\"Cadastro temporariamente desabilitado\"}"));
    }
}
