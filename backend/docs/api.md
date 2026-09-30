# CineBook API Documentation

Tài liệu đặc tả các giao diện lập trình ứng dụng (API Contract) của toàn bộ hệ thống CineBook Microservices.

---

## Danh Mục Dịch Vụ
1. [Movie Service (`:8081`)](#1-movie-service-port-8081)
2. [Theater Service (`:8082`)](#2-theater-service-port-8082)
3. [Booking Service (`:8083`)](#3-booking-service-port-8083)
4. [Payment Service (`:8084` - trước Kafka/Saga)](#4-payment-service-port-8084---trước-kafkasaga)

---

## 1. Movie Service (Port 8081)

### Public APIs
- `GET /api/movies`: Lấy danh sách phim phân trang, tìm kiếm, lọc theo thể loại và trạng thái (`now-showing`, `coming-soon`, `ended`).
- `GET /api/movies/{id}`: Chi tiết phim theo ID.
- `GET /api/genres`: Danh mục các thể loại phim.

### Admin APIs
- `POST /api/admin/movies`: Tạo phim mới.
- `PUT /api/admin/movies/{id}`: Cập nhật thông tin phim.
- `DELETE /api/admin/movies/{id}`: Xóa phim khỏi hệ thống.
- `POST /api/admin/media/upload`: Tải file ảnh/video trailer lên server lưu trữ.

---

## 2. Theater Service (Port 8082)

*Chi tiết kỹ thuật, cơ sở dữ liệu và thuật toán xem tại:* [`backend/docs/plan.md`](./plan.md)

### 2.0. Quy Chuẩn Chung & Headers
- Mọi request đều hỗ trợ header truy vết phân tán `X-Correlation-Id`. Nếu client không gửi, service sẽ tự động sinh UUID và trả về trong response header.
- Hỗ trợ CORS cho Frontend `http://localhost:5173`.
- Định dạng phản hồi lỗi chuẩn:
  ```json
  {
    "code": "SHOWTIME_OVERLAP",
    "message": "Phòng chiếu đã có suất chiếu trong khoảng thời gian này",
    "traceId": "c8b417e2-4751-419b-aef3-54f85e13cb09",
    "timestamp": "2026-09-16T14:20:00Z",
    "path": "/api/admin/showtimes"
  }
  ```

### 2.1. Cụm Rạp (Theaters)
| Phương Thức | Đường Dẫn | Quyền | Mô Tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/theaters` | Public | Lấy danh sách các cụm rạp hoạt động (Query param: `city`) |
| `GET` | `/api/theaters/{id}` | Public | Lấy chi tiết rạp kèm danh sách phòng chiếu và tổng số ghế |
| `GET` | `/api/admin/theaters` | Admin | Quản lý danh sách rạp phân trang (`city`, `status`, `search`, `page`, `pageSize`) |
| `POST` | `/api/admin/theaters` | Admin | Tạo cụm rạp mới (`201 Created`) |
| `GET` | `/api/admin/theaters/{id}` | Admin | Chi tiết cụm rạp |
| `PUT` | `/api/admin/theaters/{id}` | Admin | Cập nhật thông tin cụm rạp |
| `DELETE`| `/api/admin/theaters/{id}` | Admin | Ngừng hoạt động cụm rạp (soft delete sang `INACTIVE`; chặn nếu còn suất chiếu tương lai) |

#### Mẫu Request Tạo Cụm Rạp (`POST /api/admin/theaters`):
```json
{
  "name": "CineBook Landmark 81",
  "address": "Tầng B1, TTTM Vincom Landmark 81, 720A Điện Biên Phủ, P. 22, Bình Thạnh",
  "city": "Ho Chi Minh",
  "hotline": "1900 6017",
  "openingHours": "08:00 - 24:00",
  "features": ["IMAX Laser", "Dolby Atmos", "VIP Lounge"],
  "imageUrl": "https://images.unsplash.com/photo-landmark81.jpg",
  "status": "ACTIVE"
}
```

---

### 2.2. Phòng Chiếu (Auditoriums)
| Phương Thức | Đường Dẫn | Quyền | Mô Tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/theaters/{theaterId}/auditoriums` | Admin | Lấy danh sách phòng chiếu thuộc rạp (Query param: `status`) |
| `POST` | `/api/admin/theaters/{theaterId}/auditoriums` | Admin | Tạo phòng chiếu mới (`201 Created`, kiểm tra tên duy nhất trong rạp) |
| `GET` | `/api/admin/auditoriums/{id}` | Admin | Chi tiết phòng chiếu |
| `PUT` | `/api/admin/auditoriums/{id}` | Admin | Cập nhật thông tin phòng chiếu |
| `DELETE`| `/api/admin/auditoriums/{id}` | Admin | Ngừng hoạt động phòng chiếu (soft delete sang `INACTIVE`; chặn nếu còn suất chiếu tương lai) |

#### Mẫu Request Tạo Phòng Chiếu (`POST /api/admin/theaters/{theaterId}/auditoriums`):
```json
{
  "name": "Phòng 01 — IMAX Laser",
  "format": "IMAX_LASER",
  "status": "ACTIVE"
}
```
*Định dạng hỗ trợ (`format`)*: `2D`, `3D`, `IMAX_LASER`, `4DX`, `SCREENX`, `DOLBY_ATMOS`.

---

### 2.3. Sơ Đồ Ghế (Seats)
| Phương Thức | Đường Dẫn | Quyền | Mô Tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/auditoriums/{id}/seats/generate` | Admin | Sinh tự động sơ đồ ghế theo hàng cột và đồng bộ `total_seats` |
| `GET` | `/api/admin/auditoriums/{id}/seats` | Admin | Lấy cấu trúc sơ đồ ghế của phòng chiếu |
| `GET` | `/api/auditoriums/{id}/seats` | Public | Xem sơ đồ ghế của phòng chiếu |

#### Mẫu Request Sinh Sơ Đồ Ghế (`POST /api/admin/auditoriums/{id}/seats/generate`):
```json
{
  "rows": [
    { "label": "A", "seatCount": 10, "seatType": "STANDARD" },
    { "label": "B", "seatCount": 10, "seatType": "STANDARD" },
    { "label": "C", "seatCount": 10, "seatType": "VIP" },
    { "label": "D", "seatCount": 10, "seatType": "VIP" },
    { "label": "E", "seatCount": 8, "seatType": "COUPLE" }
  ]
}
```

---

### 2.4. Suất Chiếu (Showtimes)
| Phương Thức | Đường Dẫn | Quyền | Mô Tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/movies/{movieId}/showtimes` | Public | Lấy lịch chiếu theo phim (Gom nhóm theo cụm rạp; lọc theo `date`, `theaterId`, `city`) |
| `GET` | `/api/showtimes/{id}` | Public | Chi tiết 1 suất chiếu |
| `GET` | `/api/showtimes/{id}/seats` | Public | **Phục vụ màn hình chọn ghế**: Sơ đồ ghế thực tế kèm bảng giá vé theo loại ghế |
| `GET` | `/api/admin/showtimes` | Admin | Lọc danh sách suất chiếu phân trang (`theaterId`, `auditoriumId`, `movieId`, `status`, `date`) |
| `POST` | `/api/admin/showtimes` | Admin | Tạo suất chiếu (gọi movie-service lấy thời lượng, tính `endTime`, check chống trùng lịch) |
| `GET` | `/api/admin/showtimes/{id}` | Admin | Xem chi tiết suất chiếu |
| `PUT` | `/api/admin/showtimes/{id}` | Admin | Sửa thời gian, giá vé (chỉ áp dụng cho suất `SCHEDULED`) |
| `PATCH`| `/api/admin/showtimes/{id}/status` | Admin | Chuyển đổi trạng thái theo State Machine (`SCHEDULED` $\rightarrow$ `SELLING` $\rightarrow$ `ENDED` / `CANCELLED`) |
| `DELETE`| `/api/admin/showtimes/{id}` | Admin | Xóa suất chiếu (chặn xóa nếu đang `SELLING`) |

#### Mẫu Request Tạo Suất Chiếu (`POST /api/admin/showtimes`):
```json
{
  "auditoriumId": "b1b0c953-27e1-4c62-8418-5a676b7c9e02",
  "movieId": "20000000-0000-0000-0000-000000000001",
  "startTime": "2026-09-20T14:30:00Z",
  "cleaningDurationMin": 15,
  "priceStandard": 90000,
  "priceVip": 110000,
  "priceCouple": 180000
}
```

#### Mẫu Phản Hồi Sơ Đồ Ghế Suất Chiếu (`GET /api/showtimes/{id}/seats`):
```json
{
  "showtimeId": "f8c0d954-38f2-5d73-9529-6b787c8d0f03",
  "auditoriumId": "b1b0c953-27e1-4c62-8418-5a676b7c9e02",
  "auditoriumName": "Phòng 01 — IMAX Laser",
  "format": "IMAX_LASER",
  "prices": {
    "STANDARD": 90000,
    "VIP": 110000,
    "COUPLE": 180000
  },
  "totalSeats": 48,
  "seats": [
    {
      "id": "c1b0c953-27e1-4c62-8418-5a676b7c9e10",
      "auditoriumId": "b1b0c953-27e1-4c62-8418-5a676b7c9e02",
      "rowLabel": "A",
      "seatNumber": 1,
      "seatType": "STANDARD",
      "displayName": "A1"
    }
  ]
}
```

### 2.5. Giám Sát Sức Khỏe (Actuator)
- `GET /actuator/health`: Kiểm tra trạng thái dịch vụ (PostgreSQL connection, Flyway, disk space) $\rightarrow$ `{"status": "UP"}`.
- `GET /actuator/info`: Thông tin service.

---

## 3. Booking Service (Port 8083)

### Headers và quy ước
- `X-User-Id`: UUID bắt buộc trên các API booking của người dùng.
- `Idempotency-Key`: UUID bắt buộc khi tạo hold; gửi lại cùng payload sẽ trả về booking cũ.
- `X-Correlation-Id`: tùy chọn; booking-service tự sinh và forward sang theater-service nếu thiếu.
- State machine: `PENDING_PAYMENT` → `CONFIRMED` / `CANCELLED` / `EXPIRED`.

### Public APIs
| Phương thức | Đường dẫn | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/bookings/showtimes/{showtimeId}/seats` | Seat map realtime; hỗ trợ `AVAILABLE`, `HELD_BY_ME`, `HELD`, `SOLD`. |
| `POST` | `/api/bookings/hold` | Giữ 1–8 ghế, kiểm tra suất chiếu và snapshot giá; trả `201 Created`, replay cùng payload trả `200 OK`. |
| `GET` | `/api/bookings/{id}` | Xem booking của user hiện tại. |
| `GET` | `/api/bookings/me?page=0&pageSize=20` | Danh sách booking của user hiện tại. |
| `POST` | `/api/bookings/{id}/confirm` | Xác nhận mock payment legacy khi `BOOKING_MOCK_PAYMENT_ENABLED=true`. |
| `POST` | `/api/bookings/{id}/cancel` | Hủy booking đang `PENDING_PAYMENT` và release ghế. |

### Internal APIs dùng bởi payment-service

Các endpoint dưới đây bắt buộc `X-Service-Key: ${BOOKING_SERVICE_KEY}` và không expose cho client/browser.

| Phương thức | Đường dẫn | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/internal/bookings/{id}/payment-status?userId={userId}` | Đọc trạng thái, amount, currency hệ thống (`VND`) và payment hiện đã gắn. |
| `POST` | `/api/internal/bookings/{id}/confirm-payment` | Confirm idempotent bằng `paymentId`, `amount`, `currency`; server re-check row dưới lock. |

Header bổ sung cho confirm: `X-User-Id: <userId>`.

Mẫu request giữ ghế:
```json
{
  "showtimeId": "11111111-1111-1111-1111-111111111111",
  "seatIds": [
    "22222222-2222-2222-2222-222222222222"
  ]
}
```

Booking-service dùng Redis Lua để lock ghế nguyên tử và PostgreSQL partial unique index để chặn double-booking ở tầng cuối. Hết TTL, booking được coi là không còn hiệu lực ngay trên read/write path; scheduler chỉ làm housekeeping.

---

## 4. Payment Service (Port 8084 - trước Kafka/Saga)

Payment-service dùng PostgreSQL riêng tại `localhost:5436`, lưu payment và lịch sử `payment_attempts`. Giai đoạn này chỉ có mock provider; chưa thêm Kafka/Saga.

### Public APIs

| Phương thức | Đường dẫn | Mô tả |
| :--- | :--- | :--- |
| `POST` | `/api/payments` | Tạo payment từ booking đang `PENDING_PAYMENT`; bắt buộc `Idempotency-Key` là UUID. |
| `GET` | `/api/payments/{id}` | Xem payment của user hiện tại. |
| `GET` | `/api/payments/me?page=0&pageSize=20` | Danh sách payment của user hiện tại. |
| `POST` | `/api/payments/{id}/complete` | Hoàn tất mock payment với `success=true/false`; retry cùng request là idempotent. |
| `POST` | `/api/payments/{id}/retry` | Retry payment sau khi booking-service tạm thời unavailable. |

Tạo payment:
```json
{
  "bookingId": "11111111-1111-1111-1111-111111111111",
  "amount": 250000.00,
  "currency": "VND",
  "method": "MOCK"
}
```

Hoàn tất mock:
```json
{
  "success": true,
  "providerRef": "MOCK-001"
}
```

Payment claim dùng một câu `UPDATE ... WHERE ... RETURNING` atomic. Mỗi lần claim tạo một `payment_attempts`; stale worker không thể resolve payment vì các câu update cuối đều kiểm tra `processing_token` (fencing token). Reconciliation job dùng ShedLock và vẫn claim lại bằng cùng cơ chế atomic.
