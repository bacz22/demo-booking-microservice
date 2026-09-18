package com.cinebook.booking.repository;

import com.cinebook.booking.exception.RedisUnavailableException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Repository
public class RedisIdempotencyRepository {
    private final StringRedisTemplate redis;
    private final RedisScript<Long> releaseScript;
    private final Duration mutexTtl;
    private final Duration fingerprintTtl;

    public RedisIdempotencyRepository(StringRedisTemplate redis,
                                      @Qualifier("releaseIdempotencyMutexScript") RedisScript<Long> releaseScript,
                                      @Value("${booking.idempotency.mutex-ttl-seconds:30}") int mutexTtl,
                                      @Value("${booking.idempotency.fingerprint-ttl-seconds:600}") int fingerprintTtl) {
        this.redis = redis;
        this.releaseScript = releaseScript;
        this.mutexTtl = Duration.ofSeconds(mutexTtl);
        this.fingerprintTtl = Duration.ofSeconds(fingerprintTtl);
    }

    public String getFingerprint(UUID requestId) {
        try { return redis.opsForValue().get(fingerprintKey(requestId)); }
        catch (RuntimeException ex) { throw new RedisUnavailableException("Không thể đọc idempotency fingerprint"); }
    }

    public boolean createFingerprint(UUID requestId, String hash) {
        try { return Boolean.TRUE.equals(redis.opsForValue().setIfAbsent(fingerprintKey(requestId), hash, fingerprintTtl)); }
        catch (RuntimeException ex) { throw new RedisUnavailableException("Không thể tạo idempotency fingerprint"); }
    }

    public String claimMutex(UUID requestId, String hash) {
        String token = UUID.randomUUID().toString();
        String value = hash + ":" + token;
        try {
            return Boolean.TRUE.equals(redis.opsForValue().setIfAbsent(mutexKey(requestId), value, mutexTtl)) ? value : null;
        } catch (RuntimeException ex) { throw new RedisUnavailableException("Không thể khóa idempotency request"); }
    }

    public void releaseMutex(UUID requestId, String value) {
        if (value == null) return;
        try { redis.execute(releaseScript, List.of(mutexKey(requestId)), value); }
        catch (RuntimeException ex) { throw new RedisUnavailableException("Không thể release idempotency mutex"); }
    }

    private String fingerprintKey(UUID id) { return "idemhash:" + id; }
    private String mutexKey(UUID id) { return "idem:" + id; }
}
