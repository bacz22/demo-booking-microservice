package com.cinebook.payment.controller;

import com.cinebook.payment.controller.dto.AdminPage;
import com.cinebook.payment.controller.dto.AdminPaymentDetailResponse;
import com.cinebook.payment.controller.dto.AdminPaymentSummaryResponse;
import com.cinebook.payment.controller.dto.PaymentResponse;
import com.cinebook.payment.domain.enums.PaymentStatus;
import com.cinebook.payment.exception.PaymentBadRequestException;
import com.cinebook.payment.exception.PaymentException;
import com.cinebook.payment.service.AdminPaymentService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.UUID;

/** API quản trị thanh toán (chỉ đọc). Gateway chặn non-admin; kiểm tra lại X-User-Roles ở đây. */
@RestController
@RequestMapping("/api/admin/payments")
public class AdminPaymentController {
    private final AdminPaymentService admin;

    public AdminPaymentController(AdminPaymentService admin) {
        this.admin = admin;
    }

    @GetMapping
    public AdminPage<PaymentResponse> list(@RequestHeader(value = "X-User-Roles", required = false) String roles,
                                           @RequestParam(required = false) String q,
                                           @RequestParam(required = false) String status,
                                           @RequestParam(required = false) UUID userId,
                                           @RequestParam(required = false) UUID bookingId,
                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                           @RequestParam(defaultValue = "createdAt") String sortBy,
                                           @RequestParam(defaultValue = "desc") String sortOrder,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int pageSize) {
        requireAdmin(roles);
        return admin.list(new AdminPaymentService.Filter(q, parseStatus(status), userId, bookingId, from, to,
            sortBy, sortOrder, page, pageSize));
    }

    @GetMapping("/summary")
    public AdminPaymentSummaryResponse summary(@RequestHeader(value = "X-User-Roles", required = false) String roles,
                                               @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                               @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        requireAdmin(roles);
        return admin.summary(from, to);
    }

    @GetMapping("/{id}")
    public AdminPaymentDetailResponse get(@RequestHeader(value = "X-User-Roles", required = false) String roles,
                                          @PathVariable UUID id) {
        requireAdmin(roles);
        return admin.get(id);
    }

    private static void requireAdmin(String roles) {
        if (roles == null || Arrays.stream(roles.split(",")).noneMatch(r -> r.trim().equals("ADMIN"))) {
            throw new PaymentException("FORBIDDEN", "Chỉ quản trị viên mới thực hiện được thao tác này", HttpStatus.FORBIDDEN);
        }
    }

    private static PaymentStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return PaymentStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new PaymentBadRequestException("status không hợp lệ");
        }
    }
}
