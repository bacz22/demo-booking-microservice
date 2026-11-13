package com.cinebook.booking.controller.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Số liệu dashboard. revenue/confirmedBookings/seatsSold tính theo ngày xác nhận;
 * createdBookings/byStatus tính theo ngày tạo booking.
 */
public record AdminBookingStatsResponse(LocalDate from, LocalDate to, BigDecimal revenue, long confirmedBookings,
                                        long seatsSold, long createdBookings, Map<String, Long> byStatus,
                                        List<DailyPoint> daily) {
    public record DailyPoint(LocalDate date, BigDecimal revenue, long confirmedBookings, long seatsSold) {}
}
