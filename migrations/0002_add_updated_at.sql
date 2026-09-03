-- Migration 0002: Add updated_at column to articles if not already present
-- Safe, additive migration for existing D1 databases

ALTER TABLE articles ADD COLUMN updated_at TEXT;
