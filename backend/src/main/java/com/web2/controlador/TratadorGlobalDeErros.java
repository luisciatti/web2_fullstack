package com.web2.controlador;

import com.web2.excecao.CadastroDesabilitadoException;
import com.web2.excecao.EmailJaCadastradoException;
import com.web2.excecao.TokenInvalidoException;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class TratadorGlobalDeErros {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> tratarValidacao(MethodArgumentNotValidException ex) {

        Map<String, String> erros = new LinkedHashMap<>();

        for (FieldError erro : ex.getBindingResult().getFieldErrors()) {
            erros.put(erro.getField(), erro.getDefaultMessage());
        }

        return erros;
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> tratarJsonInvalido(HttpMessageNotReadableException ex) {
        return Map.of("erro", "JSON inválido ou mal formatado");
    }

    @ExceptionHandler(EmailJaCadastradoException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, String> tratarEmailJaCadastrado(EmailJaCadastradoException ex) {
        return Map.of("erro", "Email já está em uso");
    }

    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Map<String, String> tratarBadCredentials(BadCredentialsException ex) {
        return Map.of("erro", "Credenciais inválidas");
    }

    @ExceptionHandler(TokenInvalidoException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Map<String, String> tratarTokenInvalido(TokenInvalidoException ex) {
        return Map.of("erro", "Refresh token inválido ou expirado");
    }

    @ExceptionHandler(CadastroDesabilitadoException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public Map<String, String> tratarCadastroDesabilitado(CadastroDesabilitadoException ex) {
        return Map.of("erro", "Cadastro temporariamente desabilitado");
    }
}