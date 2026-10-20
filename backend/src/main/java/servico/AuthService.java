package servico;

import com.web2.security.JwtService;
import dao.RoleRepositorio;
import dao.UsuarioRepositorio;
import dto.AuthResponse;
import dto.LoginRequest;
import dto.RegistroRequest;
import modelo.RefreshToken;
import modelo.Role;
import modelo.Usuario;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
public class AuthService {
    private final UsuarioRepositorio usuarioRepositorio;
    private final RoleRepositorio roleRepositorio;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UsuarioRepositorio usuarioRepositorio,
            RoleRepositorio roleRepositorio,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            AuthenticationManager authenticationManager) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.roleRepositorio = roleRepositorio;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse registrar(RegistroRequest request) {
        if (usuarioRepositorio.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email já está em uso");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(request.getNome());
        usuario.setEmail(request.getEmail());
        usuario.setSenhaHash(passwordEncoder.encode(request.getSenha()));
        usuario.setAtivo(true);

        // Atribui role padrão ROLE_USER
        Role roleUser = roleRepositorio.findByNome("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("Role ROLE_USER não encontrada"));
        usuario.setRoles(Set.of(roleUser));

        usuarioRepositorio.save(usuario);

        return gerarTokens(usuario);
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getSenha()));

        Usuario usuario = (Usuario) authentication.getPrincipal();
        return gerarTokens(usuario);
    }

    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        RefreshToken tokenEntity = refreshTokenService.findByToken(refreshToken);

        if (!refreshTokenService.isValid(tokenEntity)) {
            throw new RuntimeException("Refresh token inválido ou expirado");
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

    private AuthResponse gerarTokens(Usuario usuario) {
        String accessToken = jwtService.generateAccessToken(usuario);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(usuario);

        return new AuthResponse(accessToken, refreshToken.getToken());
    }
}