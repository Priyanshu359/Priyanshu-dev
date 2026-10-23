package dev.priyanshu.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiApplication.class, args);
    }

    @RestController
    static class StatusController {
        @GetMapping("/")
        public Map<String, String> root() {
            return Map.of("service", "priyanshu-api", "status", "foundation ok");
        }

        @GetMapping(value = {"/favicon.ico", "/favicon.png"})
        public org.springframework.http.ResponseEntity<Void> favicon() {
            return org.springframework.http.ResponseEntity.noContent().build();
        }
    }
}
