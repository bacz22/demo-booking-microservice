package com.cinebook.booking.repository;

import com.cinebook.booking.domain.entity.Booking;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID>,
        org.springframework.data.jpa.repository.JpaSpecificationExecutor<Booking> {
    Optional<Booking> findByRequestId(UUID requestId);
    Page<Booking> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booking b where b.id = :id")
    Optional<Booking> findByIdForUpdate(@Param("id") UUID id);

    @Query(value = "select nextval('booking_code_seq')", nativeQuery = true)
    long nextBookingCodeSequence();

    @Query(value = "select id from bookings where status = 'PENDING_PAYMENT' and expires_at <= current_timestamp order by expires_at for update skip locked limit :limit", nativeQuery = true)
    List<UUID> findExpiredIdsForUpdate(@Param("limit") int limit);
}
