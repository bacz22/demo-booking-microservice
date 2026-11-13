# Danh mục sự kiện Kafka

Tất cả message có **key = bookingId** (giữ thứ tự sự kiện của cùng một đơn trên một partition) và value là JSON **envelope**:

```json
{
  "eventId": "uuid",            // dùng để chống xử lý trùng (processed_events)
  "eventType": "PaymentSucceeded",
  "schemaVersion": 1,
  "aggregateId": "bookingId",
  "occurredAt": "2026-11-10T02:38:53Z",
  "correlationId": "...",       // nối log xuyên service
  "producer": "payment-service",
  "payload": { ... }
}
```

Header Kafka: `eventType`, `eventId`. Producer ghi vào bảng `outbox_events` trong cùng transaction nghiệp vụ; poller đẩy lên Kafka.
Hợp đồng được định nghĩa trong `kafka/KafkaEvents.java`, giữ giống nhau ở booking, payment và notification.

## Topic

| Topic | Producer | Consumer (group) |
|---|---|---|
| `payment.events` | payment-service | booking-service (`booking-service`), notification-service (`notification-service`) |
| `booking.events` | booking-service | payment-service (`payment-service`), notification-service (`notification-service`) |
| `payment.events.DLT`, `booking.events.DLT` | error handler của consumer | — (xem bằng Kafka UI) |

Lỗi dữ liệu (JSON hỏng, thiếu trường) → đẩy thẳng sang `<topic>.DLT`. Lỗi tạm thời → retry 3 lần, cách 1 s, rồi mới vào DLT.

## payment.events

| eventType | Khi nào | Payload | Ai xử lý |
|---|---|---|---|
| `PaymentSucceeded` | Cổng thanh toán báo thành công | `paymentId, bookingId, userId, amount, currency` | booking: xác nhận đơn → `BookingConfirmed`, hoặc từ chối → `BookingPaymentRejected` |
| `PaymentFailed` | Cổng thanh toán từ chối | `paymentId, bookingId, userId, failureCode, failureMessage` | booking: huỷ đơn (`PAYMENT_FAILED`), nhả ghế |
| `PaymentRefunded` | Đã hoàn tiền sau khi booking từ chối | `paymentId, bookingId, userId, amount, currency, reason` | notification: thông báo hoàn tiền |

## booking.events

| eventType | Khi nào | Payload | Ai xử lý |
|---|---|---|---|
| `BookingConfirmed` | Đơn được xác nhận sau thanh toán | `bookingId, userId, paymentId, amount, currency, details` | payment: payment → `SUCCEEDED`; notification: "Đặt vé thành công" |
| `BookingPaymentRejected` | Nhận tiền nhưng đơn không còn hợp lệ (hết hạn, đã huỷ, suất ngừng bán, sai số tiền, đã trả bằng payment khác) | `bookingId, userId, paymentId, reason, message` | payment: hoàn tiền (bù trừ) → `PaymentRefunded` |
| `BookingCancelled` | User/admin huỷ, thanh toán thất bại, suất chiếu ngừng bán | `bookingId, userId, reason, details` | notification |
| `BookingExpired` | Hết 5 phút giữ ghế chưa thanh toán | `bookingId, userId, details` | notification |

`details` (schemaVersion 2): `bookingCode, showtimeId, movieId, theaterId, seatLabels[], totalAmount, currency` — để consumer hiển thị mà không phải gọi REST. Event schemaVersion 1 không có `details` (null), consumer vẫn xử lý được.

## Trạng thái

- Booking: `PENDING_PAYMENT → CONFIRMED | CANCELLED | EXPIRED`
- Payment: `PENDING → PROCESSING → SUCCEEDED | FAILED | REFUNDED`
