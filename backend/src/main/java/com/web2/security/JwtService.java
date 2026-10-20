package com.web2.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.Date;
import java.util.List;

@Service
public class JwtService {

    private static final String CLAIM_ROLES = "roles";
    private static final String CLAIM_TYPE = "type";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";

    private final JwtProperties props;
    private final SecretKey key;

    public JwtService(JwtProperties props) {
        this.props = props;
        byte[] secretBytes = props.secret().getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret deve ter pelo menos 32 bytes");
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
    }

    // Geração
    public String generateAccessToken(String subject, Collection<String> roles) {
        return buildToken(subject, roles, TYPE_ACCESS, props.accessTokenExpirationMs());
    }

    public String generateRefreshToken(String subject) {
        return buildToken(subject, List.of(), TYPE_REFRESH, props.refreshTokenExpirationMs());
    }

    private String buildToken(String subject, Collection<String> roles, String type, long ttlMs) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(subject)
                .claim(CLAIM_ROLES, List.copyOf(roles))
                .claim(CLAIM_TYPE, type)
                .issuedAt(new Date(now))
                .expiration(new Date(now + ttlMs))
                .signWith(key)
                .compact();
    }

    // Leitura de claims
    public Claims extractAllClaims(String token) {
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
    }

    public String extractSubject(String token) {
        return extractAllClaims(token).getSubject();
    }

    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        List<String> roles = extractAllClaims(token).get(CLAIM_ROLES, List.class);
        return roles != null ? roles : List.of();
    }

    // Validação
    public boolean isAccessTokenValid(String token) {
        return isValid(token, TYPE_ACCESS);
    }

    public boolean isRefreshTokenValid(String token) {
        return isValid(token, TYPE_REFRESH);
    }

    private boolean isValid(String token, String expectedType) {
        try {
            Claims claims = extractAllClaims(token);
            return expectedType.equals(claims.get(CLAIM_TYPE, String.class))
                    && claims.getSubject() != null;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}