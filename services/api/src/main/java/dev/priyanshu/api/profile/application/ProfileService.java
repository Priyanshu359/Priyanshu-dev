package dev.priyanshu.api.profile.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import dev.priyanshu.api.profile.domain.Profile;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;

@Service
public class ProfileService {

    private static final Logger log = LoggerFactory.getLogger(ProfileService.class);
    private static final String REDIS_CACHE_KEY = "profile:me";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper jsonMapper;
    private final ObjectMapper yamlMapper;
    private volatile Profile cachedProfile;
    private volatile String compactJson;
    private volatile String prettyJson;

    public ProfileService(StringRedisTemplate redisTemplate, ObjectMapper jsonMapper) {
        this.redisTemplate = redisTemplate;
        this.jsonMapper = jsonMapper;
        this.yamlMapper = new ObjectMapper(new YAMLFactory());
    }

    @PostConstruct
    public void init() {
        refreshProfile();
    }

    public synchronized void refreshProfile() {
        try {
            Profile profile = loadFromYaml();
            this.cachedProfile = profile;
            this.compactJson = jsonMapper.writeValueAsString(profile);
            this.prettyJson = jsonMapper.writerWithDefaultPrettyPrinter().writeValueAsString(profile);

            try {
                redisTemplate.opsForValue().set(REDIS_CACHE_KEY, this.compactJson, Duration.ofHours(1));
            } catch (Exception e) {
                log.warn("Failed to cache profile in Redis: {}", e.getMessage());
            }
            log.info("Profile loaded successfully for {}", profile.name());
        } catch (Exception e) {
            log.error("Failed to load profile.yaml: {}", e.getMessage(), e);
            // Default fallback
            this.cachedProfile = new Profile(
                "Priyanshu Sinha",
                "Backend Engineer (SDE-1)",
                List.of("Java", "Spring Boot", "Kafka", "Redis"),
                "freelance",
                "POST /hire-me",
                "StudyIQ",
                "Gurugram, India",
                "priyanshu.kr.sinha74@gmail.com",
                "https://github.com/Priyanshu359",
                "https://www.linkedin.com/in/priyanshu7",
                "/resume.pdf",
                20,
                "100K+",
                "92%",
                "1.5+",
                null,
                null
            );
            try {
                this.compactJson = jsonMapper.writeValueAsString(this.cachedProfile);
                this.prettyJson = jsonMapper.writerWithDefaultPrettyPrinter().writeValueAsString(this.cachedProfile);
            } catch (Exception ignored) {}
        }
    }

    private Profile loadFromYaml() throws Exception {
        // Search potential relative locations from execution dir
        List<Path> candidates = List.of(
            Path.of("content/site/profile.yaml"),
            Path.of("../../content/site/profile.yaml"),
            Path.of("../content/site/profile.yaml"),
            Path.of(System.getProperty("user.dir"), "../../content/site/profile.yaml"),
            Path.of(System.getProperty("user.dir"), "content/site/profile.yaml")
        );

        for (Path p : candidates) {
            if (Files.exists(p)) {
                log.info("Loading profile from: {}", p.toAbsolutePath());
                return yamlMapper.readValue(p.toFile(), Profile.class);
            }
        }

        // Try classpath
        try (InputStream is = getClass().getResourceAsStream("/profile.yaml")) {
            if (is != null) {
                return yamlMapper.readValue(is, Profile.class);
            }
        }

        throw new IllegalStateException("profile.yaml not found in candidate paths");
    }

    public Profile getProfile() {
        if (cachedProfile == null) {
            refreshProfile();
        }
        return cachedProfile;
    }

    public String getCompactJson() {
        if (compactJson == null) {
            refreshProfile();
        }
        return compactJson;
    }

    public String getPrettyJson() {
        if (prettyJson == null) {
            refreshProfile();
        }
        return prettyJson;
    }
}
