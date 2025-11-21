package com.kushi.consultancy.security;

import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

/**
 * Utility class for generating and validating JWT tokens.
 */
public class JwtUtil {
    
    private final Key accessKey;
    private final Key refreshKey;

    public JwtUtil(String accessSecret, String refreshSecret) {
        this.accessKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(accessSecret));
        this.refreshKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(refreshSecret));
    }

    /**
     * Generate an access token valid for 1 hour.
     */
    public String generateAccessToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .addClaims(Map.of("role", "admin"))
                .setIssuedAt(new Date())
                .setExpiration(Date.from(Instant.now().plusSeconds(3600)))
                .signWith(accessKey, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Generate a refresh token valid for 7 days.
     */
    public String generateRefreshToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .addClaims(Map.of("role", "admin"))
                .setIssuedAt(new Date())
                .setExpiration(Date.from(Instant.now().plusSeconds(604800)))
                .signWith(refreshKey, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Validate access token and return claims or null if invalid.
     */
    public Claims validateAccessToken(String token) {
        return parse(token, accessKey);
    }

    /**
     * Validate refresh token and return claims or null if invalid.
     */
    public Claims validateRefreshToken(String token) {
        return parse(token, refreshKey);
    }

    private Claims parse(String token, Key key) {
        try {
            return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }
}
