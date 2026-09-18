# Kế hoạch triển khai Milestone 1: Booking Service (CineBook) — Implementation Ready Draft

Tài liệu này mô tả phạm vi và thứ tự triển khai Milestone 1 cho **Booking Service**. Thiết kế dùng PostgreSQL làm nguồn dữ liệu cuối cùng, Redis để loại xung đột sớm, transaction cục bộ rõ ràng và test cạnh tranh để kiểm chứng khả năng chống double-booking.

---

## 🔑 Nguyên tắc Cốt lõi

| # | Nguyên tắc |
| :-- | :--- |
| 1 | **PostgreSQL là Nguồn Sự Thật Duy Nhất** cho trạng thái ghế và chốt chặn dữ liệu cuối cùng. |
| 2 | **Redis là Mutex Tốc độ cao** cho write-path — loại xung đột từ sớm ở tầng bộ nhớ, không bao giờ dùng `KEYS`/`SCAN`. |
| 3 | **Read-path không chạm Redis** — một query SQL lấy ghế đang HELD/SOLD rồi merge với seat layout từ theater-service/cache. |
| 4 | **Phân tách ranh giới Transaction & Compensation** — outer service không `@Transactional` điều phối compensation và gọi `BookingPersistenceService` có `@Transactional`. |
| 5 | **Scheduler là housekeeping, không phải correctness** — ghế trống về mặt logic ngay tại `expires_at`, không đợi scheduler. |
| 6 | **Idempotency có điều phối** — tính hash trước khi check, dùng mutex ngắn hạn cho request đang xử lý và unique constraint trên `request_id` làm chốt chặn cuối. |
| 7 | **Đồng bộ Contract hệ thống** — sử dụng chuẩn `ApiError` thống nhất với `theater-service` và `movie-service`. |

---

## 📌 Phạm vi Milestone 1

1. Nhận `showtimeId` và danh sách `seatIds` từ client (kèm `X-User-Id` qua header).
2. Kiểm tra suất chiếu tồn tại và đang `SELLING` qua `TheaterServiceClient` (không cache status trên write-path).
3. Kiểm tra danh sách ghế thuộc đúng phòng chiếu và lấy bảng giá snapshot (cache layout ghế 60s).
4. Giữ đồng thời nhiều ghế bằng Redis Lua script nguyên tử (all-or-nothing), TTL 300s.
5. Tạo booking `PENDING_PAYMENT`, lưu vào PostgreSQL `booking_db`.
6. Chống double-booking bằng nhiều lớp: Redis Lua loại xung đột sớm, Composite Foreign Key và Partial Unique Index bảo vệ cuối tại PostgreSQL.
7. Hủy booking chủ động → `CANCELLED`; hết hạn → `EXPIRED`.
8. Xác nhận booking bằng Payment Mock (chỉ bật khi `booking.mock-payment-enabled=true`).
9. API sơ đồ ghế thời gian thực: `AVAILABLE`, `HELD_BY_ME`, `HELD`, `SOLD`.
10. Proxy Vite: `/api/bookings` → `localhost:8083`.
11. Observability: metrics đầy đủ Micrometer (`booking.compensation.count`, `booking.hold.*`, ...).

---

## 🏛️ Kiến trúc & Thiết kế Kỹ thuật Chi tiết

### 1. State Machine & Xử lý Hết hạn (Tách Transaction)

```
                              Payment thành công (Mock)
         ┌────────────────────────────────────────────────────> CONFIRMED
         │
PENDING_PAYMENT ──┬── Người dùng chủ động hủy ───────────────> CANCELLED
                  │
                  ├── Payment thất bại ────────────────────────> CANCELLED
                  │
                  └── expires_at < NOW() ──────────────────────> EXPIRED
```

**Xử lý `confirmBooking` và đơn hết hạn:**
```
BookingService (không có @Transactional)
    ↓
BookingPersistenceService.confirmOrExpire(bookingId, userId) (@Transactional)
    ├── Reload booking bằng PESSIMISTIC_WRITE
    ├── Kiểm tra ownership và status bên trong transaction
    ├── Lấy thời điểm hiện tại từ Clock sau khi đã lock row
    ├── Nếu hết hạn: booking = EXPIRED, toàn bộ ghế = RELEASED
    └── Nếu còn hạn: booking = CONFIRMED, toàn bộ ghế = SOLD
    ↓
Transaction commit và trả về ConfirmOutcome(CONFIRMED | EXPIRED, releaseCommand)
    ↓
BookingService nhả Redis theo requestId sau commit
    ↓
Nếu outcome = EXPIRED: ném BookingExpiredException (HTTP 410) ngoài transaction
```
> Mọi kiểm tra có tính quyết định (`ownership`, `status`, `expires_at`) phải được thực hiện lại trong transaction sau khi lock/reload entity. Không dùng kết quả kiểm tra trước transaction để quyết định state transition. Entity giữ `@Version` làm lớp bảo vệ bổ sung; optimistic/pessimistic conflict được map thành HTTP 409.

**Enums:**
- `BookingStatus`: `PENDING_PAYMENT`, `CONFIRMED`, `CANCELLED`, `EXPIRED`
- `BookingSeatStatus`: `HELD`, `SOLD`, `RELEASED`

---

### 2. Mô hình Dữ liệu PostgreSQL (`booking_db`)

#### Bảng `bookings` & Bảng `booking_seats` (Bổ sung Composite FK bảo vệ `showtime_id`)

```sql
-- 1. Bảng bookings
CREATE TABLE bookings (
    id              UUID            PRIMARY KEY,
    booking_code    VARCHAR(32)     NOT NULL,
    request_id      UUID            NOT NULL,
    request_hash    VARCHAR(64)     NOT NULL,   -- SHA-256(userId|showtimeId|sorted(seatIds))
    user_id         UUID            NOT NULL,
    showtime_id     UUID            NOT NULL,
    movie_id        UUID            NOT NULL,
    theater_id      UUID            NOT NULL,
    auditorium_id   UUID            NOT NULL,
    total_amount    NUMERIC(12, 2)  NOT NULL,
    status          VARCHAR(32)     NOT NULL,   -- PENDING_PAYMENT | CONFIRMED | CANCELLED | EXPIRED
    expires_at      TIMESTAMPTZ     NOT NULL,
    confirmed_at    TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    cancel_reason   VARCHAR(255),
    version         BIGINT          NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_bookings_code UNIQUE (booking_code),
    CONSTRAINT uq_bookings_request_id UNIQUE (request_id),
    CONSTRAINT uq_bookings_id_showtime UNIQUE (id, showtime_id),
    CONSTRAINT ck_bookings_total_amount CHECK (total_amount >= 0),
    CONSTRAINT ck_bookings_status CHECK (
        status IN ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED')
    ),
    CONSTRAINT ck_bookings_expiry CHECK (expires_at > created_at)
);

-- 2. Bảng booking_seats
CREATE TABLE booking_seats (
    id              UUID            PRIMARY KEY,
    booking_id      UUID            NOT NULL,
    showtime_id     UUID            NOT NULL,
    seat_id         UUID            NOT NULL,
    row_label       VARCHAR(10)     NOT NULL,
    seat_number     INTEGER         NOT NULL,
    seat_type       VARCHAR(20)     NOT NULL,   -- STANDARD | VIP | COUPLE
    price           NUMERIC(12, 2)  NOT NULL,
    status          VARCHAR(20)     NOT NULL,   -- HELD | SOLD | RELEASED
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_booking_seats_booking_seat UNIQUE (booking_id, seat_id),
    CONSTRAINT ck_booking_seats_number CHECK (seat_number > 0),
    CONSTRAINT ck_booking_seats_price CHECK (price >= 0),
    CONSTRAINT ck_booking_seats_type CHECK (
        seat_type IN ('STANDARD', 'VIP', 'COUPLE')
    ),
    CONSTRAINT ck_booking_seats_status CHECK (
        status IN ('HELD', 'SOLD', 'RELEASED')
    ),
    CONSTRAINT fk_booking_seats_booking_showtime 
        FOREIGN KEY (booking_id, showtime_id) 
        REFERENCES bookings(id, showtime_id) 
        ON DELETE RESTRICT
);
```

> **Khắc phục lỗi P1:**
> - Thêm composite unique constraint `uq_bookings_id_showtime` trên `bookings(id, showtime_id)`.
> - Thêm composite foreign key `fk_booking_seats_booking_showtime` ngăn chặn tuyệt đối trường hợp lệch `showtime_id` giữa booking và booking_seats.
> - Đổi `ON DELETE CASCADE` thành `ON DELETE RESTRICT` để bảo vệ lịch sử giao dịch.
> - Đặt tên tường minh cho unique/check constraint để application phân loại chính xác lỗi PostgreSQL mà không parse message tự do.

#### Sequence & Indexes

```sql
-- Sequence sinh booking_code
CREATE SEQUENCE booking_code_seq START WITH 1 INCREMENT BY 1 NO CYCLE;

-- Partial Unique Index chặn double-booking ở tầng DB
CREATE UNIQUE INDEX uq_booking_seats_showtime_seat_active
    ON booking_seats (showtime_id, seat_id)
    WHERE status IN ('HELD', 'SOLD');

-- Index phục vụ read-path seat map
CREATE INDEX idx_booking_seats_showtime_active
    ON booking_seats (showtime_id)
    WHERE status IN ('HELD', 'SOLD');

-- Index phục vụ scheduler quét đơn hết hạn (không đưa status vào vì đã là hằng số ở WHERE)
CREATE INDEX idx_bookings_pending_expires
    ON bookings (expires_at)
    WHERE status = 'PENDING_PAYMENT';

-- Bảng ShedLock
CREATE TABLE shedlock (
    name        VARCHAR(64)  NOT NULL,
    lock_until  TIMESTAMPTZ  NOT NULL,
    locked_at   TIMESTAMPTZ  NOT NULL,
    locked_by   VARCHAR(255) NOT NULL,
    PRIMARY KEY (name)
);
```

---

### 3. Redis Lua Scripts

**Seat-hold key:** `hold:{showtimeId}:seatId` (Redis Cluster Hash Tag `{showtimeId}` bắt buộc).  
**Seat-hold value:** `{requestId}:{userId}` | **TTL:** 300s

**Idempotency mutex key:** `idem:{requestId}`  
**Idempotency mutex value:** `{requestHash}:{executionToken}` | **TTL:** 30s

**Idempotency fingerprint key:** `idemhash:{requestId}`  
**Idempotency fingerprint value:** `{requestHash}` | **TTL:** 600s; không xóa khi request kết thúc để ngăn tái sử dụng cùng key với payload khác trong thời gian seat hold còn tồn tại.

- `hold_seats.lua`: All-or-Nothing, idempotent với chính `requestId`; retry sau khi process bị crash có thể tiếp tục sử dụng hold cũ.
- `release_seats.lua`: Chỉ xóa key có value bắt đầu bằng đúng `{requestId}:`, trả về số key thực tế đã xóa.
- `release_idempotency_mutex.lua`: Chỉ xóa `idem:{requestId}` nếu `executionToken` khớp để process cũ không xóa lock của process mới.
- Trước khi claim mutex, dùng `SET idemhash:{requestId} requestHash NX EX 600`; nếu key đã tồn tại thì bắt buộc hash phải khớp.
- Khi mutex idempotency đã tồn tại:
  - `requestHash` khác: trả `422 IDEMPOTENCY_CONFLICT`.
  - `requestHash` giống nhưng booking chưa commit: trả `409 IDEMPOTENCY_IN_PROGRESS` và header `Retry-After: 1`.
  - Client retry sau đó sẽ đi qua DB fast-path và nhận cùng booking đã tạo.

---

### 4. Write-Path & Quy trình Idempotency Chuẩn xác

```
Client Request (Header: X-User-Id, Idempotency-Key)
    │
    ▼
BookingController (Validate @RequestHeader UUID userId)
    │
    ▼
BookingService (KHÔNG có @Transactional)
    │
    ├── 1. Validate & Dedupe seatIds (LinkedHashSet, size trong [1, 8])
    │      Sort seatIds theo thứ tự tự nhiên (UUID String)
    │
    ├── 2. Tính request_hash = SHA-256(userId + "|" + showtimeId + "|" + sortedSeatIds)
    │
    ├── 3. Fast-path check: findByRequestId(idempotencyKey)
    │      ├── Tìm thấy VÀ request_hash KHỚP ➔ Trả HTTP 200 kèm booking hiện có
    │      ├── Tìm thấy VÀ request_hash LỆCH ➔ Ném IdempotencyConflictException (HTTP 422)
    │      └── Chưa có ➔ Tiếp tục bước 4
    │
    ├── 4. Verify/Create fingerprint `idemhash:{requestId}`:
    │      ├── Hash lệch ➔ HTTP 422
    │      └── Hash khớp hoặc tạo mới thành công ➔ tiếp tục
    │
    ├── 5. Claim idempotency mutex `idem:{requestId}` bằng SET NX EX 30:
    │      ├── Lock tồn tại, hash lệch ➔ HTTP 422
    │      ├── Lock tồn tại, hash khớp ➔ HTTP 409 IDEMPOTENCY_IN_PROGRESS
    │      └── Claim thành công ➔ lưu executionToken và tiếp tục
    │
    ├── 6. Gọi TheaterServiceClient (KHÔNG cache showtime status trên write-path):
    │      Kiểm tra showtime.status == 'SELLING', xác nhận seats thuộc auditorium, snapshot giá
    │
    ├── 7. Redis Seat Mutex: tryHold(showtimeId, seatIds, requestId, userId)
    │      └── Nếu false ➔ Ném SeatAlreadyHeldException (HTTP 409)
    │
    ├── 8. try {
    │          BookingPersistenceService.persistBooking(...) [@Transactional REQUIRES_NEW]
    │          - In-Flight Reclaim: lock booking hết hạn đang giữ seat được chọn
    │          - Chuyển booking cũ sang EXPIRED và TẤT CẢ ghế của booking đó sang RELEASED
    │          - INSERT bookings
    │          - INSERT booking_seats
    │          - flush() tường minh
    │      } catch (DataIntegrityViolationException dive) {
    │          // Phân loại race condition:
    │          - Nếu vi phạm uq_bookings_request_id:
    │            + Query lại findByRequestId(idempotencyKey)
    │            + Khớp hash ➔ KHÔNG nhả seat hold của winner; trả 200
    │            + Lệch hash ➔ KHÔNG nhả seat hold của winner; ném 422
    │          - Nếu vi phạm uq_booking_seats_showtime_seat_active:
    │            ➔ Nhả seat hold thuộc request hiện tại, ném HTTP 409
    │          - Lỗi khác ➔ Nhả seat hold nếu booking chưa commit, ném lại exception
    │      } catch (RuntimeException ex) {
    │          // Mọi persistence failure đều phải compensation
    │          release seat hold nếu booking chưa commit
    │          ném lại exception gốc; lỗi release chỉ được log/metric, không che exception gốc
    │      } finally {
    │          release idempotency mutex nếu executionToken khớp
    │      }
    │
    └── 9. Sau khi DB commit: nhả idempotency mutex, giữ seat-hold đến confirm/cancel/expiry;
           trả HTTP 201 Created kèm BookingResponse
```

> `Idempotency-Key` bắt buộc là UUID. Constraint name được lấy từ `PSQLException.getServerErrorMessage().getConstraint()`, không phân loại lỗi bằng cách tìm chuỗi trong message. Nếu service chết giữa bước giữ Redis và persist DB, idempotency mutex hết hạn sau 30s; retry cùng `requestId` được Lua coi là cùng chủ và tiếp tục xử lý. Seat hold mồ côi tự hết hạn sau 300s.

**Quy tắc cleanup sau khi claim idempotency mutex:**

- Toàn bộ bước gọi theater-service, giữ ghế và persist DB phải nằm trong một khối `try/finally`; `finally` luôn gọi `releaseIdempotencyMutex(requestId, executionToken)`.
- Chỉ compensation seat hold khi hold đã được tạo nhưng booking **chưa commit**. Theo dõi rõ `seatHoldAcquired` và `bookingCommitted` trong orchestration.
- Lỗi trước khi giữ ghế chỉ cần nhả idempotency mutex.
- Lỗi persistence làm transaction rollback thì nhả seat hold và mutex.
- Sau khi booking commit, không nhả seat hold vì response mapping/network lỗi; hold phải tồn tại đến confirm/cancel/expiry.
- Trường hợp unique `uq_bookings_request_id` tìm thấy winner cùng hash cũng không nhả seat hold, vì hold đó thuộc booking winner có cùng `requestId`.

---

### 5. Cơ chế "Xóa Redis Sau Commit" An toàn

Để đảm bảo tuyệt đối không xóa key Redis khi DB chưa commit:
- `confirmBooking` & `cancelBooking` được điều phối bởi `BookingService` (không transaction).
- Trước mock confirm, `BookingService` gọi trực tiếp theater-service (không dùng cache) để kiểm tra showtime vẫn `SELLING`; không đặt HTTP call bên trong transaction DB.
- Nếu showtime không còn `SELLING`, persistence service chuyển booking sang `CANCELLED` với reason `SHOWTIME_NOT_SELLING`, release toàn bộ ghế; outer service nhả Redis rồi trả HTTP 409.
- `BookingService` gọi `BookingPersistenceService` thực thi logic DB bên trong `@Transactional`.
- **Chỉ khi persistence method trả về thành công** (transaction đã commit hoàn tất vào PostgreSQL), `BookingService` mới gọi `seatHoldService.release(...)`.
- Lệnh release dùng `booking.requestId` làm owner token, không dùng booking ID hoặc user ID đơn lẻ.
- Nếu lệnh xóa Redis gặp sự cố mạng: Ghi log `ERROR`, tăng metric `booking.redis.release_failure`. TTL 300s của Redis sẽ tự động hết hạn, đảm bảo không ảnh hưởng đến tính đúng đắn của DB.

> Milestone 1 chỉ có kiểm tra đồng bộ best-effort giữa theater và booking. Race khi showtime bị hủy ngay sau lần kiểm tra sẽ được xử lý triệt để ở milestone Kafka bằng `ShowtimeCancelled` event và compensation.

**Kiểm soát Mock Payment Endpoint:**
- Endpoint `POST /api/bookings/{id}/confirm` chỉ được kích hoạt khi:
  `booking.mock-payment-enabled: true` (hoặc profile `local`/`dev`).
  Nếu cấu hình `false` (production) ➔ ném `MockPaymentDisabledException` (HTTP 403 Forbidden).

---

### 6. Expiration Housekeeping

`BookingExpirationService` chỉ dọn dữ liệu vật lý; logic availability vẫn dựa trên `expires_at` và không chờ scheduler.

- Outer scheduler không có transaction:
  - `@Scheduled(fixedDelayString = "${booking.expiration.fixed-delay-ms:30000}")`.
  - `@SchedulerLock(name = "expireBookings", lockAtMostFor = "5m", lockAtLeastFor = "5s")`.
- Mỗi vòng gọi `BookingPersistenceService.expireBatch(batchSize)`:
  - Transaction chọn tối đa 100 booking bằng `FOR UPDATE SKIP LOCKED`.
  - Điều kiện: `status = 'PENDING_PAYMENT' AND expires_at <= CURRENT_TIMESTAMP`.
  - Chuyển booking sang `EXPIRED` và toàn bộ ghế của các booking đó sang `RELEASED` trong cùng transaction.
  - Trả về danh sách `ReleaseCommand(showtimeId, seatIds, requestId)` sau khi commit.
- Outer scheduler chạy Redis release cho từng command. Lỗi Redis chỉ log/metric và không rollback DB; TTL là cơ chế phục hồi cuối.
- Metrics: `booking.expired.count`, `booking.expiration.batch.duration`, `booking.redis.release_failure`.

**In-Flight Reclaim trên write-path:** trước khi insert booking mới, persistence service lock các booking hết hạn đang giữ một trong các ghế được chọn, chuyển booking cha sang `EXPIRED` và **toàn bộ ghế** của booking đó sang `RELEASED`, sau đó mới insert. Targeted reclaim dùng row lock chờ hoàn tất, không dùng `SKIP LOCKED`, để tránh unique conflict giả do dòng hết hạn chưa được dọn.

---

### 7. Read-Path: Real-Time Seat Map (DB cho trạng thái, Theater cho layout)

`GET /api/bookings/showtimes/{showtimeId}/seats` (Header `X-User-Id` tùy chọn để map `HELD_BY_ME`)
- Một query SQL lấy các trạng thái booking đang có hiệu lực qua Partial Index và PK Join:
  ```sql
  SELECT
      bs.seat_id,
      bs.status   AS seat_status,
      b.user_id,
      b.expires_at
  FROM booking_seats bs
  JOIN bookings b ON b.id = bs.booking_id
  WHERE bs.showtime_id = :showtimeId
    AND (
        (bs.status = 'SOLD' AND b.status = 'CONFIRMED')
        OR (bs.status = 'HELD'
            AND b.status = 'PENDING_PAYMENT'
            AND b.expires_at > CURRENT_TIMESTAMP)
    );
  ```
- Lấy toàn bộ cấu trúc ghế từ theater-service/Caffeine Cache 60s (`theaterSeatMaps`), sau đó merge với kết quả SQL. Những ghế không xuất hiện trong SQL được map thành `AVAILABLE`.
- Map sang: `AVAILABLE`, `HELD_BY_ME` (kèm `remainingSeconds`), `HELD`, `SOLD`. Trả về kèm `serverTime` (ISO-8601).

---

### 8. Contract Lỗi Thống nhất Hệ sinh thái (`ApiError`)

Thay vì dùng `ProblemDetail`, Booking Service dùng đúng định dạng `ApiError` như `theater-service` và `movie-service`:

```java
public record ApiError(
    String code,
    String message,
    String traceId,
    Instant timestamp,
    String path
) {}
```

| Exception | HTTP Status | Error Code |
| :--- | :--- | :--- |
| `SeatAlreadyHeldException` | 409 Conflict | `SEAT_ALREADY_HELD` |
| `InvalidBookingStateException` | 409 Conflict | `INVALID_BOOKING_STATE` |
| `IdempotencyConflictException` | 422 Unprocessable Entity | `IDEMPOTENCY_CONFLICT` |
| `IdempotencyInProgressException` | 409 Conflict | `IDEMPOTENCY_IN_PROGRESS` |
| `BookingExpiredException` | 410 Gone | `BOOKING_EXPIRED` |
| `ShowtimeNotSellingException` | 409 Conflict | `SHOWTIME_NOT_SELLING` |
| `SeatNotFoundException` | 400 Bad Request | `SEAT_NOT_FOUND` |
| `BookingNotFoundException` | 404 Not Found | `BOOKING_NOT_FOUND` |
| `BookingAccessDeniedException` | 403 Forbidden | `FORBIDDEN_ACCESS` |
| `MockPaymentDisabledException` | 403 Forbidden | `MOCK_PAYMENT_DISABLED` |
| `TheaterServiceUnavailableException` | 503 Service Unavailable | `THEATER_SERVICE_UNAVAILABLE` |
| `RedisUnavailableException` | 503 Service Unavailable | `REDIS_UNAVAILABLE` |

---

### 9. User Identity & Forwarding Correlation ID

- Header bắt buộc: `X-User-Id: <uuid>`. Không nhận `userId` trong request body.
- Endpoints:
  - `POST /api/bookings/hold` (lấy `userId` từ `X-User-Id`)
  - `GET /api/bookings/me?page=0&pageSize=20` (phân trang, sort `createdAt DESC`; thay thế `/user/{userId}` để tránh lộ dữ liệu người khác)
  - `GET /api/bookings/{id}` (kiểm tra ownership: `booking.userId == headerUserId`)
  - `POST /api/bookings/{id}/cancel` (kiểm tra ownership)
  - `POST /api/bookings/{id}/confirm` (kiểm tra ownership)
- Controller không đọc header rải rác. Tạo abstraction `CurrentUserProvider`; Milestone 1 dùng `HeaderCurrentUserProvider` đọc `X-User-Id`, Milestone 2 thay implementation bằng JWT subject mà không đổi application service.
- `RestClientConfig`: Đăng ký `ClientHttpRequestInterceptor` tự động trích xuất `correlationId` từ SLF4J MDC và đính kèm vào header `X-Correlation-Id` khi gọi sang `theater-service`.

---

## ⚙️ Build Dependencies & Application Configuration

### Maven dependencies

- Giữ các starter hiện có: Web MVC, Validation, Data JPA, Flyway, Actuator và PostgreSQL driver.
- Thêm `spring-boot-starter-data-redis`, `spring-boot-starter-cache`, Caffeine và Apache Commons Pool 2 cho Lettuce pooling.
- Thêm ShedLock Spring và JDBC Template provider.
- Thêm Prometheus registry cho Micrometer.
- Test: Testcontainers PostgreSQL và Testcontainers core `GenericContainer` cho Redis.
- Bỏ Lombok và cấu hình annotation processor nếu implementation tiếp tục dùng Java record/constructor tường minh như movie-service và theater-service.
- Chưa thêm Kafka trong Milestone 1.

### Cấu hình bắt buộc

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      timeout: 2s
      lettuce:
        pool:
          max-active: 20
          max-idle: 10
          min-idle: 2

booking:
  hold-ttl-seconds: 300
  max-seats-per-booking: 8
  redis-required: true
  mock-payment-enabled: false
  idempotency:
    mutex-ttl-seconds: 30
    fingerprint-ttl-seconds: 600
  expiration:
    fixed-delay-ms: 30000
    batch-size: 100
  services:
    theater:
      url: ${THEATER_SERVICE_URL:http://localhost:8082}
      connect-timeout: 3s
      read-timeout: 5s
```

Quy tắc cache:

- Chỉ cache seat layout tĩnh trong 60 giây.
- Không cache showtime status trên hold/confirm write-path.
- Redis không khả dụng và `redis-required=true`: trả `503 REDIS_UNAVAILABLE`, không fallback âm thầm sang local lock.
- Profile `local` có thể override `booking.mock-payment-enabled=true`; giá trị mặc định và production luôn là `false`.

---

## 📋 Chi tiết Cấu trúc Packages & Files (`com.cinebook.booking`)

Toàn bộ code được đặt dưới package gốc: **`com.cinebook.booking`**.

```
backend/booking-service/booking/src/main/java/com/cinebook/booking/
├── BookingApplication.java
├── client/
│   ├── TheaterServiceClient.java
│   └── dto/
│       ├── TheaterShowtimeDto.java
│       ├── TheaterSeatMapDto.java
│       └── TheaterSeatDto.java
├── config/
│   ├── CacheConfig.java
│   ├── CorrelationIdFilter.java
│   ├── CorsConfig.java
│   ├── RedisConfig.java
│   ├── RestClientConfig.java
│   └── SchedulerConfig.java
├── controller/
│   ├── BookingController.java
│   ├── SeatAvailabilityController.java
│   └── dto/
│       ├── CreateBookingRequest.java
│       ├── BookingResponse.java
│       ├── SeatAvailabilityResponse.java
│       └── SeatStatusDto.java
├── domain/
│   ├── entity/
│   │   ├── Booking.java
│   │   └── BookingSeat.java
│   └── enums/
│       ├── BookingStatus.java
│       ├── BookingSeatStatus.java
│       └── ConfirmOutcome.java
├── exception/
│   ├── ApiError.java
│   ├── GlobalExceptionHandler.java
│   └── [Các Domain Exception]
├── metrics/
│   └── BookingMetrics.java
├── security/
│   ├── CurrentUserProvider.java
│   └── HeaderCurrentUserProvider.java
├── repository/
│   ├── BookingRepository.java
│   ├── BookingSeatRepository.java
│   ├── RedisSeatHoldRepository.java
│   └── RedisIdempotencyRepository.java
└── service/
    ├── BookingService.java
    ├── BookingPersistenceService.java
    ├── BookingExpirationService.java
    ├── IdempotencyService.java
    ├── SeatHoldService.java
    └── SeatAvailabilityService.java
```

```text
backend/booking-service/booking/src/main/resources/
├── application.yaml
├── db/migration/
│   └── V1__init_booking_schema.sql
└── lua/
    ├── hold_seats.lua
    ├── release_seats.lua
    └── release_idempotency_mutex.lua
```

---

## 🚧 Thứ tự Triển khai

1. **Foundation**: cập nhật Maven, bỏ Lombok dư thừa, hoàn thiện `application.yaml`, correlation filter, CORS, RestClient, Redis/Cache/Scheduler config.
2. **Database**: viết Flyway V1, chạy migration trên PostgreSQL sạch và kiểm tra toàn bộ constraint/index bằng integration test.
3. **Domain**: triển khai `Booking`, `BookingSeat`, state transition, ownership và `Clock` injectable để test expiry ổn định.
4. **Theater client**: map đúng contract hiện tại của `GET /api/showtimes/{id}` và `/seats`; timeout/error mapping/correlation forwarding.
5. **Redis primitives**: hoàn thiện Lua hold/release, idempotency fingerprint/mutex và test trực tiếp với Redis container.
6. **Persistence use cases**: persist booking, targeted reclaim, confirm-or-expire, cancel và expiration batch; mọi invariant được recheck trong transaction.
7. **Application orchestration**: ghép idempotency → theater validation → seat hold → DB commit → compensation/cleanup.
8. **Read/API layer**: booking endpoints, `/me`, seat availability merge, `ApiError`, ownership và mock-payment feature flag.
9. **Housekeeping & observability**: scheduler, ShedLock, metrics và health indicators.
10. **Verification**: unit, integration, concurrency, manual flow; sau khi toàn bộ DoD pass mới cập nhật `backend/docs/api.md` và nối frontend proxy.

Mỗi bước phải build/test xanh trước khi sang bước tiếp theo; không triển khai Kafka, payment-service thật hoặc Saga trong Milestone 1.

---

## 🧪 Kế hoạch Kiểm thử & Definition of Done

1. **Unit Tests**:
   - Chuyển trạng thái state machine (`BookingTest`), kiểm tra logic `confirm`, `cancel`, `expire`.
   - Tính toán `request_hash` (sorted seatIds).
   - Validate input: giới hạn [1, 8] ghế, dedupe.
   - Phân loại PostgreSQL constraint theo constraint name.
   - `safeRelease` không che mất persistence exception gốc khi Redis release cũng lỗi.

2. **Integration Tests (PostgreSQL + Redis Testcontainers)**:
   - **Lua Script Tests**: All-or-nothing (1 ghế bị khóa -> toàn bộ fail, 0 key mồ côi), Idempotent với chính chủ, Safe release.
   - **Idempotency Mutex Tests**: cùng key/cùng hash trả `IDEMPOTENCY_IN_PROGRESS`; cùng key/khác hash trả 422; unlock sai execution token không xóa mutex.
   - **Compensation Tests**: `DataIntegrityViolationException`, database timeout và RuntimeException đều nhả seat hold/mutex; lỗi Redis release không che exception gốc.
   - **Self-Healing on Confirm**: Đơn quá hạn bấm confirm -> tự đổi `EXPIRED` trong DB, trả 410.
   - **Transactional Recheck**: confirm/cancel/expiration chạy cạnh tranh nhưng chỉ một state transition commit thành công.
   - **In-Flight Reclaim**: Đơn quá hạn không chạy scheduler -> khách mới đặt lại ghế đó thành công 201.
   - **Composite FK Test**: Cố tình insert booking_seat với showtime_id khác booking -> DB ném FK violation.
   - **Database Check Tests**: enum status sai, giá âm và `expires_at <= created_at` đều bị PostgreSQL từ chối.
   - **Expiration Batch Test**: `FOR UPDATE SKIP LOCKED` dọn đúng batch, cập nhật booking và toàn bộ ghế trước khi release Redis.

3. **Concurrency Stress Test (Definition of Done)**:
   - **50 luồng đồng thời tranh giữ 1 ghế**:
     - Đúng 1 request nhận HTTP 201.
     - 49 requests nhận HTTP 409.
     - Đúng 1 dòng `HELD` trong DB.
     - Đúng 1 key Redis tồn tại.
     - `booking.compensation.count` = 0.
   - **25 cặp cụm ghế chồng lấn `[A1, A2]` vs `[A2, A3]`**:
     - Không sinh zombie key cho ghế A3 khi nhánh 2 thất bại.
   - **50 luồng cùng gửi 1 Idempotency-Key**:
     - Đúng 1 request nhận 201 và đúng 1 booking trong DB.
     - Request trùng đang chạy nhận `409 IDEMPOTENCY_IN_PROGRESS`, không nhận `SEAT_ALREADY_HELD`.
     - Sau khi winner commit, retry tất cả request trùng trả 200 và cùng một `bookingId`.
     - Cùng `Idempotency-Key` nhưng payload khác luôn trả 422.

4. **Manual Verification**:
   - Chạy PostgreSQL booking, Redis và theater-service; health booking-service phải `UP`.
   - Kiểm tra chuỗi Hold → Seat Availability → Confirm/Cancel → release ghế.
   - Chờ quá TTL mà không chạy scheduler trước; request mới vẫn reclaim được ghế.
   - Tắt Redis khi `redis-required=true`; hold trả 503 và DB không có booking dở dang.
   - Xác nhận `X-Correlation-Id` được giữ nguyên từ frontend → booking-service → theater-service.
