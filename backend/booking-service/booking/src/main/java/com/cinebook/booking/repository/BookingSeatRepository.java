package com.cinebook.booking.repository;

import com.cinebook.booking.domain.entity.BookingSeat;
import com.cinebook.booking.domain.enums.BookingSeatStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface BookingSeatRepository extends JpaRepository<BookingSeat, UUID> {
    List<BookingSeat> findByBookingIdOrderBySeatNumber(UUID bookingId);

    @Query(value = """
        select bs.seat_id, bs.status, b.user_id, b.expires_at
        from booking_seats bs join bookings b on b.id = bs.booking_id
        where bs.showtime_id = :showtimeId
          and ((bs.status = 'SOLD' and b.status = 'CONFIRMED')
            or (bs.status = 'HELD' and b.status = 'PENDING_PAYMENT' and b.expires_at > current_timestamp))
        """, nativeQuery = true)
    List<Object[]> findActiveSeatStates(@Param("showtimeId") UUID showtimeId);

    @Modifying
    @Query("update BookingSeat s set s.status = :status, s.updatedAt = :now where s.bookingId in :bookingIds")
    int updateStatusByBookingIds(@Param("bookingIds") Collection<UUID> bookingIds,
                                 @Param("status") BookingSeatStatus status,
                                 @Param("now") java.time.Instant now);

    @Modifying
    @Query("update BookingSeat s set s.status = :status, s.updatedAt = :now where s.bookingId = :bookingId")
    int updateStatusByBookingId(@Param("bookingId") UUID bookingId,
                                @Param("status") BookingSeatStatus status,
                                @Param("now") java.time.Instant now);

    @Query(value = """
        select b.id from bookings b join booking_seats bs on bs.booking_id = b.id
        where b.showtime_id = :showtimeId and bs.seat_id in (:seatIds)
          and b.status = 'PENDING_PAYMENT' and b.expires_at <= current_timestamp
        for update of b
        """, nativeQuery = true)
    List<UUID> findExpiredBookingIdsForSeats(@Param("showtimeId") UUID showtimeId,
                                             @Param("seatIds") Collection<UUID> seatIds);
}
