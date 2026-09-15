package com.cinebook.movie.application;

import java.util.UUID;

public class MovieNotFoundException extends RuntimeException {

    public MovieNotFoundException(UUID id) {
        super("Movie not found: " + id);
    }
}
