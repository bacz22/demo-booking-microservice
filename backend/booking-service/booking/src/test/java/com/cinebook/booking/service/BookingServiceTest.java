package com.cinebook.booking.service;

import com.cinebook.booking.client.MovieServiceClient;
import com.cinebook.booking.client.TheaterServiceClient;
import com.cinebook.booking.client.dto.TheaterSeatDto;
import com.cinebook.booking.client.dto.TheaterSeatMapDto;
import com.cinebook.booking.client.dto.TheaterShowtimeDto;
import com.cinebook.booking.controller.dto.BookingResponse;
import com.cinebook.booking.controller.dto.CreateBookingRequest;
import com.cinebook.booking.domain.entity.Booking;
import com.cinebook.booking.domain.enums.ConfirmOutcome;
import com.cinebook.booking.exception.ShowtimeNotSellingException;
import com.cinebook.booking.metrics.BookingMetrics;
import com.cinebook.booking.repository.RedisIdempotencyRepository;
import com.cinebook.booking.repository.RedisSeatHoldRepository;
import org.postgresql.util.PSQLException;
import org.postgresql.util.ServerErrorMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {
    private static final Instant NOW = Instant.parse("2026-09-17T08:00:00Z");
    private static final UUID USER_ID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID SHOWTIME_ID = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final UUID SEAT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID REQUEST_ID = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");

    @Mock BookingPersistenceService persistence;
    @Mock TheaterServiceClient theater;
    @Mock MovieServiceClient movies;
    @Mock RedisSeatHoldRepository seatHolds;
    @Mock RedisIdempotencyRepository idempotency;
    @Mock BookingMetrics metrics;

    private BookingService service;

    @BeforeEach
    void setUp() {
        service = new BookingService(persistence, theater, movies, seatHolds, idempotency, metrics,
            Clock.fixed(NOW, ZoneOffset.UTC), 8, 300, true);
    }

    @Test
    void holdUsesFreshShowtimePricesAndReturnsCreatedResult() {
        CreateBookingRequest request = new CreateBookingRequest(SHOWTIME_ID, List.of(SEAT_ID));
        TheaterShowtimeDto showtime = showtime("SELLING", "100.00", "175.00", "250.00");
        TheaterSeatDto seat = new TheaterSeatDto(SEAT_ID, showtime.auditoriumId(), "A", 1, "VIP", "A1");
        Booking booking = booking(request, "175.00");

        when(persistence.findByRequestId(REQUEST_ID)).thenReturn(null);
        when(idempotency.getFingerprint(REQUEST_ID)).thenReturn(null);
        when(idempotency.createFingerprint(REQUEST_ID, BookingService.hash(USER_ID, SHOWTIME_ID, List.of(SEAT_ID)))).thenReturn(true);
        when(idempotency.claimMutex(eq(REQUEST_ID), any(String.class))).thenReturn("mutex");
        when(theater.getShowtime(SHOWTIME_ID)).thenReturn(showtime);
        when(theater.getSeatMap(SHOWTIME_ID)).thenReturn(new TheaterSeatMapDto(SHOWTIME_ID, showtime.auditoriumId(), "Room", "2D", Map.of(), 1, List.of(seat)));
        when(seatHolds.tryHold(SHOWTIME_ID, List.of(SEAT_ID), REQUEST_ID, USER_ID)).thenReturn(true);
        when(persistence.create(any(PersistBookingCommand.class))).thenReturn(booking);
        when(persistence.getSeats(booking.getId())).thenReturn(List.of());

        HoldResult result = service.hold(request, USER_ID, REQUEST_ID);

        assertTrue(result.created());
        assertEquals(new BigDecimal("175.00"), result.response().totalAmount());
        ArgumentCaptor<PersistBookingCommand> command = ArgumentCaptor.forClass(PersistBookingCommand.class);
        verify(persistence).create(command.capture());
        assertEquals(new BigDecimal("175.00"), command.getValue().totalAmount());
        assertEquals(List.of(new BigDecimal("175.00")), command.getValue().prices());
    }

    @Test
    void requestUniqueViolationReplaysWinningBooking() {
        CreateBookingRequest request = new CreateBookingRequest(SHOWTIME_ID, List.of(SEAT_ID));
        Booking winner = booking(request, "175.00");

        when(persistence.findByRequestId(REQUEST_ID)).thenReturn(null, null, winner);
        when(idempotency.getFingerprint(REQUEST_ID)).thenReturn(null);
        when(idempotency.createFingerprint(REQUEST_ID, BookingService.hash(USER_ID, SHOWTIME_ID, List.of(SEAT_ID)))).thenReturn(true);
        when(idempotency.claimMutex(eq(REQUEST_ID), any(String.class))).thenReturn("mutex");
        when(theater.getShowtime(SHOWTIME_ID)).thenReturn(showtime("SELLING", "100.00", "175.00", "250.00"));
        UUID auditoriumId = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
        when(theater.getSeatMap(SHOWTIME_ID)).thenReturn(new TheaterSeatMapDto(SHOWTIME_ID, auditoriumId,
            "Room", "2D", Map.of(), 1, List.of(new TheaterSeatDto(SEAT_ID, auditoriumId, "A", 1, "VIP", "A1"))));
        when(seatHolds.tryHold(SHOWTIME_ID, List.of(SEAT_ID), REQUEST_ID, USER_ID)).thenReturn(true);
        when(persistence.create(any(PersistBookingCommand.class)))
            .thenThrow(dataIntegrityViolation("uq_bookings_request_id"));
        when(persistence.getSeats(winner.getId())).thenReturn(List.of());

        HoldResult result = service.hold(request, USER_ID, REQUEST_ID);

        assertFalse(result.created());
        assertEquals(winner.getId(), result.response().id());
        verify(seatHolds, never()).release(any(UUID.class), anyList(), any(UUID.class), any(UUID.class));
    }

    @Test
    void seatUniqueViolationReleasesRedisHoldAndReturnsSeatConflict() {
        CreateBookingRequest request = new CreateBookingRequest(SHOWTIME_ID, List.of(SEAT_ID));
        when(persistence.findByRequestId(REQUEST_ID)).thenReturn(null);
        when(idempotency.getFingerprint(REQUEST_ID)).thenReturn(null);
        when(idempotency.createFingerprint(REQUEST_ID, BookingService.hash(USER_ID, SHOWTIME_ID, List.of(SEAT_ID)))).thenReturn(true);
        when(idempotency.claimMutex(eq(REQUEST_ID), any(String.class))).thenReturn("mutex");
        when(theater.getShowtime(SHOWTIME_ID)).thenReturn(showtime("SELLING", "100.00", "175.00", "250.00"));
        UUID auditoriumId = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
        when(theater.getSeatMap(SHOWTIME_ID)).thenReturn(new TheaterSeatMapDto(SHOWTIME_ID, auditoriumId,
            "Room", "2D", Map.of(), 1, List.of(new TheaterSeatDto(SEAT_ID, auditoriumId, "A", 1, "VIP", "A1"))));
        when(seatHolds.tryHold(SHOWTIME_ID, List.of(SEAT_ID), REQUEST_ID, USER_ID)).thenReturn(true);
        when(persistence.create(any(PersistBookingCommand.class)))
            .thenThrow(dataIntegrityViolation("uq_booking_seats_showtime_seat_active"));

        assertThrows(com.cinebook.booking.exception.SeatAlreadyHeldException.class,
            () -> service.hold(request, USER_ID, REQUEST_ID));

        verify(seatHolds).release(SHOWTIME_ID, List.of(SEAT_ID), REQUEST_ID, USER_ID);
    }

    @Test
    void sameRequestIdAndPayloadReturnsReplayWithoutCreatingAnotherBooking() {
        CreateBookingRequest request = new CreateBookingRequest(SHOWTIME_ID, List.of(SEAT_ID));
        Booking existing = booking(request, "100.00");
        when(persistence.findByRequestId(REQUEST_ID)).thenReturn(existing);
        when(persistence.getSeats(existing.getId())).thenReturn(List.of());

        HoldResult result = service.hold(request, USER_ID, REQUEST_ID);

        assertFalse(result.created());
        assertEquals(existing.getId(), result.response().id());
        verify(persistence, never()).create(any(PersistBookingCommand.class));
        verify(idempotency, never()).claimMutex(any(UUID.class), any(String.class));
    }

    @Test
    void holdRejectsShowtimeThatIsNotSellingBeforeHoldingSeats() {
        CreateBookingRequest request = new CreateBookingRequest(SHOWTIME_ID, List.of(SEAT_ID));
        when(persistence.findByRequestId(REQUEST_ID)).thenReturn(null);
        when(idempotency.getFingerprint(REQUEST_ID)).thenReturn(null);
        when(idempotency.createFingerprint(any(UUID.class), any(String.class))).thenReturn(true);
        when(idempotency.claimMutex(any(UUID.class), any(String.class))).thenReturn("mutex");
        when(theater.getShowtime(SHOWTIME_ID)).thenReturn(showtime("SCHEDULED", "100.00", "175.00", "250.00"));

        assertThrows(ShowtimeNotSellingException.class, () -> service.hold(request, USER_ID, REQUEST_ID));

        verify(seatHolds, never()).tryHold(any(UUID.class), anyList(), any(UUID.class), any(UUID.class));
        verify(persistence, never()).create(any(PersistBookingCommand.class));
    }

    @Test
    void confirmCancelsAndReleasesSeatsWhenShowtimeStoppedSelling() {
        Booking booking = booking(new CreateBookingRequest(SHOWTIME_ID, List.of(SEAT_ID)), "100.00");
        TransitionResult cancelled = new TransitionResult(booking, List.of(SEAT_ID), ConfirmOutcome.EXPIRED);
        when(persistence.get(booking.getId(), USER_ID)).thenReturn(booking);
        when(theater.getShowtime(SHOWTIME_ID)).thenReturn(showtime("STOPPED", "100.00", "175.00", "250.00"));
        when(persistence.cancel(booking.getId(), USER_ID, "SHOWTIME_NOT_SELLING")).thenReturn(cancelled);

        assertThrows(ShowtimeNotSellingException.class, () -> service.confirm(booking.getId(), USER_ID));

        verify(persistence).cancel(booking.getId(), USER_ID, "SHOWTIME_NOT_SELLING");
        verify(seatHolds).release(SHOWTIME_ID, List.of(SEAT_ID), REQUEST_ID, USER_ID);
        verify(persistence, never()).confirmOrExpire(any(UUID.class), any(UUID.class));
    }

    private TheaterShowtimeDto showtime(String status, String standard, String vip, String couple) {
        UUID auditoriumId = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
        return new TheaterShowtimeDto(SHOWTIME_ID, auditoriumId, "Room", "2D",
            UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"), "Theater", "Address", "City",
            UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff"), NOW, NOW.plusSeconds(7200), 120, 15,
            new BigDecimal(standard), new BigDecimal(vip), new BigDecimal(couple), status, NOW, NOW);
    }

    private Booking booking(CreateBookingRequest request, String total) {
        return new Booking(UUID.fromString("99999999-9999-9999-9999-999999999999"), "CB-00000001", REQUEST_ID,
            BookingService.hash(USER_ID, request.showtimeId(), request.seatIds()), USER_ID, request.showtimeId(),
            UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff"), UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd"), new BigDecimal(total), NOW.plusSeconds(300), NOW);
    }

    private DataIntegrityViolationException dataIntegrityViolation(String constraint) {
        String serverMessage = "SERROR\0C23505\0n" + constraint + "\0Mduplicate key\0\0";
        return new DataIntegrityViolationException("duplicate key", new PSQLException(new ServerErrorMessage(serverMessage)));
    }
}
