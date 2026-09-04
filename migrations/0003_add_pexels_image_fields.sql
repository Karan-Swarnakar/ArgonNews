-- Migration 0003: Add Pexels image provider metadata columns
-- Safe, additive migration for existing D1 databases

ALTER TABLE articles ADD COLUMN image_photographer_url TEXT;
ALTER TABLE articles ADD COLUMN image_page_url TEXT;
ALTER TABLE articles ADD COLUMN image_checked_at TEXT;
