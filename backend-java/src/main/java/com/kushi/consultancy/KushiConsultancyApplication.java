package com.kushi.consultancy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class KushiConsultancyApplication {

	public static void main(String[] args) {
		SpringApplication.run(KushiConsultancyApplication.class, args);
	}

}