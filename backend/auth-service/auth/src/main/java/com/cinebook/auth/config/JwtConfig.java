package com.cinebook.auth.config;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;

/**
 * Khóa RSA ký JWT. Có app.jwt.private-key-location (PEM PKCS#8) thì dùng, không thì sinh key mới
 * lúc khởi động (chỉ phù hợp dev: restart là token cũ hết hiệu lực).
 */
@Configuration
public class JwtConfig {
    private static final Logger log = LoggerFactory.getLogger(JwtConfig.class);

    @Bean
    RSAKey rsaKey(@Value("${app.jwt.private-key-location:}") String location,
                  @Value("${app.jwt.key-id:cinebook-auth-1}") String keyId,
                  ResourceLoader resourceLoader) throws Exception {
        KeyPair pair = location.isBlank() ? generate() : load(resourceLoader.getResource(location));
        return new RSAKey.Builder((RSAPublicKey) pair.getPublic())
            .privateKey(pair.getPrivate())
            .keyID(keyId)
            .build();
    }

    @Bean
    JwtEncoder jwtEncoder(RSAKey rsaKey) {
        return new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(rsaKey)));
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private static KeyPair generate() throws NoSuchAlgorithmException {
        log.warn("app.jwt.private-key-location chưa cấu hình: sinh RSA key tạm thời (chỉ dùng cho dev)");
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        return generator.generateKeyPair();
    }

    private static KeyPair load(Resource resource) throws IOException, java.security.GeneralSecurityException {
        String pem = resource.getContentAsString(StandardCharsets.UTF_8)
            .replaceAll("-----(BEGIN|END) PRIVATE KEY-----", "")
            .replaceAll("\\s", "");
        KeyFactory factory = KeyFactory.getInstance("RSA");
        var privateKey = (RSAPrivateCrtKey) factory.generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(pem)));
        var publicKey = factory.generatePublic(new RSAPublicKeySpec(privateKey.getModulus(), privateKey.getPublicExponent()));
        return new KeyPair(publicKey, privateKey);
    }
}
