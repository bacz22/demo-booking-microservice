package com.cinebook.gateway.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Chuyển danh tính đã xác thực xuống service phía sau.
 * - Luôn XOÁ X-User-Id / X-User-Roles / X-Gateway-Secret client tự gửi (chống giả mạo).
 * - Có JWT hợp lệ → gắn X-User-Id = sub, X-User-Roles = "USER,ADMIN".
 * - Gắn X-Gateway-Secret để service biết request đi qua gateway, và X-Correlation-Id.
 */
@Component
public class IdentityRelayFilter implements GlobalFilter, Ordered {
    public static final String USER_HEADER = "X-User-Id";
    public static final String ROLES_HEADER = "X-User-Roles";
    public static final String SECRET_HEADER = "X-Gateway-Secret";
    public static final String CORRELATION_HEADER = "X-Correlation-Id";

    private final String gatewaySecret;

    public IdentityRelayFilter(@Value("${app.security.gateway-secret}") String gatewaySecret) {
        this.gatewaySecret = gatewaySecret;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String correlationId = Optional.ofNullable(exchange.getRequest().getHeaders().getFirst(CORRELATION_HEADER))
            .filter(s -> !s.isBlank() && s.length() <= 100)
            .orElseGet(() -> UUID.randomUUID().toString());
        exchange.getResponse().getHeaders().set(CORRELATION_HEADER, correlationId);

        return ReactiveSecurityContextHolder.getContext()
            .map(ctx -> Optional.ofNullable(ctx.getAuthentication()))
            .defaultIfEmpty(Optional.empty())
            .flatMap(auth -> {
                ServerHttpRequest.Builder request = exchange.getRequest().mutate().headers(h -> {
                    h.remove(USER_HEADER);
                    h.remove(ROLES_HEADER);
                    h.set(SECRET_HEADER, gatewaySecret);
                    h.set(CORRELATION_HEADER, correlationId);
                });
                if (auth.orElse(null) instanceof JwtAuthenticationToken jwt) {
                    String roles = jwt.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .filter(a -> a.startsWith("ROLE_"))
                        .map(a -> a.substring(5))
                        .collect(Collectors.joining(","));
                    request.headers(h -> {
                        h.set(USER_HEADER, jwt.getToken().getSubject());
                        h.set(ROLES_HEADER, roles);
                    });
                }
                return chain.filter(exchange.mutate().request(request.build()).build());
            });
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
