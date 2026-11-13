package com.cinebook.payment.controller.dto;

import com.cinebook.payment.domain.entity.PaymentAttempt;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Chi tiết payment cho admin, kèm lịch sử các lần xử lý (attempts). */
public record AdminPaymentDetailResponse(PaymentResponse payment, List<Attempt> attempts) {
    public record Attempt(UUID id, int attemptNumber, String status, String providerRef, String failureCode,
                          String failureMessage, Instant startedAt, Instant endedAt) {
        public static Attempt from(PaymentAttempt a) {
            return new Attempt(a.getId(), a.getAttemptNumber(), a.getStatus().name(), a.getProviderRef(),
                a.getFailureCode(), a.getFailureMessage(), a.getStartedAt(), a.getEndedAt());
        }
    }
}
