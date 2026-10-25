package com.web2.excecao;

public class TokenInvalidoException extends RuntimeException {
    public TokenInvalidoException() {
        super("Refresh token inválido ou expirado");
    }
}
