package com.cinebook.booking.service;

import com.cinebook.booking.domain.entity.Booking;
import com.cinebook.booking.domain.entity.BookingSeat;
import com.cinebook.booking.domain.enums.BookingSeatStatus;
import com.cinebook.booking.domain.enums.BookingStatus;
import com.cinebook.booking.domain.enums.ConfirmOutcome;
import com.cinebook.booking.exception.BookingAccessDeniedException;
import com.cinebook.booking.exception.BookingNotFoundException;
import com.cinebook.booking.exception.InvalidBookingStateException;
import com.cinebook.booking.exception.PaymentAmountMismatchException;
import com.cinebook.booking.exception.PaymentCurrencyMismatchException;
import com.cinebook.booking.repository.BookingRepository;
import com.cinebook.booking.repository.BookingSeatRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

@Service
public class BookingPersistenceService {
    private final BookingRepository bookings;
    private final BookingSeatRepository seats;
    private final Clock clock;

    public BookingPersistenceService(BookingRepository bookings, BookingSeatRepository seats, Clock clock) {
        this.bookings = bookings;
        this.seats = seats;
        this.clock = clock;
    }

    @Transactional
    public Booking create(PersistBookingCommand command) {
        Instant now = Instant.now(clock);
        List<UUID> selectedSeatIds = command.seats().stream().map(s -> s.id()).toList();
        List<UUID> reclaimIds = new ArrayList<>(new LinkedHashSet<>(
            seats.findExpiredBookingIdsForSeats(command.showtimeId(), selectedSeatIds)));
        for (UUID reclaimId : reclaimIds) {
            Booking old = bookings.findByIdForUpdate(reclaimId).orElse(null);
            if (old != null && old.getStatus() == BookingStatus.PENDING_PAYMENT && !old.getExpiresAt().isAfter(now)) {
                old.expire(now);
                bookings.save(old);
            }
        }
        if (!reclaimIds.isEmpty()) seats.updateStatusByBookingIds(reclaimIds, BookingSeatStatus.RELEASED, now);

        String code = "CB-" + String.format("%08d", bookings.nextBookingCodeSequence());
        Booking booking = new Booking(UUID.randomUUID(), code, command.requestId(), command.requestHash(),
            command.userId(), command.showtimeId(), command.movieId(), command.theaterId(), command.auditoriumId(),
            command.totalAmount(), command.expiresAt(), now);
        bookings.saveAndFlush(booking);
        List<BookingSeat> bookingSeats = new ArrayList<>();
        for (int i = 0; i < command.seats().size(); i++) {
            var seat = command.seats().get(i);
            bookingSeats.add(new BookingSeat(UUID.randomUUID(), booking.getId(), command.showtimeId(), seat.id(),
                seat.rowLabel(), seat.seatNumber(), seat.seatType(), command.prices().get(i), now));
        }
        seats.saveAllAndFlush(bookingSeats);
        return booking;
    }

    @Transactional(readOnly = true)
    public Booking get(UUID bookingId, UUID userId) {
        Booking booking = bookings.findById(bookingId).orElseThrow(BookingNotFoundException::new);
        checkOwner(booking, userId);
        return booking;
    }

    @Transactional(readOnly = true)
    public Booking findByRequestId(UUID requestId) { return bookings.findByRequestId(requestId).orElse(null); }

    @Transactional(readOnly = true)
    public List<BookingSeat> getSeats(UUID bookingId) { return seats.findByBookingIdOrderBySeatNumber(bookingId); }

    @Transactional(readOnly = true)
    public Page<Booking> findMine(UUID userId, Pageable pageable) { return bookings.findByUserIdOrderByCreatedAtDesc(userId, pageable); }

    @Transactional
    public TransitionResult confirmOrExpire(UUID bookingId, UUID userId) {
        Booking booking = bookings.findByIdForUpdate(bookingId).orElseThrow(BookingNotFoundException::new);
        checkOwner(booking, userId);
        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new InvalidBookingStateException("Booking hiện ở trạng thái " + booking.getStatus());
        }
        Instant now = Instant.now(clock);
        List<BookingSeat> bookingSeats = seats.findByBookingIdOrderBySeatNumber(bookingId);
        List<UUID> seatIds = bookingSeats.stream().map(BookingSeat::getSeatId).toList();
        if (!booking.getExpiresAt().isAfter(now)) {
            booking.expire(now);
            bookingSeats.forEach(s -> s.markReleased(now));
            bookings.save(booking);
            seats.saveAllAndFlush(bookingSeats);
            return new TransitionResult(booking, seatIds, ConfirmOutcome.EXPIRED);
        }
        booking.confirm(now);
        bookingSeats.forEach(s -> s.markSold(now));
        bookings.save(booking);
        seats.saveAllAndFlush(bookingSeats);
        return new TransitionResult(booking, seatIds, ConfirmOutcome.CONFIRMED);
    }

    @Transactional
    public PaymentConfirmationResult confirmWithPayment(PaymentConfirmationCommand command) {
        Booking booking = bookings.findByIdForUpdate(command.bookingId()).orElseThrow(BookingNotFoundException::new);
        checkOwner(booking, command.userId());
        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            PaymentConfirmationOutcome outcome = command.paymentId().equals(booking.getPaymentId())
                ? PaymentConfirmationOutcome.ALREADY_CONFIRMED_SAME_PAYMENT
                : PaymentConfirmationOutcome.ALREADY_CONFIRMED_OTHER_PAYMENT;
            return new PaymentConfirmationResult(booking, List.of(), outcome);
        }
        if (booking.getStatus() == BookingStatus.EXPIRED) {
            return new PaymentConfirmationResult(booking, List.of(), PaymentConfirmationOutcome.ALREADY_EXPIRED);
        }
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            return new PaymentConfirmationResult(booking, List.of(), PaymentConfirmationOutcome.CANCELLED);
        }
        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new InvalidBookingStateException("Booking hiện ở trạng thái " + booking.getStatus());
        }
        if (!"VND".equalsIgnoreCase(command.currency())) throw new PaymentCurrencyMismatchException();
        if (booking.getTotalAmount().compareTo(command.amount()) != 0) throw new PaymentAmountMismatchException();

        Instant now = Instant.now(clock);
        List<BookingSeat> bookingSeats = seats.findByBookingIdOrderBySeatNumber(command.bookingId());
        List<UUID> seatIds = bookingSeats.stream().map(BookingSeat::getSeatId).toList();
        if (!booking.getExpiresAt().isAfter(now)) {
            booking.expire(now);
            bookingSeats.forEach(s -> s.markReleased(now));
            bookings.save(booking);
            seats.saveAllAndFlush(bookingSeats);
            return new PaymentConfirmationResult(booking, seatIds, PaymentConfirmationOutcome.NEWLY_EXPIRED);
        }
        booking.confirm(command.paymentId(), now);
        bookingSeats.forEach(s -> s.markSold(now));
        bookings.save(booking);
        seats.saveAllAndFlush(bookingSeats);
        return new PaymentConfirmationResult(booking, seatIds, PaymentConfirmationOutcome.NEWLY_CONFIRMED);
    }

    @Transactional(readOnly = true)
    public BookingPaymentStatus paymentStatus(UUID bookingId, UUID userId) {
        Booking booking = bookings.findById(bookingId).orElseThrow(BookingNotFoundException::new);
        checkOwner(booking, userId);
        return BookingPaymentStatus.from(booking);
    }

    @Transactional
    public TransitionResult cancel(UUID bookingId, UUID userId, String reason) {
        Booking booking = bookings.findByIdForUpdate(bookingId).orElseThrow(BookingNotFoundException::new);
        checkOwner(booking, userId);
        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new InvalidBookingStateException("Booking hiện ở trạng thái " + booking.getStatus());
        }
        Instant now = Instant.now(clock);
        List<BookingSeat> bookingSeats = seats.findByBookingIdOrderBySeatNumber(bookingId);
        booking.cancel(reason, now);
        bookingSeats.forEach(s -> s.markReleased(now));
        bookings.save(booking);
        seats.saveAllAndFlush(bookingSeats);
        return new TransitionResult(booking, bookingSeats.stream().map(BookingSeat::getSeatId).toList(), ConfirmOutcome.EXPIRED);
    }

    @Transactional
    public List<ReleaseCommand> expireBatch(int batchSize) {
        Instant now = Instant.now(clock);
        List<ReleaseCommand> commands = new ArrayList<>();
        for (UUID id : bookings.findExpiredIdsForUpdate(batchSize)) {
            Booking booking = bookings.findById(id).orElse(null);
            if (booking == null || booking.getStatus() != BookingStatus.PENDING_PAYMENT || booking.getExpiresAt().isAfter(now)) continue;
            List<BookingSeat> bookingSeats = seats.findByBookingIdOrderBySeatNumber(id);
            booking.expire(now);
            bookingSeats.forEach(s -> s.markReleased(now));
            bookings.save(booking);
            seats.saveAll(bookingSeats);
            commands.add(new ReleaseCommand(booking.getShowtimeId(), bookingSeats.stream().map(BookingSeat::getSeatId).toList(), booking.getRequestId(), booking.getUserId()));
        }
        bookings.flush();
        seats.flush();
        return commands;
    }

    private void checkOwner(Booking booking, UUID userId) {
        if (!booking.getUserId().equals(userId)) throw new BookingAccessDeniedException();
    }
}
