-- Plans and AI Credits Schema
-- This creates the infrastructure for subscription plans and AI credit management

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  journey_limit INTEGER NOT NULL DEFAULT 3, -- -1 for unlimited
  team_member_limit INTEGER NOT NULL DEFAULT 1, -- -1 for unlimited
  ai_credits_monthly INTEGER NOT NULL DEFAULT 50, -- -1 for custom/unlimited
  version_history_days INTEGER NOT NULL DEFAULT 7, -- -1 for unlimited
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default plans
INSERT INTO plans (id, name, price_monthly, price_yearly, journey_limit, team_member_limit, ai_credits_monthly, version_history_days, features) VALUES
  ('free', 'Free', 0, 0, 3, 1, 50, 7, '{"templates": "community", "export": ["pdf"], "collaboration": false, "analytics": false, "customBranding": false, "sso": false, "api": false}'),
  ('starter', 'Starter', 19, 15, 15, 5, 500, 30, '{"templates": "full", "export": ["pdf", "png", "csv"], "collaboration": true, "analytics": "basic", "customBranding": false, "sso": false, "api": false}'),
  ('business', 'Business', 49, 39, -1, 25, 2000, 90, '{"templates": "full_custom", "export": ["pdf", "png", "csv", "json"], "collaboration": true, "analytics": "advanced", "customBranding": true, "sso": false, "api": true}'),
  ('enterprise', 'Enterprise', -1, -1, -1, -1, -1, -1, '{"templates": "custom_dev", "export": ["all"], "collaboration": true, "analytics": "enterprise", "customBranding": true, "sso": true, "api": true, "dedicatedManager": true}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  journey_limit = EXCLUDED.journey_limit,
  team_member_limit = EXCLUDED.team_member_limit,
  ai_credits_monthly = EXCLUDED.ai_credits_monthly,
  version_history_days = EXCLUDED.version_history_days,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Add plan_id to organizations (organization-level subscription)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES plans(id) DEFAULT 'free';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'paused'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- AI Credits tracking table
CREATE TABLE IF NOT EXISTS ai_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  credits_total INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  credits_purchased INTEGER NOT NULL DEFAULT 0, -- top-up credits
  period_start TIMESTAMPTZ NOT NULL DEFAULT DATE_TRUNC('month', NOW()),
  period_end TIMESTAMPTZ NOT NULL DEFAULT DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, period_start)
);

-- AI Credit transactions log
CREATE TABLE IF NOT EXISTS ai_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('monthly_allocation', 'top_up', 'usage', 'refund', 'adjustment')),
  amount INTEGER NOT NULL, -- positive for credits added, negative for usage
  description TEXT,
  journey_id UUID REFERENCES journeys(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_credits_org_period ON ai_credits(organization_id, period_start);
CREATE INDEX IF NOT EXISTS idx_ai_credit_transactions_org ON ai_credit_transactions(organization_id, created_at DESC);

-- Function to get current AI credits for an organization
CREATE OR REPLACE FUNCTION get_organization_ai_credits(org_id UUID)
RETURNS TABLE(
  credits_available INTEGER,
  credits_used INTEGER,
  credits_total INTEGER,
  period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    GREATEST(0, ac.credits_total + ac.credits_purchased - ac.credits_used) as credits_available,
    ac.credits_used,
    ac.credits_total + ac.credits_purchased as credits_total,
    ac.period_end
  FROM ai_credits ac
  WHERE ac.organization_id = org_id
    AND NOW() BETWEEN ac.period_start AND ac.period_end
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use AI credits
CREATE OR REPLACE FUNCTION use_ai_credits(
  org_id UUID,
  user_uuid UUID,
  credits_to_use INTEGER,
  description_text TEXT DEFAULT NULL,
  journey_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits RECORD;
BEGIN
  -- Get current credits
  SELECT * INTO current_credits FROM get_organization_ai_credits(org_id);
  
  IF current_credits IS NULL OR current_credits.credits_available < credits_to_use THEN
    RETURN FALSE;
  END IF;
  
  -- Update credits used
  UPDATE ai_credits
  SET credits_used = credits_used + credits_to_use,
      updated_at = NOW()
  WHERE organization_id = org_id
    AND NOW() BETWEEN period_start AND period_end;
  
  -- Log transaction
  INSERT INTO ai_credit_transactions (organization_id, user_id, type, amount, description, journey_id)
  VALUES (org_id, user_uuid, 'usage', -credits_to_use, description_text, journey_uuid);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add AI credits (top-up or monthly allocation)
CREATE OR REPLACE FUNCTION add_ai_credits(
  org_id UUID,
  credits_to_add INTEGER,
  credit_type TEXT DEFAULT 'top_up',
  description_text TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Get or create current period credits
  INSERT INTO ai_credits (organization_id, credits_total, credits_purchased)
  VALUES (
    org_id, 
    CASE WHEN credit_type = 'monthly_allocation' THEN credits_to_add ELSE 0 END,
    CASE WHEN credit_type = 'top_up' THEN credits_to_add ELSE 0 END
  )
  ON CONFLICT (organization_id, period_start) DO UPDATE
  SET 
    credits_total = CASE WHEN credit_type = 'monthly_allocation' THEN ai_credits.credits_total + credits_to_add ELSE ai_credits.credits_total END,
    credits_purchased = CASE WHEN credit_type = 'top_up' THEN ai_credits.credits_purchased + credits_to_add ELSE ai_credits.credits_purchased END,
    updated_at = NOW();
  
  -- Log transaction
  INSERT INTO ai_credit_transactions (organization_id, type, amount, description)
  VALUES (org_id, credit_type, credits_to_add, description_text);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credit_transactions ENABLE ROW LEVEL SECURITY;

-- Plans are readable by everyone (public pricing)
CREATE POLICY "Plans are viewable by everyone" ON plans FOR SELECT USING (true);

-- AI credits are viewable by organization members
CREATE POLICY "AI credits viewable by org members" ON ai_credits
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- AI credit transactions viewable by org members  
CREATE POLICY "AI credit transactions viewable by org members" ON ai_credit_transactions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );
