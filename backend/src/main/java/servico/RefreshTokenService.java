package servico;

import dao.RefreshTokenRepositorio;
import modelo.RefreshToken;
import modelo.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class RefreshTokenService {
    private final RefreshTokenRepositorio refreshTokenRepositorio;
    private final long refreshTokenExpirationMs;

    public RefreshTokenService(
            RefreshTokenRepositorio refreshTokenRepositorio,
            @Value("${app.jwt.refresh-token-expiration-ms}") long refreshTokenExpirationMs) {
        this.refreshTokenRepositorio = refreshTokenRepositorio;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    @Transactional
    public RefreshToken createRefreshToken(Usuario usuario) {
        // Revoga refresh tokens anteriores do usuário (opcional, mas recomendado)
        refreshTokenRepositorio.findByUsuarioIdAndRevogadoFalse(usuario.getId())
                .ifPresent(this::revokeRefreshToken);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setUsuario(usuario);
        refreshToken.setExpiraEm(Instant.now().plusMillis(refreshTokenExpirationMs));
        refreshToken.setRevogado(false);

        return refreshTokenRepositorio.save(refreshToken);
    }

    public RefreshToken findByToken(String token) {
        return refreshTokenRepositorio.findByToken(token).orElse(null);
    }

    public boolean isValid(RefreshToken refreshToken) {
        return refreshToken != null
                && !refreshToken.getRevogado()
                && !refreshToken.isExpirado();
    }

    @Transactional
    public void revokeRefreshToken(RefreshToken refreshToken) {
        if (refreshToken != null) {
            refreshToken.setRevogado(true);
            refreshTokenRepositorio.save(refreshToken);
        }
    }

    @Transactional
    public void revokeAllByUsuarioId(String usuarioId) {
        refreshTokenRepositorio.deleteByUsuarioId(usuarioId);
    }
}