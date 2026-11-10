package com.cinebook.booking.kafka;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Hợp đồng event giữa booking-service và payment-service.
 * schemaVersion 2: BookingConfirmed/BookingCancelled/BookingExpired có thêm {@link BookingDetails}
 * (null ở event v1) để consumer như notification-service hiển thị được mà không cần gọi REST.
 * File này được giữ GIỐNG HỆT ở booking, payment và notification — sửa một nơi thì sửa cả các nơi kia.
 *
 * payment.events : PaymentSucceeded, PaymentFailed, PaymentRefunded
 * booking.events : BookingConfirmed, BookingPaymentRejected, BookingCancelled, BookingExpired
 */
public final class KafkaEvents {
    private KafkaEvents() {}

    public static final String PAYMENT_SUCCEEDED = "PaymentSucceeded";
    public static final String PAYMENT_FAILED = "PaymentFailed";
    public static final String PAYMENT_REFUNDED = "PaymentRefunded";
    public static final String BOOKING_CONFIRMED = "BookingConfirmed";
    public static final String BOOKING_PAYMENT_REJECTED = "BookingPaymentRejected";
    public static final String BOOKING_CANCELLED = "BookingCancelled";
    public static final String BOOKING_EXPIRED = "BookingExpired";

    /** Tiền đã thu thành công, yêu cầu booking xác nhận. */
    public record PaymentSucceeded(UUID paymentId, UUID bookingId, UUID userId,
                                   BigDecimal amount, String currency) {}

    public record PaymentFailed(UUID paymentId, UUID bookingId, UUID userId,
                                String failureCode, String failureMessage) {}

    /** Compensation đã xong: payment bị booking từ chối và đã được hoàn tiền. */
    public record PaymentRefunded(UUID paymentId, UUID bookingId, UUID userId,
                                  BigDecimal amount, String currency, String reason) {}

    /** Thông tin hiển thị của booking, gắn kèm event booking từ schemaVersion 2. */
    public record BookingDetails(String bookingCode, UUID showtimeId, UUID movieId, UUID theaterId,
                                 List<String> seatLabels, BigDecimal totalAmount, String currency) {}

    /** paymentId = null khi booking được xác nhận bằng mock confirm (không qua payment-service). */
    public record BookingConfirmed(UUID bookingId, UUID userId, UUID paymentId,
                                   BigDecimal amount, String currency, BookingDetails details) {}

    /**
     * Booking không nhận được payment này (hết hạn, đã huỷ, đã trả bằng payment khác...).
     * Đóng vai trò RefundRequested trong Saga: payment-service sẽ hoàn tiền và phát PaymentRefunded.
     */
    public record BookingPaymentRejected(UUID bookingId, UUID userId, UUID paymentId,
                                         String reason, String message) {}

    public record BookingCancelled(UUID bookingId, UUID userId, String reason, BookingDetails details) {}

    public record BookingExpired(UUID bookingId, UUID userId, BookingDetails details) {}
}
