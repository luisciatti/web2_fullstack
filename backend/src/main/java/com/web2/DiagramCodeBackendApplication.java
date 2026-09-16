package com.web2;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {
        "com.web2",
        "dao",
        "servico",
        "gerador"
})
public class DiagramCodeBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(DiagramCodeBackendApplication.class, args);
    }
}