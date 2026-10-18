package dev.priyanshu.api.profile.adapter.in.web;

import dev.priyanshu.api.profile.application.ProfileService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping(value = "/me", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getProfile(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        boolean isTerminalClient = userAgent != null && (
            userAgent.toLowerCase().contains("curl") ||
            userAgent.toLowerCase().contains("wget") ||
            userAgent.toLowerCase().contains("httpie")
        );

        if (isTerminalClient) {
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(profileService.getCompactJson());
        }

        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .body(profileService.getPrettyJson());
    }
}
