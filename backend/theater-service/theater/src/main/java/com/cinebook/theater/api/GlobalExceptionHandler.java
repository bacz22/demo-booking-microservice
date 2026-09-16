package com.cinebook.theater.api;

import com.cinebook.theater.application.exception.AuditoriumInUseException;
import com.cinebook.theater.application.exception.AuditoriumNotFoundException;
import com.cinebook.theater.application.exception.DuplicateResourceException;
import com.cinebook.theater.application.exception.InvalidShowtimeStateException;
import com.cinebook.theater.application.exception.MovieNotFoundException;
import com.cinebook.theater.application.exception.MovieServiceUnavailableException;
import com.cinebook.theater.application.exception.ShowtimeInPastException;
import com.cinebook.theater.application.exception.ShowtimeNotFoundException;
import com.cinebook.theater.application.exception.ShowtimeOverlapException;
import com.cinebook.theater.application.exception.TheaterInUseException;
import com.cinebook.theater.application.exception.TheaterNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(TheaterNotFoundException.class)
    public ResponseEntity<ApiError> handleTheaterNotFound(TheaterNotFoundException exception, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "THEATER_NOT_FOUND", exception.getMessage(), request);
    }

    @ExceptionHandler(AuditoriumNotFoundException.class)
    public ResponseEntity<ApiError> handleAuditoriumNotFound(AuditoriumNotFoundException exception, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "AUDITORIUM_NOT_FOUND", exception.getMessage(), request);
    }

    @ExceptionHandler(ShowtimeNotFoundException.class)
    public ResponseEntity<ApiError> handleShowtimeNotFound(ShowtimeNotFoundException exception, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "SHOWTIME_NOT_FOUND", exception.getMessage(), request);
    }

    @ExceptionHandler(InvalidShowtimeStateException.class)
    public ResponseEntity<ApiError> handleInvalidShowtimeState(InvalidShowtimeStateException exception, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "INVALID_SHOWTIME_STATE", exception.getMessage(), request);
    }

    @ExceptionHandler(MovieNotFoundException.class)
    public ResponseEntity<ApiError> handleMovieNotFound(MovieNotFoundException exception, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "MOVIE_NOT_FOUND", exception.getMessage(), request);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiError> handleDuplicateResource(DuplicateResourceException exception, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, "DUPLICATE_RESOURCE", exception.getMessage(), request);
    }

    @ExceptionHandler(AuditoriumInUseException.class)
    public ResponseEntity<ApiError> handleAuditoriumInUse(AuditoriumInUseException exception, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, "AUDITORIUM_IN_USE", exception.getMessage(), request);
    }

    @ExceptionHandler(TheaterInUseException.class)
    public ResponseEntity<ApiError> handleTheaterInUse(TheaterInUseException exception, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, "THEATER_IN_USE", exception.getMessage(), request);
    }

    @ExceptionHandler(ShowtimeOverlapException.class)
    public ResponseEntity<ApiError> handleShowtimeOverlap(ShowtimeOverlapException exception, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, "SHOWTIME_OVERLAP", exception.getMessage(), request);
    }

    @ExceptionHandler(ShowtimeInPastException.class)
    public ResponseEntity<ApiError> handleShowtimeInPast(ShowtimeInPastException exception, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "SHOWTIME_IN_PAST", exception.getMessage(), request);
    }

    @ExceptionHandler(MovieServiceUnavailableException.class)
    public ResponseEntity<ApiError> handleMovieServiceUnavailable(MovieServiceUnavailableException exception, HttpServletRequest request) {
        return build(HttpStatus.SERVICE_UNAVAILABLE, "MOVIE_SERVICE_UNAVAILABLE", exception.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        String message = exception.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .orElse("Request validation failed");
        return build(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message, request);
    }

    @ExceptionHandler({IllegalArgumentException.class, ConstraintViolationException.class})
    public ResponseEntity<ApiError> handleBadRequest(RuntimeException exception, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", exception.getMessage(), request);
    }

    @ExceptionHandler({
        HttpMessageNotReadableException.class,
        MethodArgumentTypeMismatchException.class,
        MissingServletRequestParameterException.class
    })
    public ResponseEntity<ApiError> handleMalformedRequest(Exception exception, HttpServletRequest request) {
        return build(
            HttpStatus.BAD_REQUEST,
            "INVALID_REQUEST",
            "Request chứa giá trị không đúng định dạng hoặc không được hỗ trợ",
            request
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleConflict(DataIntegrityViolationException exception, HttpServletRequest request) {
        String causeMessage = exception.getMostSpecificCause().getMessage();
        if (causeMessage != null && causeMessage.contains("ex_showtimes_auditorium_time_overlap")) {
            return build(
                HttpStatus.CONFLICT,
                "SHOWTIME_OVERLAP",
                "Phòng chiếu đã có suất chiếu khác trong khoảng thời gian này",
                request
            );
        }
        return build(HttpStatus.CONFLICT, "DATA_INTEGRITY_VIOLATION", "Dữ liệu bị xung đột hoặc vi phạm ràng buộc toàn vẹn", request);
    }

    private ResponseEntity<ApiError> build(
        HttpStatus status,
        String code,
        String message,
        HttpServletRequest request
    ) {
        ApiError error = new ApiError(
            code,
            message,
            MDC.get("correlationId"),
            Instant.now(),
            request.getRequestURI()
        );
        return ResponseEntity.status(status).body(error);
    }
}
