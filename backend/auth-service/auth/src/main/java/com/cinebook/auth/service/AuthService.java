package com.cinebook.auth.service;

import com.cinebook.auth.domain.User;
import com.cinebook.auth.exception.AuthException;
import com.cinebook.auth.repository.RefreshTokenRepository;
import com.cinebook.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class AuthService {
    public static final String ISSUER = "cinebook-auth";

    public record UserView(UUID id, String email, String fullName, String phone, List<String> roles, Instant createdAt) {
        static UserView from(User u) {
            return new UserView(u.id(), u.email(), u.fullName(), u.phone(), u.roles(), u.createdAt());
        }
    }

    public record TokenResponse(String accessToken, String refreshToken, String tokenType, long expiresIn, UserView user) {}

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final Clock clock;
    private final Duration accessTtl;
    private final Duration refreshTtl;
    private final String keyId;

    public AuthService(UserRepository users, RefreshTokenRepository refreshTokens, PasswordEncoder passwordEncoder,
                       JwtEncoder jwtEncoder, Clock clock,
                       @Value("${app.jwt.access-token-ttl:15m}") Duration accessTtl,
                       @Value("${app.jwt.refresh-token-ttl:7d}") Duration refreshTtl,
                       @Value("${app.jwt.key-id:cinebook-auth-1}") String keyId) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.clock = clock;
        this.accessTtl = accessTtl;
        this.refreshTtl = refreshTtl;
        this.keyId = keyId;
    }

    @Transactional
    public TokenResponse register(String email, String password, String fullName, String phone) {
        User user = new User(UUID.randomUUID(), email.trim(), passwordEncoder.encode(password), fullName.trim(),
            phone == null || phone.isBlank() ? null : phone.trim(), "ACTIVE", List.of("USER"), Instant.now(clock));
        try {
            users.insert(user);
        } catch (DuplicateKeyException ex) {
            throw AuthException.emailExists();
        }
        return issue(user);
    }

    @Transactional
    public TokenResponse login(String email, String password) {
        User user = users.findByEmail(email.trim()).orElseThrow(AuthException::invalidCredentials);
        if (!passwordEncoder.matches(password, user.passwordHash())) throw AuthException.invalidCredentials();
        if (!user.isActive()) throw AuthException.accountLocked();
        return issue(user);
    }

    /** Rotation: refresh token cũ bị thu hồi, cấp cặp token mới. */
    @Transactional
    public TokenResponse refresh(String refreshToken) {
        UUID userId = refreshTokens.revokeIfValid(hash(refreshToken), Instant.now(clock))
            .orElseThrow(AuthException::invalidRefreshToken);
        User user = users.findById(userId).filter(User::isActive).orElseThrow(AuthException::invalidRefreshToken);
        return issue(user);
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokens.revokeIfValid(hash(refreshToken), Instant.now(clock));
    }

    public UserView me(UUID userId) {
        return users.findById(userId).map(UserView::from).orElseThrow(AuthException::unauthenticated);
    }

    private TokenResponse issue(User user) {
        Instant now = Instant.now(clock);
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer(ISSUER)
            .subject(user.id().toString())
            .issuedAt(now)
            .expiresAt(now.plus(accessTtl))
            .id(UUID.randomUUID().toString())
            .claim("email", user.email())
            .claim("name", user.fullName())
            .claim("roles", user.roles())
            .build();
        JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256).keyId(keyId).build();
        String accessToken = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();

        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String refreshToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        refreshTokens.insert(user.id(), hash(refreshToken), now.plus(refreshTtl), now);

        return new TokenResponse(accessToken, refreshToken, "Bearer", accessTtl.toSeconds(), UserView.from(user));
    }

    static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
