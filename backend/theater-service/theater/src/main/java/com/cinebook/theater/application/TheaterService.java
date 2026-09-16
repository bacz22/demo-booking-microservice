package com.cinebook.theater.application;

import com.cinebook.theater.api.dto.PageResponse;
import com.cinebook.theater.api.dto.TheaterCreateRequest;
import com.cinebook.theater.api.dto.TheaterDetailResponse;
import com.cinebook.theater.api.dto.TheaterResponse;
import com.cinebook.theater.api.dto.TheaterUpdateRequest;
import com.cinebook.theater.application.exception.DuplicateResourceException;
import com.cinebook.theater.application.exception.TheaterInUseException;
import com.cinebook.theater.application.exception.TheaterNotFoundException;
import com.cinebook.theater.domain.model.ShowtimeStatus;
import com.cinebook.theater.domain.model.Theater;
import com.cinebook.theater.domain.model.TheaterStatus;
import com.cinebook.theater.domain.model.Auditorium;
import com.cinebook.theater.infrastructure.repository.AuditoriumRepository;
import com.cinebook.theater.infrastructure.repository.ShowtimeRepository;
import com.cinebook.theater.infrastructure.repository.TheaterRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class TheaterService {

    private final TheaterRepository theaterRepository;
    private final AuditoriumRepository auditoriumRepository;
    private final ShowtimeRepository showtimeRepository;

    public TheaterService(
        TheaterRepository theaterRepository,
        AuditoriumRepository auditoriumRepository,
        ShowtimeRepository showtimeRepository
    ) {
        this.theaterRepository = theaterRepository;
        this.auditoriumRepository = auditoriumRepository;
        this.showtimeRepository = showtimeRepository;
    }

    @Transactional
    public TheaterResponse createTheater(TheaterCreateRequest request) {
        String trimmedName = request.name().trim();
        if (theaterRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new DuplicateResourceException("Cụm rạp với tên '" + trimmedName + "' đã tồn tại");
        }

        Theater theater = new Theater(
            trimmedName,
            request.address().trim(),
            request.city().trim(),
            request.hotline(),
            request.openingHours(),
            request.features(),
            request.imageUrl(),
            request.status() != null ? request.status() : TheaterStatus.ACTIVE
        );

        Theater saved = theaterRepository.save(theater);
        return TheaterResponse.from(saved);
    }

    @Transactional
    public TheaterResponse updateTheater(UUID id, TheaterUpdateRequest request) {
        Theater theater = theaterRepository.findById(id)
            .orElseThrow(() -> new TheaterNotFoundException(id));

        String trimmedName = request.name().trim();
        if (theaterRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, id)) {
            throw new DuplicateResourceException("Cụm rạp với tên '" + trimmedName + "' đã tồn tại");
        }

        theater.setName(trimmedName);
        theater.setAddress(request.address().trim());
        theater.setCity(request.city().trim());
        theater.setHotline(request.hotline());
        theater.setOpeningHours(request.openingHours());
        theater.setFeatures(request.features());
        theater.setImageUrl(request.imageUrl());
        if (request.status() != null) {
            theater.setStatus(request.status());
        }

        Theater updated = theaterRepository.save(theater);
        return TheaterResponse.from(updated);
    }

    @Transactional
    public void deleteTheater(UUID id) {
        Theater theater = theaterRepository.findById(id)
            .orElseThrow(() -> new TheaterNotFoundException(id));

        boolean hasUpcomingShowtimes = showtimeRepository.existsUpcomingShowtimesByTheater(
            id,
            Instant.now(),
            ShowtimeStatus.CANCELLED
        );

        if (hasUpcomingShowtimes) {
            throw new TheaterInUseException(id, "Không thể xóa cụm rạp vì đang có suất chiếu trong tương lai");
        }

        theaterRepository.delete(theater);
    }

    public TheaterDetailResponse getTheaterById(UUID id) {
        Theater theater = theaterRepository.findById(id)
            .orElseThrow(() -> new TheaterNotFoundException(id));
        List<Auditorium> auditoriums = auditoriumRepository.findByTheaterIdOrderByNameAsc(id);
        return TheaterDetailResponse.of(theater, auditoriums);
    }

    public PageResponse<TheaterResponse> getTheaters(String city, TheaterStatus status, String search, Pageable pageable) {
        Specification<Theater> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (city != null && !city.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("city")), city.trim().toLowerCase()));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("name")), searchPattern));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Theater> page = theaterRepository.findAll(spec, pageable);
        List<TheaterResponse> items = page.getContent().stream().map(TheaterResponse::from).toList();
        return PageResponse.of(items, page.getTotalElements(), page.getNumber(), page.getSize());
    }

    public List<TheaterResponse> getActiveTheaters(String city) {
        List<Theater> theaters;
        if (city != null && !city.isBlank()) {
            theaters = theaterRepository.findByCityAndStatusOrderByNameAsc(city.trim(), TheaterStatus.ACTIVE);
        } else {
            theaters = theaterRepository.findByStatusOrderByNameAsc(TheaterStatus.ACTIVE);
        }
        return theaters.stream().map(TheaterResponse::from).toList();
    }
}
