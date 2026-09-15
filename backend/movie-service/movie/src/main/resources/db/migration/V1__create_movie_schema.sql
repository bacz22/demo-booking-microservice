CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE genres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    original_title VARCHAR(255),
    description TEXT,
    duration_min INTEGER NOT NULL CHECK (duration_min > 0),
    age_rating VARCHAR(10) NOT NULL DEFAULT 'P',
    release_date DATE,
    poster_url TEXT,
    backdrop_url TEXT,
    trailer_url TEXT,
    rating NUMERIC(3, 1) CHECK (rating >= 0 AND rating <= 10),
    director VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'COMING_SOON',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT movies_status_check CHECK (status IN ('NOW_SHOWING', 'COMING_SOON', 'ENDED'))
);

CREATE TABLE movie_genres (
    movie_id UUID NOT NULL,
    genre_id UUID NOT NULL,
    PRIMARY KEY (movie_id, genre_id),
    CONSTRAINT fk_movie_genres_movie
        FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE,
    CONSTRAINT fk_movie_genres_genre
        FOREIGN KEY (genre_id) REFERENCES genres (id) ON DELETE RESTRICT
);

CREATE INDEX idx_movies_status ON movies (status);
CREATE INDEX idx_movies_release_date ON movies (release_date);
