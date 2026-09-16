-- ====================================================================
-- CineBook Theater Service Seed Data Migration (V2)
-- Dữ liệu mẫu thực tế: Cụm rạp, phòng chiếu & sơ đồ ghế
-- Lưu ý: Không seed showtimes với UUID cố định; tạo showtime qua API.
-- ====================================================================

-- 1. SEED CỤM RẠP (theaters)
INSERT INTO theaters (id, name, address, city, hotline, opening_hours, features, image_url, status)
VALUES
    (
        '30000000-0000-0000-0000-000000000001',
        'CineBook Landmark 81',
        'Tầng B1, TTTM Vincom Landmark 81, 720A Điện Biên Phủ, P. 22, Q. Bình Thạnh',
        'Ho Chi Minh',
        '1900 6017',
        '08:00 - 24:00',
        ARRAY['IMAX Laser', 'Dolby Atmos', 'Ghế Sweetbox Đôi', 'VIP Lounge Chờ', 'Bãi Đỗ Xe Ô Tô'],
        'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200',
        'ACTIVE'
    ),
    (
        '30000000-0000-0000-0000-000000000002',
        'CineBook Bitexco Financial',
        'Tầng 3 & 4, Tòa tháp Bitexco Financial Tower, 2 Hải Triều, P. Bến Nghé, Q. 1',
        'Ho Chi Minh',
        '1900 6018',
        '08:30 - 23:30',
        ARRAY['4DX Dynamic', 'Dolby Atmos', 'VIP Lounge Chờ', 'Quầy Bắp Nước Cao Cấp'],
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200',
        'ACTIVE'
    ),
    (
        '30000000-0000-0000-0000-000000000003',
        'CineBook Vincom Đồng Khởi',
        'Tầng 3, TTTM Vincom Center Đồng Khởi, 72 Lê Thánh Tôn, P. Bến Nghé, Q. 1',
        'Ho Chi Minh',
        '1900 6019',
        '08:00 - 23:30',
        ARRAY['ScreenX 270°', 'Dolby Atmos', 'Ghế Sweetbox Đôi', 'Máy Bán Vé Tự Động'],
        'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=1200',
        'ACTIVE'
    ),
    (
        '30000000-0000-0000-0000-000000000004',
        'CineBook Vincom Bà Triệu',
        'Tầng 6, TTTM Vincom Center Bà Triệu, 191 Bà Triệu, P. Lê Đại Hành, Q. Hai Bà Trưng',
        'Ha Noi',
        '1900 6020',
        '08:00 - 24:00',
        ARRAY['IMAX Laser', 'Dolby Atmos', 'Bãi Đỗ Xe Ô Tô', 'VIP Lounge Chờ'],
        'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=1200',
        'ACTIVE'
    )
ON CONFLICT (id) DO NOTHING;

-- 2. SEED PHÒNG CHIẾU (auditoriums)
INSERT INTO auditoriums (id, theater_id, name, format, total_seats, status)
VALUES
    -- Landmark 81
    ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Phòng 01 — IMAX Laser', 'IMAX_LASER', 75, 'ACTIVE'),
    ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Phòng 02 — Dolby Atmos', 'DOLBY_ATMOS', 75, 'ACTIVE'),
    ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'Phòng 03 — 2D Digital', '2D', 75, 'ACTIVE'),

    -- Bitexco Financial
    ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', 'Phòng 01 — 4DX Motion', '4DX', 75, 'ACTIVE'),
    ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', 'Phòng 02 — 2D Digital', '2D', 75, 'ACTIVE'),

    -- Vincom Đồng Khởi
    ('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000003', 'Phòng 01 — ScreenX 270°', 'SCREENX', 75, 'ACTIVE'),
    ('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000003', 'Phòng 02 — 2D Digital', '2D', 75, 'ACTIVE'),

    -- Vincom Bà Triệu
    ('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000004', 'Phòng 01 — IMAX Laser', 'IMAX_LASER', 75, 'ACTIVE'),
    ('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000004', 'Phòng 02 — 2D Digital', '2D', 75, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 3. SEED SƠ ĐỒ GHẾ MẪU (seats) CHO TẤT CẢ PHÒNG CHIẾU
-- Hàng A & B: STANDARD (Ghế 1..10) -> 20 ghế
-- Hàng C, D, E, F, G: VIP (Ghế 1..10) -> 50 ghế
-- Hàng H: COUPLE (Ghế 1..5) -> 5 ghế đôi
-- Tổng cộng: 75 ghế/phòng

-- Ghế STANDARD (Hàng A, B)
INSERT INTO seats (auditorium_id, row_label, seat_number, seat_type, display_name)
SELECT
    a.id AS auditorium_id,
    r.row_label,
    s.seat_number,
    'STANDARD' AS seat_type,
    r.row_label || s.seat_number AS display_name
FROM auditoriums a
CROSS JOIN (VALUES ('A'), ('B')) AS r(row_label)
CROSS JOIN generate_series(1, 10) AS s(seat_number)
ON CONFLICT (auditorium_id, row_label, seat_number) DO NOTHING;

-- Ghế VIP (Hàng C, D, E, F, G)
INSERT INTO seats (auditorium_id, row_label, seat_number, seat_type, display_name)
SELECT
    a.id AS auditorium_id,
    r.row_label,
    s.seat_number,
    'VIP' AS seat_type,
    r.row_label || s.seat_number AS display_name
FROM auditoriums a
CROSS JOIN (VALUES ('C'), ('D'), ('E'), ('F'), ('G')) AS r(row_label)
CROSS JOIN generate_series(1, 10) AS s(seat_number)
ON CONFLICT (auditorium_id, row_label, seat_number) DO NOTHING;

-- Ghế COUPLE (Hàng H, Ghế 1..5)
INSERT INTO seats (auditorium_id, row_label, seat_number, seat_type, display_name)
SELECT
    a.id AS auditorium_id,
    'H' AS row_label,
    s.seat_number,
    'COUPLE' AS seat_type,
    'H' || s.seat_number AS display_name
FROM auditoriums a
CROSS JOIN generate_series(1, 5) AS s(seat_number)
ON CONFLICT (auditorium_id, row_label, seat_number) DO NOTHING;

-- Đồng bộ lại total_seats cho từng phòng
UPDATE auditoriums a
SET total_seats = (
    SELECT COUNT(*)
    FROM seats s
    WHERE s.auditorium_id = a.id
);
