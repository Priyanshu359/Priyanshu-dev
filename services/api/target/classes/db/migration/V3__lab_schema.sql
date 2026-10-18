-- =====================================================================
-- V3: Lab Schema Definition with Row Level Security (RLS)
-- =====================================================================

-- 1. Index Strategy Experiments: 3 Identical tables with fixed index strategies
-- Table A: No secondary index (forces Seq Scan)
CREATE TABLE IF NOT EXISTS lab.orders_noidx (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    amount_paise INT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE lab.orders_noidx ENABLE ROW LEVEL SECURITY;

-- Table B: Single B-Tree index on user_id (Bitmap / Index Scan)
CREATE TABLE IF NOT EXISTS lab.orders_user_idx (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    amount_paise INT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON lab.orders_user_idx (user_id);
ALTER TABLE lab.orders_user_idx ENABLE ROW LEVEL SECURITY;

-- Table C: Composite index on (user_id, created_at, status) (Index Only Scan)
CREATE TABLE IF NOT EXISTS lab.orders_composite_idx (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    amount_paise INT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_composite ON lab.orders_composite_idx (user_id, created_at, status);
ALTER TABLE lab.orders_composite_idx ENABLE ROW LEVEL SECURITY;


-- 2. N+1 Query Demonstration Tables
CREATE TABLE IF NOT EXISTS lab.instructor (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL
);
ALTER TABLE lab.instructor ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS lab.course (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    instructor_id BIGINT NOT NULL REFERENCES lab.instructor (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_course_instructor_id ON lab.course (instructor_id);
ALTER TABLE lab.course ENABLE ROW LEVEL SECURITY;


-- 3. Concurrency & Race Condition Experiment: Wallet
CREATE TABLE IF NOT EXISTS lab.wallet (
    id BIGSERIAL PRIMARY KEY,
    balance_paise BIGINT NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE lab.wallet ENABLE ROW LEVEL SECURITY;
