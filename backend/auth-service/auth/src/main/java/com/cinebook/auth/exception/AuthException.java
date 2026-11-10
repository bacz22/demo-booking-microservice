package com.cinebook.auth.exception;

import org.springframework.http.HttpStatus;

public class AuthException extends RuntimeException {
    private final String code;
    private final HttpStatus status;

    public AuthException(String code, String message, HttpStatus status) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public String getCode() { return code; }

    public HttpStatus getStatus() { return status; }

    public static AuthException invalidCredentials() {
        return new AuthException("INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng", HttpStatus.UNAUTHORIZED);
    }

    public static AuthException invalidRefreshToken() {
        return new AuthException("INVALID_REFRESH_TOKEN", "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại", HttpStatus.UNAUTHORIZED);
    }

    public static AuthException emailExists() {
        return new AuthException("EMAIL_ALREADY_EXISTS", "Email đã được sử dụng", HttpStatus.CONFLICT);
    }

    public static AuthException accountLocked() {
        return new AuthException("ACCOUNT_LOCKED", "Tài khoản đã bị khóa", HttpStatus.FORBIDDEN);
    }

    public static AuthException unauthenticated() {
        return new AuthException("UNAUTHENTICATED", "Chưa đăng nhập", HttpStatus.UNAUTHORIZED);
    }
}
