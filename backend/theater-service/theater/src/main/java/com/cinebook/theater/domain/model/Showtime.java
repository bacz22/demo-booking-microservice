package com.cinebook.theater.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "showtimes")
public class Showtime {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auditorium_id", nullable = false)
    private Auditorium auditorium;

    @Column(name = "movie_id", nullable = false)
    private UUID movieId;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time", nullable = false)
    private Instant endTime;

    @Column(name = "movie_duration_min", nullable = false)
    private int movieDurationMin;

    @Column(name = "cleaning_duration_min", nullable = false)
    private int cleaningDurationMin = 15;

    @Column(name = "price_standard", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceStandard = new BigDecimal("90000");

    @Column(name = "price_vip", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceVip = new BigDecimal("110000");

    @Column(name = "price_couple", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceCouple = new BigDecimal("180000");

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ShowtimeStatus status = ShowtimeStatus.SCHEDULED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Showtime() {
    }

    public Showtime(Auditorium auditorium, UUID movieId, Instant startTime, Instant endTime, int movieDurationMin, int cleaningDurationMin, BigDecimal priceStandard, BigDecimal priceVip, BigDecimal priceCouple, ShowtimeStatus status) {
        this.auditorium = auditorium;
        this.movieId = movieId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.movieDurationMin = movieDurationMin;
        setCleaningDurationMin(cleaningDurationMin);
        this.priceStandard = priceStandard != null ? priceStandard : new BigDecimal("90000");
        this.priceVip = priceVip != null ? priceVip : new BigDecimal("110000");
        this.priceCouple = priceCouple != null ? priceCouple : new BigDecimal("180000");
        this.status = status != null ? status : ShowtimeStatus.SCHEDULED;
    }

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
        if (this.status == null) {
            this.status = ShowtimeStatus.SCHEDULED;
        }
        validateCleaningDuration(this.cleaningDurationMin);
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Auditorium getAuditorium() {
        return auditorium;
    }

    public void setAuditorium(Auditorium auditorium) {
        this.auditorium = auditorium;
    }

    public UUID getMovieId() {
        return movieId;
    }

    public void setMovieId(UUID movieId) {
        this.movieId = movieId;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    public void setEndTime(Instant endTime) {
        this.endTime = endTime;
    }

    public int getMovieDurationMin() {
        return movieDurationMin;
    }

    public void setMovieDurationMin(int movieDurationMin) {
        this.movieDurationMin = movieDurationMin;
    }

    public int getCleaningDurationMin() {
        return cleaningDurationMin;
    }

    public void setCleaningDurationMin(int cleaningDurationMin) {
        validateCleaningDuration(cleaningDurationMin);
        this.cleaningDurationMin = cleaningDurationMin;
    }

    private static void validateCleaningDuration(int cleaningDurationMin) {
        if (cleaningDurationMin < 0) {
            throw new IllegalArgumentException("Thời gian dọn phòng không được âm");
        }
    }

    public BigDecimal getPriceStandard() {
        return priceStandard;
    }

    public void setPriceStandard(BigDecimal priceStandard) {
        this.priceStandard = priceStandard;
    }

    public BigDecimal getPriceVip() {
        return priceVip;
    }

    public void setPriceVip(BigDecimal priceVip) {
        this.priceVip = priceVip;
    }

    public BigDecimal getPriceCouple() {
        return priceCouple;
    }

    public void setPriceCouple(BigDecimal priceCouple) {
        this.priceCouple = priceCouple;
    }

    public ShowtimeStatus getStatus() {
        return status;
    }

    public void setStatus(ShowtimeStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
