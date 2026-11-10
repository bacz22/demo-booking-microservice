package com.cinebook.movie.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;

/**
 * Chỉ nhận request /api/** đi qua api-gateway (có X-Gateway-Secret đúng), vì gateway là nơi duy nhất
 * xác thực JWT và gắn X-User-Id. /api/internal/** (gọi service-to-service) và actuator không bị chặn.
 * app.security.gateway-secret để trống = tắt kiểm tra (dùng trong test).
 * Lớp này giống hệt nhau ở mọi service (chỉ khác package).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class GatewaySecretFilter extends OncePerRequestFilter {
    public static final String HEADER = "X-Gateway-Secret";

    private final byte[] secret;

    public GatewaySecretFilter(@Value("${app.security.gateway-secret:}") String secret) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return secret.length == 0
            || !path.startsWith("/api/")
            || path.startsWith("/api/internal/")
            || "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        String provided = request.getHeader(HEADER);
        if (provided != null && MessageDigest.isEqual(secret, provided.getBytes(StandardCharsets.UTF_8))) {
            chain.doFilter(request, response);
            return;
        }
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"code\":\"GATEWAY_REQUIRED\",\"message\":\"Request phải đi qua API Gateway\","
            + "\"timestamp\":\"" + Instant.now() + "\",\"path\":\"" + path(request) + "\"}");
    }

    private static String path(HttpServletRequest request) {
        return request.getRequestURI().replace("\\", "").replace("\"", "");
    }
}
