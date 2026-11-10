package com.cinebook.auth;

import com.cinebook.auth.controller.JwksController;
import com.cinebook.auth.exception.AuthException;
import com.cinebook.auth.service.AuthService;
import com.cinebook.auth.service.AuthService.TokenResponse;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
class AuthServiceTest {
    private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");

    @Autowired AuthService auth;
    @Autowired JwksController jwks;
    @Autowired JdbcTemplate jdbc;

    @DynamicPropertySource
    static void registerPostgresProperties(DynamicPropertyRegistry registry) {
        POSTGRES.start();
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @AfterAll
    static void stop() { POSTGRES.stop(); }

    @BeforeEach
    void clean() {
        jdbc.update("DELETE FROM refresh_tokens");
        jdbc.update("DELETE FROM user_roles");
        jdbc.update("DELETE FROM users");
    }

    @Test
    void register_thenLogin_issuesJwtVerifiableByJwks() throws Exception {
        TokenResponse registered = auth.register("An@Example.com", "secret123", "Nguyễn An", null);
        TokenResponse login = auth.login("an@example.com", "secret123"); // email không phân biệt hoa thường

        // Gateway verify bằng public key công bố ở JWKS
        RSAKey publicKey = JWKSet.parse(jwks.jwks()).getKeys().getFirst().toRSAKey();
        assertFalse(publicKey.isPrivate());
        Jwt jwt = NimbusJwtDecoder.withPublicKey(publicKey.toRSAPublicKey()).build().decode(login.accessToken());

        assertEquals(registered.user().id().toString(), jwt.getSubject());
        assertEquals("cinebook-auth", jwt.getClaimAsString("iss"));
        assertEquals(List.of("USER"), jwt.getClaimAsStringList("roles"));
        assertEquals("An@Example.com", jwt.getClaimAsString("email"));
        assertEquals(900, login.expiresIn());
    }

    @Test
    void duplicateEmail_isRejected() {
        auth.register("a@b.vn", "secret123", "A", null);
        AuthException ex = assertThrows(AuthException.class, () -> auth.register("A@B.vn", "secret123", "B", null));
        assertEquals("EMAIL_ALREADY_EXISTS", ex.getCode());
    }

    @Test
    void wrongPassword_isRejected() {
        auth.register("a@b.vn", "secret123", "A", null);
        assertEquals("INVALID_CREDENTIALS",
            assertThrows(AuthException.class, () -> auth.login("a@b.vn", "wrong")).getCode());
        assertEquals("INVALID_CREDENTIALS",
            assertThrows(AuthException.class, () -> auth.login("nobody@b.vn", "secret123")).getCode());
    }

    @Test
    void refresh_rotatesToken_andOldTokenCannotBeReused() {
        TokenResponse first = auth.register("a@b.vn", "secret123", "A", null);

        TokenResponse second = auth.refresh(first.refreshToken());

        assertNotEquals(first.refreshToken(), second.refreshToken());
        assertEquals("INVALID_REFRESH_TOKEN",
            assertThrows(AuthException.class, () -> auth.refresh(first.refreshToken())).getCode());
    }

    @Test
    void logout_revokesRefreshToken() {
        TokenResponse tokens = auth.register("a@b.vn", "secret123", "A", null);

        auth.logout(tokens.refreshToken());

        assertThrows(AuthException.class, () -> auth.refresh(tokens.refreshToken()));
    }

    @Test
    void me_returnsUserWithRoles() {
        TokenResponse tokens = auth.register("a@b.vn", "secret123", "A", "0901");
        var me = auth.me(tokens.user().id());
        assertEquals("a@b.vn", me.email());
        assertEquals(List.of("USER"), me.roles());
    }
}
