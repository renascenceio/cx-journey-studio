-- Add semantic versioning columns to journey_versions table
-- version_label: Semantic version like "1.0", "1.1", "2.0"
-- change_type: Classification of the change - "minor", "medium", "major"

ALTER TABLE journey_versions 
ADD COLUMN IF NOT EXISTS version_label TEXT DEFAULT '1.0';

ALTER TABLE journey_versions 
ADD COLUMN IF NOT EXISTS change_type TEXT DEFAULT 'minor' 
CHECK (change_type IN ('minor', 'medium', 'major'));

-- Update existing versions to have a version_label based on version_number
UPDATE journey_versions 
SET version_label = version_number::TEXT || '.0'
WHERE version_label IS NULL OR version_label = '1.0';
