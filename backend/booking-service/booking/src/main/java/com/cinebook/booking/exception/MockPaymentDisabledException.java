package com.cinebook.booking.exception;
import org.springframework.http.HttpStatus;
public class MockPaymentDisabledException extends BookingException { public MockPaymentDisabledException() { super("MOCK_PAYMENT_DISABLED", "Mock payment chưa được bật", HttpStatus.FORBIDDEN); } }
