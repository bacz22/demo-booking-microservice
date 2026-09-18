package com.cinebook.booking.service;

import com.cinebook.booking.metrics.BookingMetrics;
import com.cinebook.booking.repository.RedisSeatHoldRepository;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class BookingExpirationService {
    private static final Logger log = LoggerFactory.getLogger(BookingExpirationService.class);
    private final BookingPersistenceService persistence;
    private final RedisSeatHoldRepository seatHolds;
    private final BookingMetrics metrics;
    private final int batchSize;

    public BookingExpirationService(BookingPersistenceService persistence, RedisSeatHoldRepository seatHolds,
                                    BookingMetrics metrics, @Value("${booking.expiration.batch-size:100}") int batchSize) {
        this.persistence = persistence;
        this.seatHolds = seatHolds;
        this.metrics = metrics;
        this.batchSize = batchSize;
    }

    @Scheduled(fixedDelayString = "${booking.expiration.fixed-delay-ms:30000}")
    @SchedulerLock(name = "expireBookings", lockAtMostFor = "5m", lockAtLeastFor = "5s")
    public void expire() {
        long started = System.nanoTime();
        for (ReleaseCommand command : persistence.expireBatch(batchSize)) {
            try { seatHolds.release(command.showtimeId(), command.seatIds(), command.requestId(), command.userId()); }
            catch (RuntimeException ex) { log.warn("Could not release expired booking seats {}", command.requestId(), ex); metrics.increment("booking.redis.release_failure"); }
            metrics.increment("booking.expired.count");
        }
        metrics.increment("booking.expiration.batch.count");
        log.debug("Booking expiration batch finished in {} ms", (System.nanoTime() - started) / 1_000_000);
    }
}
