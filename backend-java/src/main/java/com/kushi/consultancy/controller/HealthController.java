package com.kushi.consultancy.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Health check endpoint.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "message", "Kushi Consultancy Backend is running"
        ));
    }

    // Root path convenience (returns same health payload) to avoid noisy 404s when hitting service URL directly
    @GetMapping(path = "/")
    public ResponseEntity<?> root() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "message", "Service root"
        ));
    }
}
