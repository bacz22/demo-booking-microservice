package com.cinebook.theater.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class RestClientConfig {

    @Value("${cinebook.services.movie-service.base-url:http://localhost:8081}")
    private String movieServiceBaseUrl;

    @Value("${cinebook.services.movie-service.connect-timeout-ms:3000}")
    private int connectTimeoutMs;

    @Value("${cinebook.services.movie-service.read-timeout-ms:5000}")
    private int readTimeoutMs;

    @Bean
    public RestClient movieServiceRestClient() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMs));

        return RestClient.builder()
            .baseUrl(movieServiceBaseUrl)
            .requestFactory(requestFactory)
            .build();
    }
}
