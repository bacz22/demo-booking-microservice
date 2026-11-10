package com.cinebook.gateway.ratelimit;

import com.cinebook.gateway.security.JsonErrorWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.time.Clock;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limit fixed-window trong bộ nhớ cho vài endpoint nhạy cảm (login, register, giữ ghế).
 * Khoá theo user (nếu đã đăng nhập) hoặc IP. Đủ cho một instance gateway; chạy nhiều instance
 * thì chuyển sang RequestRateLimiter dùng Redis.
 * Là WebFilter chạy sau Spring Security để biết user hiện tại.
 */
@Component
@EnableConfigurationProperties(RateLimitProperties.class)
public class RateLimitFilter implements WebFilter, Ordered {
    private record Window(long start, int count) {}

    private final RateLimitProperties props;
    private final JsonErrorWriter errors;
    private final Clock clock;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    @Autowired
    public RateLimitFilter(RateLimitProperties props, JsonErrorWriter errors) {
        this(props, errors, Clock.systemUTC());
    }

    RateLimitFilter(RateLimitProperties props, JsonErrorWriter errors, Clock clock) {
        this.props = props;
        this.errors = errors;
        this.clock = clock;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        var request = exchange.getRequest();
        Optional<RateLimitProperties.Rule> rule = props.rules().stream()
            .filter(r -> r.method().equalsIgnoreCase(request.getMethod().name())
                && r.path().equals(request.getPath().value()))
            .findFirst();
        if (rule.isEmpty()) return chain.filter(exchange);

        return ReactiveSecurityContextHolder.getContext()
            .map(ctx -> ctx.getAuthentication() instanceof JwtAuthenticationToken jwt ? "u:" + jwt.getName() : null)
            .defaultIfEmpty("")
            .flatMap(user -> {
                String who = user.isEmpty() ? "ip:" + clientIp(exchange) : user;
                if (allow(rule.get(), who)) return chain.filter(exchange);
                exchange.getResponse().getHeaders().set("Retry-After", String.valueOf(props.window().toSeconds()));
                return errors.write(exchange, HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED",
                    "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút");
            });
    }

    boolean allow(RateLimitProperties.Rule rule, String who) {
        long now = clock.millis();
        long windowMs = props.window().toMillis();
        String key = rule.method() + " " + rule.path() + "|" + who;
        Window w = windows.compute(key, (k, old) ->
            old == null || now - old.start() >= windowMs ? new Window(now, 1) : new Window(old.start(), old.count() + 1));
        if (windows.size() > 10_000) windows.entrySet().removeIf(e -> now - e.getValue().start() >= windowMs);
        return w.count() <= rule.limit();
    }

    private static String clientIp(ServerWebExchange exchange) {
        InetSocketAddress remote = exchange.getRequest().getRemoteAddress();
        return remote == null ? "unknown" : remote.getAddress().getHostAddress();
    }

    @Override
    public int getOrder() {
        // Sau Spring Security WebFilterChainProxy (order -100) để đã có SecurityContext
        return 0;
    }
}
