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
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "auditoriums")
public class Auditorium {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "theater_id", nullable = false)
    private Theater theater;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private AuditoriumFormat format = AuditoriumFormat.TWO_D;

    @Column(name = "total_seats", nullable = false)
    private int totalSeats = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AuditoriumStatus status = AuditoriumStatus.ACTIVE;

    @OneToMany(mappedBy = "auditorium", fetch = FetchType.LAZY)
    private List<Seat> seats = new ArrayList<>();

    @OneToMany(mappedBy = "auditorium", fetch = FetchType.LAZY)
    private List<Showtime> showtimes = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Auditorium() {
    }

    public Auditorium(Theater theater, String name, AuditoriumFormat format, AuditoriumStatus status) {
        this.theater = theater;
        this.name = name;
        this.format = format != null ? format : AuditoriumFormat.TWO_D;
        this.status = status != null ? status : AuditoriumStatus.ACTIVE;
        this.totalSeats = 0;
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
            this.status = AuditoriumStatus.ACTIVE;
        }
        if (this.format == null) {
            this.format = AuditoriumFormat.TWO_D;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public void addSeat(Seat seat) {
        seats.add(seat);
        seat.setAuditorium(this);
    }

    public void removeSeat(Seat seat) {
        seats.remove(seat);
        seat.setAuditorium(null);
    }

    // Getters and Setters

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Theater getTheater() {
        return theater;
    }

    public void setTheater(Theater theater) {
        this.theater = theater;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public AuditoriumFormat getFormat() {
        return format;
    }

    public void setFormat(AuditoriumFormat format) {
        this.format = format;
    }

    public int getTotalSeats() {
        return totalSeats;
    }

    public void setTotalSeats(int totalSeats) {
        this.totalSeats = totalSeats;
    }

    public AuditoriumStatus getStatus() {
        return status;
    }

    public void setStatus(AuditoriumStatus status) {
        this.status = status;
    }

    public List<Seat> getSeats() {
        return seats;
    }

    public void setSeats(List<Seat> seats) {
        this.seats = seats;
    }

    public List<Showtime> getShowtimes() {
        return showtimes;
    }

    public void setShowtimes(List<Showtime> showtimes) {
        this.showtimes = showtimes;
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
