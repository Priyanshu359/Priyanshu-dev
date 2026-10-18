package dev.priyanshu.api.platform.adapter.in.web;

import dev.priyanshu.api.platform.PlatformProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
public class CorsConfig {

    private final PlatformProperties properties;

    public CorsConfig(PlatformProperties properties) {
        this.properties = properties;
    }

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        List<String> allowedOrigins = properties.getCors().getAllowedOrigins();
        config.setAllowedOriginPatterns(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of(
            ResponseHeaderFilter.REQUEST_ID_HEADER,
            ResponseHeaderFilter.RESPONSE_TIME_HEADER,
            RateLimitingFilter.RATELIMIT_LIMIT_HEADER,
            RateLimitingFilter.RATELIMIT_REMAINING_HEADER,
            RateLimitingFilter.RETRY_AFTER_HEADER,
            "X-Query-Count"
        ));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
