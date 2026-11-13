package com.cinebook.booking.service;

import com.cinebook.booking.controller.dto.AdminBookingStatsResponse;
import com.cinebook.booking.controller.dto.AdminPage;
import com.cinebook.booking.controller.dto.BookingResponse;
import com.cinebook.booking.domain.entity.Booking;
import com.cinebook.booking.domain.entity.BookingSeat;
import com.cinebook.booking.domain.enums.BookingStatus;
import com.cinebook.booking.exception.BadRequestException;
import com.cinebook.booking.exception.BookingNotFoundException;
import com.cinebook.booking.repository.BookingRepository;
import com.cinebook.booking.repository.BookingSeatRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/** Truy vấn cho trang quản trị: danh sách có lọc/sắp xếp và số liệu dashboard. */
@Service
public class AdminBookingService {
    /** Ngày hiển thị theo giờ Việt Nam. */
    public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Map<String, String> SORT_FIELDS = Map.of(
        "createdAt", "createdAt", "totalAmount", "totalAmount", "showtimeStart", "showtimeStart");

    public record Filter(String q, BookingStatus status, UUID movieId, UUID theaterId, UUID userId,
                         LocalDate from, LocalDate to, String sortBy, String sortOrder, int page, int pageSize) {}

    private final BookingRepository bookings;
    private final BookingSeatRepository seats;
    private final JdbcTemplate jdbc;

    public AdminBookingService(BookingRepository bookings, BookingSeatRepository seats, JdbcTemplate jdbc) {
        this.bookings = bookings;
        this.seats = seats;
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public AdminPage<BookingResponse> list(Filter f) {
        String sortField = SORT_FIELDS.getOrDefault(f.sortBy() == null ? "createdAt" : f.sortBy(), "createdAt");
        Sort.Direction direction = "asc".equalsIgnoreCase(f.sortOrder()) ? Sort.Direction.ASC : Sort.Direction.DESC;
        int size = Math.min(Math.max(f.pageSize(), 1), 100);
        PageRequest pageable = PageRequest.of(Math.max(f.page(), 0), size,
            Sort.by(direction, sortField).and(Sort.by(Sort.Direction.DESC, "id")));

        Page<Booking> page = bookings.findAll(spec(f), pageable);
        Map<UUID, List<BookingSeat>> seatsByBooking = page.isEmpty() ? Map.of()
            : seats.findByBookingIdIn(page.map(Booking::getId).toList()).stream()
                .collect(Collectors.groupingBy(BookingSeat::getBookingId));
        List<BookingResponse> items = page.map(b -> BookingResponse.from(b,
            seatsByBooking.getOrDefault(b.getId(), List.of()))).toList();
        return AdminPage.of(items, page);
    }

    @Transactional(readOnly = true)
    public BookingResponse get(UUID id) {
        Booking booking = bookings.findById(id).orElseThrow(BookingNotFoundException::new);
        return BookingResponse.from(booking, seats.findByBookingIdOrderBySeatNumber(id));
    }

    /**
     * Số liệu dashboard trong khoảng [from, to] (ngày theo giờ VN, tính cả hai đầu).
     * Doanh thu = tổng tiền booking CONFIRMED theo ngày xác nhận; trạng thái tính theo ngày tạo.
     */
    @Transactional(readOnly = true)
    public AdminBookingStatsResponse stats(LocalDate from, LocalDate to) {
        if (from == null || to == null || from.isAfter(to)) throw new BadRequestException("Khoảng ngày không hợp lệ");
        if (from.plusDays(366).isBefore(to)) throw new BadRequestException("Khoảng thống kê tối đa 1 năm");
        Timestamp start = Timestamp.from(from.atStartOfDay(ZONE).toInstant());
        Timestamp end = Timestamp.from(to.plusDays(1).atStartOfDay(ZONE).toInstant());

        Map<LocalDate, AdminBookingStatsResponse.DailyPoint> daily = new LinkedHashMap<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            daily.put(d, new AdminBookingStatsResponse.DailyPoint(d, BigDecimal.ZERO, 0, 0));
        }
        jdbc.query("""
            SELECT (b.confirmed_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day,
                   sum(b.total_amount) AS revenue, count(*) AS bookings,
                   coalesce(sum((SELECT count(*) FROM booking_seats s WHERE s.booking_id = b.id)), 0) AS seats
              FROM bookings b
             WHERE b.status = 'CONFIRMED' AND b.confirmed_at >= ? AND b.confirmed_at < ?
             GROUP BY 1
            """, rs -> {
            LocalDate day = rs.getObject("day", LocalDate.class);
            daily.put(day, new AdminBookingStatsResponse.DailyPoint(day, rs.getBigDecimal("revenue"),
                rs.getLong("bookings"), rs.getLong("seats")));
        }, start, end);

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (BookingStatus s : BookingStatus.values()) byStatus.put(s.name(), 0L);
        jdbc.query("SELECT status, count(*) AS c FROM bookings WHERE created_at >= ? AND created_at < ? GROUP BY status",
            rs -> { byStatus.put(rs.getString("status"), rs.getLong("c")); }, start, end);

        List<AdminBookingStatsResponse.DailyPoint> points = new ArrayList<>(daily.values());
        BigDecimal revenue = points.stream().map(AdminBookingStatsResponse.DailyPoint::revenue).reduce(BigDecimal.ZERO, BigDecimal::add);
        long confirmed = points.stream().mapToLong(AdminBookingStatsResponse.DailyPoint::confirmedBookings).sum();
        long seatsSold = points.stream().mapToLong(AdminBookingStatsResponse.DailyPoint::seatsSold).sum();
        long created = byStatus.values().stream().mapToLong(Long::longValue).sum();
        return new AdminBookingStatsResponse(from, to, revenue, confirmed, seatsSold, created, byStatus, points);
    }

    /** Số ghế đã bán (CONFIRMED) theo từng suất chiếu, dùng cho tỉ lệ lấp đầy trên dashboard. */
    @Transactional(readOnly = true)
    public Map<UUID, Long> soldSeatsByShowtime(List<UUID> showtimeIds) {
        if (showtimeIds == null || showtimeIds.isEmpty()) return Map.of();
        if (showtimeIds.size() > 200) throw new BadRequestException("Tối đa 200 suất chiếu mỗi lần");
        Map<UUID, Long> result = new LinkedHashMap<>();
        showtimeIds.forEach(id -> result.put(id, 0L));
        String placeholders = showtimeIds.stream().map(id -> "?").collect(Collectors.joining(","));
        jdbc.query("SELECT s.showtime_id, count(*) AS c FROM booking_seats s JOIN bookings b ON b.id = s.booking_id"
                + " WHERE b.status = 'CONFIRMED' AND s.showtime_id IN (" + placeholders + ") GROUP BY s.showtime_id",
            rs -> { result.put(rs.getObject("showtime_id", UUID.class), rs.getLong("c")); }, showtimeIds.toArray());
        return result;
    }

    private static Specification<Booking> spec(Filter f) {
        return (root, query, cb) -> {
            List<Predicate> where = new ArrayList<>();
            if (f.status() != null) where.add(cb.equal(root.get("status"), f.status()));
            if (f.movieId() != null) where.add(cb.equal(root.get("movieId"), f.movieId()));
            if (f.theaterId() != null) where.add(cb.equal(root.get("theaterId"), f.theaterId()));
            if (f.userId() != null) where.add(cb.equal(root.get("userId"), f.userId()));
            if (f.from() != null) {
                where.add(cb.greaterThanOrEqualTo(root.get("createdAt"), f.from().atStartOfDay(ZONE).toInstant()));
            }
            if (f.to() != null) {
                where.add(cb.lessThan(root.<Instant>get("createdAt"), f.to().plusDays(1).atStartOfDay(ZONE).toInstant()));
            }
            if (f.q() != null && !f.q().isBlank()) {
                String like = "%" + f.q().trim().toLowerCase().replace("%", "\\%").replace("_", "\\_") + "%";
                where.add(cb.or(
                    cb.like(cb.lower(root.get("bookingCode")), like, '\\'),
                    cb.like(cb.lower(cb.coalesce(root.get("movieTitle"), "")), like, '\\'),
                    cb.like(cb.lower(cb.coalesce(root.get("theaterName"), "")), like, '\\')));
            }
            return cb.and(where.toArray(Predicate[]::new));
        };
    }
}
