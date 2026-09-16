package com.cinebook.movie.api.dto;

public record MediaUploadResponse(
    String resourceType,
    String publicId,
    String url,
    String secureUrl,
    String format,
    Long bytes,
    Integer width,
    Integer height,
    Double duration
) {
}
