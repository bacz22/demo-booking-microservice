package com.cinebook.theater.api;

import com.cinebook.theater.api.dto.TheaterDetailResponse;
import com.cinebook.theater.api.dto.TheaterResponse;
import com.cinebook.theater.application.TheaterService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/theaters")
public class TheaterPublicController {

    private final TheaterService theaterService;

    public TheaterPublicController(TheaterService theaterService) {
        this.theaterService = theaterService;
    }

    @GetMapping
    public List<TheaterResponse> getActiveTheaters(@RequestParam(required = false) String city) {
        return theaterService.getActiveTheaters(city);
    }

    @GetMapping("/{id}")
    public TheaterDetailResponse getTheaterById(@PathVariable UUID id) {
        return theaterService.getTheaterById(id);
    }
}
