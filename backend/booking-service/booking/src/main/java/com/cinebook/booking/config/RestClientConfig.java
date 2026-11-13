package com.cinebook.booking.config;

import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class RestClientConfig {
    @Bean
    RestClient theaterRestClient(
        @Value("${booking.services.theater.url:http://localhost:8082}") String baseUrl,
        @Value("${booking.services.theater.connect-timeout:3s}") Duration connectTimeout,
        @Value("${booking.services.theater.read-timeout:5s}") Duration readTimeout,
        @Value("${app.security.gateway-secret:}") String gatewaySecret) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);
        return RestClient.builder().baseUrl(baseUrl).requestFactory(factory)
            // theater-service chỉ nhận /api/** kèm secret của gateway
            .defaultHeader(GatewaySecretFilter.HEADER, gatewaySecret)
            .requestInterceptor((request, body, execution) -> {
                String correlationId = MDC.get("correlationId");
                if (correlationId != null && !correlationId.isBlank()) {
                    request.getHeaders().set(CorrelationIdFilter.HEADER, correlationId);
                }
                return execution.execute(request, body);
            }).build();
    }

    /** movie-service: chỉ dùng để lấy tên phim/poster cho snapshot booking. */
    @Bean
    RestClient movieRestClient(
        @Value("${booking.services.movie.url:http://localhost:8081}") String baseUrl,
        @Value("${booking.services.movie.connect-timeout:2s}") Duration connectTimeout,
        @Value("${booking.services.movie.read-timeout:3s}") Duration readTimeout,
        @Value("${app.security.gateway-secret:}") String gatewaySecret) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);
        return RestClient.builder().baseUrl(baseUrl).requestFactory(factory)
            .defaultHeader(GatewaySecretFilter.HEADER, gatewaySecret)
            .requestInterceptor((request, body, execution) -> {
                String correlationId = MDC.get("correlationId");
                if (correlationId != null && !correlationId.isBlank()) {
                    request.getHeaders().set(CorrelationIdFilter.HEADER, correlationId);
                }
                return execution.execute(request, body);
            }).build();
    }
}
