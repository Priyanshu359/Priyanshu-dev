package dev.priyanshu.api.platform.adapter.in.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ResponseHeaderFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ResponseHeaderFilter.class);

    public static final String REQUEST_ID_HEADER = "X-Request-Id";
    public static final String RESPONSE_TIME_HEADER = "X-Response-Time";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        long startTime = System.currentTimeMillis();

        String requestId = request.getHeader(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }

        request.setAttribute(REQUEST_ID_HEADER, requestId);
        response.setHeader(REQUEST_ID_HEADER, requestId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = Math.max(1, System.currentTimeMillis() - startTime);
            response.setHeader(RESPONSE_TIME_HEADER, duration + "ms");

            String uri = request.getRequestURI();
            if (!uri.startsWith("/actuator")) {
                String query = request.getQueryString();
                String fullPath = uri + (query != null && !query.isBlank() ? "?" + query : "");
                log.info("HTTP {} {} -> status={} ({}ms, reqId={})",
                    request.getMethod(), fullPath, response.getStatus(), duration, requestId.substring(0, Math.min(8, requestId.length())));
            }
        }
    }
}

