-- Snapshot thông tin hiển thị lúc giữ ghế: tên phim/rạp/giờ chiếu không đổi theo dữ liệu nguồn,
-- và trang admin không phải gọi movie/theater-service cho từng dòng.
ALTER TABLE bookings
    ADD COLUMN movie_title     VARCHAR(255),
    ADD COLUMN poster_url      VARCHAR(1000),
    ADD COLUMN theater_name    VARCHAR(255),
    ADD COLUMN theater_city    VARCHAR(100),
    ADD COLUMN auditorium_name VARCHAR(100),
    ADD COLUMN showtime_start  TIMESTAMPTZ,
    ADD COLUMN showtime_end    TIMESTAMPTZ;

-- Lọc/sắp xếp cho trang admin và thống kê dashboard
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status_created ON bookings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_confirmed_at ON bookings (confirmed_at) WHERE status = 'CONFIRMED';
CREATE INDEX IF NOT EXISTS idx_bookings_movie ON bookings (movie_id);
CREATE INDEX IF NOT EXISTS idx_bookings_theater ON bookings (theater_id);
