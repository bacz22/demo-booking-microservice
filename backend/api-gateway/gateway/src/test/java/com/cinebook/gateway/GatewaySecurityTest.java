package com.cinebook.gateway;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Chạy gateway thật trước một backend giả (echo lại header nhận được) để kiểm tra
 * xác thực, phân quyền, chống giả mạo X-User-Id và rate limit.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "app.rate-limit.rules[0].method=POST",
    "app.rate-limit.rules[0].path=/api/auth/login",
    "app.rate-limit.rules[0].limit=3",
    "app.rate-limit.rules[1].method=POST",
    "app.rate-limit.rules[1].path=/api/auth/register",
    "app.rate-limit.rules[1].limit=100",
    "app.rate-limit.rules[2].method=POST",
    "app.rate-limit.rules[2].path=/api/bookings/hold",
    "app.rate-limit.rules[2].limit=100",
    "app.security.gateway-secret=test-secret"
})
@AutoConfigureWebTestClient
class GatewaySecurityTest {
    private static final RSAKey KEY = generateKey();
    private static final HttpServer BACKEND = startEchoBackend();

    @Autowired WebTestClient client;

    @DynamicPropertySource
    static void routes(DynamicPropertyRegistry registry) {
        String url = "http://localhost:" + BACKEND.getAddress().getPort();
        for (String name : List.of("AUTH", "THEATER", "BOOKING", "PAYMENT", "NOTIFICATION", "MOVIE")) {
            registry.add(name + "_SERVICE_URL", () -> url);
        }
    }

    @TestConfiguration
    static class TestJwtConfig {
        @Bean
        @Primary
        ReactiveJwtDecoder testJwtDecoder() throws Exception {
            NimbusReactiveJwtDecoder decoder = NimbusReactiveJwtDecoder.withPublicKey(KEY.toRSAPublicKey()).build();
            decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer("cinebook-auth"));
            return decoder;
        }
    }

    @AfterAll
    static void stopBackend() { BACKEND.stop(0); }

    @Test
    void publicCatalog_isReachableWithoutToken_andSpoofedIdentityIsStripped() {
        client.get().uri("/api/movies").header("X-User-Id", UUID.randomUUID().toString())
            .header("X-Gateway-Secret", "forged").exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.x-user-id").doesNotExist()
            .jsonPath("$.x-gateway-secret").isEqualTo("test-secret")
            .jsonPath("$.x-correlation-id").exists();
    }

    @Test
    void protectedRoute_withoutToken_returns401Json() {
        client.get().uri("/api/bookings/me").exchange()
            .expectStatus().isUnauthorized()
            .expectBody().jsonPath("$.code").isEqualTo("UNAUTHENTICATED")
            .jsonPath("$.correlationId").isNotEmpty();
    }

    @Test
    void validToken_relaysUserFromToken_notFromClientHeader() {
        String userId = UUID.randomUUID().toString();
        client.get().uri("/api/bookings/me")
            .header("Authorization", "Bearer " + token(userId, List.of("USER"), "cinebook-auth"))
            .header("X-User-Id", UUID.randomUUID().toString()) // cố giả mạo user khác
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.x-user-id").isEqualTo(userId)
            .jsonPath("$.x-user-roles").isEqualTo("USER");
    }

    @Test
    void tokenFromOtherIssuer_isRejected() {
        client.get().uri("/api/bookings/me")
            .header("Authorization", "Bearer " + token(UUID.randomUUID().toString(), List.of("USER"), "evil"))
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    void adminRoutes_requireAdminRole() {
        client.post().uri("/api/admin/movies")
            .header("Authorization", "Bearer " + token(UUID.randomUUID().toString(), List.of("USER"), "cinebook-auth"))
            .exchange()
            .expectStatus().isForbidden()
            .expectBody().jsonPath("$.code").isEqualTo("FORBIDDEN");

        client.post().uri("/api/admin/movies")
            .header("Authorization", "Bearer " + token(UUID.randomUUID().toString(), List.of("USER", "ADMIN"), "cinebook-auth"))
            .exchange()
            .expectStatus().isOk()
            .expectBody().jsonPath("$.x-user-roles").isEqualTo("USER,ADMIN");
    }

    @Test
    void internalRoutes_areNotExposed() {
        client.get().uri("/api/internal/bookings/" + UUID.randomUUID() + "/payment-status")
            .header("Authorization", "Bearer " + token(UUID.randomUUID().toString(), List.of("USER", "ADMIN"), "cinebook-auth"))
            .exchange()
            .expectStatus().isForbidden();
    }

    @Test
    void login_isRateLimited() {
        for (int i = 0; i < 3; i++) {
            client.post().uri("/api/auth/login").exchange().expectStatus().isOk();
        }
        client.post().uri("/api/auth/login").exchange()
            .expectStatus().isEqualTo(429)
            .expectBody().jsonPath("$.code").isEqualTo("RATE_LIMITED");
    }

    // ---------- helpers ----------

    private static String token(String subject, List<String> roles, String issuer) {
        try {
            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(subject).issuer(issuer).claim("roles", roles)
                .issueTime(new Date()).expirationTime(Date.from(Instant.now().plusSeconds(300))).build();
            SignedJWT jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(KEY.getKeyID()).build(), claims);
            jwt.sign(new RSASSASigner(KEY));
            return jwt.serialize();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static RSAKey generateKey() {
        try {
            return new RSAKeyGenerator(2048).keyID("test").generate();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    /** Backend giả: trả về JSON các header nhận được (tên header viết thường). */
    private static HttpServer startEchoBackend() {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
            server.createContext("/", exchange -> {
                Map<String, String> headers = new TreeMap<>();
                exchange.getRequestHeaders().forEach((k, v) -> headers.put(k.toLowerCase(), String.join(",", v)));
                String json = headers.entrySet().stream()
                    .map(e -> "\"" + e.getKey() + "\":\"" + e.getValue().replace("\"", "\\\"") + "\"")
                    .collect(Collectors.joining(",", "{", "}"));
                byte[] body = json.getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, body.length);
                exchange.getResponseBody().write(body);
                exchange.close();
            });
            server.start();
            return server;
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }
}
