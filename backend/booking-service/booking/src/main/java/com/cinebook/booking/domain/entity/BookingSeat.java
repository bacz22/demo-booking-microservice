package com.cinebook.booking.domain.entity;

import com.cinebook.booking.domain.enums.BookingSeatStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "booking_seats")
public class BookingSeat {
    @Id
    private UUID id;
    @Column(name = "booking_id", nullable = false)
    private UUID bookingId;
    @Column(name = "showtime_id", nullable = false)
    private UUID showtimeId;
    @Column(name = "seat_id", nullable = false)
    private UUID seatId;
    @Column(name = "row_label", nullable = false, length = 10)
    private String rowLabel;
    @Column(name = "seat_number", nullable = false)
    private int seatNumber;
    @Column(name = "seat_type", nullable = false, length = 20)
    private String seatType;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingSeatStatus status;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected BookingSeat() {
    }

    public BookingSeat(UUID id, UUID bookingId, UUID showtimeId, UUID seatId, String rowLabel,
                       int seatNumber, String seatType, BigDecimal price, Instant now) {
        this.id = id;
        this.bookingId = bookingId;
        this.showtimeId = showtimeId;
        this.seatId = seatId;
        this.rowLabel = rowLabel;
        this.seatNumber = seatNumber;
        this.seatType = seatType;
        this.price = price;
        this.status = BookingSeatStatus.HELD;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void markSold(Instant now) { this.status = BookingSeatStatus.SOLD; this.updatedAt = now; }
    public void markReleased(Instant now) { this.status = BookingSeatStatus.RELEASED; this.updatedAt = now; }
    public UUID getId() { return id; }
    public UUID getBookingId() { return bookingId; }
    public UUID getShowtimeId() { return showtimeId; }
    public UUID getSeatId() { return seatId; }
    public String getRowLabel() { return rowLabel; }
    public int getSeatNumber() { return seatNumber; }
    public String getSeatType() { return seatType; }
    public BigDecimal getPrice() { return price; }
    public BookingSeatStatus getStatus() { return status; }
    public Instant getUpdatedAt() { return updatedAt; }
}
