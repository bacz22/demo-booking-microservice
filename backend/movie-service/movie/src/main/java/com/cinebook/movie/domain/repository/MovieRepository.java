package com.cinebook.movie.domain.repository;

import com.cinebook.movie.domain.model.Movie;
import com.cinebook.movie.domain.model.MovieStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MovieRepository extends JpaRepository<Movie, UUID> {

    Page<Movie> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Movie> findByTitleContainingIgnoreCaseOrderByCreatedAtDesc(String title, Pageable pageable);

    Page<Movie> findByStatusOrderByCreatedAtDesc(MovieStatus status, Pageable pageable);

    Page<Movie> findByStatusAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(
        MovieStatus status,
        String title,
        Pageable pageable
    );

    @Override
    @EntityGraph(attributePaths = "genres")
    Optional<Movie> findById(UUID id);
}
