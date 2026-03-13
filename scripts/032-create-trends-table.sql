-- Create trends table for AI-generated and auto-generated CX trends
CREATE TABLE IF NOT EXISTS cx_trends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  impact_score INTEGER DEFAULT 0, -- 0-100 numeric measurement
  proof_text TEXT, -- Evidence/proof of the trend impact
  source TEXT, -- Where the trend was identified
  source_url TEXT,
  categories TEXT[] DEFAULT '{}', -- Applicable industry categories
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  generation_type TEXT DEFAULT 'manual' CHECK (generation_type IN ('manual', 'ai_request', 'cron_auto')),
  ai_prompt TEXT, -- The prompt used if AI-generated
  published_to_solutions BOOLEAN DEFAULT false,
  solution_id UUID REFERENCES solutions(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cx_trends_status ON cx_trends(status);
CREATE INDEX IF NOT EXISTS idx_cx_trends_org ON cx_trends(organization_id);
CREATE INDEX IF NOT EXISTS idx_cx_trends_categories ON cx_trends USING GIN(categories);

-- Add RLS policies
ALTER TABLE cx_trends ENABLE ROW LEVEL SECURITY;

-- Admin users can view all trends
CREATE POLICY "Admins can view all trends" ON cx_trends
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'journey_master')
    )
  );

-- Admin users can insert trends
CREATE POLICY "Admins can insert trends" ON cx_trends
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'journey_master')
    )
  );

-- Admin users can update trends
CREATE POLICY "Admins can update trends" ON cx_trends
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'journey_master')
    )
  );

-- Admin users can delete trends
CREATE POLICY "Admins can delete trends" ON cx_trends
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'journey_master')
    )
  );

-- Published trends can be viewed by all authenticated users
CREATE POLICY "Published trends viewable by all" ON cx_trends
  FOR SELECT TO authenticated
  USING (status = 'published');
