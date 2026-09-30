package com.cinebook.payment.job;

import com.cinebook.payment.service.PaymentService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
public class PaymentReconciliationJob {
    private static final Logger log = LoggerFactory.getLogger(PaymentReconciliationJob.class);
    private final PaymentService service;
    private final Clock clock;
    private final long leaseSeconds;
    private final int batchSize;

    public PaymentReconciliationJob(PaymentService service, Clock clock,
                                    @Value("${payment.processing.lease-seconds:60}") long leaseSeconds,
                                    @Value("${payment.processing.reconciliation-batch-size:100}") int batchSize) {
        this.service = service; this.clock = clock; this.leaseSeconds = leaseSeconds; this.batchSize = batchSize;
    }

    @Scheduled(fixedDelayString = "${payment.processing.reconciliation-delay-ms:30000}")
    @SchedulerLock(name = "payment-reconciliation", lockAtMostFor = "5m", lockAtLeastFor = "1s")
    public void reconcile() {
        // The scan is read-only; each retry performs the atomic claim again.
        // This keeps stale workers fenced even when two service instances scan the same row.
        log.debug("Payment reconciliation tick at {}", Instant.now(clock));
        service.reconcileStuck(batchSize);
    }
}
