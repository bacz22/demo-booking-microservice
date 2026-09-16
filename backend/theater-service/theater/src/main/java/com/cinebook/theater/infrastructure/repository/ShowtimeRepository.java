package com.cinebook.theater.infrastructure.repository;

import com.cinebook.theater.domain.model.Showtime;
import com.cinebook.theater.domain.model.ShowtimeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, UUID>, JpaSpecificationExecutor<Showtime> {

    @Query("""
        SELECT s FROM Showtime s
        WHERE s.auditorium.id = :auditoriumId
          AND s.status != 'CANCELLED'
          AND (:excludeId IS NULL OR s.id != :excludeId)
          AND s.startTime < :endTime
          AND s.endTime > :startTime
    """)
    List<Showtime> findOverlappingShowtimes(
        @Param("auditoriumId") UUID auditoriumId,
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime,
        @Param("excludeId") UUID excludeId
    );

    @Query("""
        SELECT s FROM Showtime s
        JOIN s.auditorium a
        JOIN a.theater t
        WHERE s.movieId = :movieId
          AND s.startTime >= :start
          AND s.startTime < :end
          AND (:theaterId IS NULL OR t.id = :theaterId)
          AND (:city IS NULL OR LOWER(t.city) = :city)
          AND t.status = 'ACTIVE'
          AND a.status = 'ACTIVE'
          AND s.status IN ('SCHEDULED', 'SELLING')
        ORDER BY t.name ASC, a.name ASC, s.startTime ASC
    """)
    List<Showtime> findActiveShowtimesForMovie(
        @Param("movieId") UUID movieId,
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("theaterId") UUID theaterId,
        @Param("city") String city
    );

    @Query("""
        SELECT s FROM Showtime s
        JOIN s.auditorium a
        JOIN a.theater t
        WHERE (:theaterId IS NULL OR t.id = :theaterId)
          AND (:auditoriumId IS NULL OR a.id = :auditoriumId)
          AND (:movieId IS NULL OR s.movieId = :movieId)
          AND (:status IS NULL OR s.status = :status)
          AND (:startFrom IS NULL OR s.startTime >= :startFrom)
          AND (:startTo IS NULL OR s.startTime < :startTo)
        ORDER BY s.startTime DESC
    """)
    Page<Showtime> findShowtimesWithFilters(
        @Param("theaterId") UUID theaterId,
        @Param("auditoriumId") UUID auditoriumId,
        @Param("movieId") UUID movieId,
        @Param("status") ShowtimeStatus status,
        @Param("startFrom") Instant startFrom,
        @Param("startTo") Instant startTo,
        Pageable pageable
    );

    boolean existsByAuditoriumIdAndStartTimeAfterAndStatusNot(UUID auditoriumId, Instant after, ShowtimeStatus status);

    @Query("""
        SELECT COUNT(s) > 0 FROM Showtime s
        JOIN s.auditorium a
        WHERE a.theater.id = :theaterId
          AND s.startTime > :after
          AND s.status != :status
    """)
    boolean existsUpcomingShowtimesByTheater(
        @Param("theaterId") UUID theaterId,
        @Param("after") Instant after,
        @Param("status") ShowtimeStatus status
    );
}
