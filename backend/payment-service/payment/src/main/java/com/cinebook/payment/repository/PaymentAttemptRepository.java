package com.cinebook.payment.repository;

import com.cinebook.payment.domain.entity.PaymentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PaymentAttemptRepository extends JpaRepository<PaymentAttempt, UUID> {
    long countByPaymentId(UUID paymentId);
}
