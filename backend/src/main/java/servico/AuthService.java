package servico;

import com.web2.excecao.CadastroDesabilitadoException;
import com.web2.excecao.EmailJaCadastradoException;
import com.web2.excecao.TokenInvalidoException;
import com.web2.metricas.MetricasNegocio;
import com.web2.security.JwtService;
import dao.RoleRepositorio;
import dao.UsuarioRepositorio;
import dto.AuthResponse;
import dto.LoginRequest;
import dto.RegistroRequest;
import modelo.RefreshToken;
import modelo.Role;
import modelo.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Set;

@Service
public class AuthService {
    private final UsuarioRepositorio usuarioRepositorio;
    private final RoleRepositorio roleRepositorio;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AuthenticationManager authenticationManager;
    private final boolean registrationEnabled;
    private final MetricasNegocio metricasNegocio;

    public AuthService(
            UsuarioRepositorio usuarioRepositorio,
            RoleRepositorio roleRepositorio,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            AuthenticationManager authenticationManager,
            @Value("${app.registration.enabled:true}") boolean registrationEnabled,
            MetricasNegocio metricasNegocio) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.roleRepositorio = roleRepositorio;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.authenticationManager = authenticationManager;
        this.registrationEnabled = registrationEnabled;
        this.metricasNegocio = metricasNegocio;
    }

    @Transactional
    public AuthResponse registrar(RegistroRequest request) {
        try {
            if (!registrationEnabled) {
                throw new CadastroDesabilitadoException();
            }

            String email = normalizarEmail(request.getEmail());
            if (usuarioRepositorio.existsByEmail(email)) {
                throw new EmailJaCadastradoException();
            }

            Usuario usuario = new Usuario();
            usuario.setNome(request.getNome());
            usuario.setEmail(email);
            usuario.setSenhaHash(passwordEncoder.encode(request.getSenha()));
            usuario.setAtivo(true);

            // Atribui role padrão ROLE_USER
            Role roleUser = roleRepositorio.findByNome("ROLE_USER")
                    .orElseThrow(() -> new RuntimeException("Role ROLE_USER não encontrada"));
            usuario.setRoles(Set.of(roleUser));

            Usuario salvo = usuarioRepositorio.save(usuario);
            metricasNegocio.registrarAuthRegisterSucesso();

            return gerarTokens(salvo);
        } catch (RuntimeException e) {
            metricasNegocio.registrarAuthRegisterFalha();
            throw e;
        }
    }

    public AuthResponse login(LoginRequest request) {
        try {
            String email = normalizarEmail(request.getEmail());

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getSenha()));

            Usuario usuario = (Usuario) authentication.getPrincipal();
            metricasNegocio.registrarAuthLoginSucesso();
            return gerarTokens(usuario);
        } catch (RuntimeException e) {
            metricasNegocio.registrarAuthLoginFalha();
            throw e;
        }
    }

    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        RefreshToken tokenEntity = refreshTokenService.findByToken(refreshToken);

        if (!refreshTokenService.isValid(tokenEntity)) {
            throw new TokenInvalidoException();
        }

        Usuario usuario = tokenEntity.getUsuario();

        // Gera novos tokens
        AuthResponse response = gerarTokens(usuario);

        // Revoga o refresh token antigo (rotation)
        refreshTokenService.revokeRefreshToken(tokenEntity);

        return response;
    }

    @Transactional
    public void logout(String refreshToken) {
        RefreshToken tokenEntity = refreshTokenService.findByToken(refreshToken);
        if (tokenEntity != null) {
            refreshTokenService.revokeRefreshToken(tokenEntity);
        }
    }

    private String normalizarEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private AuthResponse gerarTokens(Usuario usuario) {
        String accessToken = jwtService.generateAccessToken(usuario);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(usuario);

        return new AuthResponse(accessToken, refreshToken.getToken());
    }
}