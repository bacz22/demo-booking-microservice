package com.cinebook.theater.api;

import com.cinebook.theater.api.dto.PageResponse;
import com.cinebook.theater.api.dto.TheaterCreateRequest;
import com.cinebook.theater.api.dto.TheaterDetailResponse;
import com.cinebook.theater.api.dto.TheaterResponse;
import com.cinebook.theater.api.dto.TheaterUpdateRequest;
import com.cinebook.theater.application.TheaterService;
import com.cinebook.theater.domain.model.TheaterStatus;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/theaters")
public class TheaterAdminController {

    private final TheaterService theaterService;

    public TheaterAdminController(TheaterService theaterService) {
        this.theaterService = theaterService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TheaterResponse createTheater(@Valid @RequestBody TheaterCreateRequest request) {
        return theaterService.createTheater(request);
    }

    @PutMapping("/{id}")
    public TheaterResponse updateTheater(
        @PathVariable UUID id,
        @Valid @RequestBody TheaterUpdateRequest request
    ) {
        return theaterService.updateTheater(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTheater(@PathVariable UUID id) {
        theaterService.deleteTheater(id);
    }

    @GetMapping("/{id}")
    public TheaterDetailResponse getTheaterById(@PathVariable UUID id) {
        return theaterService.getTheaterById(id);
    }

    @GetMapping
    public PageResponse<TheaterResponse> getTheaters(
        @RequestParam(required = false) String city,
        @RequestParam(required = false) TheaterStatus status,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int pageSize
    ) {
        return theaterService.getTheaters(
            city,
            status,
            search,
            PageRequest.of(page, pageSize, Sort.by("name").ascending())
        );
    }
}
