package com.web2.config;

import com.web2.security.RateLimitFilter;
import dao.UsuarioRepositorio;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.SecurityFilterChain;
import com.web2.security.JwtAuthenticationFilter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

        @Bean
        RateLimitFilter rateLimitFilter(
                        @Value("${app.rate-limit.auth.max-requests:20}") int maxRequests,
                        @Value("${app.rate-limit.auth.window-seconds:60}") long windowSeconds) {
                return new RateLimitFilter(maxRequests, windowSeconds);
        }

        @Bean
        SecurityFilterChain securityFilterChain(
                        HttpSecurity http,
                        JwtAuthenticationFilter jwtAuthenticationFilter,
                        RateLimitFilter rateLimitFilter)
                        throws Exception {
                http
                                .csrf(csrf -> csrf.disable())

                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                                .authorizeHttpRequests(authorize -> authorize

                                                // Rotas públicas
                                                .requestMatchers(
                                                                "/api/auth/**",
                                                                "/docs",
                                                                "/docs/**",
                                                                "/swagger-ui/**",
                                                                "/actuator/health")
                                                .permitAll()

                                                // Rotas protegidas
                                                .requestMatchers("/api/projetos/**")
                                                .hasAnyRole("USER", "ADMIN")

                                                // Qualquer outra rota exige autenticação
                                                .anyRequest()
                                                .authenticated())
                                .addFilterBefore(
                                                rateLimitFilter,
                                                UsernamePasswordAuthenticationFilter.class)
                                .addFilterBefore(
                                                jwtAuthenticationFilter,
                                                UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public AuthenticationManager authenticationManager(
                        AuthenticationConfiguration authenticationConfiguration)
                        throws Exception {

                return authenticationConfiguration.getAuthenticationManager();
        }

        @Bean
        public UserDetailsService userDetailsService(
                        UsuarioRepositorio usuarioRepositorio) {

                return username -> usuarioRepositorio
                                .findByEmail(username)
                                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
        }
}