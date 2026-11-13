# Kịch bản demo (~5 phút)

Chuẩn bị: `docker compose up -d --build`, đợi các service `healthy`. Mở http://localhost:3000.
Muốn xem Kafka: `docker compose --profile tools up -d kafka-ui` → http://localhost:8090.

## 1. Đặt vé thành công (1,5 phút)
1. Chọn một phim đang chiếu → chọn suất chiếu → hệ thống yêu cầu đăng nhập → dùng nút **Điền mẫu ngay** (`demo@cinebook.vn`).
2. Chọn 2 ghế (một ghế thường, một ghế VIP) → khung tóm tắt hiện đơn giá theo từng loại ghế → **Tiếp tục**: ghế được giữ 5 phút (đồng hồ đếm ngược).
3. **Thanh toán** → cổng thanh toán giả lập → **Thanh toán thành công**.
4. Trang chuyển sang "Đang xác nhận…" rồi tới **Đặt vé thành công**: kết quả đến qua Saga (payment → Kafka → booking → Kafka → payment).
5. Chuông thông báo hiện "Đặt vé thành công" với mã vé và ghế (notification-service nghe sự kiện Kafka).

Điểm nói: outbox đảm bảo sự kiện không mất; consumer idempotent theo `eventId`.

## 2. Thanh toán thất bại (45 giây)
Đặt vé mới → trên cổng giả lập chọn **Từ chối giao dịch** → trang thất bại hiển thị lý do `CARD_DECLINED`; đơn bị huỷ ngay và ghế được nhả (không chờ hết 5 phút); chuông có thông báo "Đơn vé đã huỷ".

## 3. Hai người tranh một ghế (1 phút)
Mở thêm một cửa sổ ẩn danh, đăng nhập `admin@cinebook.vn`, vào cùng suất chiếu. Chọn cùng một ghế X ở cả hai cửa sổ, bấm **Tiếp tục** gần như cùng lúc → chỉ một bên giữ được ghế, bên còn lại nhận lỗi ghế đã có người giữ; tải lại sơ đồ ghế sẽ thấy ghế X đang được giữ.

Điểm nói: Redis `SET NX` + Lua script giữ nhiều ghế theo kiểu all-or-nothing; unique index trong Postgres là chốt chặn cuối.

## 4. Phân quyền & quản trị (1 phút)
- Với tài khoản demo, vào `/admin` → bị chuyển sang trang 403.
- Đăng nhập admin → **Dashboard**: doanh thu, số vé, tỉ lệ thanh toán thành công, suất chiếu sắp tới (dữ liệu thật từ booking/payment-service).
- **Đơn đặt vé**: lọc theo trạng thái/ngày, xem chi tiết với timeline; **Người dùng**: khoá một tài khoản → phiên của người đó bị thu hồi.

## 5. Bảo mật ở gateway (45 giây, dùng terminal hoặc Bruno)
```bash
# Gọi thẳng service, bỏ qua gateway → 401 GATEWAY_REQUIRED
curl -i http://localhost:8083/api/bookings/me     # (chỉ khi chạy service ngoài Docker)
# Qua gateway không có token → 401
curl -i http://localhost:8080/api/bookings/me
# Đăng nhập sai liên tục → 429 RATE_LIMITED
```
Điểm nói: gateway xoá mọi `X-User-Id` client tự gửi và gắn lại từ JWT.

## 6. (Tuỳ chọn) Dead-letter topic
Trong Kafka UI, gửi một message JSON hỏng vào `payment.events` → message rơi vào `payment.events.DLT`, consumer vẫn chạy tiếp, không kẹt partition.
