package com.cinebook.payment.config;

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
    RestClient bookingRestClient(
        @Value("${payment.services.booking.url:http://localhost:8083}") String baseUrl,
        @Value("${payment.services.booking.service-key:}") String serviceKey,
        @Value("${payment.services.booking.connect-timeout:3s}") Duration connectTimeout,
        @Value("${payment.services.booking.read-timeout:5s}") Duration readTimeout) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);
        return RestClient.builder().baseUrl(baseUrl).requestFactory(factory)
            .requestInterceptor((request, body, execution) -> {
                if (!serviceKey.isBlank()) request.getHeaders().set("X-Service-Key", serviceKey);
                String correlationId = MDC.get("correlationId");
                if (correlationId != null && !correlationId.isBlank()) {
                    request.getHeaders().set(CorrelationIdFilter.HEADER, correlationId);
                }
                return execution.execute(request, body);
            }).build();
    }
}
