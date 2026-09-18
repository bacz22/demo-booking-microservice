package com.cinebook.booking.repository;

import com.cinebook.booking.exception.RedisUnavailableException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public class RedisSeatHoldRepository {
    private final StringRedisTemplate redis;
    private final RedisScript<Long> holdScript;
    private final RedisScript<Long> releaseScript;
    private final int ttlSeconds;

    public RedisSeatHoldRepository(StringRedisTemplate redis,
                                   @Qualifier("holdSeatsScript") RedisScript<Long> holdScript,
                                   @Qualifier("releaseSeatsScript") RedisScript<Long> releaseScript,
                                   @Value("${booking.hold-ttl-seconds:300}") int ttlSeconds) {
        this.redis = redis;
        this.holdScript = holdScript;
        this.releaseScript = releaseScript;
        this.ttlSeconds = ttlSeconds;
    }

    public boolean tryHold(UUID showtimeId, List<UUID> seatIds, UUID requestId, UUID userId) {
        String owner = owner(requestId, userId);
        try {
            List<String> keys = seatIds.stream().map(id -> key(showtimeId, id)).toList();
            Long result = redis.execute(holdScript, keys, owner, String.valueOf(ttlSeconds));
            if (result == null) throw new RedisUnavailableException("Redis không trả kết quả hold");
            return result == 1L;
        } catch (RedisUnavailableException ex) { throw ex; }
        catch (RuntimeException ex) { throw new RedisUnavailableException("Không thể giữ ghế trên Redis"); }
    }

    public void release(UUID showtimeId, List<UUID> seatIds, UUID requestId, UUID userId) {
        if (seatIds == null || seatIds.isEmpty()) return;
        try {
            List<String> keys = seatIds.stream().map(id -> key(showtimeId, id)).toList();
            redis.execute(releaseScript, keys, owner(requestId, userId));
        } catch (RuntimeException ex) {
            throw new RedisUnavailableException("Không thể release ghế trên Redis");
        }
    }

    public String key(UUID showtimeId, UUID seatId) { return "hold:{" + showtimeId + "}:" + seatId; }
    private String owner(UUID requestId, UUID userId) { return requestId + ":" + userId; }
}
