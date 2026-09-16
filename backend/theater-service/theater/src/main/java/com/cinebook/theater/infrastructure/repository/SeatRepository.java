package com.cinebook.theater.infrastructure.repository;

import com.cinebook.theater.domain.model.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SeatRepository extends JpaRepository<Seat, UUID> {

    List<Seat> findByAuditoriumIdOrderByRowLabelAscSeatNumberAsc(UUID auditoriumId);

    long countByAuditoriumId(UUID auditoriumId);

    @Modifying
    @Query("DELETE FROM Seat s WHERE s.auditorium.id = :auditoriumId")
    void deleteByAuditoriumId(@Param("auditoriumId") UUID auditoriumId);

    boolean existsByAuditoriumIdAndRowLabelAndSeatNumber(UUID auditoriumId, String rowLabel, int seatNumber);
}
