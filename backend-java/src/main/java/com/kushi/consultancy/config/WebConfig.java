package com.kushi.consultancy.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;
import java.util.concurrent.Executor;

/**
 * CORS configuration for allowing frontend origins to access the API.
 */
@Configuration
public class WebConfig {

    @Value("${app.cors.origins}")
    private String corsOrigins;

    @Bean
    public CorsFilter corsFilter() {
        List<String> allowedOrigins = Arrays.asList(corsOrigins.split(","));
        
        CorsConfiguration config = new CorsConfiguration();
        allowedOrigins.forEach(config::addAllowedOrigin);
        config.setAllowCredentials(true);
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        config.addExposedHeader("Set-Cookie");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        
        return new CorsFilter(source);
    }

    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(3);
        executor.setMaxPoolSize(6);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("async-email-");
        executor.initialize();
        return executor;
    }
}
