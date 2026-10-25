import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.web2.Web2BackendApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(classes = Web2BackendApplication.class)
@AutoConfigureMockMvc
class FrontendPublicAccessTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void paginasPublicasDoFrontendNaoRetornam401Ou403() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(result -> assertThat(result.getResponse().getStatus()).isNotIn(401, 403));

        mockMvc.perform(get("/index.html"))
                .andExpect(result -> assertThat(result.getResponse().getStatus()).isNotIn(401, 403));
    }

    @Test
    void apiProjetosSemTokenContinuaNegada() throws Exception {
        mockMvc.perform(get("/api/projetos"))
                .andExpect(status().isForbidden());
    }
}
