package com.web2.config;

import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "DiagramCode Backend API",
                version = "v1",
                description = "API REST para projetos, geração de artefatos e diagramas Mermaid"
        )
)
public class OpenApiConfig {
}