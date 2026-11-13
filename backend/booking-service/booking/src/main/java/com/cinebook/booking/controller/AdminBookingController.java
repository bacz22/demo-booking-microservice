package com.cinebook.booking.controller;

import com.cinebook.booking.controller.dto.AdminBookingStatsResponse;
import com.cinebook.booking.controller.dto.AdminCancelRequest;
import com.cinebook.booking.controller.dto.AdminPage;
import com.cinebook.booking.controller.dto.BookingResponse;
import com.cinebook.booking.domain.enums.BookingStatus;
import com.cinebook.booking.exception.BadRequestException;
import com.cinebook.booking.exception.BookingException;
import com.cinebook.booking.service.AdminBookingService;
import com.cinebook.booking.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * API quản trị booking. Gateway đã chặn người không có ROLE_ADMIN; ở đây kiểm tra lại
 * header X-User-Roles do gateway gắn để phòng khi cấu hình route sai.
 */
@RestController
@RequestMapping("/api/admin/bookings")
public class AdminBookingController {
    private final AdminBookingService admin;
    private final BookingService bookings;

    public AdminBookingController(AdminBookingService admin, BookingService bookings) {
        this.admin = admin;
        this.bookings = bookings;
    }

    @GetMapping
    public AdminPage<BookingResponse> list(@RequestHeader(value = "X-User-Roles", required = false) String roles,
                                           @RequestParam(required = false) String q,
                                           @RequestParam(required = false) String status,
                                           @RequestParam(required = false) UUID movieId,
                                           @RequestParam(required = false) UUID theaterId,
                                           @RequestParam(required = false) UUID userId,
                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                           @RequestParam(defaultValue = "createdAt") String sortBy,
                                           @RequestParam(defaultValue = "desc") String sortOrder,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int pageSize) {
        requireAdmin(roles);
        return admin.list(new AdminBookingService.Filter(q, parseStatus(status), movieId, theaterId, userId,
            from, to, sortBy, sortOrder, page, pageSize));
    }

    @GetMapping("/stats")
    public AdminBookingStatsResponse stats(@RequestHeader(value = "X-User-Roles", required = false) String roles,
                                           @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                           @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        requireAdmin(roles);
        return admin.stats(from, to);
    }

    /** Số ghế đã bán theo suất chiếu: ?showtimeIds=a,b,c */
    @GetMapping("/sold-seats")
    public Map<UUID, Long> soldSeats(@RequestHeader(value = "X-User-Roles", required = false) String roles,
                                     @RequestParam List<UUID> showtimeIds) {
        requireAdmin(roles);
        return admin.soldSeatsByShowtime(showtimeIds);
    }

    @GetMapping("/{id}")
    public BookingResponse get(@RequestHeader(value = "X-User-Roles", required = false) String roles,
                               @PathVariable UUID id) {
        requireAdmin(roles);
        return admin.get(id);
    }

    @PostMapping("/{id}/cancel")
    public BookingResponse cancel(@RequestHeader(value = "X-User-Roles", required = false) String roles,
                                  @PathVariable UUID id,
                                  @Valid @RequestBody(required = false) AdminCancelRequest request) {
        requireAdmin(roles);
        return bookings.adminCancel(id, request == null ? null : request.reason());
    }

    static void requireAdmin(String roles) {
        if (roles == null || Arrays.stream(roles.split(",")).noneMatch(r -> r.trim().equals("ADMIN"))) {
            throw new BookingException("FORBIDDEN", "Chỉ quản trị viên mới thực hiện được thao tác này", HttpStatus.FORBIDDEN);
        }
    }

    private static BookingStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return BookingStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("status không hợp lệ");
        }
    }
}
