# Supabase Setup Guide — priyanshu.dev

The site uses online **Supabase (hosted PostgreSQL 15/16 + pgvector)** for persistent storage, vector retrieval embeddings, and backend telemetry.

> [!IMPORTANT]
> In accordance with project policy, **all database operations, DDL migrations, and SQL script executions are performed manually by the repository owner in the Supabase Dashboard SQL Editor**. No automated scripts or agents execute queries directly against the database.

---

## 1. Project Creation & Connection Details

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → Database**:
   - **Direct Connection** (Standard PostgreSQL):
     ```
     Host: db.<project-ref>.supabase.co
     Port: 5432
     Database: postgres
     User: postgres
     Password: <your-database-password>
     ```
   - **Connection Pooler (Supavisor)** (Recommended for serverless & high concurrency):
     ```
     Host: aws-0-<region>.pooler.supabase.com
     Port: 6543 (Transaction mode) or 5432 (Session mode)
     Database: postgres
     User: postgres.<project-ref>
     Password: <your-database-password>
     ```
3. Set your credentials in `.env` (copy from `.env.example`):
   ```bash
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

   SUPABASE_DB_HOST=aws-0-<region>.pooler.supabase.com
   SUPABASE_DB_PORT=6543
   SUPABASE_DB_NAME=postgres
   SUPABASE_DB_USER=postgres.<project-ref>
   SUPABASE_DB_PASSWORD=<your-db-password>

   # Spring Boot JDBC Connection String
   DATABASE_URL=jdbc:postgresql://${SUPABASE_DB_HOST}:${SUPABASE_DB_PORT}/${SUPABASE_DB_NAME}?sslmode=require
   ```

---

## 2. SQL Scripts for Supabase SQL Editor

Paste and run the following blocks in the **Supabase Dashboard → SQL Editor**:

### Step 1: Enable `pgvector`
```sql
-- Enable vector extension for AI semantic search embeddings
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 2: Knowledge Chunks & Embeddings Table
```sql
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    keywords TEXT,
    content TEXT NOT NULL,
    embedding vector(1536), -- 1536 for OpenAI text-embedding-3-small, or adjust for chosen model
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast cosine similarity vector search
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx 
ON knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### Step 3: Vector Search Function
```sql
CREATE OR REPLACE FUNCTION match_knowledge_chunks (
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    slug VARCHAR(255),
    title VARCHAR(255),
    category VARCHAR(100),
    content TEXT,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        k.id,
        k.slug,
        k.title,
        k.category,
        k.content,
        1 - (k.embedding <=> query_embedding) AS similarity
    FROM knowledge_chunks k
    WHERE 1 - (k.embedding <=> query_embedding) > match_threshold
    ORDER BY k.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

### Step 4: Ask Queries & Telemetry Table
```sql
CREATE TABLE IF NOT EXISTS ask_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100),
    question TEXT NOT NULL,
    answer TEXT,
    cached BOOLEAN DEFAULT FALSE,
    rate_limited BOOLEAN DEFAULT FALSE,
    cache_lookup_ms INTEGER,
    retrieval_ms INTEGER,
    model_latency_ms INTEGER,
    total_ms INTEGER,
    client_ip VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ask_telemetry_created_at ON ask_telemetry (created_at DESC);
```

### Step 5: Lab Experiment Benchmarking Tables
```sql
CREATE TABLE IF NOT EXISTS lab_db_benchmark_users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- For the Databases Lab EXPLAIN ANALYZE comparison:
-- Query 1: Seq Scan (unindexed filter)
-- Query 2: B-Tree Index Scan
CREATE INDEX IF NOT EXISTS idx_lab_benchmark_email ON lab_db_benchmark_users (email);
```

---

## 3. Local Docker Compose Architecture

With Supabase hosting Postgres online, local Docker Compose only runs **Redis 7**:
```bash
docker compose -f infra/docker-compose.yml up -d
```
Redis handles:
- Distributed token bucket rate limiting (`token_bucket.lua`).
- Semantic response cache for `/api/ask`.
