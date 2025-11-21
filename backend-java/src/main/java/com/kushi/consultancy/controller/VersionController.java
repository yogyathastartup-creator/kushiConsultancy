package com.kushi.consultancy.controller;

import java.util.Map;

import org.springframework.boot.info.BuildProperties;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/version")
public class VersionController {

    private final BuildProperties buildProperties;

    public VersionController(BuildProperties buildProperties) {
        this.buildProperties = buildProperties;
    }

    @GetMapping
    public ResponseEntity<?> version() {
        return ResponseEntity.ok(Map.of(
            "name", buildProperties.getName(),
            "version", buildProperties.getVersion(),
            "time", buildProperties.getTime().toString(),
            "epochSeconds", buildProperties.getTime().getEpochSecond()
        ));
    }
}
