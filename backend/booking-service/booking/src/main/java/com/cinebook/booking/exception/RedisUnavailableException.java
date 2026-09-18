package com.cinebook.booking.exception;
import org.springframework.http.HttpStatus;
public class RedisUnavailableException extends BookingException { public RedisUnavailableException(String m) { super("REDIS_UNAVAILABLE", m, HttpStatus.SERVICE_UNAVAILABLE); } }
