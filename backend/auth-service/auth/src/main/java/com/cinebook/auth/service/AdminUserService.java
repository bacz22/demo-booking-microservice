package com.cinebook.auth.service;

import com.cinebook.auth.domain.User;
import com.cinebook.auth.exception.AuthException;
import com.cinebook.auth.repository.RefreshTokenRepository;
import com.cinebook.auth.repository.UserRepository;
import com.cinebook.auth.service.AuthService.UserView;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Quản trị người dùng: tìm kiếm, khoá/mở khoá, đổi quyền. */
@Service
public class AdminUserService {
    private static final Set<String> STATUSES = Set.of("ACTIVE", "LOCKED");
    private static final Set<String> ROLES = Set.of("USER", "ADMIN");

    public record UserPage(List<UserView> items, int page, int pageSize, long total, int totalPages) {}

    public record Summary(long totalUsers, long activeUsers, long lockedUsers, long adminUsers) {}

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final Clock clock;

    public AdminUserService(UserRepository users, RefreshTokenRepository refreshTokens, Clock clock) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public UserPage search(String q, String role, String status, int page, int pageSize) {
        if (role != null && !role.isBlank() && !ROLES.contains(role)) throw badRequest("role không hợp lệ");
        if (status != null && !status.isBlank() && !STATUSES.contains(status)) throw badRequest("status không hợp lệ");
        int size = Math.min(Math.max(pageSize, 1), 100);
        int safePage = Math.max(page, 0);
        var filter = new UserRepository.Search(q, role, status, size, safePage * size);
        long total = users.count(filter);
        List<UserView> items = users.search(filter).stream().map(UserView::from).toList();
        return new UserPage(items, safePage, size, total, (int) Math.ceil(total / (double) size));
    }

    @Transactional(readOnly = true)
    public List<UserView> findByIds(Collection<UUID> ids) {
        if (ids.size() > 200) throw badRequest("Tối đa 200 id mỗi lần");
        return users.findByIds(new LinkedHashSet<>(ids)).stream().map(UserView::from).toList();
    }

    @Transactional(readOnly = true)
    public UserView get(UUID id) {
        return users.findById(id).map(UserView::from).orElseThrow(AdminUserService::notFound);
    }

    @Transactional(readOnly = true)
    public Summary summary() {
        Map<String, Long> byStatus = users.countByStatus();
        long active = byStatus.getOrDefault("ACTIVE", 0L);
        long locked = byStatus.getOrDefault("LOCKED", 0L);
        return new Summary(active + locked, active, locked, users.countByRole("ADMIN"));
    }

    /** Khoá tài khoản thì thu hồi luôn mọi refresh token: phiên hiện tại hết hạn sau tối đa 15 phút. */
    @Transactional
    public UserView updateStatus(UUID actorId, UUID id, String status) {
        if (!STATUSES.contains(status)) throw badRequest("status không hợp lệ");
        if (id.equals(actorId)) throw badRequest("Không thể tự khoá hoặc mở khoá tài khoản của chính mình");
        get(id);
        Instant now = Instant.now(clock);
        users.updateStatus(id, status, now);
        if ("LOCKED".equals(status)) refreshTokens.revokeAllForUser(id, now);
        return get(id);
    }

    /** Quyền mới có hiệu lực ở access token kế tiếp (sau khi refresh). */
    @Transactional
    public UserView updateRoles(UUID actorId, UUID id, List<String> roles) {
        Set<String> wanted = new LinkedHashSet<>(roles);
        if (wanted.isEmpty() || !ROLES.containsAll(wanted)) throw badRequest("Danh sách quyền không hợp lệ");
        wanted.add("USER"); // mọi tài khoản đều là USER
        if (id.equals(actorId) && !wanted.contains("ADMIN")) {
            throw badRequest("Không thể tự bỏ quyền quản trị của chính mình");
        }
        get(id);
        users.replaceRoles(id, List.copyOf(wanted), Instant.now(clock));
        return get(id);
    }

    private static AuthException badRequest(String message) {
        return new AuthException("BAD_REQUEST", message, HttpStatus.BAD_REQUEST);
    }

    private static AuthException notFound() {
        return new AuthException("USER_NOT_FOUND", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND);
    }
}
