package com.web2;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@ComponentScan(basePackages = {
        "com.web2",
        "dao",
        "servico",
        "gerador"
})
@EntityScan(basePackages = "dao.jpa.entity")
@EnableJpaRepositories(basePackages = "dao.jpa")
public class DiagramCodeBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(DiagramCodeBackendApplication.class, args);
    }
}