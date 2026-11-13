package com.cinebook.payment.service;

import com.cinebook.payment.controller.dto.AdminPage;
import com.cinebook.payment.controller.dto.AdminPaymentDetailResponse;
import com.cinebook.payment.controller.dto.AdminPaymentSummaryResponse;
import com.cinebook.payment.controller.dto.PaymentResponse;
import com.cinebook.payment.domain.entity.Payment;
import com.cinebook.payment.domain.enums.PaymentStatus;
import com.cinebook.payment.exception.PaymentBadRequestException;
import com.cinebook.payment.repository.PaymentAttemptRepository;
import com.cinebook.payment.repository.PaymentRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Truy vấn cho trang quản trị thanh toán. */
@Service
public class AdminPaymentService {
    public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Map<String, String> SORT_FIELDS = Map.of("createdAt", "createdAt", "amount", "amount");

    public record Filter(String q, PaymentStatus status, UUID userId, UUID bookingId, LocalDate from, LocalDate to,
                         String sortBy, String sortOrder, int page, int pageSize) {}

    private final PaymentRepository payments;
    private final PaymentAttemptRepository attempts;
    private final JdbcTemplate jdbc;

    public AdminPaymentService(PaymentRepository payments, PaymentAttemptRepository attempts, JdbcTemplate jdbc) {
        this.payments = payments;
        this.attempts = attempts;
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public AdminPage<PaymentResponse> list(Filter f) {
        String sortField = SORT_FIELDS.getOrDefault(f.sortBy() == null ? "createdAt" : f.sortBy(), "createdAt");
        Sort.Direction direction = "asc".equalsIgnoreCase(f.sortOrder()) ? Sort.Direction.ASC : Sort.Direction.DESC;
        int size = Math.min(Math.max(f.pageSize(), 1), 100);
        Page<Payment> page = payments.findAll(spec(f), PageRequest.of(Math.max(f.page(), 0), size,
            Sort.by(direction, sortField).and(Sort.by(Sort.Direction.DESC, "id"))));
        return AdminPage.of(page.map(PaymentResponse::from).toList(), page);
    }

    @Transactional(readOnly = true)
    public AdminPaymentDetailResponse get(UUID id) {
        Payment payment = payments.findById(id).orElseThrow(PaymentNotFoundException::new);
        return new AdminPaymentDetailResponse(PaymentResponse.from(payment),
            attempts.findByPaymentIdOrderByAttemptNumber(id).stream().map(AdminPaymentDetailResponse.Attempt::from).toList());
    }

    @Transactional(readOnly = true)
    public AdminPaymentSummaryResponse summary(LocalDate from, LocalDate to) {
        if (from == null || to == null || from.isAfter(to)) throw new PaymentBadRequestException("Khoảng ngày không hợp lệ");
        Map<String, AdminPaymentSummaryResponse.StatusSummary> byStatus = new LinkedHashMap<>();
        for (PaymentStatus s : PaymentStatus.values()) {
            byStatus.put(s.name(), new AdminPaymentSummaryResponse.StatusSummary(0, BigDecimal.ZERO));
        }
        jdbc.query("""
            SELECT status, count(*) AS c, coalesce(sum(amount), 0) AS amount FROM payments
             WHERE created_at >= ? AND created_at < ? GROUP BY status
            """, rs -> {
            byStatus.put(rs.getString("status"),
                new AdminPaymentSummaryResponse.StatusSummary(rs.getLong("c"), rs.getBigDecimal("amount")));
        }, Timestamp.from(from.atStartOfDay(ZONE).toInstant()), Timestamp.from(to.plusDays(1).atStartOfDay(ZONE).toInstant()));

        long total = byStatus.values().stream().mapToLong(AdminPaymentSummaryResponse.StatusSummary::count).sum();
        BigDecimal amount = byStatus.values().stream().map(AdminPaymentSummaryResponse.StatusSummary::amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        long succeeded = byStatus.get("SUCCEEDED").count();
        long finished = succeeded + byStatus.get("FAILED").count() + byStatus.get("REFUNDED").count();
        Double rate = finished == 0 ? null
            : BigDecimal.valueOf(succeeded).divide(BigDecimal.valueOf(finished), 4, RoundingMode.HALF_UP).doubleValue();
        return new AdminPaymentSummaryResponse(from, to, total, amount, byStatus, rate);
    }

    private static Specification<Payment> spec(Filter f) {
        return (root, query, cb) -> {
            List<Predicate> where = new ArrayList<>();
            if (f.status() != null) where.add(cb.equal(root.get("status"), f.status()));
            if (f.userId() != null) where.add(cb.equal(root.get("userId"), f.userId()));
            if (f.bookingId() != null) where.add(cb.equal(root.get("bookingId"), f.bookingId()));
            if (f.from() != null) where.add(cb.greaterThanOrEqualTo(root.get("createdAt"), f.from().atStartOfDay(ZONE).toInstant()));
            if (f.to() != null) where.add(cb.lessThan(root.get("createdAt"), f.to().plusDays(1).atStartOfDay(ZONE).toInstant()));
            if (f.q() != null && !f.q().isBlank()) {
                String like = "%" + f.q().trim().toLowerCase().replace("%", "\\%").replace("_", "\\_") + "%";
                where.add(cb.or(
                    cb.like(cb.lower(root.get("paymentCode")), like, '\\'),
                    cb.like(cb.lower(cb.coalesce(root.get("providerRef"), "")), like, '\\'),
                    cb.like(cb.lower(cb.coalesce(root.get("failureCode"), "")), like, '\\')));
            }
            return cb.and(where.toArray(Predicate[]::new));
        };
    }
}
