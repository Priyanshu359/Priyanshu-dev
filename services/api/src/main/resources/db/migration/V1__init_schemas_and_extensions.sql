-- =====================================================================
-- V1: Initialize Extensions and Schemas (Never use public schema)
-- =====================================================================

-- Extensions needed for UUID generation, cryptographic hashing, and vector embeddings
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Isolated schemas
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS lab;

-- Restrict public schema usage
REVOKE ALL ON SCHEMA public FROM PUBLIC;
