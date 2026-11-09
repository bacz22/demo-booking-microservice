package com.cinebook.booking.kafka.consumer;

import com.cinebook.booking.client.TheaterServiceClient;
import com.cinebook.booking.domain.entity.Booking;
import com.cinebook.booking.domain.enums.BookingStatus;
import com.cinebook.booking.exception.BookingAccessDeniedException;
import com.cinebook.booking.exception.BookingNotFoundException;
import com.cinebook.booking.exception.ShowtimeNotFoundException;
import com.cinebook.booking.kafka.EventEnvelope;
import com.cinebook.booking.kafka.KafkaEvents;
import com.cinebook.booking.repository.ProcessedEventRepository;
import com.cinebook.booking.repository.RedisSeatHoldRepository;
import com.cinebook.booking.service.BookingPersistenceService;
import com.cinebook.booking.service.PaymentConfirmationCommand;
import com.cinebook.booking.service.PaymentConfirmationResult;
import com.cinebook.booking.service.TransitionResult;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.UUID;

/**
 * Nghe payment.events.
 * PaymentSucceeded → xác nhận booking, trả lời BookingConfirmed hoặc BookingPaymentRejected qua outbox.
 * Gọi theater-service nằm NGOÀI transaction; theater down → ném lỗi để error handler retry rồi vào DLT.
 * Giải phóng ghế trên Redis chỉ làm SAU khi transaction commit.
 */
@Component
public class PaymentEventsConsumer {
    private static final Logger log = LoggerFactory.getLogger(PaymentEventsConsumer.class);
    private static final String CONSUMER_NAME = "booking-payment-events-v1";

    private final JsonMapper mapper;
    private final ProcessedEventRepository processedEvents;
    private final BookingPersistenceService persistence;
    private final TheaterServiceClient theater;
    private final RedisSeatHoldRepository seatHolds;
    private final TransactionTemplate tx;

    public PaymentEventsConsumer(JsonMapper mapper, ProcessedEventRepository processedEvents,
                                 BookingPersistenceService persistence, TheaterServiceClient theater,
                                 RedisSeatHoldRepository seatHolds, TransactionTemplate tx) {
        this.mapper = mapper;
        this.processedEvents = processedEvents;
        this.persistence = persistence;
        this.theater = theater;
        this.seatHolds = seatHolds;
        this.tx = tx;
    }

    /** Ghế cần trả về Redis sau commit (null = không cần). */
    private record Release(UUID showtimeId, List<UUID> seatIds, UUID requestId, UUID userId) {}

    @KafkaListener(topics = "${app.kafka.topics.payment-events:payment.events}")
    public void onMessage(ConsumerRecord<String, String> record) {
        EventEnvelope event = mapper.readValue(record.value(), EventEnvelope.class);
        if (event.eventId() == null || event.eventType() == null) {
            throw new IllegalArgumentException("Event thiếu eventId/eventType");
        }
        if (event.correlationId() != null) MDC.put("correlationId", event.correlationId());
        try {
            switch (event.eventType()) {
                case KafkaEvents.PAYMENT_SUCCEEDED ->
                    onPaymentSucceeded(event, mapper.treeToValue(event.payload(), KafkaEvents.PaymentSucceeded.class));
                case KafkaEvents.PAYMENT_FAILED ->
                    onPaymentFailed(event, mapper.treeToValue(event.payload(), KafkaEvents.PaymentFailed.class));
                case KafkaEvents.PAYMENT_REFUNDED -> {
                    var payload = mapper.treeToValue(event.payload(), KafkaEvents.PaymentRefunded.class);
                    log.info("PaymentRefunded received. bookingId={} paymentId={} reason={}",
                        payload.bookingId(), payload.paymentId(), payload.reason());
                }
                default -> log.debug("Ignore payment event type={} eventId={}", event.eventType(), event.eventId());
            }
        } finally {
            MDC.remove("correlationId");
        }
    }

    private void onPaymentSucceeded(EventEnvelope event, KafkaEvents.PaymentSucceeded p) {
        if (p.paymentId() == null || p.bookingId() == null || p.userId() == null || p.amount() == null) {
            throw new IllegalArgumentException("PaymentSucceeded thiếu dữ liệu bắt buộc");
        }

        // 1. Đọc booking + kiểm tra showtime ngoài transaction.
        Booking booking;
        try {
            booking = persistence.get(p.bookingId(), p.userId());
        } catch (BookingNotFoundException | BookingAccessDeniedException ex) {
            rejectOnly(event, p, "BOOKING_NOT_FOUND", "Không tìm thấy booking cho payment này");
            return;
        }
        boolean showtimeSelling = true;
        if (booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
            try {
                showtimeSelling = "SELLING".equalsIgnoreCase(theater.getShowtime(booking.getShowtimeId()).status());
            } catch (ShowtimeNotFoundException ex) {
                showtimeSelling = false;
            }
        }
        boolean dataMismatch = booking.getTotalAmount().compareTo(p.amount()) != 0
            || !"VND".equalsIgnoreCase(p.currency());
        final boolean selling = showtimeSelling;

        // 2. Transaction: đăng ký idempotency + đổi trạng thái + ghi outbox.
        Release release = tx.execute(status -> {
            if (!processedEvents.tryRegister(event.eventId(), CONSUMER_NAME, event.eventType(), p.bookingId())) {
                log.info("Duplicate PaymentSucceeded ignored. eventId={} bookingId={}", event.eventId(), p.bookingId());
                return null;
            }
            if (dataMismatch && booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
                persistence.emitPaymentRejected(p.bookingId(), p.userId(), p.paymentId(),
                    "PAYMENT_DATA_MISMATCH", "Amount/currency không khớp booking");
                return null;
            }
            if (!selling) {
                TransitionResult cancelled = persistence.cancel(p.bookingId(), p.userId(), "SHOWTIME_NOT_SELLING");
                persistence.emitPaymentRejected(p.bookingId(), p.userId(), p.paymentId(),
                    "SHOWTIME_NOT_SELLING", "Suất chiếu không còn mở bán");
                return toRelease(cancelled.booking(), cancelled.seatIds());
            }
            PaymentConfirmationResult result = persistence.confirmWithPayment(
                new PaymentConfirmationCommand(p.bookingId(), p.userId(), p.paymentId(), p.amount(), p.currency()));
            switch (result.outcome()) {
                case NEWLY_CONFIRMED -> { /* BookingConfirmed đã được ghi trong confirmWithPayment */ }
                case ALREADY_CONFIRMED_SAME_PAYMENT -> persistence.emitConfirmed(result.booking());
                case ALREADY_CONFIRMED_OTHER_PAYMENT -> persistence.emitPaymentRejected(p.bookingId(), p.userId(),
                    p.paymentId(), "BOOKING_ALREADY_PAID", "Booking đã gắn với payment khác");
                case NEWLY_EXPIRED, ALREADY_EXPIRED -> persistence.emitPaymentRejected(p.bookingId(), p.userId(),
                    p.paymentId(), "BOOKING_EXPIRED", "Booking đã hết hạn giữ ghế");
                case CANCELLED -> persistence.emitPaymentRejected(p.bookingId(), p.userId(),
                    p.paymentId(), "BOOKING_CANCELLED", "Booking đã bị huỷ");
            }
            log.info("PaymentSucceeded handled. bookingId={} paymentId={} outcome={}",
                p.bookingId(), p.paymentId(), result.outcome());
            return toRelease(result.booking(), result.seatIds());
        });

        // 3. Sau commit: trả ghế khỏi Redis hold (lỗi Redis không làm hỏng luồng).
        releaseQuietly(release);
    }

    /**
     * Thanh toán thất bại → huỷ booking ngay (PAYMENT_FAILED) và nhả ghế, không chờ hết hạn.
     * Mỗi booking chỉ có một payment nên user không thể thử lại trên booking này.
     * Booking không còn PENDING_PAYMENT (đã xác nhận/huỷ/hết hạn) → bỏ qua.
     */
    private void onPaymentFailed(EventEnvelope event, KafkaEvents.PaymentFailed p) {
        if (p.bookingId() == null || p.userId() == null) {
            throw new IllegalArgumentException("PaymentFailed thiếu bookingId/userId");
        }
        Release release = tx.execute(status -> {
            if (!processedEvents.tryRegister(event.eventId(), CONSUMER_NAME, event.eventType(), p.bookingId())) {
                log.info("Duplicate PaymentFailed ignored. eventId={} bookingId={}", event.eventId(), p.bookingId());
                return null;
            }
            Booking booking;
            try {
                booking = persistence.get(p.bookingId(), p.userId());
            } catch (BookingNotFoundException | BookingAccessDeniedException ex) {
                log.warn("PaymentFailed for unknown booking. bookingId={}", p.bookingId());
                return null;
            }
            if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
                log.info("PaymentFailed ignored, booking already {}. bookingId={}", booking.getStatus(), p.bookingId());
                return null;
            }
            TransitionResult cancelled = persistence.cancel(p.bookingId(), p.userId(), "PAYMENT_FAILED");
            log.info("Booking cancelled after PaymentFailed. bookingId={} paymentId={} code={}",
                p.bookingId(), p.paymentId(), p.failureCode());
            return toRelease(cancelled.booking(), cancelled.seatIds());
        });
        releaseQuietly(release);
    }

    private void releaseQuietly(Release release) {
        if (release == null) return;
        try {
            seatHolds.release(release.showtimeId(), release.seatIds(), release.requestId(), release.userId());
        } catch (RuntimeException ex) {
            log.warn("Redis release failed for booking request {}", release.requestId(), ex);
        }
    }

    private void rejectOnly(EventEnvelope event, KafkaEvents.PaymentSucceeded p, String reason, String message) {
        tx.executeWithoutResult(status -> {
            if (!processedEvents.tryRegister(event.eventId(), CONSUMER_NAME, event.eventType(), p.bookingId())) return;
            persistence.emitPaymentRejected(p.bookingId(), p.userId(), p.paymentId(), reason, message);
        });
    }

    private static Release toRelease(Booking booking, List<UUID> seatIds) {
        if (seatIds == null || seatIds.isEmpty()) return null;
        return new Release(booking.getShowtimeId(), seatIds, booking.getRequestId(), booking.getUserId());
    }
}
