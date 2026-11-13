package com.cinebook.auth.controller;

import com.cinebook.auth.exception.AuthException;
import com.cinebook.auth.service.AdminUserService;
import com.cinebook.auth.service.AdminUserService.Summary;
import com.cinebook.auth.service.AdminUserService.UserPage;
import com.cinebook.auth.service.AuthService.UserView;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/** API quản trị người dùng. Gateway chặn non-admin; kiểm tra lại X-User-Roles ở đây. */
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    private final AdminUserService admin;

    public AdminUserController(AdminUserService admin) {
        this.admin = admin;
    }

    public record StatusRequest(@NotBlank String status) {}

    public record RolesRequest(@NotEmpty List<String> roles) {}

    /** Tìm kiếm có phân trang; hoặc ?ids=a,b,c để lấy nhiều user một lần (không phân trang). */
    @GetMapping
    public Object list(@RequestHeader(value = "X-User-Roles", required = false) String roles,
                       @RequestParam(required = false) List<UUID> ids,
                       @RequestParam(required = false) String q,
                       @RequestParam(required = false) String role,
                       @RequestParam(required = false) String status,
                       @RequestParam(defaultValue = "0") int page,
                       @RequestParam(defaultValue = "20") int pageSize) {
        requireAdmin(roles);
        if (ids != null) return admin.findByIds(ids);
        return admin.search(q, role, status, page, pageSize);
    }

    @GetMapping("/summary")
    public Summary summary(@RequestHeader(value = "X-User-Roles", required = false) String roles) {
        requireAdmin(roles);
        return admin.summary();
    }

    @GetMapping("/{id}")
    public UserView get(@RequestHeader(value = "X-User-Roles", required = false) String roles, @PathVariable UUID id) {
        requireAdmin(roles);
        return admin.get(id);
    }

    @PatchMapping("/{id}/status")
    public UserView updateStatus(@RequestHeader(value = "X-User-Roles", required = false) String roles,
                                 @RequestHeader("X-User-Id") UUID actorId, @PathVariable UUID id,
                                 @Valid @RequestBody StatusRequest request) {
        requireAdmin(roles);
        return admin.updateStatus(actorId, id, request.status().trim().toUpperCase());
    }

    @PutMapping("/{id}/roles")
    public UserView updateRoles(@RequestHeader(value = "X-User-Roles", required = false) String roles,
                                @RequestHeader("X-User-Id") UUID actorId, @PathVariable UUID id,
                                @Valid @RequestBody RolesRequest request) {
        requireAdmin(roles);
        return admin.updateRoles(actorId, id, request.roles().stream().map(r -> r.trim().toUpperCase()).toList());
    }

    private static void requireAdmin(String roles) {
        if (roles == null || Arrays.stream(roles.split(",")).noneMatch(r -> r.trim().equals("ADMIN"))) {
            throw new AuthException("FORBIDDEN", "Chỉ quản trị viên mới thực hiện được thao tác này", HttpStatus.FORBIDDEN);
        }
    }
}
