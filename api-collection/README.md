# Collection API CineBook (Bruno)

Mở thư mục này bằng [Bruno](https://www.usebruno.com/), chọn environment `local` (gateway http://localhost:8080).

Chạy các thư mục theo thứ tự 1 → 3: request đăng nhập lưu token vào biến `accessToken` / `adminToken`, các request sau dùng lại. Thư mục **2-Booking** chạy trọn luồng: tìm suất chiếu → giữ ghế → tạo payment → xác nhận → kiểm tra Saga đã chuyển payment sang `SUCCEEDED` → xem thông báo.

Chạy bằng CLI (trong thư mục này): `npx @usebruno/cli run --env local`
