package com.cinebook.auth;

import com.cinebook.auth.exception.AuthException;
import com.cinebook.auth.service.AdminUserService;
import com.cinebook.auth.service.AuthService;
import com.cinebook.auth.service.AuthService.TokenResponse;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
class AdminUserServiceTest {
    private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");

    @Autowired AdminUserService admin;
    @Autowired AuthService auth;
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
    void search_filtersByTextRoleAndStatus_andPaginates() {
        UUID an = register("an@cinebook.vn", "Nguyễn An");
        UUID binh = register("binh@cinebook.vn", "Trần Bình");
        register("chi@cinebook.vn", "Lê Chi");
        admin.updateRoles(UUID.randomUUID(), binh, List.of("USER", "ADMIN"));
        admin.updateStatus(UUID.randomUUID(), an, "LOCKED");

        assertEquals(List.of(binh), ids(admin.search("bình", null, null, 0, 20)));
        assertEquals(List.of(binh), ids(admin.search(null, "ADMIN", null, 0, 20)));
        assertEquals(List.of(an), ids(admin.search(null, null, "LOCKED", 0, 20)));

        var firstPage = admin.search(null, null, null, 0, 2);
        assertEquals(3, firstPage.total());
        assertEquals(2, firstPage.totalPages());
        assertEquals(2, firstPage.items().size());

        var summary = admin.summary();
        assertEquals(3, summary.totalUsers());
        assertEquals(1, summary.lockedUsers());
        assertEquals(1, summary.adminUsers());
    }

    @Test
    void lockingUser_revokesSessions_andBlocksLogin() {
        TokenResponse tokens = auth.register("a@b.vn", "secret123", "A", null);

        var locked = admin.updateStatus(UUID.randomUUID(), tokens.user().id(), "LOCKED");

        assertEquals("LOCKED", locked.status());
        assertEquals("INVALID_REFRESH_TOKEN",
            assertThrows(AuthException.class, () -> auth.refresh(tokens.refreshToken())).getCode());
        assertEquals("ACCOUNT_LOCKED",
            assertThrows(AuthException.class, () -> auth.login("a@b.vn", "secret123")).getCode());
    }

    @Test
    void adminCannotLockSelf_orRemoveOwnAdminRole() {
        UUID me = register("admin@b.vn", "Admin");
        admin.updateRoles(UUID.randomUUID(), me, List.of("ADMIN"));

        assertThrows(AuthException.class, () -> admin.updateStatus(me, me, "LOCKED"));
        assertThrows(AuthException.class, () -> admin.updateRoles(me, me, List.of("USER")));
        assertEquals(List.of("USER", "ADMIN"), admin.get(me).roles());
    }

    @Test
    void findByIds_returnsOnlyRequestedUsers() {
        UUID a = register("a@b.vn", "A");
        register("b@b.vn", "B");

        assertEquals(List.of(a), admin.findByIds(List.of(a, UUID.randomUUID())).stream()
            .map(AuthService.UserView::id).toList());
    }

    @Test
    void changePassword_requiresCurrentPassword_andRevokesSessions() {
        TokenResponse tokens = auth.register("a@b.vn", "secret123", "A", null);
        UUID id = tokens.user().id();

        assertEquals("INVALID_PASSWORD",
            assertThrows(AuthException.class, () -> auth.changePassword(id, "wrong", "newpass1")).getCode());

        auth.changePassword(id, "secret123", "newpass1");

        assertThrows(AuthException.class, () -> auth.refresh(tokens.refreshToken()));
        assertEquals(id, auth.login("a@b.vn", "newpass1").user().id());
    }

    @Test
    void updateProfile_changesNameAndPhone() {
        UUID id = register("a@b.vn", "A");
        var updated = auth.updateProfile(id, "  Nguyễn Văn B ", "0901 000 111");
        assertEquals("Nguyễn Văn B", updated.fullName());
        assertEquals("0901 000 111", updated.phone());
    }

    private UUID register(String email, String name) {
        return auth.register(email, "secret123", name, null).user().id();
    }

    private static List<UUID> ids(AdminUserService.UserPage page) {
        return page.items().stream().map(AuthService.UserView::id).toList();
    }
}
