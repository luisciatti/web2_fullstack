package servico;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import com.web2.metricas.MetricasNegocio;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import dao.ProjetoRepositorio;
import gerador.GeradorTemplate;
import modelo.ArtefatoGerado;
import modelo.Projeto;
import modelo.ResultadoGeracao;
import modelo.Usuario;

@Service
public class ProjetoServicoImpl implements ProjetoServico {

        private final ProjetoRepositorio repositorio;
        private final GeradorTemplate geradorTemplate;
        private final MetricasNegocio metricasNegocio;

        public ProjetoServicoImpl(
                        ProjetoRepositorio repositorio,
                        GeradorTemplate geradorTemplate,
                        MetricasNegocio metricasNegocio) {

                this.repositorio = repositorio;
                this.geradorTemplate = geradorTemplate;
                this.metricasNegocio = metricasNegocio;
        }

        @Override
        public List<Projeto> buscarTodos() {
                Authentication authentication = autenticacaoAtual();

                if (ehAdmin(authentication)) {
                        return repositorio.buscarTodos();
                }

                String usuarioId = usuarioIdAtual(authentication);

                return repositorio.buscarTodos()
                                .stream()
                                .filter(projeto -> Objects.equals(projeto.getUsuarioId(), usuarioId))
                                .toList();
        }

        @Override
        public Optional<Projeto> buscarPorId(String id) {
                Authentication authentication = autenticacaoAtual();

                Optional<Projeto> projeto = repositorio.buscarPorId(id);

                projeto.ifPresent(p -> validarAcesso(p, authentication));

                return projeto;
        }

        @Override
        public Projeto salvar(Projeto projeto) {
                Authentication authentication = autenticacaoAtual();

                boolean novoProjeto = projeto.getId() == null || projeto.getId().isBlank();

                if (novoProjeto) {

                        // Novo projeto pertence sempre ao usuário autenticado.
                        projeto.setUsuarioId(
                                        usuarioIdAtual(authentication));

                } else {

                        Projeto existente = repositorio.buscarPorId(projeto.getId())
                                        .orElseThrow(() -> new IllegalArgumentException(
                                                        "Projeto não encontrado: "
                                                                        + projeto.getId()));

                        validarAcesso(existente, authentication);

                        // Impede troca do dono através de PUT.
                        projeto.setUsuarioId(existente.getUsuarioId());
                }

                return repositorio.salvar(projeto);
        }

        @Override
        public void deletarPorId(String id) {
                Authentication authentication = autenticacaoAtual();

                Projeto projeto = repositorio.buscarPorId(id)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Projeto não encontrado: " + id));

                validarAcesso(projeto, authentication);

                repositorio.deletarPorId(id);
        }

        @Override
        public ResultadoGeracao gerar(String id) {
                try {
                        Authentication authentication = autenticacaoAtual();

                        Projeto projeto = repositorio.buscarPorId(id)
                                        .orElseThrow(() -> new IllegalArgumentException(
                                                        "Projeto não encontrado: " + id));

                        validarAcesso(projeto, authentication);

                        String uml = geradorTemplate.gerarUml(projeto);
                        String cloud = geradorTemplate.gerarDiagramaCloud(projeto);

                        List<ArtefatoGerado> artefatos = geradorTemplate.gerarArtefatos(projeto);

                        ResultadoGeracao resultado = new ResultadoGeracao(
                                        projeto.getId(),
                                        uml,
                                        cloud,
                                        artefatos);
                        metricasNegocio.registrarProjetoGeracaoSucesso();
                        return resultado;
                } catch (RuntimeException e) {
                        metricasNegocio.registrarProjetoGeracaoFalha();
                        throw e;
                }
        }

        private Authentication autenticacaoAtual() {
                Authentication authentication = SecurityContextHolder
                                .getContext()
                                .getAuthentication();

                if (authentication == null
                                || !authentication.isAuthenticated()
                                || authentication instanceof AnonymousAuthenticationToken) {

                        throw new AccessDeniedException(
                                        "Usuário não autenticado");
                }

                return authentication;
        }

        private String usuarioIdAtual(
                        Authentication authentication) {

                Object principal = authentication.getPrincipal();

                if (principal instanceof Usuario usuario
                                && usuario.getId() != null
                                && !usuario.getId().isBlank()) {

                        return usuario.getId();
                }

                throw new AccessDeniedException(
                                "Usuário autenticado inválido");
        }

        private boolean ehAdmin(
                        Authentication authentication) {

                return authentication.getAuthorities()
                                .stream()
                                .anyMatch(authority -> "ROLE_ADMIN".equals(
                                                authority.getAuthority()));
        }

        private void validarAcesso(
                        Projeto projeto,
                        Authentication authentication) {

                if (ehAdmin(authentication)) {
                        return;
                }

                String usuarioId = usuarioIdAtual(authentication);

                if (!Objects.equals(
                                projeto.getUsuarioId(),
                                usuarioId)) {

                        throw new AccessDeniedException(
                                        "Você não possui acesso a este projeto");
                }
        }
}