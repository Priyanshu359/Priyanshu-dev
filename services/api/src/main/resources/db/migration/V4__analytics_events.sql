-- =====================================================================
-- V4: Analytics Events Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS app.analytics_event (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,       -- 'page_view', 'click', 'time_spent', 'lab_interaction'
    event_name TEXT NOT NULL,       -- 'view_/about', 'click_resume', 'click_github', etc.
    path TEXT NOT NULL,             -- '/about', '/labs/cache', etc.
    referrer TEXT,                  -- 'https://google.com', 'direct', etc.
    device TEXT,                    -- 'desktop', 'mobile', 'tablet'
    browser TEXT,                   -- 'Chrome', 'Safari', 'Firefox', etc.
    os TEXT,                        -- 'macOS', 'Windows', 'iOS', 'Android', 'Linux'
    ip_hash TEXT,                   -- anonymized SHA-256 of IP for unique daily visitors
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast indexes for time-series analytics and aggregations
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON app.analytics_event (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON app.analytics_event (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_path ON app.analytics_event (path);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON app.analytics_event (session_id);
