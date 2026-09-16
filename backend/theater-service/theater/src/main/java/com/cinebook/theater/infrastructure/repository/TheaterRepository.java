package com.cinebook.theater.infrastructure.repository;

import com.cinebook.theater.domain.model.Theater;
import com.cinebook.theater.domain.model.TheaterStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TheaterRepository extends JpaRepository<Theater, UUID>, JpaSpecificationExecutor<Theater> {

    List<Theater> findByStatusOrderByNameAsc(TheaterStatus status);

    List<Theater> findByCityAndStatusOrderByNameAsc(String city, TheaterStatus status);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);
}
