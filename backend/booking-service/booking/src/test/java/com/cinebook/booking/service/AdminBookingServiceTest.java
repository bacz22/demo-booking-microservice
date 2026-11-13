package com.cinebook.booking.service;

import com.cinebook.booking.client.TheaterServiceClient;
import com.cinebook.booking.client.dto.TheaterSeatDto;
import com.cinebook.booking.controller.dto.BookingResponse;
import com.cinebook.booking.domain.entity.Booking;
import com.cinebook.booking.domain.entity.BookingSnapshot;
import com.cinebook.booking.domain.enums.BookingStatus;
import com.cinebook.booking.exception.InvalidBookingStateException;
import com.cinebook.booking.repository.RedisSeatHoldRepository;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@SpringBootTest
@ActiveProfiles("test")
class AdminBookingServiceTest {
    private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");
    private static final BigDecimal PRICE = new BigDecimal("90000.00");

    @Autowired AdminBookingService admin;
    @Autowired BookingService bookingService;
    @Autowired BookingPersistenceService persistence;
    @Autowired JdbcTemplate jdbc;
    @MockitoBean TheaterServiceClient theater;
    @MockitoBean RedisSeatHoldRepository seatHolds;

    @DynamicPropertySource
    static void registerPostgresProperties(DynamicPropertyRegistry registry) {
        POSTGRES.start();
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @AfterAll
    static void stop() { POSTGRES.stop(); }

    @BeforeEach
    void clean() {
        jdbc.update("DELETE FROM outbox_events");
        jdbc.update("DELETE FROM booking_seats");
        jdbc.update("DELETE FROM bookings");
    }

    @Test
    void snapshotIsStoredAndReturned() {
        Booking b = newBooking("Dune", "CineBook Landmark", 2);

        BookingResponse r = admin.get(b.getId());

        assertEquals("Dune", r.movieTitle());
        assertEquals("CineBook Landmark", r.theaterName());
        assertEquals("Phòng 01", r.auditoriumName());
        assertEquals(2, r.seats().size());
    }

    @Test
    void list_filtersByStatusAndSearch_andSortsByAmount() {
        Booking dune = newBooking("Dune", "CineBook Landmark", 1);
        Booking oppen = newBooking("Oppenheimer", "CineBook Bitexco", 3);
        persistence.confirmWithPayment(new PaymentConfirmationCommand(oppen.getId(), oppen.getUserId(),
            UUID.randomUUID(), oppen.getTotalAmount(), "VND"));

        var confirmed = admin.list(filter(null, BookingStatus.CONFIRMED, "createdAt", "desc"));
        assertEquals(1, confirmed.total());
        assertEquals(oppen.getId(), confirmed.items().getFirst().id());

        var byMovie = admin.list(filter("dune", null, "createdAt", "desc"));
        assertEquals(List.of(dune.getId()), byMovie.items().stream().map(BookingResponse::id).toList());

        var byCode = admin.list(filter(oppen.getBookingCode().toLowerCase(), null, "createdAt", "desc"));
        assertEquals(1, byCode.total());

        var byAmount = admin.list(filter(null, null, "totalAmount", "asc"));
        assertEquals(List.of(dune.getId(), oppen.getId()), byAmount.items().stream().map(BookingResponse::id).toList());
    }

    @Test
    void stats_countsRevenueFromConfirmedBookingsOnly() {
        Booking paid = newBooking("Dune", "CineBook Landmark", 2);
        newBooking("Dune", "CineBook Landmark", 1); // vẫn PENDING_PAYMENT
        persistence.confirmWithPayment(new PaymentConfirmationCommand(paid.getId(), paid.getUserId(),
            UUID.randomUUID(), paid.getTotalAmount(), "VND"));

        LocalDate today = LocalDate.now(AdminBookingService.ZONE);
        var stats = admin.stats(today.minusDays(6), today);

        assertEquals(0, new BigDecimal("180000.00").compareTo(stats.revenue()));
        assertEquals(1, stats.confirmedBookings());
        assertEquals(2, stats.seatsSold());
        assertEquals(2, stats.createdBookings());
        assertEquals(1L, stats.byStatus().get("CONFIRMED"));
        assertEquals(1L, stats.byStatus().get("PENDING_PAYMENT"));
        assertEquals(7, stats.daily().size());
        assertEquals(0, new BigDecimal("180000.00").compareTo(stats.daily().getLast().revenue()));
    }

    @Test
    void soldSeats_countsOnlyConfirmedSeatsPerShowtime() {
        Booking paid = newBooking("Dune", "CineBook Landmark", 2);
        persistence.confirmWithPayment(new PaymentConfirmationCommand(paid.getId(), paid.getUserId(),
            UUID.randomUUID(), paid.getTotalAmount(), "VND"));
        UUID other = UUID.randomUUID();

        Map<UUID, Long> sold = admin.soldSeatsByShowtime(List.of(paid.getShowtimeId(), other));

        assertEquals(2L, sold.get(paid.getShowtimeId()));
        assertEquals(0L, sold.get(other));
    }

    @Test
    void adminCancel_cancelsPendingBooking_withReason_andRejectsConfirmed() {
        Booking pending = newBooking("Dune", "CineBook Landmark", 1);

        BookingResponse r = bookingService.adminCancel(pending.getId(), "Khách gọi điện yêu cầu huỷ");

        assertEquals("CANCELLED", r.status());
        assertEquals("ADMIN_CANCELLED: Khách gọi điện yêu cầu huỷ", r.cancelReason());
        verify(seatHolds).release(any(), any(), any(), any());

        Booking paid = newBooking("Dune", "CineBook Landmark", 1);
        persistence.confirmWithPayment(new PaymentConfirmationCommand(paid.getId(), paid.getUserId(),
            UUID.randomUUID(), paid.getTotalAmount(), "VND"));
        assertThrows(InvalidBookingStateException.class, () -> bookingService.adminCancel(paid.getId(), null));
    }

    // ---------- helpers ----------

    private Booking newBooking(String movieTitle, String theaterName, int seatCount) {
        UUID showtimeId = UUID.randomUUID();
        UUID auditoriumId = UUID.randomUUID();
        List<TheaterSeatDto> seats = new java.util.ArrayList<>();
        for (int i = 1; i <= seatCount; i++) {
            seats.add(new TheaterSeatDto(UUID.randomUUID(), auditoriumId, "A", i, "STANDARD", "A" + i));
        }
        List<BigDecimal> prices = seats.stream().map(s -> PRICE).toList();
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        return persistence.create(new PersistBookingCommand(UUID.randomUUID(), "hash-" + UUID.randomUUID(),
            UUID.randomUUID(), showtimeId, UUID.randomUUID(), UUID.randomUUID(), auditoriumId,
            PRICE.multiply(BigDecimal.valueOf(seatCount)), Instant.now().plus(5, ChronoUnit.MINUTES), seats, prices,
            new BookingSnapshot(movieTitle, null, theaterName, "HCM", "Phòng 01", start, start.plus(2, ChronoUnit.HOURS))));
    }

    private static AdminBookingService.Filter filter(String q, BookingStatus status, String sortBy, String order) {
        return new AdminBookingService.Filter(q, status, null, null, null, null, null, sortBy, order, 0, 20);
    }
}
