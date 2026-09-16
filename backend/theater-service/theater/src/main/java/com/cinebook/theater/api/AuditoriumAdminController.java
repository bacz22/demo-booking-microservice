package com.cinebook.theater.api;

import com.cinebook.theater.api.dto.AuditoriumCreateRequest;
import com.cinebook.theater.api.dto.AuditoriumResponse;
import com.cinebook.theater.api.dto.AuditoriumUpdateRequest;
import com.cinebook.theater.application.AuditoriumService;
import com.cinebook.theater.domain.model.AuditoriumStatus;
import jakarta.validation.Valid;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping
public class AuditoriumAdminController {

    private final AuditoriumService auditoriumService;

    public AuditoriumAdminController(AuditoriumService auditoriumService) {
        this.auditoriumService = auditoriumService;
    }

    @PostMapping("/api/admin/theaters/{theaterId}/auditoriums")
    @ResponseStatus(HttpStatus.CREATED)
    public AuditoriumResponse createAuditorium(
        @PathVariable UUID theaterId,
        @Valid @RequestBody AuditoriumCreateRequest request
    ) {
        return auditoriumService.createAuditorium(theaterId, request);
    }

    @GetMapping("/api/admin/theaters/{theaterId}/auditoriums")
    public List<AuditoriumResponse> getAuditoriumsByTheater(
        @PathVariable UUID theaterId,
        @RequestParam(required = false) AuditoriumStatus status
    ) {
        return auditoriumService.getAuditoriumsByTheater(theaterId, status);
    }

    @GetMapping("/api/admin/auditoriums/{id}")
    public AuditoriumResponse getAuditoriumById(@PathVariable UUID id) {
        return auditoriumService.getAuditoriumById(id);
    }

    @PutMapping("/api/admin/auditoriums/{id}")
    public AuditoriumResponse updateAuditorium(
        @PathVariable UUID id,
        @Valid @RequestBody AuditoriumUpdateRequest request
    ) {
        return auditoriumService.updateAuditorium(id, request);
    }

    @DeleteMapping("/api/admin/auditoriums/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAuditorium(@PathVariable UUID id) {
        auditoriumService.deleteAuditorium(id);
    }
}
