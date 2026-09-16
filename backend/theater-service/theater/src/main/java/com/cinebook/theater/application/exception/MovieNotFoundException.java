package com.cinebook.theater.application.exception;

import java.util.UUID;

public class MovieNotFoundException extends RuntimeException {

    private final UUID movieId;

    public MovieNotFoundException(UUID movieId) {
        super("Không tìm thấy phim với mã ID: " + movieId);
        this.movieId = movieId;
    }

    public UUID getMovieId() {
        return movieId;
    }
}
