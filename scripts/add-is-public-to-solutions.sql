-- Add is_public column to solutions table
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Create index for public solutions queries
CREATE INDEX IF NOT EXISTS idx_solutions_is_public ON solutions(is_public) WHERE is_public = true;
