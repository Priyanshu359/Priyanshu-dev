package dev.priyanshu.api.analytics.domain;

import java.util.List;

public record AnalyticsOverview(
    long totalPageViews,
    long uniqueVisitors,
    long totalSessions,
    long totalInteractions,
    List<TopMetric> topPages,
    List<TopMetric> topReferrers,
    List<TopMetric> topEvents,
    List<TopMetric> deviceBreakdown,
    List<TopMetric> browserBreakdown,
    List<TopMetric> osBreakdown,
    List<TimeSeriesPoint> timeline,
    List<RecentEvent> recentEvents
) {
    public record TopMetric(String label, long count, double percentage) {}
    public record TimeSeriesPoint(String timestamp, long pageViews, long uniqueVisitors) {}
    public record RecentEvent(
        String eventType,
        String eventName,
        String path,
        String device,
        String referrer,
        String timeAgo,
        String timestamp
    ) {}
}
