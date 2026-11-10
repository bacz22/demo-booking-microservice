package com.cinebook.notification.service;

import com.cinebook.notification.domain.NotificationType;
import com.cinebook.notification.kafka.KafkaEvents;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;
import java.util.Map;

/** Dựng tiêu đề/nội dung thông báo tiếng Việt từ event. Không phụ thuộc Spring để dễ test. */
public final class NotificationComposer {
    private NotificationComposer() {}

    public record Message(NotificationType type, String title, String body) {}

    private static final Map<String, String> CANCEL_REASONS = Map.of(
        "PAYMENT_FAILED", "thanh toán không thành công",
        "USER_CANCELLED", "bạn đã huỷ đơn",
        "SHOWTIME_NOT_SELLING", "suất chiếu đã ngừng bán vé");

    private static final Map<String, String> REFUND_REASONS = Map.of(
        "BOOKING_EXPIRED", "đơn giữ vé đã hết hạn trước khi thanh toán được xác nhận",
        "BOOKING_CANCELLED", "đơn giữ vé đã bị huỷ",
        "SHOWTIME_NOT_SELLING", "suất chiếu đã ngừng bán vé",
        "BOOKING_ALREADY_PAID", "đơn vé đã được thanh toán bởi giao dịch khác",
        "PAYMENT_DATA_MISMATCH", "số tiền không khớp với đơn vé",
        "BOOKING_NOT_FOUND", "không tìm thấy đơn vé");

    public static Message confirmed(KafkaEvents.BookingConfirmed e) {
        var d = e.details();
        String body = d == null
            ? "Đơn vé của bạn đã được xác nhận."
            : "Đơn vé %s đã được xác nhận. Ghế: %s. Tổng tiền: %s.".formatted(
                d.bookingCode(), seats(d), money(d.totalAmount()));
        return new Message(NotificationType.BOOKING_CONFIRMED, "Đặt vé thành công", body);
    }

    public static Message cancelled(KafkaEvents.BookingCancelled e) {
        String reason = CANCEL_REASONS.getOrDefault(e.reason(), "đơn đã bị huỷ");
        return new Message(NotificationType.BOOKING_CANCELLED, "Đơn vé đã huỷ",
            "Đơn vé %s đã bị huỷ do %s. Ghế đã được giải phóng.".formatted(code(e.details()), reason));
    }

    public static Message expired(KafkaEvents.BookingExpired e) {
        return new Message(NotificationType.BOOKING_EXPIRED, "Hết thời gian giữ ghế",
            "Đơn vé %s đã hết thời gian giữ ghế và được huỷ tự động.".formatted(code(e.details())));
    }

    public static Message refunded(KafkaEvents.PaymentRefunded e) {
        String reason = REFUND_REASONS.getOrDefault(e.reason(), "đơn vé không thể xác nhận");
        return new Message(NotificationType.PAYMENT_REFUNDED, "Đã hoàn tiền",
            "Số tiền %s đã được hoàn lại do %s.".formatted(money(e.amount()), reason));
    }

    private static String code(KafkaEvents.BookingDetails d) {
        return d == null || d.bookingCode() == null ? "của bạn" : d.bookingCode();
    }

    private static String seats(KafkaEvents.BookingDetails d) {
        return d.seatLabels() == null || d.seatLabels().isEmpty() ? "—" : String.join(", ", d.seatLabels());
    }

    static String money(BigDecimal amount) {
        if (amount == null) return "—";
        return NumberFormat.getIntegerInstance(Locale.of("vi", "VN")).format(amount) + " ₫";
    }
}
