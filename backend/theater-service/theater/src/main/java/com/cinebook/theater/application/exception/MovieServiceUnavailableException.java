package com.cinebook.theater.application.exception;

public class MovieServiceUnavailableException extends RuntimeException {

    public MovieServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }

    public MovieServiceUnavailableException(String message) {
        super(message);
    }
}
