-- Add login logo URL columns to site_config table
ALTER TABLE site_config 
ADD COLUMN IF NOT EXISTS login_logo_light_url TEXT,
ADD COLUMN IF NOT EXISTS login_logo_dark_url TEXT;

-- Update comment for clarity
COMMENT ON COLUMN site_config.login_logo_light_url IS 'Custom logo for login page on light backgrounds';
COMMENT ON COLUMN site_config.login_logo_dark_url IS 'Custom logo for login page on dark backgrounds';
