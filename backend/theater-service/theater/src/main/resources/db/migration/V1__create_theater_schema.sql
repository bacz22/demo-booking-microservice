-- ====================================================================
-- CineBook Theater Service Schema Migration (V1)
-- Cơ sở dữ liệu: theater_db (PostgreSQL)
-- Bảng: theaters, auditoriums, seats, showtimes
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. BẢNG CỤM RẠP (theaters)
CREATE TABLE IF NOT EXISTS theaters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    hotline VARCHAR(50),
    opening_hours VARCHAR(100) NOT NULL DEFAULT '08:00 - 24:00',
    features TEXT[] NOT NULL DEFAULT '{}',
    image_url VARCHAR(1000),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT theaters_status_check CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_theaters_city ON theaters (city);
CREATE INDEX IF NOT EXISTS idx_theaters_status ON theaters (status);

-- 2. BẢNG PHÒNG CHIẾU (auditoriums)
CREATE TABLE IF NOT EXISTS auditoriums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theater_id UUID NOT NULL REFERENCES theaters(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    format VARCHAR(50) NOT NULL DEFAULT '2D',
    total_seats INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT auditoriums_format_check CHECK (format IN ('2D', '3D', 'IMAX_LASER', '4DX', 'SCREENX', 'DOLBY_ATMOS')),
    CONSTRAINT auditoriums_total_seats_check CHECK (total_seats >= 0),
    CONSTRAINT auditoriums_status_check CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'INACTIVE')),
    CONSTRAINT uq_theater_auditorium_name UNIQUE (theater_id, name)
);

CREATE INDEX IF NOT EXISTS idx_auditoriums_theater ON auditoriums (theater_id);
CREATE INDEX IF NOT EXISTS idx_auditoriums_status ON auditoriums (status);

-- 3. BẢNG SƠ ĐỒ GHẾ CỐ ĐỊNH (seats)
CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditorium_id UUID NOT NULL REFERENCES auditoriums(id) ON DELETE CASCADE,
    row_label VARCHAR(10) NOT NULL,
    seat_number INT NOT NULL,
    seat_type VARCHAR(30) NOT NULL DEFAULT 'STANDARD',
    display_name VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT seats_number_check CHECK (seat_number > 0),
    CONSTRAINT seats_type_check CHECK (seat_type IN ('STANDARD', 'VIP', 'COUPLE')),
    CONSTRAINT uq_auditorium_seat UNIQUE (auditorium_id, row_label, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_seats_auditorium_row ON seats (auditorium_id, row_label, seat_number);

-- 4. BẢNG SUẤT CHIẾU (showtimes)
CREATE TABLE IF NOT EXISTS showtimes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditorium_id UUID NOT NULL REFERENCES auditoriums(id) ON DELETE CASCADE,
    movie_id UUID NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    movie_duration_min INT NOT NULL,
    cleaning_duration_min INT NOT NULL DEFAULT 15,
    price_standard NUMERIC(12, 2) NOT NULL DEFAULT 90000,
    price_vip NUMERIC(12, 2) NOT NULL DEFAULT 110000,
    price_couple NUMERIC(12, 2) NOT NULL DEFAULT 180000,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT showtimes_duration_check CHECK (movie_duration_min > 0),
    CONSTRAINT showtimes_cleaning_check CHECK (cleaning_duration_min >= 0),
    CONSTRAINT showtimes_price_standard_check CHECK (price_standard >= 0),
    CONSTRAINT showtimes_price_vip_check CHECK (price_vip >= 0),
    CONSTRAINT showtimes_price_couple_check CHECK (price_couple >= 0),
    CONSTRAINT showtimes_status_check CHECK (status IN ('SCHEDULED', 'SELLING', 'ENDED', 'CANCELLED')),
    CONSTRAINT showtimes_time_valid CHECK (end_time > start_time)
);

-- Chỉ mục tối ưu cho kiểm tra trùng lịch (Overlap check)
CREATE INDEX IF NOT EXISTS idx_showtimes_overlap ON showtimes (auditorium_id, start_time, end_time);

-- Chỉ mục tối ưu cho tìm kiếm lịch chiếu theo phim & ngày
CREATE INDEX IF NOT EXISTS idx_showtimes_movie_date ON showtimes (movie_id, start_time);
CREATE INDEX IF NOT EXISTS idx_showtimes_start_time ON showtimes (start_time);
