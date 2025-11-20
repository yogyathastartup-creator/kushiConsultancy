package com.kushi.consultancy.controller;

import com.kushi.consultancy.service.EmailService;
import com.kushi.consultancy.service.FileStorageService;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;

/**
 * REST controller for file upload endpoints.
 */
@RestController
@RequestMapping("/api/upload")
@Validated
public class UploadController {

    private static final Logger logger = LoggerFactory.getLogger(UploadController.class);
    
    private final FileStorageService fileStorageService;
    private final EmailService emailService;

    public UploadController(FileStorageService fileStorageService, EmailService emailService) {
        this.fileStorageService = fileStorageService;
        this.emailService = emailService;
    }

    @PostMapping("/cv")
    public ResponseEntity<?> uploadCv(
            @RequestParam("cv") MultipartFile cv,
            @RequestParam @NotBlank String name,
            @RequestParam @NotBlank String email,
            @RequestParam @NotBlank String phone,
            @RequestParam @NotBlank String position,
            @RequestParam @NotBlank String experience,
            @RequestParam @NotBlank String location) {
        
        logger.info("Received CV upload request from: {} for position: {}", name, position);
        
        // Quick validation checks
        if (cv.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "No file uploaded"
            ));
        }

        long fileSize = cv.getSize();
        if (fileSize > 5 * 1024 * 1024) { // 5MB limit
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "File too large",
                "message", "Maximum file size is 5MB"
            ));
        }

        try {
            logger.debug("Storing file: {} ({} KB)", cv.getOriginalFilename(), fileSize / 1024);
            var storedFile = fileStorageService.store(cv);
            logger.info("File stored successfully: {}", storedFile.storedName());
            
            // Send email with complete applicant info and CV attachment (asynchronously)
            logger.debug("Triggering async email notification for applicant: {}", name);
            emailService.sendCvNotification(
                name, email, phone, position, experience, location,
                storedFile.path().toFile(), cv.getOriginalFilename()
            );
            logger.info("Email notification queued for: {}", name);
            
            String fileId = generateShortHash(storedFile.storedName());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "CV uploaded successfully. Email notification will be sent shortly.",
                "fileId", fileId
            ));
        } catch (Exception e) {
            logger.error("Error processing CV upload from: {}", name, e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Upload processing failed",
                "message", e.getMessage()
            ));
        }
    }

    private String generateShortHash(String input) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(input.getBytes());
        return HexFormat.of().formatHex(hash).substring(0, 16);
    }
}
