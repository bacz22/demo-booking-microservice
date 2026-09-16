package com.cinebook.movie.domain.repository;

import com.cinebook.movie.domain.model.Movie;
import com.cinebook.movie.domain.model.MovieStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface MovieRepository extends JpaRepository<Movie, UUID>, JpaSpecificationExecutor<Movie> {

    @Override
    @EntityGraph(attributePaths = "genres")
    Optional<Movie> findById(UUID id);
}
