package com.cinebook.movie.domain.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "movies")
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "original_title", length = 255)
    private String originalTitle;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "duration_min", nullable = false)
    private Integer durationMin;

    @Column(name = "age_rating", nullable = false, length = 10)
    private String ageRating;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Column(name = "poster_url", columnDefinition = "TEXT")
    private String posterUrl;

    @Column(name = "backdrop_url", columnDefinition = "TEXT")
    private String backdropUrl;

    @Column(name = "trailer_url", columnDefinition = "TEXT")
    private String trailerUrl;

    @Column(precision = 3, scale = 1)
    private BigDecimal rating;

    @Column(length = 255)
    private String director;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MovieStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "movie_genres",
        joinColumns = @JoinColumn(name = "movie_id"),
        inverseJoinColumns = @JoinColumn(name = "genre_id")
    )
    private Set<Genre> genres = new LinkedHashSet<>();

    protected Movie() {
    }

    public Movie(
        String title,
        String originalTitle,
        String description,
        Integer durationMin,
        String ageRating,
        LocalDate releaseDate,
        String posterUrl,
        String backdropUrl,
        String trailerUrl,
        BigDecimal rating,
        String director,
        MovieStatus status,
        Set<Genre> genres
    ) {
        this.title = title;
        this.originalTitle = originalTitle;
        this.description = description;
        this.durationMin = durationMin;
        this.ageRating = ageRating;
        this.releaseDate = releaseDate;
        this.posterUrl = posterUrl;
        this.backdropUrl = backdropUrl;
        this.trailerUrl = trailerUrl;
        this.rating = rating;
        this.director = director;
        this.status = status;
        this.genres = new LinkedHashSet<>(genres);
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getOriginalTitle() {
        return originalTitle;
    }

    public String getDescription() {
        return description;
    }

    public Integer getDurationMin() {
        return durationMin;
    }

    public String getAgeRating() {
        return ageRating;
    }

    public LocalDate getReleaseDate() {
        return releaseDate;
    }

    public String getPosterUrl() {
        return posterUrl;
    }

    public String getBackdropUrl() {
        return backdropUrl;
    }

    public String getTrailerUrl() {
        return trailerUrl;
    }

    public BigDecimal getRating() {
        return rating;
    }

    public String getDirector() {
        return director;
    }

    public MovieStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Set<Genre> getGenres() {
        return genres;
    }

    public void update(
        String title,
        String originalTitle,
        String description,
        Integer durationMin,
        String ageRating,
        LocalDate releaseDate,
        String posterUrl,
        String backdropUrl,
        String trailerUrl,
        BigDecimal rating,
        String director,
        MovieStatus status,
        Set<Genre> genres
    ) {
        this.title = title;
        this.originalTitle = originalTitle;
        this.description = description;
        this.durationMin = durationMin;
        this.ageRating = ageRating;
        this.releaseDate = releaseDate;
        this.posterUrl = posterUrl;
        this.backdropUrl = backdropUrl;
        this.trailerUrl = trailerUrl;
        this.rating = rating;
        this.director = director;
        this.status = status;
        this.genres.clear();
        this.genres.addAll(genres);
    }
}
