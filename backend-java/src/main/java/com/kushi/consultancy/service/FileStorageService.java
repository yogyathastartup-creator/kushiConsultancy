package com.kushi.consultancy.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.SecureRandom;

/**
 * Service for storing uploaded files securely.
 */
@Service
public class FileStorageService {

    private final Path tempDirectory = Path.of(System.getProperty("java.io.tmpdir"));
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Store an uploaded file with a random filename.
     */
    public StoredFile store(MultipartFile file) throws IOException {
        String randomName = generateRandomHex(16) + getFileExtension(file.getOriginalFilename());
        Path targetPath = tempDirectory.resolve(randomName);
        
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        
        return new StoredFile(
            randomName,
            file.getOriginalFilename(),
            targetPath,
            file.getSize(),
            file.getContentType()
        );
    }

    private String generateRandomHex(int bytes) {
        byte[] randomBytes = new byte[bytes];
        secureRandom.nextBytes(randomBytes);
        
        StringBuilder hexString = new StringBuilder();
        for (byte b : randomBytes) {
            hexString.append(String.format("%02x", b));
        }
        return hexString.toString();
    }

    private String getFileExtension(String filename) {
        if (filename == null) {
            return "";
        }
        int lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex >= 0 ? filename.substring(lastDotIndex) : "";
    }

    /**
     * Record representing a stored file.
     */
    public record StoredFile(
        String storedName,
        String originalName,
        Path path,
        long size,
        String mimeType
    ) {}
}
