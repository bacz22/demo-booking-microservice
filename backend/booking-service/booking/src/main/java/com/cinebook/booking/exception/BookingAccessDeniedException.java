package com.cinebook.booking.exception;
import org.springframework.http.HttpStatus;
public class BookingAccessDeniedException extends BookingException { public BookingAccessDeniedException() { super("FORBIDDEN_ACCESS", "Bạn không có quyền truy cập booking này", HttpStatus.FORBIDDEN); } }
