package com.cinebook.theater.application;

import com.cinebook.theater.api.dto.AuditoriumCreateRequest;
import com.cinebook.theater.api.dto.AuditoriumResponse;
import com.cinebook.theater.api.dto.AuditoriumUpdateRequest;
import com.cinebook.theater.application.exception.AuditoriumInUseException;
import com.cinebook.theater.application.exception.AuditoriumNotFoundException;
import com.cinebook.theater.application.exception.DuplicateResourceException;
import com.cinebook.theater.application.exception.TheaterNotFoundException;
import com.cinebook.theater.domain.model.Auditorium;
import com.cinebook.theater.domain.model.AuditoriumFormat;
import com.cinebook.theater.domain.model.AuditoriumStatus;
import com.cinebook.theater.domain.model.ShowtimeStatus;
import com.cinebook.theater.domain.model.Theater;
import com.cinebook.theater.infrastructure.repository.AuditoriumRepository;
import com.cinebook.theater.infrastructure.repository.ShowtimeRepository;
import com.cinebook.theater.infrastructure.repository.TheaterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class AuditoriumService {

    private final AuditoriumRepository auditoriumRepository;
    private final TheaterRepository theaterRepository;
    private final ShowtimeRepository showtimeRepository;

    public AuditoriumService(
        AuditoriumRepository auditoriumRepository,
        TheaterRepository theaterRepository,
        ShowtimeRepository showtimeRepository
    ) {
        this.auditoriumRepository = auditoriumRepository;
        this.theaterRepository = theaterRepository;
        this.showtimeRepository = showtimeRepository;
    }

    @Transactional
    public AuditoriumResponse createAuditorium(UUID theaterId, AuditoriumCreateRequest request) {
        Theater theater = theaterRepository.findById(theaterId)
            .orElseThrow(() -> new TheaterNotFoundException(theaterId));

        String trimmedName = request.name().trim();
        if (auditoriumRepository.existsByTheaterIdAndNameIgnoreCase(theaterId, trimmedName)) {
            throw new DuplicateResourceException("Phòng chiếu với tên '" + trimmedName + "' đã tồn tại trong cụm rạp này");
        }

        Auditorium auditorium = new Auditorium(
            theater,
            trimmedName,
            request.format() != null ? request.format() : AuditoriumFormat.TWO_D,
            request.status() != null ? request.status() : AuditoriumStatus.ACTIVE
        );
        theater.addAuditorium(auditorium);

        Auditorium saved = auditoriumRepository.save(auditorium);
        return AuditoriumResponse.from(saved);
    }

    @Transactional
    public AuditoriumResponse updateAuditorium(UUID id, AuditoriumUpdateRequest request) {
        Auditorium auditorium = auditoriumRepository.findById(id)
            .orElseThrow(() -> new AuditoriumNotFoundException(id));

        String trimmedName = request.name().trim();
        UUID theaterId = auditorium.getTheater().getId();
        if (auditoriumRepository.existsByTheaterIdAndNameIgnoreCaseAndIdNot(theaterId, trimmedName, id)) {
            throw new DuplicateResourceException("Phòng chiếu với tên '" + trimmedName + "' đã tồn tại trong cụm rạp này");
        }

        auditorium.setName(trimmedName);
        if (request.format() != null) {
            auditorium.setFormat(request.format());
        }
        if (request.status() != null) {
            auditorium.setStatus(request.status());
        }

        Auditorium updated = auditoriumRepository.save(auditorium);
        return AuditoriumResponse.from(updated);
    }

    @Transactional
    public void deleteAuditorium(UUID id) {
        Auditorium auditorium = auditoriumRepository.findById(id)
            .orElseThrow(() -> new AuditoriumNotFoundException(id));

        boolean hasUpcomingShowtimes = showtimeRepository.existsByAuditoriumIdAndStartTimeAfterAndStatusNot(
            id,
            Instant.now(),
            ShowtimeStatus.CANCELLED
        );

        if (hasUpcomingShowtimes) {
            throw new AuditoriumInUseException(id, "Không thể xóa phòng chiếu vì đang có suất chiếu trong tương lai");
        }

        auditoriumRepository.delete(auditorium);
    }

    public AuditoriumResponse getAuditoriumById(UUID id) {
        Auditorium auditorium = auditoriumRepository.findById(id)
            .orElseThrow(() -> new AuditoriumNotFoundException(id));
        return AuditoriumResponse.from(auditorium);
    }

    public List<AuditoriumResponse> getAuditoriumsByTheater(UUID theaterId, AuditoriumStatus status) {
        if (!theaterRepository.existsById(theaterId)) {
            throw new TheaterNotFoundException(theaterId);
        }

        List<Auditorium> auditoriums;
        if (status != null) {
            auditoriums = auditoriumRepository.findByTheaterIdAndStatusOrderByNameAsc(theaterId, status);
        } else {
            auditoriums = auditoriumRepository.findByTheaterIdOrderByNameAsc(theaterId);
        }

        return auditoriums.stream().map(AuditoriumResponse::from).toList();
    }
}
