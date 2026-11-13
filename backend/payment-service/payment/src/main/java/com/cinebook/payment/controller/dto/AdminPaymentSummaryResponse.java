package com.cinebook.payment.controller.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

/**
 * Tổng hợp payment tạo trong [from, to] (ngày giờ VN). successRate = SUCCEEDED / (SUCCEEDED + FAILED + REFUNDED),
 * null khi chưa có giao dịch nào kết thúc.
 */
public record AdminPaymentSummaryResponse(LocalDate from, LocalDate to, long totalCount, BigDecimal totalAmount,
                                          Map<String, StatusSummary> byStatus, Double successRate) {
    public record StatusSummary(long count, BigDecimal amount) {}
}
