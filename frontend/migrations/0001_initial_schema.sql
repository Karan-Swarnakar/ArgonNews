-- ArgonNews Cloudflare D1 Database Schema
-- Migration 0001_initial_schema.sql

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  source_type TEXT,
  reliability REAL DEFAULT 0.95,
  content TEXT,
  category TEXT NOT NULL,
  published_at TEXT NOT NULL,
  discovered_at TEXT,
  collected_at TEXT NOT NULL,
  analysis TEXT,
  summary TEXT,
  why_it_matters TEXT,
  importance INTEGER DEFAULT 5,
  companies TEXT DEFAULT '[]',
  technologies TEXT DEFAULT '[]',
  image_url TEXT,
  image_source TEXT,
  image_license TEXT,
  image_credit TEXT,
  image_alt TEXT,
  content_hash TEXT,
  other_sources TEXT DEFAULT '[]'
);

-- Ingestion audit & system health log
CREATE TABLE IF NOT EXISTS ingestion_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  sources_attempted INTEGER DEFAULT 0,
  sources_succeeded INTEGER DEFAULT 0,
  articles_found INTEGER DEFAULT 0,
  articles_inserted INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  error_message TEXT
);

-- Performance and sorting indexes (Newest First)
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_collected ON articles(collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);
CREATE INDEX IF NOT EXISTS idx_articles_importance ON articles(importance DESC);
CREATE INDEX IF NOT EXISTS idx_articles_url ON articles(url);
CREATE INDEX IF NOT EXISTS idx_articles_content_hash ON articles(content_hash);
