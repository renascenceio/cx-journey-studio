-- Add logo URL columns to site_config table
ALTER TABLE site_config
ADD COLUMN IF NOT EXISTS logo_light_url TEXT,
ADD COLUMN IF NOT EXISTS logo_dark_url TEXT,
ADD COLUMN IF NOT EXISTS logo_mark_light_url TEXT,
ADD COLUMN IF NOT EXISTS logo_mark_dark_url TEXT;

-- Add comments for clarity
COMMENT ON COLUMN site_config.logo_light_url IS 'Full logo URL for light theme backgrounds';
COMMENT ON COLUMN site_config.logo_dark_url IS 'Full logo URL for dark theme backgrounds';
COMMENT ON COLUMN site_config.logo_mark_light_url IS 'Logo mark (icon) URL for light theme backgrounds';
COMMENT ON COLUMN site_config.logo_mark_dark_url IS 'Logo mark (icon) URL for dark theme backgrounds';

-- Create the branding row if it doesn't exist
INSERT INTO site_config (key, value)
VALUES ('branding', '{}')
ON CONFLICT (key) DO NOTHING;
