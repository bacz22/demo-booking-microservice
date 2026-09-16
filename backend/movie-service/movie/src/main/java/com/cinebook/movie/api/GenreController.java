package com.cinebook.movie.api;

import com.cinebook.movie.application.MovieService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/genres")
public class GenreController {

    private final MovieService movieService;

    public GenreController(MovieService movieService) {
        this.movieService = movieService;
    }

    @GetMapping
    public List<String> getGenres() {
        return movieService.getGenres();
    }
}
