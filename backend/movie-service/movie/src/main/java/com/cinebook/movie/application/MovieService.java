package com.cinebook.movie.application;

import com.cinebook.movie.api.dto.CreateMovieRequest;
import com.cinebook.movie.api.dto.MovieResponse;
import com.cinebook.movie.api.dto.UpdateMovieRequest;
import com.cinebook.movie.domain.model.Genre;
import com.cinebook.movie.domain.model.Movie;
import com.cinebook.movie.domain.model.MovieStatus;
import com.cinebook.movie.domain.repository.GenreRepository;
import com.cinebook.movie.domain.repository.MovieRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MovieService {

    private final MovieRepository movieRepository;
    private final GenreRepository genreRepository;

    public MovieService(MovieRepository movieRepository, GenreRepository genreRepository) {
        this.movieRepository = movieRepository;
        this.genreRepository = genreRepository;
    }

    @Transactional
    public MovieResponse create(CreateMovieRequest request) {
        Movie movie = new Movie(
            request.title().trim(),
            trimToNull(request.originalTitle()),
            trimToNull(request.description()),
            request.durationMin(),
            request.ageRating().trim().toUpperCase(Locale.ROOT),
            request.releaseDate(),
            trimToNull(request.posterUrl()),
            trimToNull(request.backdropUrl()),
            trimToNull(request.trailerUrl()),
            request.rating(),
            trimToNull(request.director()),
            request.status() == null || request.status().isBlank()
                ? MovieStatus.COMING_SOON
                : MovieStatus.from(request.status()),
            resolveGenres(request.genres())
        );

        return toResponse(movieRepository.save(movie));
    }

    @Transactional
    public MovieResponse update(UUID id, UpdateMovieRequest request) {
        Movie movie = findMovie(id);
        movie.update(
            request.title().trim(),
            trimToNull(request.originalTitle()),
            trimToNull(request.description()),
            request.durationMin(),
            request.ageRating().trim().toUpperCase(Locale.ROOT),
            request.releaseDate(),
            trimToNull(request.posterUrl()),
            trimToNull(request.backdropUrl()),
            trimToNull(request.trailerUrl()),
            request.rating(),
            trimToNull(request.director()),
            MovieStatus.from(request.status()),
            resolveGenres(request.genres())
        );

        return toResponse(movie);
    }

    @Transactional
    public MovieResponse getById(UUID id) {
        return toResponse(findMovie(id));
    }

    @Transactional
    public Page<MovieResponse> search(String search, String status, Pageable pageable) {
        String normalizedSearch = search == null ? "" : search.trim();
        MovieStatus normalizedStatus = status == null || status.isBlank() ? null : MovieStatus.from(status);

        Page<Movie> movies;
        if (normalizedStatus == null && normalizedSearch.isBlank()) {
            movies = movieRepository.findAllByOrderByCreatedAtDesc(pageable);
        } else if (normalizedStatus == null) {
            movies = movieRepository.findByTitleContainingIgnoreCaseOrderByCreatedAtDesc(normalizedSearch, pageable);
        } else if (normalizedSearch.isBlank()) {
            movies = movieRepository.findByStatusOrderByCreatedAtDesc(normalizedStatus, pageable);
        } else {
            movies = movieRepository.findByStatusAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(
                normalizedStatus,
                normalizedSearch,
                pageable
            );
        }

        return movies.map(this::toResponse);
    }

    @Transactional
    public void delete(UUID id) {
        Movie movie = findMovie(id);
        movieRepository.delete(movie);
    }

    private Movie findMovie(UUID id) {
        return movieRepository.findById(id)
            .orElseThrow(() -> new MovieNotFoundException(id));
    }

    private Set<Genre> resolveGenres(Set<String> names) {
        if (names == null || names.isEmpty()) {
            return new LinkedHashSet<>();
        }

        Map<String, String> normalizedNames = names.stream()
            .filter(name -> name != null && !name.isBlank())
            .map(String::trim)
            .collect(Collectors.toMap(
                name -> name.toLowerCase(Locale.ROOT),
                name -> name,
                (first, ignored) -> first,
                LinkedHashMap::new
            ));

        Set<Genre> genres = new LinkedHashSet<>();
        for (String name : normalizedNames.values()) {
            genres.add(genreRepository.findByNameIgnoreCase(name).orElseGet(() -> genreRepository.save(new Genre(name))));
        }
        return genres;
    }

    private MovieResponse toResponse(Movie movie) {
        return new MovieResponse(
            movie.getId(),
            movie.getTitle(),
            movie.getOriginalTitle(),
            movie.getDescription(),
            movie.getDurationMin(),
            movie.getAgeRating(),
            movie.getReleaseDate(),
            movie.getPosterUrl(),
            movie.getBackdropUrl(),
            movie.getTrailerUrl(),
            movie.getRating(),
            movie.getDirector(),
            movie.getStatus().value(),
            movie.getGenres().stream().map(Genre::getName).toList(),
            movie.getCreatedAt()
        );
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
