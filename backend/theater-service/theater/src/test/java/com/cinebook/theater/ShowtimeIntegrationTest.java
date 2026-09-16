package com.cinebook.theater;

import com.cinebook.theater.api.GlobalExceptionHandler;
import com.cinebook.theater.api.ShowtimeAdminController;
import com.cinebook.theater.api.ShowtimePublicController;
import com.cinebook.theater.application.ShowtimeScheduleValidator;
import com.cinebook.theater.application.ShowtimeService;
import com.cinebook.theater.domain.model.Auditorium;
import com.cinebook.theater.domain.model.Showtime;
import com.cinebook.theater.domain.model.ShowtimeStatus;
import com.cinebook.theater.infrastructure.client.MovieServiceClient;
import com.cinebook.theater.infrastructure.client.dto.MovieSummaryResponse;
import com.cinebook.theater.infrastructure.repository.AuditoriumRepository;
import com.cinebook.theater.infrastructure.repository.SeatRepository;
import com.cinebook.theater.infrastructure.repository.ShowtimeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
class ShowtimeIntegrationTest extends PostgresIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private AuditoriumRepository auditoriumRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private ShowtimeScheduleValidator validator;

    @Autowired
    private GlobalExceptionHandler globalExceptionHandler;

    private MovieServiceClient movieServiceClient;
    private ShowtimeService showtimeService;

    @BeforeEach
    void setUp() {
        movieServiceClient = Mockito.mock(MovieServiceClient.class);
        showtimeService = new ShowtimeService(
            showtimeRepository,
            auditoriumRepository,
            seatRepository,
            movieServiceClient,
            validator
        );

        ShowtimeAdminController adminController = new ShowtimeAdminController(showtimeService);
        ShowtimePublicController publicController = new ShowtimePublicController(showtimeService);

        mockMvc = MockMvcBuilders.standaloneSetup(adminController, publicController)
            .setControllerAdvice(globalExceptionHandler)
            .build();
    }

    @Test
    @DisplayName("Quy trình tạo suất chiếu thành công: Gọi movie-service tính tự động endTime = start + duration + cleaning")
    void testCreateShowtimeSuccess() throws Exception {
        Auditorium auditorium = auditoriumRepository.findAll().get(0);
        UUID auditoriumId = auditorium.getId();
        UUID movieId = UUID.randomUUID();

        when(movieServiceClient.validateAndGetMovie(movieId))
            .thenReturn(new MovieSummaryResponse(movieId, "Avatar 3: Fire and Ash", 150, "P", "NOW_SHOWING"));

        Instant startTime = Instant.now().plus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS);

        String createReqJson = String.format("""
            {
                "auditoriumId": "%s",
                "movieId": "%s",
                "startTime": "%s",
                "cleaningDurationMin": 15,
                "priceStandard": 95000,
                "priceVip": 120000,
                "priceCouple": 200000
            }
        """, auditoriumId, movieId, startTime);

        Instant expectedEndTime = startTime.plus(165, ChronoUnit.MINUTES);

        mockMvc.perform(post("/api/admin/showtimes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createReqJson))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.auditoriumId", is(auditoriumId.toString())))
            .andExpect(jsonPath("$.movieId", is(movieId.toString())))
            .andExpect(jsonPath("$.startTime", is(startTime.toString())))
            .andExpect(jsonPath("$.endTime", is(expectedEndTime.toString())))
            .andExpect(jsonPath("$.movieDurationMin", is(150)))
            .andExpect(jsonPath("$.cleaningDurationMin", is(15)))
            .andExpect(jsonPath("$.status", is("SCHEDULED")))
            .andExpect(jsonPath("$.priceStandard", is(95000)))
            .andExpect(jsonPath("$.priceVip", is(120000)))
            .andExpect(jsonPath("$.priceCouple", is(200000)));
    }

    @Test
    @DisplayName("Chặn tạo suất chiếu trong quá khứ với lỗi 400 SHOWTIME_IN_PAST")
    void testCreateShowtimeInPastFails() throws Exception {
        Auditorium auditorium = auditoriumRepository.findAll().get(0);
        UUID auditoriumId = auditorium.getId();
        UUID movieId = UUID.randomUUID();

        when(movieServiceClient.validateAndGetMovie(movieId))
            .thenReturn(new MovieSummaryResponse(movieId, "Dune: Part Two", 166, "T16", "NOW_SHOWING"));

        Instant pastStart = Instant.now().minus(2, ChronoUnit.HOURS).truncatedTo(ChronoUnit.SECONDS);

        String createReqJson = String.format("""
            {
                "auditoriumId": "%s",
                "movieId": "%s",
                "startTime": "%s",
                "cleaningDurationMin": 15
            }
        """, auditoriumId, movieId, pastStart);

        mockMvc.perform(post("/api/admin/showtimes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createReqJson))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code", is("SHOWTIME_IN_PAST")));
    }

    @Test
    @DisplayName("Chặn tạo suất chiếu bị trùng lịch với lỗi 409 SHOWTIME_OVERLAP")
    void testCreateShowtimeOverlapFails() throws Exception {
        Auditorium auditorium = auditoriumRepository.findAll().get(0);
        UUID auditoriumId = auditorium.getId();
        UUID movieId1 = UUID.randomUUID();
        UUID movieId2 = UUID.randomUUID();

        when(movieServiceClient.validateAndGetMovie(any()))
            .thenReturn(new MovieSummaryResponse(movieId1, "Movie 1", 120, "T13", "NOW_SHOWING"));

        Instant baseStart = Instant.now().plus(3, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS).plus(14, ChronoUnit.HOURS);
        Instant baseEnd = baseStart.plus(135, ChronoUnit.MINUTES); // 120m + 15m cleaning

        Showtime existing = new Showtime(
            auditorium,
            movieId1,
            baseStart,
            baseEnd,
            120,
            15,
            new BigDecimal("90000"),
            new BigDecimal("110000"),
            new BigDecimal("180000"),
            ShowtimeStatus.SCHEDULED
        );
        showtimeRepository.saveAndFlush(existing);

        // Suất chiếu mới bắt đầu lúc 15:00 (nằm trong 14:00 - 16:15) -> Trùng lịch
        Instant overlappingStart = baseStart.plus(60, ChronoUnit.MINUTES);
        String overlapReqJson = String.format("""
            {
                "auditoriumId": "%s",
                "movieId": "%s",
                "startTime": "%s",
                "cleaningDurationMin": 15
            }
        """, auditoriumId, movieId2, overlappingStart);

        mockMvc.perform(post("/api/admin/showtimes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(overlapReqJson))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code", is("SHOWTIME_OVERLAP")));
    }

    @Test
    @DisplayName("Kiểm tra State Machine: SCHEDULED -> SELLING -> ENDED; Chặn chuyển ngược từ ENDED về SELLING")
    void testShowtimeStateMachineTransitions() throws Exception {
        Auditorium auditorium = auditoriumRepository.findAll().get(0);
        Instant start = Instant.now().plus(4, ChronoUnit.DAYS);
        Instant end = start.plus(135, ChronoUnit.MINUTES);

        Showtime showtime = new Showtime(
            auditorium,
            UUID.randomUUID(),
            start,
            end,
            120,
            15,
            new BigDecimal("90000"),
            new BigDecimal("110000"),
            new BigDecimal("180000"),
            ShowtimeStatus.SCHEDULED
        );
        showtime = showtimeRepository.saveAndFlush(showtime);
        UUID showtimeId = showtime.getId();

        // 1. Chuyển SCHEDULED -> SELLING thành công
        String toSellingJson = """
            { "status": "SELLING" }
        """;
        mockMvc.perform(patch("/api/admin/showtimes/{id}/status", showtimeId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(toSellingJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("SELLING")));

        // 2. Chuyển SELLING -> ENDED thành công
        String toEndedJson = """
            { "status": "ENDED" }
        """;
        mockMvc.perform(patch("/api/admin/showtimes/{id}/status", showtimeId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(toEndedJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", is("ENDED")));

        // 3. Thử chuyển từ ENDED về SELLING -> 400 INVALID_SHOWTIME_STATE
        mockMvc.perform(patch("/api/admin/showtimes/{id}/status", showtimeId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(toSellingJson))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code", is("INVALID_SHOWTIME_STATE")));
    }

    @Test
    @DisplayName("Chặn xóa hoặc sửa suất chiếu đang ở trạng thái SELLING")
    void testCannotDeleteOrUpdateSellingShowtime() throws Exception {
        Auditorium auditorium = auditoriumRepository.findAll().get(0);
        Instant start = Instant.now().plus(5, ChronoUnit.DAYS);
        Instant end = start.plus(135, ChronoUnit.MINUTES);

        Showtime showtime = new Showtime(
            auditorium,
            UUID.randomUUID(),
            start,
            end,
            120,
            15,
            new BigDecimal("90000"),
            new BigDecimal("110000"),
            new BigDecimal("180000"),
            ShowtimeStatus.SELLING
        );
        showtime = showtimeRepository.saveAndFlush(showtime);
        UUID showtimeId = showtime.getId();

        // 1. Chặn DELETE khi SELLING -> 400 INVALID_SHOWTIME_STATE
        mockMvc.perform(delete("/api/admin/showtimes/{id}", showtimeId))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code", is("INVALID_SHOWTIME_STATE")));

        // 2. Chặn PUT cập nhật khi SELLING -> 400 INVALID_SHOWTIME_STATE
        String updateReq = String.format("""
            {
                "startTime": "%s",
                "priceStandard": 100000
            }
        """, start.plus(30, ChronoUnit.MINUTES));

        mockMvc.perform(put("/api/admin/showtimes/{id}", showtimeId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateReq))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code", is("INVALID_SHOWTIME_STATE")));
    }

    @Test
    @DisplayName("Public APIs: Lấy lịch chiếu theo phim gom nhóm theo rạp & Lấy sơ đồ ghế kèm bảng giá")
    void testPublicShowtimeAPIs() throws Exception {
        Auditorium auditorium = auditoriumRepository.findAll().get(0);
        UUID movieId = UUID.randomUUID();

        Instant start = Instant.now().plus(4, ChronoUnit.HOURS).truncatedTo(ChronoUnit.MINUTES);
        Instant end = start.plus(135, ChronoUnit.MINUTES);

        Showtime showtime = new Showtime(
            auditorium,
            movieId,
            start,
            end,
            120,
            15,
            new BigDecimal("90000"),
            new BigDecimal("110000"),
            new BigDecimal("180000"),
            ShowtimeStatus.SELLING
        );
        showtime = showtimeRepository.saveAndFlush(showtime);
        UUID showtimeId = showtime.getId();

        // 1. GET /api/movies/{movieId}/showtimes -> Gom nhóm theo rạp
        mockMvc.perform(get("/api/movies/{movieId}/showtimes", movieId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].theaterName", is(auditorium.getTheater().getName())))
            .andExpect(jsonPath("$[0].showtimes", hasSize(1)))
            .andExpect(jsonPath("$[0].showtimes[0].id", is(showtimeId.toString())))
            .andExpect(jsonPath("$[0].showtimes[0].status", is("SELLING")));

        // Bộ lọc city không phân biệt hoa thường và không phát sinh lower(bytea)
        mockMvc.perform(get("/api/movies/{movieId}/showtimes", movieId)
                .param("city", auditorium.getTheater().getCity().toUpperCase()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)));

        // 2. GET /api/showtimes/{id}/seats -> Sơ đồ ghế và bảng giá
        mockMvc.perform(get("/api/showtimes/{id}/seats", showtimeId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.showtimeId", is(showtimeId.toString())))
            .andExpect(jsonPath("$.auditoriumName", is(auditorium.getName())))
            .andExpect(jsonPath("$.prices.STANDARD", is(90000)))
            .andExpect(jsonPath("$.prices.VIP", is(110000)))
            .andExpect(jsonPath("$.prices.COUPLE", is(180000)))
            .andExpect(jsonPath("$.totalSeats", is(auditorium.getTotalSeats())))
            .andExpect(jsonPath("$.seats", hasSize(auditorium.getTotalSeats())));
    }
}
