package com.cinebook.payment.repository;

import com.cinebook.payment.domain.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID>,
        org.springframework.data.jpa.repository.JpaSpecificationExecutor<Payment> {
    Optional<Payment> findByRequestId(UUID requestId);
    Optional<Payment> findByBookingId(UUID bookingId);
    Page<Payment> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    @org.springframework.data.jpa.repository.Query(value = "select nextval('payment_code_seq')", nativeQuery = true)
    long nextPaymentCodeSequence();
}
