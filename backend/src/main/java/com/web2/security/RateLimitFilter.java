package com.web2.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

public class RateLimitFilter extends OncePerRequestFilter {
    private final int maxRequests;
    private final long windowMs;
    private final Map<String, Deque<Long>> requestsByIp = new ConcurrentHashMap<>();
    private final AtomicLong lastCleanup = new AtomicLong(0L);

    public RateLimitFilter(int maxRequests, long windowSeconds) {
        this.maxRequests = maxRequests;
        this.windowMs = TimeUnit.SECONDS.toMillis(windowSeconds);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        // TODO: atrás de um load balancer, request.getRemoteAddr() será o IP do LB;
        // antes de expor na internet configurar server.forward-headers-strategy e usar
        // o IP real do cliente.
        String ip = request.getRemoteAddr();
        if (ip == null || ip.isBlank()) {
            ip = "unknown";
        }

        long now = System.currentTimeMillis();
        if (now - lastCleanup.get() >= windowMs) {
            synchronized (lastCleanup) {
                if (now - lastCleanup.get() >= windowMs) {
                    limparEntradasAntigas(now);
                    lastCleanup.set(now);
                }
            }
        }

        Deque<Long> timestamps = requestsByIp.computeIfAbsent(ip, key -> new ConcurrentLinkedDeque<>());

        synchronized (timestamps) {
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > windowMs) {
                timestamps.pollFirst();
            }

            if (timestamps.size() >= maxRequests) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setHeader("Retry-After",
                        String.valueOf(Math.max(1, TimeUnit.MILLISECONDS.toSeconds(windowMs))));
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                response.getWriter().write("{\"erro\":\"Muitas requisições\"}");
                return;
            }

            timestamps.addLast(now);
        }

        filterChain.doFilter(request, response);
    }

    private void limparEntradasAntigas(long now) {
        requestsByIp.entrySet().removeIf(entry -> {
            Deque<Long> timestamps = entry.getValue();
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > windowMs) {
                timestamps.pollFirst();
            }
            return timestamps.isEmpty();
        });
    }
}
