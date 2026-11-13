package com.cinebook.booking.service;

import com.cinebook.booking.client.MovieServiceClient;
import com.cinebook.booking.client.dto.MovieSummaryDto;
import com.cinebook.booking.domain.entity.BookingSnapshot;
import com.cinebook.booking.client.TheaterServiceClient;
import com.cinebook.booking.client.dto.TheaterSeatDto;
import com.cinebook.booking.client.dto.TheaterSeatMapDto;
import com.cinebook.booking.client.dto.TheaterShowtimeDto;
import com.cinebook.booking.controller.dto.BookingResponse;
import com.cinebook.booking.controller.dto.CreateBookingRequest;
import com.cinebook.booking.domain.entity.Booking;
import com.cinebook.booking.domain.enums.ConfirmOutcome;
import com.cinebook.booking.exception.BadRequestException;
import com.cinebook.booking.exception.BookingExpiredException;
import com.cinebook.booking.exception.IdempotencyConflictException;
import com.cinebook.booking.exception.IdempotencyInProgressException;
import com.cinebook.booking.exception.InvalidBookingStateException;
import com.cinebook.booking.exception.MockPaymentDisabledException;
import com.cinebook.booking.exception.SeatAlreadyHeldException;
import com.cinebook.booking.exception.SeatNotFoundException;
import com.cinebook.booking.exception.ShowtimeNotSellingException;
import com.cinebook.booking.metrics.BookingMetrics;
import com.cinebook.booking.repository.RedisIdempotencyRepository;
import com.cinebook.booking.repository.RedisSeatHoldRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.postgresql.util.PSQLException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class BookingService {
    private static final Logger log = LoggerFactory.getLogger(BookingService.class);
    private final BookingPersistenceService persistence;
    private final TheaterServiceClient theater;
    private final MovieServiceClient movies;
    private final RedisSeatHoldRepository seatHolds;
    private final RedisIdempotencyRepository idempotency;
    private final BookingMetrics metrics;
    private final Clock clock;
    private final int maxSeats;
    private final int holdTtlSeconds;
    private final boolean mockPaymentEnabled;

    public BookingService(BookingPersistenceService persistence, TheaterServiceClient theater,
                          MovieServiceClient movies, RedisSeatHoldRepository seatHolds, RedisIdempotencyRepository idempotency,
                          BookingMetrics metrics, Clock clock,
                          @Value("${booking.max-seats-per-booking:8}") int maxSeats,
                          @Value("${booking.hold-ttl-seconds:300}") int holdTtlSeconds,
                          @Value("${booking.mock-payment-enabled:false}") boolean mockPaymentEnabled) {
        this.persistence = persistence;
        this.theater = theater;
        this.movies = movies;
        this.seatHolds = seatHolds;
        this.idempotency = idempotency;
        this.metrics = metrics;
        this.clock = clock;
        this.maxSeats = maxSeats;
        this.holdTtlSeconds = holdTtlSeconds;
        this.mockPaymentEnabled = mockPaymentEnabled;
    }

    public HoldResult hold(CreateBookingRequest request, UUID userId, UUID requestId) {
        List<UUID> seatIds = normalizeSeats(request.seatIds());
        String hash = hash(userId, request.showtimeId(), seatIds);
        Booking existing = persistence.findByRequestId(requestId);
        if (existing != null) {
            if (!existing.getRequestHash().equals(hash)) throw new IdempotencyConflictException();
            return new HoldResult(response(existing), false);
        }

        String fingerprint = idempotency.getFingerprint(requestId);
        if (fingerprint != null && !fingerprint.equals(hash)) throw new IdempotencyConflictException();
        if (fingerprint == null && !idempotency.createFingerprint(requestId, hash)) {
            fingerprint = idempotency.getFingerprint(requestId);
            if (fingerprint != null && !fingerprint.equals(hash)) throw new IdempotencyConflictException();
        }
        String mutexValue = idempotency.claimMutex(requestId, hash);
        if (mutexValue == null) throw new IdempotencyInProgressException();

        boolean holdAcquired = false;
        try {
            existing = persistence.findByRequestId(requestId);
            if (existing != null) {
                if (!existing.getRequestHash().equals(hash)) throw new IdempotencyConflictException();
                return new HoldResult(response(existing), false);
            }
            TheaterShowtimeDto showtime = theater.getShowtime(request.showtimeId());
            if (!"SELLING".equalsIgnoreCase(showtime.status())) throw new ShowtimeNotSellingException();
            BookingSnapshot snapshot = snapshot(showtime); // gọi movie-service trước khi giữ ghế trên Redis
            TheaterSeatMapDto seatMap = theater.getSeatMap(request.showtimeId());
            Map<UUID, TheaterSeatDto> available = new HashMap<>();
            for (TheaterSeatDto seat : seatMap.seats()) available.put(seat.id(), seat);
            List<TheaterSeatDto> selected = seatIds.stream().map(id -> available.get(id)).toList();
            if (selected.stream().anyMatch(java.util.Objects::isNull)) throw new SeatNotFoundException();
            List<BigDecimal> prices = selected.stream().map(seat -> priceOf(seat, showtime)).toList();
            BigDecimal total = prices.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            if (!seatHolds.tryHold(request.showtimeId(), seatIds, requestId, userId)) throw new SeatAlreadyHeldException();
            holdAcquired = true;
            Instant now = Instant.now(clock);
            Booking booking = persistence.create(new PersistBookingCommand(requestId, hash, userId,
                request.showtimeId(), showtime.movieId(), showtime.theaterId(), showtime.auditoriumId(),
                total, now.plusSeconds(holdTtlSeconds), selected, prices, snapshot));
            holdAcquired = false; // Hold belongs to the committed booking and is released on confirm/cancel/expiry.
            metrics.increment("booking.hold.success");
            return new HoldResult(response(booking), true);
        } catch (DataIntegrityViolationException ex) {
            String constraint = constraintName(ex);
            if ("uq_bookings_request_id".equals(constraint)) {
                Booking winner = persistence.findByRequestId(requestId);
                if (winner != null && winner.getRequestHash().equals(hash)) {
                    holdAcquired = false;
                    return new HoldResult(response(winner), false);
                }
                if (holdAcquired) safeRelease(request.showtimeId(), seatIds, requestId, userId);
                throw new IdempotencyConflictException();
            }
            if ("uq_booking_seats_showtime_seat_active".equals(constraint)) {
                if (holdAcquired) safeRelease(request.showtimeId(), seatIds, requestId, userId);
                metrics.increment("booking.compensation.count");
                throw new SeatAlreadyHeldException();
            }
            if (holdAcquired) safeRelease(request.showtimeId(), seatIds, requestId, userId);
            metrics.increment("booking.compensation.count");
            throw ex;
        } catch (RuntimeException ex) {
            if (holdAcquired) safeRelease(request.showtimeId(), seatIds, requestId, userId);
            metrics.increment("booking.hold.failure");
            throw ex;
        } finally {
            try { idempotency.releaseMutex(requestId, mutexValue); }
            catch (RuntimeException ex) { log.warn("Could not release idempotency mutex for {}", requestId, ex); }
        }
    }

    public BookingResponse get(UUID id, UUID userId) {
        return response(persistence.get(id, userId));
    }

    public Page<BookingResponse> findMine(UUID userId, Pageable pageable) {
        return persistence.findMine(userId, pageable).map(this::response);
    }

    public BookingResponse confirm(UUID id, UUID userId) {
        if (!mockPaymentEnabled) throw new MockPaymentDisabledException();
        Booking current = persistence.get(id, userId);
        TheaterShowtimeDto showtime = theater.getShowtime(current.getShowtimeId());
        if (!"SELLING".equalsIgnoreCase(showtime.status())) {
            TransitionResult cancelled = persistence.cancel(id, userId, "SHOWTIME_NOT_SELLING");
            safeRelease(cancelled, userId);
            throw new ShowtimeNotSellingException();
        }
        TransitionResult result = persistence.confirmOrExpire(id, userId);
        safeRelease(result, userId);
        if (result.outcome() == ConfirmOutcome.EXPIRED) throw new BookingExpiredException();
        return response(result.booking());
    }

    public BookingPaymentStatus paymentStatus(UUID id, UUID userId) {
        return persistence.paymentStatus(id, userId);
    }

    public BookingResponse cancel(UUID id, UUID userId) {
        TransitionResult result = persistence.cancel(id, userId, "USER_CANCELLED");
        safeRelease(result, userId);
        return response(result.booking());
    }

    /**
     * Admin huỷ đơn đang chờ thanh toán. Đơn đã CONFIRMED (đã thu tiền) không huỷ ở đây
     * vì cần luồng hoàn tiền riêng.
     */
    public BookingResponse adminCancel(UUID id, String reason) {
        String note = reason == null || reason.isBlank() ? "ADMIN_CANCELLED" : "ADMIN_CANCELLED: " + reason.trim();
        TransitionResult result = persistence.cancel(id, null, note.length() > 255 ? note.substring(0, 255) : note);
        safeRelease(result, result.booking().getUserId());
        return response(result.booking());
    }

    private BookingResponse response(Booking booking) {
        return BookingResponse.from(booking, persistence.getSeats(booking.getId()));
    }

    private List<UUID> normalizeSeats(List<UUID> seats) {
        if (seats == null || seats.isEmpty() || seats.size() > maxSeats) {
            throw new BadRequestException("Số ghế phải từ 1 đến " + maxSeats);
        }
        List<UUID> result = seats.stream().sorted(Comparator.comparing(UUID::toString)).toList();
        if (new HashSet<>(result).size() != result.size()) throw new BadRequestException("Danh sách ghế bị trùng");
        return result;
    }

    private BigDecimal priceOf(TheaterSeatDto seat, TheaterShowtimeDto showtime) {
        return switch (seat.seatType()) {
            case "VIP" -> showtime.priceVip();
            case "COUPLE" -> showtime.priceCouple();
            default -> showtime.priceStandard();
        };
    }

    private void safeRelease(Booking booking) {
        safeRelease(booking.getShowtimeId(), persistence.getSeats(booking.getId()).stream().map(s -> s.getSeatId()).toList(), booking.getRequestId(), booking.getUserId());
    }
    private void safeRelease(TransitionResult result, UUID userId) {
        safeRelease(result.booking().getShowtimeId(), result.seatIds(), result.booking().getRequestId(), userId);
    }
    private void safeRelease(PaymentConfirmationResult result, UUID userId) {
        if (result.seatIds().isEmpty()) return;
        safeRelease(result.booking().getShowtimeId(), result.seatIds(), result.booking().getRequestId(), userId);
    }
    private void safeRelease(UUID showtimeId, List<UUID> seatIds, UUID requestId, UUID userId) {
        try { seatHolds.release(showtimeId, seatIds, requestId, userId); }
        catch (RuntimeException ex) { log.warn("Redis release failed for booking request {}", requestId, ex); metrics.increment("booking.redis.release_failure"); }
    }

    static String hash(UUID userId, UUID showtimeId, List<UUID> seatIds) {
        String canonical = userId + "|" + showtimeId + "|" + seatIds.stream().map(UUID::toString).sorted().reduce((a,b) -> a + "," + b).orElse("");
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8));
            StringBuilder out = new StringBuilder(64);
            for (byte b : digest) out.append(String.format("%02x", b));
            return out.toString();
        } catch (NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); }
    }

    private String constraintName(Throwable error) {
        Throwable current = error;
        while (current != null) {
            if (current instanceof PSQLException psql) {
                return psql.getServerErrorMessage() == null ? null : psql.getServerErrorMessage().getConstraint();
            }
            current = current.getCause();
        }
        return null;
    }

    private BookingSnapshot snapshot(TheaterShowtimeDto showtime) {
        var movie = movies.findMovie(showtime.movieId());
        return new BookingSnapshot(movie.map(MovieSummaryDto::title).orElse(null),
            movie.map(MovieSummaryDto::posterUrl).orElse(null), showtime.theaterName(), showtime.theaterCity(),
            showtime.auditoriumName(), showtime.startTime(), showtime.endTime());
    }
}
