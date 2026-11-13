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

    @Column(name = "payment_id", unique = true)
    private UUID paymentId;

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

    // Snapshot hiển thị lúc giữ ghế (null với booking cũ chưa backfill)
    @Column(name = "movie_title", length = 255)
    private String movieTitle;

    @Column(name = "poster_url", length = 1000)
    private String posterUrl;

    @Column(name = "theater_name", length = 255)
    private String theaterName;

    @Column(name = "theater_city", length = 100)
    private String theaterCity;

    @Column(name = "auditorium_name", length = 100)
    private String auditoriumName;

    @Column(name = "showtime_start")
    private Instant showtimeStart;

    @Column(name = "showtime_end")
    private Instant showtimeEnd;

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

    public void applySnapshot(BookingSnapshot snapshot) {
        if (snapshot == null) return;
        this.movieTitle = snapshot.movieTitle();
        this.posterUrl = snapshot.posterUrl();
        this.theaterName = snapshot.theaterName();
        this.theaterCity = snapshot.theaterCity();
        this.auditoriumName = snapshot.auditoriumName();
        this.showtimeStart = snapshot.showtimeStart();
        this.showtimeEnd = snapshot.showtimeEnd();
    }

    public void confirm(Instant now) {
        confirm(null, now);
    }

    public void confirm(UUID paymentId, Instant now) {
        this.status = BookingStatus.CONFIRMED;
        this.paymentId = paymentId;
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
    public UUID getPaymentId() { return paymentId; }
    public BookingStatus getStatus() { return status; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getConfirmedAt() { return confirmedAt; }
    public Instant getCancelledAt() { return cancelledAt; }
    public String getCancelReason() { return cancelReason; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public String getMovieTitle() { return movieTitle; }
    public String getPosterUrl() { return posterUrl; }
    public String getTheaterName() { return theaterName; }
    public String getTheaterCity() { return theaterCity; }
    public String getAuditoriumName() { return auditoriumName; }
    public Instant getShowtimeStart() { return showtimeStart; }
    public Instant getShowtimeEnd() { return showtimeEnd; }
}
