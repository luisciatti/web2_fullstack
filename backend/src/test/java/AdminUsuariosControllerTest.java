import com.web2.Web2BackendApplication;
import com.web2.security.JwtService;
import dao.RoleRepositorio;
import dao.UsuarioRepositorio;
import dao.jpa.ProjetoEntityJpaRepository;
import dao.jpa.entity.ProjetoEntity;
import modelo.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = Web2BackendApplication.class)
@AutoConfigureMockMvc
@Transactional
class AdminUsuariosControllerTest {
    private static final String USUARIOS = "/api/admin/usuarios";

    @Autowired private MockMvc mvc;
    @Autowired private JwtService jwt;
    @Autowired private UsuarioRepositorio usuarios;
    @Autowired private RoleRepositorio roles;
    @Autowired private ProjetoEntityJpaRepository projetos;

    @Test
    void somenteAdminPodeConsultarUsuariosEProjetos() throws Exception {
        Usuario comum = criarUsuario("teste-admin-comum", "ROLE_USER");
        Usuario admin = criarUsuario("teste-admin-gestor", "ROLE_ADMIN");
        criarProjeto("projeto-usuario-comum", comum);
        criarProjeto("projeto-usuario-admin", admin);

        mvc.perform(get(USUARIOS)).andExpect(status().isForbidden());
        // As permissões vêm do usuário no banco, mesmo quando o token contém outra role.
        mvc.perform(get(USUARIOS).header(HttpHeaders.AUTHORIZATION, bearer(comum)))
                .andExpect(status().isForbidden());
        mvc.perform(get(USUARIOS + "/{id}/projetos", comum.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearer(comum)))
                .andExpect(status().isForbidden());

        mvc.perform(get(USUARIOS).header(HttpHeaders.AUTHORIZATION, bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].email").value(hasItem(comum.getEmail())))
                .andExpect(jsonPath("$..senhaHash").isEmpty())
                .andExpect(jsonPath("$..password").isEmpty());

        mvc.perform(get(USUARIOS + "/{id}/projetos", comum.getId())
                        .header(HttpHeaders.AUTHORIZATION, bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario.id").value(comum.getId()))
                .andExpect(jsonPath("$.projetos.length()").value(1))
                .andExpect(jsonPath("$.projetos[0].id").value("projeto-usuario-comum"))
                .andExpect(jsonPath("$.projetos[0].provedorCloud").value("aws"))
                .andExpect(jsonPath("$.projetos[0].classes").doesNotExist());

        mvc.perform(get(USUARIOS + "/{id}/projetos", "id-ausente")
                        .header(HttpHeaders.AUTHORIZATION, bearer(admin)))
                .andExpect(status().isNotFound());
    }

    private Usuario criarUsuario(String id, String role) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNome(id);
        usuario.setEmail(id + "@example.test");
        usuario.setSenhaHash("hash-de-teste");
        usuario.addRole(roles.findByNome(role).orElseThrow());
        return usuarios.save(usuario);
    }

    private void criarProjeto(String id, Usuario dono) {
        ProjetoEntity projeto = new ProjetoEntity();
        projeto.setId(id);
        projeto.setUsuarioId(dono.getId());
        projeto.setNome(id);
        projeto.setLinguagem("java");
        projeto.setFramework("spring-boot");
        projeto.setProvedorCloud("aws");
        projetos.save(projeto);
    }

    private String bearer(Usuario usuario) {
        return "Bearer " + jwt.generateAccessToken(usuario.getEmail(), List.of("ROLE_ADMIN"));
    }
}
