-- Admin Permission System
-- Creates tables for site admins and workspace admins with granular permissions

-- Drop existing admin_roles table if exists (we'll recreate with better structure)
DROP TABLE IF EXISTS admin_roles CASCADE;

-- Site Admins table - users with platform-wide admin permissions
CREATE TABLE IF NOT EXISTS site_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Workspace Admins table - users with workspace/team-scoped admin permissions
CREATE TABLE IF NOT EXISTS workspace_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_site_admins_user_id ON site_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_site_admins_active ON site_admins(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_workspace_admins_user_id ON workspace_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_admins_org_id ON workspace_admins(organization_id);
CREATE INDEX IF NOT EXISTS idx_workspace_admins_active ON workspace_admins(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE site_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_admins
-- Super admin (aslan@renascence.io) can do everything
CREATE POLICY "Super admin full access to site_admins" ON site_admins
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = 'aslan@renascence.io'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = 'aslan@renascence.io'
    )
  );

-- Site admins can read their own record
CREATE POLICY "Site admins can read own record" ON site_admins
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND is_active = true);

-- RLS Policies for workspace_admins
-- Super admin can do everything
CREATE POLICY "Super admin full access to workspace_admins" ON workspace_admins
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = 'aslan@renascence.io'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = 'aslan@renascence.io'
    )
  );

-- Site admins with 'manage_workspace_admins' permission can manage workspace admins
CREATE POLICY "Site admins can manage workspace_admins" ON workspace_admins
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM site_admins 
      WHERE site_admins.user_id = auth.uid() 
      AND site_admins.is_active = true
      AND 'manage_workspace_admins' = ANY(site_admins.permissions)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM site_admins 
      WHERE site_admins.user_id = auth.uid() 
      AND site_admins.is_active = true
      AND 'manage_workspace_admins' = ANY(site_admins.permissions)
    )
  );

-- Workspace admins can read their own record
CREATE POLICY "Workspace admins can read own record" ON workspace_admins
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND is_active = true);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS site_admins_updated_at ON site_admins;
CREATE TRIGGER site_admins_updated_at
  BEFORE UPDATE ON site_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_updated_at();

DROP TRIGGER IF EXISTS workspace_admins_updated_at ON workspace_admins;
CREATE TRIGGER workspace_admins_updated_at
  BEFORE UPDATE ON workspace_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_updated_at();
