package dev.priyanshu.api.platform.adapter.in.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.priyanshu.api.platform.adapter.out.redis.RedisTokenBucketRateLimiter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RateLimitingFilter extends OncePerRequestFilter {

    public static final String RATELIMIT_LIMIT_HEADER = "X-RateLimit-Limit";
    public static final String RATELIMIT_REMAINING_HEADER = "X-RateLimit-Remaining";
    public static final String RETRY_AFTER_HEADER = "Retry-After";

    private final RedisTokenBucketRateLimiter rateLimiter;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public RateLimitingFilter(RedisTokenBucketRateLimiter rateLimiter,
                              StringRedisTemplate redisTemplate,
                              ObjectMapper objectMapper) {
        this.rateLimiter = rateLimiter;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator") || path.equals("/lab/limited") || path.startsWith("/ask");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String clientIp = extractClientIp(request);
        var result = rateLimiter.tryAcquire(clientIp);

        response.setHeader(RATELIMIT_LIMIT_HEADER, String.valueOf(result.limit()));
        response.setHeader(RATELIMIT_REMAINING_HEADER, String.valueOf(result.remaining()));

        if (!result.allowed()) {
            // Increment rate limit hit stats counter in Redis
            try {
                redisTemplate.opsForValue().increment("stats:rate_limits_triggered");
            } catch (Exception ignored) {}

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader(RETRY_AFTER_HEADER, String.valueOf(result.retryAfterSeconds()));
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);

            ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.TOO_MANY_REQUESTS,
                "Rate limit exceeded. Please retry after " + result.retryAfterSeconds() + " seconds."
            );
            problem.setType(URI.create("https://priyanshu.dev/errors/rate-limit-exceeded"));
            problem.setTitle("Too Many Requests");
            problem.setInstance(URI.create(request.getRequestURI()));

            objectMapper.writeValue(response.getWriter(), problem);
            return;
        }

        // Increment requests served counter
        try {
            redisTemplate.opsForValue().increment("stats:requests_served");
        } catch (Exception ignored) {}

        filterChain.doFilter(request, response);
    }

    public static String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }
}
