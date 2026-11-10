package com.cinebook.auth.config;

import com.cinebook.auth.domain.User;
import com.cinebook.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Tạo tài khoản demo/admin cho môi trường dev nếu chưa có.
 * Demo user giữ UUID cũ mà frontend từng hard-code để không mất dữ liệu booking đã có.
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DemoUserSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DemoUserSeeder.class);
    static final UUID DEMO_USER_ID = UUID.fromString("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    static final UUID ADMIN_USER_ID = UUID.fromString("b1ffcd88-8d1a-4ef8-bb6d-6bb9bd380b22");

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;
    private final String demoPassword;
    private final String adminPassword;

    public DemoUserSeeder(UserRepository users, PasswordEncoder passwordEncoder, Clock clock,
                          @Value("${app.seed.demo-password:Demo@123}") String demoPassword,
                          @Value("${app.seed.admin-password:Admin@123}") String adminPassword) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
        this.demoPassword = demoPassword;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        seed(DEMO_USER_ID, "demo@cinebook.vn", demoPassword, "Nguyễn Văn An", List.of("USER"));
        seed(ADMIN_USER_ID, "admin@cinebook.vn", adminPassword, "Quản trị viên", List.of("USER", "ADMIN"));
    }

    private void seed(UUID id, String email, String password, String name, List<String> roles) {
        if (users.findByEmail(email).isPresent()) return;
        users.insert(new User(id, email, passwordEncoder.encode(password), name, "0912 345 678", "ACTIVE",
            roles, Instant.now(clock)));
        log.info("Seeded dev account {} roles={}", email, roles);
    }
}
