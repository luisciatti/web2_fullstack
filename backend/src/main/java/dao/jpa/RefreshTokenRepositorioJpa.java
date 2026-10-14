package dao.jpa;

import dao.RefreshTokenRepositorio;
import dao.jpa.entity.RefreshTokenEntity;
import dao.jpa.entity.UsuarioEntity;
import modelo.RefreshToken;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class RefreshTokenRepositorioJpa implements RefreshTokenRepositorio {
    private final RefreshTokenRepository refreshTokenRepository;
    private final UsuarioEntityJpaRepository usuarioEntityJpaRepository;
    private final AuthJpaMapper mapper;

    public RefreshTokenRepositorioJpa(
            RefreshTokenRepository refreshTokenRepository,
            UsuarioEntityJpaRepository usuarioEntityJpaRepository,
            AuthJpaMapper mapper) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.usuarioEntityJpaRepository = usuarioEntityJpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token).map(mapper::toModel);
    }

    @Override
    public Optional<RefreshToken> findByUsuarioIdAndRevogadoFalse(String usuarioId) {
        return refreshTokenRepository.findByUsuarioIdAndRevogadoFalse(usuarioId).map(mapper::toModel);
    }

    @Override
    public void deleteByUsuarioId(String usuarioId) {
        refreshTokenRepository.deleteByUsuarioId(usuarioId);
    }

    @Override
    public RefreshToken save(RefreshToken refreshToken) {
        RefreshTokenEntity entity = mapper.toEntity(refreshToken);

        if (entity.getId() == null || entity.getId().isBlank()) {
            entity.setId(UUID.randomUUID().toString());
        }

        if (refreshToken.getUsuario() != null
                && refreshToken.getUsuario().getId() != null
                && !refreshToken.getUsuario().getId().isBlank()) {
            UsuarioEntity usuarioEntity = usuarioEntityJpaRepository
                    .findById(refreshToken.getUsuario().getId())
                    .orElse(mapper.toEntity(refreshToken.getUsuario()));
            entity.setUsuario(usuarioEntity);
        }

        RefreshTokenEntity savedEntity = refreshTokenRepository.save(entity);
        return mapper.toModel(savedEntity);
    }
}
