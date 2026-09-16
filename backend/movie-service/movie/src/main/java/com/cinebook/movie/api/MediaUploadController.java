package com.cinebook.movie.api;

import com.cinebook.movie.api.dto.MediaUploadResponse;
import com.cinebook.movie.application.CloudinaryMediaService;
import com.cinebook.movie.application.MediaResourceType;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/media")
public class MediaUploadController {

    private final CloudinaryMediaService mediaService;

    public MediaUploadController(CloudinaryMediaService mediaService) {
        this.mediaService = mediaService;
    }

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MediaUploadResponse uploadImage(@RequestPart("file") MultipartFile file) {
        return toResponse(mediaService.upload(file, MediaResourceType.IMAGE));
    }

    @PostMapping(value = "/video", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MediaUploadResponse uploadVideo(@RequestPart("file") MultipartFile file) {
        return toResponse(mediaService.upload(file, MediaResourceType.VIDEO));
    }

    private MediaUploadResponse toResponse(Map<String, Object> result) {
        return new MediaUploadResponse(
            stringValue(result, "resource_type"),
            stringValue(result, "public_id"),
            stringValue(result, "url"),
            stringValue(result, "secure_url"),
            stringValue(result, "format"),
            longValue(result, "bytes"),
            integerValue(result, "width"),
            integerValue(result, "height"),
            doubleValue(result, "duration")
        );
    }

    private String stringValue(Map<String, Object> result, String key) {
        Object value = result.get(key);
        return value == null ? null : value.toString();
    }

    private Long longValue(Map<String, Object> result, String key) {
        Object value = result.get(key);
        return value instanceof Number number ? number.longValue() : null;
    }

    private Integer integerValue(Map<String, Object> result, String key) {
        Object value = result.get(key);
        return value instanceof Number number ? number.intValue() : null;
    }

    private Double doubleValue(Map<String, Object> result, String key) {
        Object value = result.get(key);
        return value instanceof Number number ? number.doubleValue() : null;
    }
}
