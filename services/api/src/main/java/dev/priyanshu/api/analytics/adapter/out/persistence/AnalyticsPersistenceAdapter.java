package dev.priyanshu.api.analytics.adapter.out.persistence;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.priyanshu.api.analytics.domain.AnalyticsEvent;
import dev.priyanshu.api.analytics.domain.AnalyticsOverview;
import dev.priyanshu.api.analytics.domain.AnalyticsOverview.RecentEvent;
import dev.priyanshu.api.analytics.domain.AnalyticsOverview.TimeSeriesPoint;
import dev.priyanshu.api.analytics.domain.AnalyticsOverview.TopMetric;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Component
public class AnalyticsPersistenceAdapter {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsPersistenceAdapter.class);

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public AnalyticsPersistenceAdapter(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public void saveEvent(AnalyticsEvent event) {
        String metadataJson = "{}";
        try {
            if (event.metadata() != null) {
                metadataJson = objectMapper.writeValueAsString(event.metadata());
            }
        } catch (Exception ignored) {}

        String sql = """
            INSERT INTO app.analytics_event (
                session_id, event_type, event_name, path, referrer, device, browser, os, ip_hash, metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?)
            """;

        try {
            jdbcTemplate.update(
                sql,
                event.sessionId(),
                event.eventType(),
                event.eventName(),
                event.path(),
                event.referrer(),
                event.device(),
                event.browser(),
                event.os(),
                event.ipHash(),
                metadataJson,
                Timestamp.from(event.createdAt() != null ? event.createdAt() : Instant.now())
            );
        } catch (Exception e) {
            log.warn("Failed to persist analytics event [{}]: {}", event.eventName(), e.getMessage());
        }
    }

    public AnalyticsOverview getOverview(String period) {
        String interval = switch (period != null ? period.toLowerCase().trim() : "7d") {
            case "24h", "1d" -> "INTERVAL '24 hours'";
            case "30d" -> "INTERVAL '30 days'";
            default -> "INTERVAL '7 days'";
        };

        try {
            // 1. Core KPIs
            String kpiSql = """
                SELECT
                    COUNT(*) FILTER (WHERE event_type = 'page_view') AS total_views,
                    COUNT(DISTINCT ip_hash) AS unique_visitors,
                    COUNT(DISTINCT session_id) AS total_sessions,
                    COUNT(*) FILTER (WHERE event_type != 'page_view') AS total_interactions
                FROM app.analytics_event
                WHERE created_at >= NOW() - %s
                """.formatted(interval);

            long[] kpis = jdbcTemplate.query(kpiSql, rs -> {
                if (rs.next()) {
                    return new long[]{
                        rs.getLong("total_views"),
                        rs.getLong("unique_visitors"),
                        rs.getLong("total_sessions"),
                        rs.getLong("total_interactions")
                    };
                }
                return new long[]{0, 0, 0, 0};
            });

            long totalViews = kpis != null ? kpis[0] : 0;
            long uniqueVisitors = kpis != null ? kpis[1] : 0;
            long totalSessions = kpis != null ? kpis[2] : 0;
            long totalInteractions = kpis != null ? kpis[3] : 0;

            // 2. Top Pages
            List<TopMetric> topPages = queryTopMetrics("""
                SELECT path AS label, COUNT(*) AS count
                FROM app.analytics_event
                WHERE event_type = 'page_view' AND created_at >= NOW() - %s
                GROUP BY path
                ORDER BY count DESC
                LIMIT 10
                """.formatted(interval), totalViews);

            // 3. Top Referrers
            List<TopMetric> topReferrers = queryTopMetrics("""
                SELECT COALESCE(NULLIF(referrer, ''), 'Direct / Bookmark') AS label, COUNT(*) AS count
                FROM app.analytics_event
                WHERE event_type = 'page_view' AND created_at >= NOW() - %s
                GROUP BY label
                ORDER BY count DESC
                LIMIT 8
                """.formatted(interval), totalViews);

            // 4. Top Interactive Events
            List<TopMetric> topEvents = queryTopMetrics("""
                SELECT event_name AS label, COUNT(*) AS count
                FROM app.analytics_event
                WHERE event_type != 'page_view' AND created_at >= NOW() - %s
                GROUP BY event_name
                ORDER BY count DESC
                LIMIT 10
                """.formatted(interval), totalInteractions > 0 ? totalInteractions : 1);

            // 5. Device Breakdown
            List<TopMetric> devices = queryTopMetrics("""
                SELECT COALESCE(NULLIF(device, ''), 'desktop') AS label, COUNT(*) AS count
                FROM app.analytics_event
                WHERE event_type = 'page_view' AND created_at >= NOW() - %s
                GROUP BY label
                ORDER BY count DESC
                """.formatted(interval), totalViews);

            // 6. Browser Breakdown
            List<TopMetric> browsers = queryTopMetrics("""
                SELECT COALESCE(NULLIF(browser, ''), 'Other') AS label, COUNT(*) AS count
                FROM app.analytics_event
                WHERE event_type = 'page_view' AND created_at >= NOW() - %s
                GROUP BY label
                ORDER BY count DESC
                LIMIT 6
                """.formatted(interval), totalViews);

            // 7. OS Breakdown
            List<TopMetric> osList = queryTopMetrics("""
                SELECT COALESCE(NULLIF(os, ''), 'Other') AS label, COUNT(*) AS count
                FROM app.analytics_event
                WHERE event_type = 'page_view' AND created_at >= NOW() - %s
                GROUP BY label
                ORDER BY count DESC
                LIMIT 6
                """.formatted(interval), totalViews);

            // 8. Timeline (Hourly for 24h, Daily for 7d/30d)
            String timeTrunc = interval.contains("24 hours") ? "hour" : "day";
            String timelineSql = """
                SELECT
                    to_char(date_trunc('%s', created_at), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS bucket,
                    COUNT(*) FILTER (WHERE event_type = 'page_view') AS page_views,
                    COUNT(DISTINCT ip_hash) AS unique_visitors
                FROM app.analytics_event
                WHERE created_at >= NOW() - %s
                GROUP BY bucket
                ORDER BY bucket ASC
                """.formatted(timeTrunc, interval);

            List<TimeSeriesPoint> timeline = jdbcTemplate.query(timelineSql, (rs, rowNum) ->
                new TimeSeriesPoint(
                    rs.getString("bucket"),
                    rs.getLong("page_views"),
                    rs.getLong("unique_visitors")
                )
            );

            // 9. Recent Live Events (Last 40 events)
            String recentSql = """
                SELECT event_type, event_name, path, device, referrer, created_at
                FROM app.analytics_event
                ORDER BY created_at DESC
                LIMIT 40
                """;

            Instant now = Instant.now();
            List<RecentEvent> recentEvents = jdbcTemplate.query(recentSql, (rs, rowNum) -> {
                Timestamp ts = rs.getTimestamp("created_at");
                Instant eventTime = ts != null ? ts.toInstant() : now;
                String timeAgo = formatTimeAgo(Duration.between(eventTime, now));
                return new RecentEvent(
                    rs.getString("event_type"),
                    rs.getString("event_name"),
                    rs.getString("path"),
                    rs.getString("device"),
                    rs.getString("referrer"),
                    timeAgo,
                    eventTime.toString()
                );
            });

            return new AnalyticsOverview(
                totalViews,
                uniqueVisitors,
                totalSessions,
                totalInteractions,
                topPages,
                topReferrers,
                topEvents,
                devices,
                browsers,
                osList,
                timeline,
                recentEvents
            );
        } catch (Exception e) {
            log.warn("Error generating analytics overview (table might be empty or migrating): {}", e.getMessage());
            return new AnalyticsOverview(0, 0, 0, 0, List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of());
        }
    }

    private List<TopMetric> queryTopMetrics(String sql, long totalBasis) {
        long basis = totalBasis > 0 ? totalBasis : 1;
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            String label = rs.getString("label");
            long count = rs.getLong("count");
            double pct = Math.round(((double) count / basis) * 1000.0) / 10.0;
            return new TopMetric(label != null ? label : "unknown", count, pct);
        });
    }

    private String formatTimeAgo(Duration duration) {
        long seconds = Math.max(0, duration.getSeconds());
        if (seconds < 60) return seconds + "s ago";
        long minutes = seconds / 60;
        if (minutes < 60) return minutes + "m ago";
        long hours = minutes / 60;
        if (hours < 24) return hours + "h ago";
        long days = hours / 24;
        return days + "d ago";
    }
}
