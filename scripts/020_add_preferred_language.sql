-- Add preferred_language column to profiles table
-- Migration: 020_add_preferred_language.sql

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- Add comment explaining valid values
COMMENT ON COLUMN profiles.preferred_language IS 'User preferred language code: en, zh, es, hi, pt, ru, fr, ar, tr, vi, ja, ko';
