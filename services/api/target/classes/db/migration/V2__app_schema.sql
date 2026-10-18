-- =====================================================================
-- V2: App Schema Definition with Row Level Security (RLS)
-- =====================================================================

-- 1. Contact Messages (from /hire-me and web form)
CREATE TABLE IF NOT EXISTS app.contact_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('recruiter', 'client', 'student')),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    content_hash TEXT NOT NULL UNIQUE,
    ip_hash TEXT,
    status TEXT NOT NULL DEFAULT 'queued',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying contact messages by created_at and status
CREATE INDEX IF NOT EXISTS idx_contact_created_at ON app.contact_message (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_status ON app.contact_message (status);

-- Enable RLS
ALTER TABLE app.contact_message ENABLE ROW LEVEL SECURITY;


-- 2. Transactional Outbox Events
CREATE TABLE IF NOT EXISTS app.outbox_event (
    id BIGSERIAL PRIMARY KEY,
    aggregate TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ
);

-- Partial index for fast outbox relay poller
CREATE INDEX IF NOT EXISTS idx_outbox_unpublished 
ON app.outbox_event (id ASC) 
WHERE published_at IS NULL;

-- Enable RLS
ALTER TABLE app.outbox_event ENABLE ROW LEVEL SECURITY;


-- 3. AI Knowledge Chunks with Vector Embeddings
CREATE TABLE IF NOT EXISTS app.knowledge_chunk (
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL UNIQUE,
    embedding vector(384),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HNSW Vector Index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_knowledge_chunk_embedding_hnsw 
ON app.knowledge_chunk USING hnsw (embedding vector_cosine_ops);

-- Enable RLS
ALTER TABLE app.knowledge_chunk ENABLE ROW LEVEL SECURITY;


-- 4. Ask Sessions (Client rate limits and conversation metadata)
CREATE TABLE IF NOT EXISTS app.ask_session (
    id TEXT PRIMARY KEY,
    question_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE app.ask_session ENABLE ROW LEVEL SECURITY;


-- 5. Usage Telemetry Events
CREATE TABLE IF NOT EXISTS app.usage_event (
    id BIGSERIAL PRIMARY KEY,
    request_id TEXT NOT NULL UNIQUE,
    session_id TEXT,
    prompt_tokens INT NOT NULL DEFAULT 0,
    cache_hit BOOLEAN NOT NULL DEFAULT false,
    context_chunks INT NOT NULL DEFAULT 0,
    blocked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_created_at ON app.usage_event (created_at DESC);

-- Enable RLS
ALTER TABLE app.usage_event ENABLE ROW LEVEL SECURITY;
