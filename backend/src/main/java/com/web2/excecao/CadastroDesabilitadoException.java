package com.web2.excecao;

public class CadastroDesabilitadoException extends RuntimeException {
    public CadastroDesabilitadoException() {
        super("Cadastro temporariamente desabilitado");
    }
}
