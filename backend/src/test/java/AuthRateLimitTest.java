package com.web2.controlador;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.web2.Web2BackendApplication;
import dto.LoginRequest;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = Web2BackendApplication.class)
@AutoConfigureMockMvc
@TestPropertySource(properties = "app.rate-limit.auth.max-requests=3")
class AuthRateLimitTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void loginQuartoPedidoForaDoLimite_retorna429() throws Exception {
        String email = "rate." + UUID.randomUUID() + "@example.com";
        LoginRequest login = new LoginRequest();
        login.setEmail(email);
        login.setSenha("senhaErrada");

        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(login)))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isTooManyRequests());
    }
}
