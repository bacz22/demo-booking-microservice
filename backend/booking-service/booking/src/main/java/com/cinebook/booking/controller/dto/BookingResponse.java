package com.cinebook.booking.controller.dto;

import com.cinebook.booking.domain.entity.Booking;
import com.cinebook.booking.domain.entity.BookingSeat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BookingResponse(
    UUID id, String bookingCode, UUID requestId, UUID userId, UUID showtimeId,
    UUID movieId, UUID theaterId, UUID auditoriumId, BigDecimal totalAmount,
    String status, Instant expiresAt, Instant confirmedAt, Instant cancelledAt,
    String cancelReason, Instant createdAt, List<BookingSeatResponse> seats,
    UUID paymentId, Instant updatedAt,
    // Snapshot lúc giữ ghế (null với booking cũ chưa backfill)
    String movieTitle, String posterUrl, String theaterName, String theaterCity,
    String auditoriumName, Instant showtimeStart, Instant showtimeEnd
) {
    public static BookingResponse from(Booking booking, List<BookingSeat> seats) {
        return new BookingResponse(booking.getId(), booking.getBookingCode(), booking.getRequestId(),
            booking.getUserId(), booking.getShowtimeId(), booking.getMovieId(), booking.getTheaterId(),
            booking.getAuditoriumId(), booking.getTotalAmount(), booking.getStatus().name(),
            booking.getExpiresAt(), booking.getConfirmedAt(), booking.getCancelledAt(),
            booking.getCancelReason(), booking.getCreatedAt(), seats.stream().map(BookingSeatResponse::from).toList(),
            booking.getPaymentId(), booking.getUpdatedAt(),
            booking.getMovieTitle(), booking.getPosterUrl(), booking.getTheaterName(), booking.getTheaterCity(),
            booking.getAuditoriumName(), booking.getShowtimeStart(), booking.getShowtimeEnd());
    }
}
