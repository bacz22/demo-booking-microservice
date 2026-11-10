package com.cinebook.gateway.security;

import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

/** Lỗi trả từ gateway theo cùng format ApiError với các service: code/message/correlationId/timestamp/path. */
@Component
public class JsonErrorWriter {

    public Mono<Void> write(ServerWebExchange exchange, HttpStatus status, String code, String message) {
        var response = exchange.getResponse();
        if (response.isCommitted()) return Mono.empty();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        // Lỗi xảy ra trước IdentityRelayFilter (401/403/429) → tự sinh correlationId để vẫn truy vết được
        String correlationId = exchange.getRequest().getHeaders().getFirst(IdentityRelayFilter.CORRELATION_HEADER);
        if (correlationId == null || correlationId.isBlank() || correlationId.length() > 100) {
            correlationId = UUID.randomUUID().toString();
        }
        response.getHeaders().set(IdentityRelayFilter.CORRELATION_HEADER, correlationId);
        String json = "{\"code\":\"%s\",\"message\":\"%s\",\"correlationId\":\"%s\",\"timestamp\":\"%s\",\"path\":\"%s\"}"
            .formatted(code, escape(message), escape(correlationId),
                Instant.now(), escape(exchange.getRequest().getPath().value()));
        DataBuffer buffer = response.bufferFactory().wrap(json.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
