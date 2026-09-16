# CineBook API Documentation

Tài liệu đặc tả các giao diện lập trình ứng dụng (API Contract) của toàn bộ hệ thống CineBook Microservices.

---

## Danh Mục Dịch Vụ
1. [Movie Service (`:8081`)](#1-movie-service-port-8081)
2. [Theater Service (`:8082`)](#2-theater-service-port-8082)
3. [Booking Service (`:8083` - Roadmap)](#3-booking-service-port-8083---roadmap)
4. [Payment Service (`:8084` - Roadmap)](#4-payment-service-port-8084---roadmap)

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

## 3. Booking Service (Port 8083 - Roadmap)
- Quản lý State Machine vé: `PENDING_PAYMENT` $\rightarrow$ `CONFIRMED` / `CANCELLED`
- Giữ ghế tạm thời bằng Redis TTL (Seat Hold Lock)
- Tích hợp Saga thanh toán và hoàn vé
- Tích hợp trực tiếp các endpoints `GET /api/showtimes/{id}` và `GET /api/showtimes/{id}/seats` từ `theater-service`.

---

## 4. Payment Service (Port 8084 - Roadmap)
- Xử lý cổng thanh toán (VNPAY, MoMo, ZaloPay, VietQR)
- Webhook nhận kết quả thanh toán bất đồng bộ
- Phát sinh sự kiện Kafka thông báo thanh toán thành công
