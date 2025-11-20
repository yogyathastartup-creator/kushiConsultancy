package com.kushi.consultancy.controller;

import com.kushi.consultancy.service.EmailService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for email testing endpoints.
 */
@RestController
@RequestMapping("/api/email")
@Validated
public class EmailController {

    private final EmailService emailService;

    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    @PostMapping("/test")
    public ResponseEntity<?> sendTestEmail(@RequestParam @NotBlank @Email String recipient) {
        try {
            boolean sent = emailService.sendTestEmail(recipient);
            
            if (sent) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Test email sent successfully to " + recipient
                ));
            } else {
                return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", "Failed to send email",
                    "message", "Check mail server configuration and credentials"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Email sending failed",
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> getMailStatus() {
        return ResponseEntity.ok(Map.of(
            "configured", true,
            "provider", "Gmail SMTP",
            "message", "Use POST /api/email/test?recipient=your@email.com to test email functionality"
        ));
    }
}
