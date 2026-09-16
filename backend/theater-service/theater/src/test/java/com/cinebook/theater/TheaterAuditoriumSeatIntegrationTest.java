package com.cinebook.theater;

import com.cinebook.theater.api.AuditoriumAdminController;
import com.cinebook.theater.api.GlobalExceptionHandler;
import com.cinebook.theater.api.SeatAdminController;
import com.cinebook.theater.api.SeatPublicController;
import com.cinebook.theater.api.TheaterAdminController;
import com.cinebook.theater.api.TheaterPublicController;
import com.cinebook.theater.domain.model.Auditorium;
import com.cinebook.theater.domain.model.Showtime;
import com.cinebook.theater.domain.model.ShowtimeStatus;
import com.cinebook.theater.domain.model.Theater;
import com.cinebook.theater.infrastructure.repository.AuditoriumRepository;
import com.cinebook.theater.infrastructure.repository.SeatRepository;
import com.cinebook.theater.infrastructure.repository.ShowtimeRepository;
import com.cinebook.theater.infrastructure.repository.TheaterRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
class TheaterAuditoriumSeatIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private TheaterAdminController theaterAdminController;

    @Autowired
    private TheaterPublicController theaterPublicController;

    @Autowired
    private AuditoriumAdminController auditoriumAdminController;

    @Autowired
    private SeatAdminController seatAdminController;

    @Autowired
    private SeatPublicController seatPublicController;

    @Autowired
    private GlobalExceptionHandler globalExceptionHandler;

    @Autowired
    private TheaterRepository theaterRepository;

    @Autowired
    private AuditoriumRepository auditoriumRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(
            theaterAdminController,
            theaterPublicController,
            auditoriumAdminController,
            seatAdminController,
            seatPublicController
        ).setControllerAdvice(globalExceptionHandler).build();
    }

    @Test
    @DisplayName("Quy trình hoàn chỉnh: Tạo rạp -> Tạo phòng chiếu -> Sinh sơ đồ ghế tự động -> Truy vấn công khai")
    void testCompleteTheaterAuditoriumSeatFlow() throws Exception {
        // 1. POST /api/admin/theaters -> Tạo rạp mới
        String createTheaterJson = """
            {
                "name": "CineBook Da Nang Riverside",
                "address": "123 Duong Bach Dang, Hai Chau",
                "city": "Da Nang",
                "hotline": "1900 8888",
                "openingHours": "08:30 - 23:30",
                "features": ["IMAX", "Dolby Atmos", "Parking"],
                "imageUrl": "https://images.unsplash.com/photo-danang.jpg",
                "status": "ACTIVE"
            }
        """;

        mockMvc.perform(post("/api/admin/theaters")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createTheaterJson))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name", is("CineBook Da Nang Riverside")))
            .andExpect(jsonPath("$.city", is("Da Nang")))
            .andExpect(jsonPath("$.status", is("ACTIVE")));

        Theater createdTheater = theaterRepository.findAll().stream()
            .filter(t -> "CineBook Da Nang Riverside".equals(t.getName()))
            .findFirst()
            .orElseThrow();
        UUID theaterId = createdTheater.getId();

        // 2. GET /api/theaters?city=Da Nang -> Tìm thấy rạp vừa tạo
        mockMvc.perform(get("/api/theaters").param("city", "Da Nang"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].id", is(theaterId.toString())));

        // 3. POST /api/admin/theaters/{theaterId}/auditoriums -> Tạo phòng chiếu
        String createAudiJson = """
            {
                "name": "Screen 01 IMAX",
                "format": "IMAX_LASER",
                "status": "ACTIVE"
            }
        """;

        mockMvc.perform(post("/api/admin/theaters/{theaterId}/auditoriums", theaterId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(createAudiJson))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name", is("Screen 01 IMAX")))
            .andExpect(jsonPath("$.format", is("IMAX_LASER")))
            .andExpect(jsonPath("$.totalSeats", is(0)));

        Auditorium createdAudi = auditoriumRepository.findByTheaterIdOrderByNameAsc(theaterId).get(0);
        UUID auditoriumId = createdAudi.getId();

        // 4. Thử tạo phòng chiếu trùng tên trong cùng rạp -> 409 CONFLICT
        mockMvc.perform(post("/api/admin/theaters/{theaterId}/auditoriums", theaterId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(createAudiJson))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code", is("DUPLICATE_RESOURCE")));

        // 5. POST /api/admin/auditoriums/{id}/seats/generate -> Sinh sơ đồ ghế tự động
        String generateSeatsJson = """
            {
                "rows": [
                    { "label": "A", "seatCount": 10, "seatType": "STANDARD" },
                    { "label": "B", "seatCount": 8, "seatType": "VIP" }
                ]
            }
        """;

        mockMvc.perform(post("/api/admin/auditoriums/{id}/seats/generate", auditoriumId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(generateSeatsJson))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.auditoriumId", is(auditoriumId.toString())))
            .andExpect(jsonPath("$.totalSeats", is(18)))
            .andExpect(jsonPath("$.seats", hasSize(18)))
            .andExpect(jsonPath("$.seats[0].displayName", is("A1")))
            .andExpect(jsonPath("$.seats[0].seatType", is("STANDARD")))
            .andExpect(jsonPath("$.seats[10].displayName", is("B1")))
            .andExpect(jsonPath("$.seats[10].seatType", is("VIP")));

        // Kiểm tra totalSeats trong DB của auditorium đã cập nhật thành 18
        Auditorium updatedAudi = auditoriumRepository.findById(auditoriumId).orElseThrow();
        assertThat(updatedAudi.getTotalSeats()).isEqualTo(18);

        // 6. GET /api/auditoriums/{id}/seats -> Kiểm tra public endpoint
        mockMvc.perform(get("/api/auditoriums/{id}/seats", auditoriumId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalSeats", is(18)))
            .andExpect(jsonPath("$.seats", hasSize(18)));

        // 7. GET /api/theaters/{id} -> Xem thông tin chi tiết rạp kèm danh sách phòng chiếu
        mockMvc.perform(get("/api/theaters/{id}", theaterId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name", is("CineBook Da Nang Riverside")))
            .andExpect(jsonPath("$.totalRooms", is(1)))
            .andExpect(jsonPath("$.totalSeats", is(18)))
            .andExpect(jsonPath("$.auditoriums", hasSize(1)))
            .andExpect(jsonPath("$.auditoriums[0].name", is("Screen 01 IMAX")));

        // 8. PUT /api/admin/theaters/{id} -> Cập nhật thông tin rạp
        String updateTheaterJson = """
            {
                "name": "CineBook Da Nang Riverside Renovated",
                "address": "123 Duong Bach Dang, Hai Chau",
                "city": "Da Nang",
                "hotline": "1900 9999",
                "openingHours": "08:00 - 24:00",
                "features": ["IMAX", "Dolby Atmos", "VIP Lounge"],
                "imageUrl": "https://images.unsplash.com/photo-danang-new.jpg",
                "status": "ACTIVE"
            }
        """;

        mockMvc.perform(put("/api/admin/theaters/{id}", theaterId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateTheaterJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name", is("CineBook Da Nang Riverside Renovated")))
            .andExpect(jsonPath("$.hotline", is("1900 9999")));
    }

    @Test
    @DisplayName("Kiểm tra an toàn: Chặn xóa phòng chiếu và rạp nếu đang có suất chiếu trong tương lai")
    void testSafetyCheckPreventsDeletionWhenFutureShowtimesExist() throws Exception {
        Auditorium auditorium = auditoriumRepository.findAll().get(0);
        UUID theaterId = auditorium.getTheater().getId();
        UUID auditoriumId = auditorium.getId();

        // Tạo suất chiếu tương lai
        Instant futureStart = Instant.now().plus(2, ChronoUnit.DAYS);
        Instant futureEnd = futureStart.plus(120, ChronoUnit.MINUTES);

        Showtime futureShowtime = new Showtime(
            auditorium,
            UUID.randomUUID(),
            futureStart,
            futureEnd,
            105,
            15,
            new BigDecimal("90000"),
            new BigDecimal("110000"),
            new BigDecimal("180000"),
            ShowtimeStatus.SCHEDULED
        );
        showtimeRepository.saveAndFlush(futureShowtime);

        // Chặn xóa phòng chiếu -> 409 Conflict
        mockMvc.perform(delete("/api/admin/auditoriums/{id}", auditoriumId))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code", is("AUDITORIUM_IN_USE")));

        // Chặn xóa cụm rạp -> 409 Conflict
        mockMvc.perform(delete("/api/admin/theaters/{id}", theaterId))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code", is("THEATER_IN_USE")));

        // Chặn sinh lại sơ đồ ghế của phòng -> 409 Conflict
        String seatGenJson = """
            {
                "rows": [
                    { "label": "A", "seatCount": 5, "seatType": "STANDARD" }
                ]
            }
        """;
        mockMvc.perform(post("/api/admin/auditoriums/{id}/seats/generate", auditoriumId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(seatGenJson))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code", is("AUDITORIUM_IN_USE")));
    }

    @Test
    @DisplayName("Kiểm tra Validation lỗi: Request thiếu trường bắt buộc trả về 400 VALIDATION_ERROR")
    void testValidationFailureReturns400() throws Exception {
        String invalidReqJson = """
            {
                "name": "",
                "address": "",
                "city": ""
            }
        """;

        mockMvc.perform(post("/api/admin/theaters")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidReqJson))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));
    }
}
