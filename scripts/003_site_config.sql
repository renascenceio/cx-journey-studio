-- Site configuration table for admin panel
CREATE TABLE IF NOT EXISTS site_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default config
INSERT INTO site_config (key, value) VALUES
  ('general', '{"siteName": "CX Journey Studio", "siteDescription": "Map, analyze, and optimize customer experiences", "supportEmail": ""}'),
  ('features', '{"enableSignups": true, "enableAI": true, "enableCrowdSolutions": true, "maintenanceMode": false}'),
  ('billing', '{"registrationCost": 0, "stripeConnected": false}'),
  ('branding', '{"primaryColor": "#6366f1", "customCss": "", "maxJourneysPerUser": 50}'),
  ('apiKeys', '{}')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write config
CREATE POLICY "Admin read config" ON site_config FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'journey_master'))
);
CREATE POLICY "Admin write config" ON site_config FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'journey_master'))
);
