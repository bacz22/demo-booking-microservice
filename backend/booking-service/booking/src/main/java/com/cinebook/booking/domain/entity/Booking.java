package com.cinebook.booking.domain.entity;

import com.cinebook.booking.domain.enums.BookingStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bookings")
public class Booking {
    @Id
    private UUID id;

    @Column(name = "booking_code", nullable = false, length = 32)
    private String bookingCode;

    @Column(name = "request_id", nullable = false, unique = true)
    private UUID requestId;

    @Column(name = "request_hash", nullable = false, length = 64)
    private String requestHash;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "showtime_id", nullable = false)
    private UUID showtimeId;

    @Column(name = "movie_id", nullable = false)
    private UUID movieId;

    @Column(name = "theater_id", nullable = false)
    private UUID theaterId;

    @Column(name = "auditorium_id", nullable = false)
    private UUID auditoriumId;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private BookingStatus status;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancel_reason", length = 255)
    private String cancelReason;

    @Version
    private long version;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Booking() {
    }

    public Booking(UUID id, String bookingCode, UUID requestId, String requestHash, UUID userId,
                   UUID showtimeId, UUID movieId, UUID theaterId, UUID auditoriumId,
                   BigDecimal totalAmount, Instant expiresAt, Instant now) {
        this.id = id;
        this.bookingCode = bookingCode;
        this.requestId = requestId;
        this.requestHash = requestHash;
        this.userId = userId;
        this.showtimeId = showtimeId;
        this.movieId = movieId;
        this.theaterId = theaterId;
        this.auditoriumId = auditoriumId;
        this.totalAmount = totalAmount;
        this.status = BookingStatus.PENDING_PAYMENT;
        this.expiresAt = expiresAt;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void confirm(Instant now) {
        this.status = BookingStatus.CONFIRMED;
        this.confirmedAt = now;
        this.updatedAt = now;
    }

    public void cancel(String reason, Instant now) {
        this.status = BookingStatus.CANCELLED;
        this.cancelReason = reason;
        this.cancelledAt = now;
        this.updatedAt = now;
    }

    public void expire(Instant now) {
        this.status = BookingStatus.EXPIRED;
        this.updatedAt = now;
    }

    public UUID getId() { return id; }
    public String getBookingCode() { return bookingCode; }
    public UUID getRequestId() { return requestId; }
    public String getRequestHash() { return requestHash; }
    public UUID getUserId() { return userId; }
    public UUID getShowtimeId() { return showtimeId; }
    public UUID getMovieId() { return movieId; }
    public UUID getTheaterId() { return theaterId; }
    public UUID getAuditoriumId() { return auditoriumId; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public BookingStatus getStatus() { return status; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getConfirmedAt() { return confirmedAt; }
    public Instant getCancelledAt() { return cancelledAt; }
    public String getCancelReason() { return cancelReason; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
