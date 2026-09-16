package com.cinebook.theater.application;

import com.cinebook.theater.api.dto.RowConfigRequest;
import com.cinebook.theater.api.dto.SeatGenerateRequest;
import com.cinebook.theater.api.dto.SeatLayoutResponse;
import com.cinebook.theater.api.dto.SeatResponse;
import com.cinebook.theater.application.exception.AuditoriumInUseException;
import com.cinebook.theater.application.exception.AuditoriumNotFoundException;
import com.cinebook.theater.domain.model.Auditorium;
import com.cinebook.theater.domain.model.Seat;
import com.cinebook.theater.domain.model.SeatType;
import com.cinebook.theater.domain.model.ShowtimeStatus;
import com.cinebook.theater.infrastructure.repository.AuditoriumRepository;
import com.cinebook.theater.infrastructure.repository.SeatRepository;
import com.cinebook.theater.infrastructure.repository.ShowtimeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class SeatService {

    private final SeatRepository seatRepository;
    private final AuditoriumRepository auditoriumRepository;
    private final ShowtimeRepository showtimeRepository;

    public SeatService(
        SeatRepository seatRepository,
        AuditoriumRepository auditoriumRepository,
        ShowtimeRepository showtimeRepository
    ) {
        this.seatRepository = seatRepository;
        this.auditoriumRepository = auditoriumRepository;
        this.showtimeRepository = showtimeRepository;
    }

    @Transactional
    public SeatLayoutResponse generateLayout(UUID auditoriumId, SeatGenerateRequest request) {
        Auditorium auditorium = auditoriumRepository.findById(auditoriumId)
            .orElseThrow(() -> new AuditoriumNotFoundException(auditoriumId));

        boolean hasUpcomingShowtimes = showtimeRepository.existsByAuditoriumIdAndStartTimeAfterAndStatusNot(
            auditoriumId,
            Instant.now(),
            ShowtimeStatus.CANCELLED
        );

        if (hasUpcomingShowtimes) {
            throw new AuditoriumInUseException(
                auditoriumId,
                "Không thể tạo lại sơ đồ ghế vì phòng chiếu đang có suất chiếu trong tương lai"
            );
        }

        seatRepository.deleteByAuditoriumId(auditoriumId);
        seatRepository.flush();

        List<Seat> seatsToSave = new ArrayList<>();
        for (RowConfigRequest rowConfig : request.rows()) {
            String rowLabel = rowConfig.label().trim().toUpperCase();
            int seatCount = rowConfig.seatCount();
            SeatType seatType = rowConfig.seatType() != null ? rowConfig.seatType() : SeatType.STANDARD;

            for (int i = 1; i <= seatCount; i++) {
                String displayName = rowLabel + i;
                seatsToSave.add(new Seat(auditorium, rowLabel, i, seatType, displayName));
            }
        }

        List<Seat> savedSeats = seatRepository.saveAll(seatsToSave);
        auditorium.setTotalSeats(savedSeats.size());
        auditoriumRepository.save(auditorium);

        List<SeatResponse> seatResponses = savedSeats.stream()
            .map(SeatResponse::from)
            .toList();

        return new SeatLayoutResponse(
            auditorium.getId(),
            auditorium.getName(),
            auditorium.getTotalSeats(),
            seatResponses
        );
    }

    public SeatLayoutResponse getSeatsByAuditorium(UUID auditoriumId) {
        Auditorium auditorium = auditoriumRepository.findById(auditoriumId)
            .orElseThrow(() -> new AuditoriumNotFoundException(auditoriumId));

        List<Seat> seats = seatRepository.findByAuditoriumIdOrderByRowLabelAscSeatNumberAsc(auditoriumId);
        List<SeatResponse> seatResponses = seats.stream()
            .map(SeatResponse::from)
            .toList();

        return new SeatLayoutResponse(
            auditorium.getId(),
            auditorium.getName(),
            auditorium.getTotalSeats(),
            seatResponses
        );
    }
}
