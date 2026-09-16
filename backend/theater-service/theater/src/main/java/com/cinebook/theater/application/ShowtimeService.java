package com.cinebook.theater.application;

import com.cinebook.theater.api.dto.MovieShowtimeGroupResponse;
import com.cinebook.theater.api.dto.PageResponse;
import com.cinebook.theater.api.dto.SeatResponse;
import com.cinebook.theater.api.dto.ShowtimeCreateRequest;
import com.cinebook.theater.api.dto.ShowtimeItemResponse;
import com.cinebook.theater.api.dto.ShowtimeResponse;
import com.cinebook.theater.api.dto.ShowtimeSeatMapResponse;
import com.cinebook.theater.api.dto.ShowtimeUpdateRequest;
import com.cinebook.theater.application.exception.AuditoriumNotFoundException;
import com.cinebook.theater.application.exception.InvalidShowtimeStateException;
import com.cinebook.theater.application.exception.ShowtimeNotFoundException;
import com.cinebook.theater.domain.model.Auditorium;
import com.cinebook.theater.domain.model.AuditoriumStatus;
import com.cinebook.theater.domain.model.Seat;
import com.cinebook.theater.domain.model.Showtime;
import com.cinebook.theater.domain.model.ShowtimeStatus;
import com.cinebook.theater.domain.model.Theater;
import com.cinebook.theater.infrastructure.client.MovieServiceClient;
import com.cinebook.theater.infrastructure.client.dto.MovieSummaryResponse;
import com.cinebook.theater.infrastructure.repository.AuditoriumRepository;
import com.cinebook.theater.infrastructure.repository.SeatRepository;
import com.cinebook.theater.infrastructure.repository.ShowtimeRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ShowtimeService {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ShowtimeRepository showtimeRepository;
    private final AuditoriumRepository auditoriumRepository;
    private final SeatRepository seatRepository;
    private final MovieServiceClient movieServiceClient;
    private final ShowtimeScheduleValidator scheduleValidator;

    public ShowtimeService(
        ShowtimeRepository showtimeRepository,
        AuditoriumRepository auditoriumRepository,
        SeatRepository seatRepository,
        MovieServiceClient movieServiceClient,
        ShowtimeScheduleValidator scheduleValidator
    ) {
        this.showtimeRepository = showtimeRepository;
        this.auditoriumRepository = auditoriumRepository;
        this.seatRepository = seatRepository;
        this.movieServiceClient = movieServiceClient;
        this.scheduleValidator = scheduleValidator;
    }

    @Transactional
    public ShowtimeResponse createShowtime(ShowtimeCreateRequest request) {
        Auditorium auditorium = auditoriumRepository.findById(request.auditoriumId())
            .orElseThrow(() -> new AuditoriumNotFoundException(request.auditoriumId()));

        if (auditorium.getStatus() != AuditoriumStatus.ACTIVE) {
            throw new IllegalArgumentException("Phòng chiếu đang không ở trạng thái hoạt động (ACTIVE)");
        }

        MovieSummaryResponse movie = movieServiceClient.validateAndGetMovie(request.movieId());

        int cleaningMin = request.cleaningDurationMin() != null ? request.cleaningDurationMin() : 15;
        Instant endTime = scheduleValidator.calculateEndTime(request.startTime(), movie.durationMin(), cleaningMin);

        scheduleValidator.validateTiming(request.startTime(), endTime);
        scheduleValidator.validateNoOverlap(auditorium.getId(), request.startTime(), endTime, null);

        BigDecimal priceStd = request.priceStandard() != null ? request.priceStandard() : new BigDecimal("90000");
        BigDecimal priceVip = request.priceVip() != null ? request.priceVip() : new BigDecimal("110000");
        BigDecimal priceCouple = request.priceCouple() != null ? request.priceCouple() : new BigDecimal("180000");

        Showtime showtime = new Showtime(
            auditorium,
            request.movieId(),
            request.startTime(),
            endTime,
            movie.durationMin(),
            cleaningMin,
            priceStd,
            priceVip,
            priceCouple,
            ShowtimeStatus.SCHEDULED
        );

        Showtime saved = showtimeRepository.save(showtime);
        return ShowtimeResponse.from(saved);
    }

    @Transactional
    public ShowtimeResponse updateShowtime(UUID id, ShowtimeUpdateRequest request) {
        Showtime showtime = showtimeRepository.findById(id)
            .orElseThrow(() -> new ShowtimeNotFoundException(id));

        if (showtime.getStatus() != ShowtimeStatus.SCHEDULED) {
            throw new InvalidShowtimeStateException("Chỉ có thể chỉnh sửa thông tin suất chiếu ở trạng thái SCHEDULED");
        }

        int cleaningMin = request.cleaningDurationMin() != null
            ? request.cleaningDurationMin()
            : showtime.getCleaningDurationMin();
        Instant endTime = scheduleValidator.calculateEndTime(request.startTime(), showtime.getMovieDurationMin(), cleaningMin);

        scheduleValidator.validateTiming(request.startTime(), endTime);
        scheduleValidator.validateNoOverlap(showtime.getAuditorium().getId(), request.startTime(), endTime, id);

        showtime.setStartTime(request.startTime());
        showtime.setEndTime(endTime);
        showtime.setCleaningDurationMin(cleaningMin);

        if (request.priceStandard() != null) {
            showtime.setPriceStandard(request.priceStandard());
        }
        if (request.priceVip() != null) {
            showtime.setPriceVip(request.priceVip());
        }
        if (request.priceCouple() != null) {
            showtime.setPriceCouple(request.priceCouple());
        }

        Showtime updated = showtimeRepository.save(showtime);
        return ShowtimeResponse.from(updated);
    }

    @Transactional
    public ShowtimeResponse updateStatus(UUID id, ShowtimeStatus newStatus) {
        Showtime showtime = showtimeRepository.findById(id)
            .orElseThrow(() -> new ShowtimeNotFoundException(id));

        ShowtimeStatus current = showtime.getStatus();
        if (current == newStatus) {
            return ShowtimeResponse.from(showtime);
        }

        validateStateTransition(current, newStatus);

        showtime.setStatus(newStatus);
        Showtime updated = showtimeRepository.save(showtime);
        return ShowtimeResponse.from(updated);
    }

    @Transactional
    public void deleteShowtime(UUID id) {
        Showtime showtime = showtimeRepository.findById(id)
            .orElseThrow(() -> new ShowtimeNotFoundException(id));

        if (showtime.getStatus() == ShowtimeStatus.SELLING) {
            throw new InvalidShowtimeStateException(
                "Không thể xóa suất chiếu đang mở bán (SELLING), vui lòng chuyển sang CANCELLED trước"
            );
        }

        showtimeRepository.delete(showtime);
    }

    public ShowtimeResponse getShowtimeById(UUID id) {
        Showtime showtime = showtimeRepository.findById(id)
            .orElseThrow(() -> new ShowtimeNotFoundException(id));
        return ShowtimeResponse.from(showtime);
    }

    public PageResponse<ShowtimeResponse> getShowtimesWithFilters(
        UUID theaterId,
        UUID auditoriumId,
        UUID movieId,
        ShowtimeStatus status,
        LocalDate date,
        Pageable pageable
    ) {
        Specification<Showtime> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (theaterId != null) {
                predicates.add(cb.equal(root.get("auditorium").get("theater").get("id"), theaterId));
            }

            if (auditoriumId != null) {
                predicates.add(cb.equal(root.get("auditorium").get("id"), auditoriumId));
            }

            if (movieId != null) {
                predicates.add(cb.equal(root.get("movieId"), movieId));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (date != null) {
                Instant startOfDay = date.atStartOfDay(VIETNAM_ZONE).toInstant();
                Instant endOfDay = date.plusDays(1).atStartOfDay(VIETNAM_ZONE).toInstant();
                predicates.add(cb.greaterThanOrEqualTo(root.get("startTime"), startOfDay));
                predicates.add(cb.lessThan(root.get("startTime"), endOfDay));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Showtime> page = showtimeRepository.findAll(spec, pageable);
        List<ShowtimeResponse> items = page.getContent().stream().map(ShowtimeResponse::from).toList();
        return PageResponse.of(items, page.getTotalElements(), page.getNumber(), page.getSize());
    }

    public List<MovieShowtimeGroupResponse> getShowtimesForMovie(
        UUID movieId,
        LocalDate date,
        UUID theaterId,
        String city
    ) {
        LocalDate targetDate = date != null ? date : LocalDate.now(VIETNAM_ZONE);
        Instant startOfDay = targetDate.atStartOfDay(VIETNAM_ZONE).toInstant();
        Instant endOfDay = targetDate.plusDays(1).atStartOfDay(VIETNAM_ZONE).toInstant();

        String cleanCity = (city != null && !city.isBlank()) ? city.trim() : null;

        List<Showtime> showtimes = showtimeRepository.findActiveShowtimesForMovie(
            movieId,
            startOfDay,
            endOfDay,
            theaterId,
            cleanCity
        );

        Map<Theater, List<Showtime>> grouped = showtimes.stream()
            .collect(Collectors.groupingBy(
                s -> s.getAuditorium().getTheater(),
                LinkedHashMap::new,
                Collectors.toList()
            ));

        List<MovieShowtimeGroupResponse> result = new ArrayList<>();
        for (Map.Entry<Theater, List<Showtime>> entry : grouped.entrySet()) {
            Theater theater = entry.getKey();
            List<ShowtimeItemResponse> showtimeItems = entry.getValue().stream()
                .map(ShowtimeItemResponse::from)
                .toList();

            result.add(new MovieShowtimeGroupResponse(
                theater.getId(),
                theater.getName(),
                theater.getAddress(),
                theater.getCity(),
                showtimeItems
            ));
        }

        return result;
    }

    public ShowtimeSeatMapResponse getSeatMapForShowtime(UUID id) {
        Showtime showtime = showtimeRepository.findById(id)
            .orElseThrow(() -> new ShowtimeNotFoundException(id));

        Auditorium auditorium = showtime.getAuditorium();
        List<Seat> seats = seatRepository.findByAuditoriumIdOrderByRowLabelAscSeatNumberAsc(auditorium.getId());

        Map<String, BigDecimal> prices = Map.of(
            "STANDARD", showtime.getPriceStandard(),
            "VIP", showtime.getPriceVip(),
            "COUPLE", showtime.getPriceCouple()
        );

        List<SeatResponse> seatResponses = seats.stream().map(SeatResponse::from).toList();

        return new ShowtimeSeatMapResponse(
            showtime.getId(),
            auditorium.getId(),
            auditorium.getName(),
            auditorium.getFormat() != null ? auditorium.getFormat().name() : "2D",
            prices,
            seats.size(),
            seatResponses
        );
    }

    private void validateStateTransition(ShowtimeStatus current, ShowtimeStatus next) {
        switch (current) {
            case SCHEDULED -> {
                if (next != ShowtimeStatus.SELLING && next != ShowtimeStatus.CANCELLED) {
                    throw new InvalidShowtimeStateException(
                        "Suất chiếu SCHEDULED chỉ có thể chuyển sang SELLING hoặc CANCELLED"
                    );
                }
            }
            case SELLING -> {
                if (next != ShowtimeStatus.ENDED && next != ShowtimeStatus.CANCELLED) {
                    throw new InvalidShowtimeStateException(
                        "Suất chiếu SELLING chỉ có thể chuyển sang ENDED hoặc CANCELLED"
                    );
                }
            }
            case ENDED -> throw new InvalidShowtimeStateException(
                "Suất chiếu đã kết thúc (ENDED), không thể chuyển sang trạng thái khác"
            );
            case CANCELLED -> throw new InvalidShowtimeStateException(
                "Suất chiếu đã bị hủy (CANCELLED), không thể chuyển sang trạng thái khác"
            );
        }
    }
}
