package com.cinebook.theater.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "theaters")
public class Theater {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 500)
    private String address;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(length = 50)
    private String hotline;

    @Column(name = "opening_hours", nullable = false, length = 100)
    private String openingHours = "08:00 - 24:00";

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "features", columnDefinition = "text[]")
    private List<String> features = new ArrayList<>();

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TheaterStatus status = TheaterStatus.ACTIVE;

    @OneToMany(mappedBy = "theater", fetch = FetchType.LAZY)
    private List<Auditorium> auditoriums = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Theater() {
    }

    public Theater(String name, String address, String city, String hotline, String openingHours, List<String> features, String imageUrl, TheaterStatus status) {
        this.name = name;
        this.address = address;
        this.city = city;
        this.hotline = hotline;
        this.openingHours = openingHours != null ? openingHours : "08:00 - 24:00";
        this.features = features != null ? features : new ArrayList<>();
        this.imageUrl = imageUrl;
        this.status = status != null ? status : TheaterStatus.ACTIVE;
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
            this.status = TheaterStatus.ACTIVE;
        }
        if (this.features == null) {
            this.features = new ArrayList<>();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public void addAuditorium(Auditorium auditorium) {
        auditoriums.add(auditorium);
        auditorium.setTheater(this);
    }

    public void removeAuditorium(Auditorium auditorium) {
        auditoriums.remove(auditorium);
        auditorium.setTheater(null);
    }

    public int getTotalRooms() {
        return auditoriums != null ? auditoriums.size() : 0;
    }

    public int getTotalSeats() {
        return auditoriums != null ? auditoriums.stream().mapToInt(Auditorium::getTotalSeats).sum() : 0;
    }

    // Getters and Setters

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getHotline() {
        return hotline;
    }

    public void setHotline(String hotline) {
        this.hotline = hotline;
    }

    public String getOpeningHours() {
        return openingHours;
    }

    public void setOpeningHours(String openingHours) {
        this.openingHours = openingHours;
    }

    public List<String> getFeatures() {
        return features;
    }

    public void setFeatures(List<String> features) {
        this.features = features;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public TheaterStatus getStatus() {
        return status;
    }

    public void setStatus(TheaterStatus status) {
        this.status = status;
    }

    public List<Auditorium> getAuditoriums() {
        return auditoriums;
    }

    public void setAuditoriums(List<Auditorium> auditoriums) {
        this.auditoriums = auditoriums;
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
