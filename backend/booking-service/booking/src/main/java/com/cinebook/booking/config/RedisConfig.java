package com.cinebook.booking.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;

@Configuration
public class RedisConfig {
    @Bean
    RedisScript<Long> holdSeatsScript() {
        return script("lua/hold_seats.lua");
    }
    @Bean
    RedisScript<Long> releaseSeatsScript() {
        return script("lua/release_seats.lua");
    }
    @Bean
    RedisScript<Long> releaseIdempotencyMutexScript() {
        return script("lua/release_idempotency_mutex.lua");
    }

    private RedisScript<Long> script(String location) {
        DefaultRedisScript<Long> script = new DefaultRedisScript<>();
        script.setLocation(new ClassPathResource(location));
        script.setResultType(Long.class);
        return script;
    }
}
