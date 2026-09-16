package com.cinebook.theater.infrastructure.repository;

import com.cinebook.theater.domain.model.Auditorium;
import com.cinebook.theater.domain.model.AuditoriumStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditoriumRepository extends JpaRepository<Auditorium, UUID> {

    List<Auditorium> findByTheaterIdOrderByNameAsc(UUID theaterId);

    List<Auditorium> findByTheaterIdAndStatusOrderByNameAsc(UUID theaterId, AuditoriumStatus status);

    boolean existsByTheaterIdAndNameIgnoreCase(UUID theaterId, String name);

    boolean existsByTheaterIdAndNameIgnoreCaseAndIdNot(UUID theaterId, String name, UUID id);

    long countByTheaterId(UUID theaterId);
}
