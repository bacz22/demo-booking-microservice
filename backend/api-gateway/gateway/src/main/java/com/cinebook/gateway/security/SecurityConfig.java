package com.cinebook.gateway.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Gateway là nơi DUY NHẤT verify JWT. Quy tắc truy cập:
 * - Đọc danh mục (phim, rạp, suất chiếu, sơ đồ ghế) và login/register/refresh: public
 * - /api/admin/**: ROLE_ADMIN
 * - /api/internal/**: không cho phép từ bên ngoài
 * - còn lại: phải đăng nhập
 */
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http, JsonErrorWriter errors,
                                                  ReactiveJwtDecoder jwtDecoder) {
        return http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
            .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
            .logout(ServerHttpSecurity.LogoutSpec::disable)
            .cors(cors -> {})
            .authorizeExchange(ex -> ex
                .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .pathMatchers("/api/internal/**").denyAll()
                .pathMatchers("/actuator/health/**", "/actuator/info", "/.well-known/**").permitAll()
                .pathMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register",
                    "/api/auth/refresh", "/api/auth/logout").permitAll()
                .pathMatchers("/api/admin/**").hasRole("ADMIN")
                .pathMatchers(HttpMethod.GET, "/api/movies/**", "/api/genres/**", "/api/theaters/**",
                    "/api/showtimes/**", "/api/auditoriums/**", "/api/bookings/showtimes/**").permitAll()
                .anyExchange().authenticated())
            .oauth2ResourceServer(rs -> rs
                .jwt(jwt -> jwt.jwtDecoder(jwtDecoder).jwtAuthenticationConverter(jwtAuthenticationConverter()))
                .authenticationEntryPoint((exchange, ex) ->
                    errors.write(exchange, HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "Bạn cần đăng nhập để tiếp tục"))
                .accessDeniedHandler((exchange, ex) ->
                    errors.write(exchange, HttpStatus.FORBIDDEN, "FORBIDDEN", "Bạn không có quyền thực hiện thao tác này")))
            .exceptionHandling(eh -> eh
                .authenticationEntryPoint((exchange, ex) ->
                    errors.write(exchange, HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "Bạn cần đăng nhập để tiếp tục"))
                .accessDeniedHandler((exchange, ex) ->
                    errors.write(exchange, HttpStatus.FORBIDDEN, "FORBIDDEN", "Bạn không có quyền thực hiện thao tác này")))
            .build();
    }

    @Bean
    ReactiveJwtDecoder jwtDecoder(@Value("${app.jwt.jwk-set-uri}") String jwkSetUri,
                                  @Value("${app.jwt.issuer}") String issuer) {
        NimbusReactiveJwtDecoder decoder = NimbusReactiveJwtDecoder.withJwkSetUri(jwkSetUri).build();
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(issuer));
        return decoder;
    }

    /** claim "roles": ["USER","ADMIN"] → ROLE_USER, ROLE_ADMIN */
    static ReactiveJwtAuthenticationConverterAdapter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName("roles");
        authorities.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return new ReactiveJwtAuthenticationConverterAdapter(converter);
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.allowed-origins}") List<String> origins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Idempotency-Key", "X-Correlation-Id"));
        config.setExposedHeaders(List.of("X-Correlation-Id", "Location"));
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
