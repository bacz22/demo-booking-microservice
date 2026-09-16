package com.cinebook.movie.application;

import com.cloudinary.Uploader;
import com.cinebook.movie.config.CloudinaryProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

@Service
public class CloudinaryMediaService {

    private final Uploader uploader;
    private final CloudinaryProperties properties;

    public CloudinaryMediaService(Uploader uploader, CloudinaryProperties properties) {
        this.uploader = uploader;
        this.properties = properties;
    }

    public Map<String, Object> upload(MultipartFile file, MediaResourceType resourceType) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file must not be empty");
        }
        if (isBlank(properties.getCloudName())
            || isBlank(properties.getApiKey())
            || isBlank(properties.getApiSecret())) {
            throw new IllegalStateException(
                "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
            );
        }

        String contentType = file.getContentType();
        String expectedPrefix = resourceType.cloudinaryValue() + "/";
        if (contentType != null && !contentType.startsWith(expectedPrefix)) {
            throw new IllegalArgumentException(
                "Expected a " + resourceType.cloudinaryValue() + " file but received " + contentType
            );
        }

        Map<String, Object> options = new HashMap<>();
        options.put("resource_type", resourceType.cloudinaryValue());
        options.put("folder", properties.getFolder());
        options.put("use_filename", true);
        options.put("unique_filename", true);
        options.put("overwrite", false);

        Path temporaryFile = null;
        try {
            temporaryFile = Files.createTempFile(
                "cinebook-upload-",
                fileSuffix(file.getOriginalFilename())
            );
            file.transferTo(temporaryFile);
            return uploader.upload(temporaryFile.toFile(), options);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not upload media to Cloudinary", exception);
        } finally {
            if (temporaryFile != null) {
                try {
                    Files.deleteIfExists(temporaryFile);
                } catch (IOException ignored) {
                    // The operating system can clean up the temporary file later.
                }
            }
        }
    }

    private String fileSuffix(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return ".tmp";
        }

        int extensionStart = originalFilename.lastIndexOf('.');
        return extensionStart >= 0 ? originalFilename.substring(extensionStart) : ".tmp";
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
