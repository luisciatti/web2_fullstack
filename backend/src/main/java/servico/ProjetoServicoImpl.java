package servico;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

import dao.ProjetoRepositorio;
import gerador.GeradorTemplate;
import modelo.ArtefatoGerado;
import modelo.Projeto;
import modelo.ResultadoGeracao;

@Service
public class ProjetoServicoImpl implements ProjetoServico {

       private final ProjetoRepositorio repositorio;
       private final GeradorTemplate geradorTemplate;  // será criado no T-19

       // o Spring injeta automaticamente — não precisa de @Autowired
       public ProjetoServicoImpl(ProjetoRepositorio repositorio,
                                  GeradorTemplate geradorTemplate) {
           // atribua os parâmetros aos campos
           this.repositorio = repositorio;
           this.geradorTemplate = geradorTemplate;
       }

    @Override
    public List<Projeto> buscarTodos() {
        // delegar para repositorio
        return repositorio.buscarTodos();
    }

    @Override
    public Optional<Projeto> buscarPorId(String id) {
        // delegar para repositorio
        return repositorio.buscarPorId(id);
    }

    @Override
    public Projeto salvar(Projeto projeto) {
        // delegar para repositorio
        return repositorio.salvar(projeto);
    }

    @Override
    public void deletarPorId(String id) {
        // delegar para repositorio
        repositorio.deletarPorId(id);
    }

    @Override
    public ResultadoGeracao gerar(String id) {
        Projeto projeto = repositorio.buscarPorId(id)
                .orElseThrow(() -> new IllegalArgumentException("Projeto não encontrado: " + id));

        String uml = geradorTemplate.gerarUml(projeto);
        String cloud = geradorTemplate.gerarDiagramaCloud(projeto);
        List<ArtefatoGerado> artefatos = geradorTemplate.gerarArtefatos(projeto);

        return new ResultadoGeracao(projeto.getId(), uml, cloud, artefatos);
    }
}
