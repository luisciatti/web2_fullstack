package com.web2;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import dao.jpa.ProjetoEntityJpaRepository;
import dao.jpa.entity.ProjetoEntity;

@SpringBootApplication
@ComponentScan(basePackages = {
        "com.web2",
        "dao",
        "servico",
        "gerador"
})
@EntityScan(basePackageClasses = ProjetoEntity.class)
@EnableJpaRepositories(basePackageClasses = ProjetoEntityJpaRepository.class)
public class Web2BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(Web2BackendApplication.class, args);
    }
}