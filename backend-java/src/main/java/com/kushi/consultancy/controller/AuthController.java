package com.kushi.consultancy.controller;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kushi.consultancy.security.JwtUtil;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.NotBlank;

/**
 * REST controller for authentication endpoints.
 */
@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

    @Value("${app.auth.admin.username}")
    private String adminUsername;

    @Value("${app.auth.admin.password}")
    private String adminPassword;

    private final JwtUtil jwtUtil;

    private final ConcurrentHashMap<String, FailedAttempts> loginAttempts = new ConcurrentHashMap<>();
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

    public AuthController(
            @Value("${app.jwt.access-secret}") String accessSecret,
            @Value("${app.jwt.refresh-secret}") String refreshSecret) {
        this.jwtUtil = new JwtUtil(accessSecret, refreshSecret);
    }

    /**
     * Login request record.
     */
    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}
    public record RefreshRequest(String refreshToken) {}

    private record FailedAttempts(int count, long lastAttemptTime) {}

    private boolean isAccountLocked(FailedAttempts attempts) {
        if (attempts.count < MAX_FAILED_ATTEMPTS) {
            return false;
        }
        return System.currentTimeMillis() - attempts.lastAttemptTime < LOCKOUT_DURATION_MS;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        FailedAttempts attempts = loginAttempts.getOrDefault(request.username(), new FailedAttempts(0, 0));
        
        if (isAccountLocked(attempts)) {
            return ResponseEntity.status(423).body(Map.of(
                "error", "Account locked",
                "message", "Too many failed login attempts. Please try again later."
            ));
        }

        if (!request.username().equals(adminUsername) || !request.password().equals(adminPassword)) {
            loginAttempts.put(request.username(), new FailedAttempts(attempts.count() + 1, System.currentTimeMillis()));
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "error", "Authentication failed",
                "message", "Invalid username or password"
            ));
        }

        // Successful login - clear failed attempts
        loginAttempts.remove(request.username());

        String accessToken = jwtUtil.generateAccessToken(request.username());
        String refreshToken = jwtUtil.generateRefreshToken(request.username());

        Cookie accessCookie = createCookie("accessToken", accessToken, 3600);
        Cookie refreshCookie = createCookie("refreshToken", refreshToken, 7 * 24 * 3600);

        response.addCookie(accessCookie);
        response.addCookie(refreshCookie);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Login successful",
            "user", Map.of(
                "username", request.username(),
                "role", "admin"
            )
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        Cookie accessCookie = createCookie("accessToken", "", 0);
        Cookie refreshCookie = createCookie("refreshToken", "", 0);
        
        accessCookie.setMaxAge(0);
        refreshCookie.setMaxAge(0);
        
        response.addCookie(accessCookie);
        response.addCookie(refreshCookie);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Logged out successfully"
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            HttpServletResponse response,
            @CookieValue(value = "refreshToken", required = false) String refreshTokenCookie,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody(required = false) RefreshRequest body) {

        String supplied = null;
        if (refreshTokenCookie != null && !refreshTokenCookie.isBlank()) {
            supplied = refreshTokenCookie;
        } else if (body != null && body.refreshToken() != null && !body.refreshToken().isBlank()) {
            supplied = body.refreshToken();
        } else if (authHeader != null && authHeader.toLowerCase().startsWith("bearer ")) {
            supplied = authHeader.substring(7).trim();
        }

        if (supplied == null || supplied.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "error", "No refresh token provided"
            ));
        }

        var claims = jwtUtil.validateRefreshToken(supplied);
        if (claims == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "error", "Invalid or expired refresh token"
            ));
        }

        String username = claims.getSubject();
        String newAccessToken = jwtUtil.generateAccessToken(username);
        response.addCookie(createCookie("accessToken", newAccessToken, 3600));

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Token refreshed",
            "user", Map.of(
                "username", username,
                "role", claims.get("role", String.class)
            )
        ));
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verify(
            @CookieValue(value = "accessToken", required = false) String accessToken) {

        if (accessToken == null || accessToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "authenticated", false
            ));
        }

        var claims = jwtUtil.validateAccessToken(accessToken);
        if (claims == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "authenticated", false,
                "error", "Invalid or expired access token"
            ));
        }

        return ResponseEntity.ok(Map.of(
            "authenticated", true,
            "user", Map.of(
                "username", claims.getSubject(),
                "role", claims.get("role", String.class)
            )
        ));
    }

    private Cookie createCookie(String name, String value, int maxAgeSeconds) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);
        boolean secure = false; // could derive from environment later
        cookie.setSecure(secure); // Set to true in production with HTTPS
        cookie.setPath("/");
        cookie.setMaxAge(maxAgeSeconds);
        cookie.setAttribute("SameSite", "Strict");
        return cookie;
    }
}
