package com.web2.controlador;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.web2.Web2BackendApplication;
import dto.LoginRequest;
import dto.RegistroRequest;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = Web2BackendApplication.class)
@AutoConfigureMockMvc
@TestPropertySource(properties = "app.registration.enabled=false")
class AuthRegistroDesabilitadoTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registerDesabilitado_retorna403() throws Exception {
        RegistroRequest request = new RegistroRequest();
        request.setNome("Teste");
        request.setEmail("desabilitado." + UUID.randomUUID() + "@example.com");
        request.setSenha("senhaValida123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(content().json("{\"erro\":\"Cadastro temporariamente desabilitado\"}"));
    }

    @Test
    void loginContinuaRespondendoMesmoComRegistroDesabilitado() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("nao-existe." + UUID.randomUUID() + "@example.com");
        request.setSenha("qualquerSenha123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(content().json("{\"erro\":\"Credenciais inválidas\"}"));
    }
}
