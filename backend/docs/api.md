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

### 2.1. Cụm Rạp (Theaters)
| Phương Thức | Đường Dẫn | Quyền | Mô Tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/theaters` | Public | Lấy danh sách các cụm rạp (lọc theo `city`) |
| `GET` | `/api/theaters/{id}` | Public | Lấy chi tiết rạp và danh sách phòng chiếu |
| `GET` | `/api/admin/theaters` | Admin | Quản lý danh sách rạp (phân trang, tìm kiếm) |
| `POST` | `/api/admin/theaters` | Admin | Tạo cụm rạp mới |
| `GET` | `/api/admin/theaters/{id}` | Admin | Lấy thông tin chi tiết rạp phục vụ chỉnh sửa |
| `PUT` | `/api/admin/theaters/{id}` | Admin | Cập nhật thông tin cụm rạp |
| `DELETE`| `/api/admin/theaters/{id}` | Admin | Xóa cụm rạp (chỉ khi không có suất chiếu tương lai) |

### 2.2. Phòng Chiếu (Auditoriums)
| Phương Thức | Đường Dẫn | Quyền | Mô Tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/theaters/{theaterId}/auditoriums` | Admin | Lấy danh sách phòng chiếu thuộc rạp |
| `POST` | `/api/admin/theaters/{theaterId}/auditoriums` | Admin | Tạo phòng chiếu mới cho rạp |
| `GET` | `/api/admin/auditoriums/{id}` | Admin | Chi tiết phòng chiếu |
| `PUT` | `/api/admin/auditoriums/{id}` | Admin | Cập nhật thông tin phòng chiếu |
| `DELETE`| `/api/admin/auditoriums/{id}` | Admin | Xóa phòng chiếu |

### 2.3. Sơ Đồ Ghế (Seats)
| Phương Thức | Đường Dẫn | Quyền | Mô Tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/auditoriums/{id}/seats/generate` | Admin | Tự động sinh danh sách ghế theo số hàng và số ghế |
| `GET` | `/api/admin/auditoriums/{id}/seats` | Admin | Lấy cấu trúc ghế của phòng chiếu |
| `GET` | `/api/auditoriums/{id}/seats` | Public | Lấy sơ đồ ghế phòng chiếu |

### 2.4. Suất Chiếu (Showtimes)
| Phương Thức | Đường Dẫn | Quyền | Mô Tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/movies/{movieId}/showtimes` | Public | Lấy lịch chiếu theo phim (lọc theo `date`, `theaterId`, `city`) |
| `GET` | `/api/showtimes/{id}` | Public | Chi tiết suất chiếu |
| `GET` | `/api/showtimes/{id}/seats` | Public | Xem sơ đồ ghế và bảng giá ghế cho suất chiếu |
| `GET` | `/api/admin/showtimes` | Admin | Quản lý danh sách suất chiếu (lọc theo ngày, rạp, phim) |
| `POST` | `/api/admin/showtimes` | Admin | Tạo suất chiếu mới (gọi movie-service, check trùng lịch) |
| `GET` | `/api/admin/showtimes/{id}` | Admin | Xem chi tiết suất chiếu |
| `PUT` | `/api/admin/showtimes/{id}` | Admin | Cập nhật suất chiếu (thời gian, giá vé) |
| `PATCH`| `/api/admin/showtimes/{id}/status` | Admin | Đổi trạng thái (`SCHEDULED`, `SELLING`, `ENDED`, `CANCELLED`) |
| `DELETE`| `/api/admin/showtimes/{id}` | Admin | Hủy hoặc xóa suất chiếu |

---

## 3. Booking Service (Port 8083 - Roadmap)
- Quản lý State Machine vé: `PENDING_PAYMENT` $\rightarrow$ `CONFIRMED` / `CANCELLED`
- Giữ ghế tạm thời bằng Redis TTL (Seat Hold Lock)
- Tích hợp Saga thanh toán và hoàn vé
