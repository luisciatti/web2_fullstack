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
import servico.ProjetoServicoImpl;

import java.util.List;
import java.util.Optional;

import static org.hibernate.validator.internal.util.Contracts.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjetoServicoImplTest {

    @Mock
    private ProjetoRepositorio repositorio;

    @Mock
    private GeradorTemplate geradorTemplate;

    @InjectMocks
    private ProjetoServicoImpl servico;

    @Test
    void gerar_comIdExistente_deveRetornarResultado() {
        Projeto projeto = new Projeto();

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