import dao.ProjetoRepositorio;
import gerador.GeradorTemplate;
import modelo.ArtefatoGerado;
import modelo.Projeto;
import modelo.ResultadoGeracao;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import servico.ProjetoServicoImpl;
import modelo.Role;
import modelo.Usuario;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Set;
import java.util.List;
import java.util.Optional;

import static org.hibernate.validator.internal.util.Contracts.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@AutoConfigureMockMvc(addFilters = false)
@ExtendWith(MockitoExtension.class)
class ProjetoServicoImplTest {

    @BeforeEach
    void configurarUsuarioAutenticado() {
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
    }

    @AfterEach
    void limparSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Mock
    private ProjetoRepositorio repositorio;

    @Mock
    private GeradorTemplate geradorTemplate;

    @InjectMocks
    private ProjetoServicoImpl servico;

    @Test
    void gerar_comIdExistente_deveRetornarResultado() {
        Projeto projeto = new Projeto();
        projeto.setUsuarioId("usuario-teste");

        when(repositorio.buscarPorId("1")).thenReturn(Optional.of(projeto));

        List<ArtefatoGerado> listaArtefatosEsperada = List.of(new ArtefatoGerado("JAVA_MODEL", "Usuario.java", "public class Usuario {}"));

        when(geradorTemplate.gerarUml(projeto)).thenReturn("diagrama-uml-gerado");
        when(geradorTemplate.gerarDiagramaCloud(projeto)).thenReturn("diagrama-cloud-gerado");
        when(geradorTemplate.gerarArtefatos(projeto)).thenReturn(listaArtefatosEsperada);

        ResultadoGeracao resultado = servico.gerar("1");

        assertNotNull(resultado);

        assertEquals("diagrama-uml-gerado", resultado.uml());
        assertEquals("diagrama-cloud-gerado", resultado.cloud());
        assertEquals(listaArtefatosEsperada, resultado.artefatos());
    }

    @Test
    void gerar_comIdInexistente_deveLancarExcecao() {
        when(repositorio.buscarPorId("nao-existe")).thenReturn(Optional.empty());

        IllegalArgumentException excecao = assertThrows(
                IllegalArgumentException.class,
                () -> servico.gerar("nao-existe")
        );
    }

    @Test
    void salvar_deveDelegarParaRepositorio() {
        var projeto = new Projeto();

        when(repositorio.salvar(projeto)).thenReturn(projeto);

        servico.salvar(projeto);

        Mockito.verify(repositorio).salvar(projeto);
    }
}