package com.web2.metricas;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class MetricasNegocio {

    private final MeterRegistry meterRegistry;

    public MetricasNegocio(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public void registrarAuthLoginSucesso() {
        registrar("auth_login_total", "sucesso");
    }

    public void registrarAuthLoginFalha() {
        registrar("auth_login_total", "falha");
    }

    public void registrarAuthRegisterSucesso() {
        registrar("auth_register_total", "sucesso");
    }

    public void registrarAuthRegisterFalha() {
        registrar("auth_register_total", "falha");
    }

    public void registrarProjetoGeracaoSucesso() {
        registrar("projeto_geracao_total", "sucesso");
    }

    public void registrarProjetoGeracaoFalha() {
        registrar("projeto_geracao_total", "falha");
    }

    private void registrar(String nome, String resultado) {
        Counter.builder(nome)
                .tag("resultado", resultado)
                .register(meterRegistry)
                .increment();
    }
}
