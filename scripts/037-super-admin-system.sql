-- Super Admin Access System
-- Creates a system for managing super admin and admin access with granular permissions

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can view all admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Super admins can manage admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Users can view their own admin role" ON admin_roles;

-- Create admin_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'support', 'moderator')),
  permissions JSONB DEFAULT '[]'::jsonb,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON admin_roles(role);

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can see all admin roles
CREATE POLICY "Super admins can view all admin roles" ON admin_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role = 'super_admin' 
      AND ar.is_active = true
    )
    OR user_id = auth.uid()
  );

-- Policy: Super admins can manage admin roles
CREATE POLICY "Super admins can manage admin roles" ON admin_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role = 'super_admin' 
      AND ar.is_active = true
    )
  );

-- Insert super admin for aslan@renascence.io
INSERT INTO admin_roles (user_id, role, permissions, notes)
SELECT 
  id,
  'super_admin',
  '["all"]'::jsonb,
  'Primary super admin - full system access'
FROM auth.users 
WHERE email = 'aslan@renascence.io'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'super_admin',
  permissions = '["all"]'::jsonb,
  is_active = true,
  updated_at = NOW();
