package com.cinebook.payment.repository;

import java.util.UUID;

public record ClaimedPayment(UUID paymentId, UUID processingToken, int attemptNumber) {
}
