package com.web2.metricas;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MetricasNegocioTest {

    @Test
    void deveRegistrarContadoresComResultado() {
        var registry = new SimpleMeterRegistry();
        var metricas = new MetricasNegocio(registry);

        metricas.registrarAuthLoginSucesso();
        metricas.registrarAuthLoginFalha();
        metricas.registrarAuthRegisterSucesso();
        metricas.registrarAuthRegisterFalha();
        metricas.registrarProjetoGeracaoSucesso();
        metricas.registrarProjetoGeracaoFalha();

        assertEquals(1.0, registry.find("auth_login_total").tag("resultado", "sucesso").counter().count());
        assertEquals(1.0, registry.find("auth_login_total").tag("resultado", "falha").counter().count());
        assertEquals(1.0, registry.find("auth_register_total").tag("resultado", "sucesso").counter().count());
        assertEquals(1.0, registry.find("auth_register_total").tag("resultado", "falha").counter().count());
        assertEquals(1.0, registry.find("projeto_geracao_total").tag("resultado", "sucesso").counter().count());
        assertEquals(1.0, registry.find("projeto_geracao_total").tag("resultado", "falha").counter().count());
    }
}
