package com.web2.excecao;

public class EmailJaCadastradoException extends RuntimeException {
    public EmailJaCadastradoException() {
        super("Email já está em uso");
    }
}
