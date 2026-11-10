package com.cinebook.auth.controller;

import com.cinebook.auth.service.AuthService;
import com.cinebook.auth.service.AuthService.TokenResponse;
import com.cinebook.auth.service.AuthService.UserView;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    public record RegisterRequest(@NotBlank @Email String email,
                                  @NotBlank @Size(min = 6, max = 72) String password,
                                  @NotBlank @Size(max = 150) String fullName,
                                  @Size(max = 30) String phone) {}

    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    @PostMapping("/register")
    public ResponseEntity<TokenResponse> register(@Valid @RequestBody RegisterRequest r) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auth.register(r.email(), r.password(), r.fullName(), r.phone()));
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest r) {
        return auth.login(r.email(), r.password());
    }

    @PostMapping("/refresh")
    public TokenResponse refresh(@Valid @RequestBody RefreshRequest r) {
        return auth.refresh(r.refreshToken());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequest r) {
        auth.logout(r.refreshToken());
        return ResponseEntity.noContent().build();
    }

    /** X-User-Id do api-gateway gắn sau khi verify JWT. */
    @GetMapping("/me")
    public UserView me(@RequestHeader("X-User-Id") UUID userId) {
        return auth.me(userId);
    }
}
