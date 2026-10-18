package dev.priyanshu.api.profile.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record Profile(
    String name,
    String role,
    List<String> stack,
    String openTo,
    String hireMe,
    String company,
    String location,
    String email,
    String github,
    String linkedin,
    String resumeUrl,
    Integer microservicesCount,
    String peakRpm,
    String cacheHitRate,
    String experienceYears,
    Map<String, Object> education,
    Map<String, Object> priorExperience
) {}
