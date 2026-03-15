-- Payment Failure Tracking and Grace Period Schema
-- This adds infrastructure for tracking failed payments and managing grace period downgrades

-- Add payment failure tracking columns to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS payment_failure_count INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS last_payment_reminder_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS previous_plan_id TEXT REFERENCES plans(id);

-- Add AI model settings at organization level (not user level)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS preferred_ai_model TEXT DEFAULT 'openai/gpt-4o-mini';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS ai_settings JSONB DEFAULT '{}';

-- Payment failure events log for auditing
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'payment_failed',
    'payment_succeeded', 
    'reminder_sent',
    'grace_period_started',
    'grace_period_ended',
    'downgraded_to_free',
    'subscription_restored'
  )),
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_events_org ON payment_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orgs_grace_period ON organizations(grace_period_ends_at) WHERE grace_period_ends_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orgs_payment_failed ON organizations(payment_failed_at) WHERE payment_failed_at IS NOT NULL;

-- Function to start grace period (called when payment fails)
CREATE OR REPLACE FUNCTION start_payment_grace_period(org_id UUID, invoice_id TEXT DEFAULT NULL, failure_reason_text TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  org_record RECORD;
BEGIN
  -- Get current org status
  SELECT * INTO org_record FROM organizations WHERE id = org_id;
  
  IF org_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Only start grace period if not already in one
  IF org_record.payment_failed_at IS NULL THEN
    UPDATE organizations
    SET 
      payment_failed_at = NOW(),
      payment_failure_count = COALESCE(payment_failure_count, 0) + 1,
      grace_period_ends_at = NOW() + INTERVAL '7 days',
      subscription_status = 'past_due',
      updated_at = NOW()
    WHERE id = org_id;
    
    -- Log the event
    INSERT INTO payment_events (organization_id, event_type, stripe_invoice_id, failure_reason, metadata)
    VALUES (org_id, 'grace_period_started', invoice_id, failure_reason_text, 
      jsonb_build_object('grace_period_days', 7, 'previous_status', org_record.subscription_status));
    
    INSERT INTO payment_events (organization_id, event_type, stripe_invoice_id, failure_reason)
    VALUES (org_id, 'payment_failed', invoice_id, failure_reason_text);
  ELSE
    -- Already in grace period, just log the retry failure
    UPDATE organizations
    SET payment_failure_count = COALESCE(payment_failure_count, 0) + 1,
        updated_at = NOW()
    WHERE id = org_id;
    
    INSERT INTO payment_events (organization_id, event_type, stripe_invoice_id, failure_reason)
    VALUES (org_id, 'payment_failed', invoice_id, failure_reason_text);
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear grace period (called when payment succeeds)
CREATE OR REPLACE FUNCTION clear_payment_grace_period(org_id UUID, invoice_id TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  org_record RECORD;
BEGIN
  SELECT * INTO org_record FROM organizations WHERE id = org_id;
  
  IF org_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Clear grace period flags
  UPDATE organizations
  SET 
    payment_failed_at = NULL,
    payment_failure_count = 0,
    grace_period_ends_at = NULL,
    last_payment_reminder_at = NULL,
    subscription_status = 'active',
    updated_at = NOW()
  WHERE id = org_id;
  
  -- Log the event
  INSERT INTO payment_events (organization_id, event_type, stripe_invoice_id)
  VALUES (org_id, 'payment_succeeded', invoice_id);
  
  -- If was downgraded, restore previous plan
  IF org_record.previous_plan_id IS NOT NULL AND org_record.plan_id = 'free' THEN
    UPDATE organizations
    SET plan_id = org_record.previous_plan_id,
        previous_plan_id = NULL,
        updated_at = NOW()
    WHERE id = org_id;
    
    INSERT INTO payment_events (organization_id, event_type, metadata)
    VALUES (org_id, 'subscription_restored', 
      jsonb_build_object('restored_plan', org_record.previous_plan_id));
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to downgrade to free plan (called after grace period ends)
CREATE OR REPLACE FUNCTION downgrade_to_free_plan(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  org_record RECORD;
BEGIN
  SELECT * INTO org_record FROM organizations WHERE id = org_id;
  
  IF org_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Store previous plan and downgrade to free
  UPDATE organizations
  SET 
    previous_plan_id = plan_id,
    plan_id = 'free',
    subscription_status = 'canceled',
    payment_failed_at = NULL,
    grace_period_ends_at = NULL,
    updated_at = NOW()
  WHERE id = org_id;
  
  -- Log the event
  INSERT INTO payment_events (organization_id, event_type, metadata)
  VALUES (org_id, 'downgraded_to_free', 
    jsonb_build_object('previous_plan', org_record.plan_id, 'reason', 'grace_period_ended'));
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log reminder sent
CREATE OR REPLACE FUNCTION log_payment_reminder_sent(org_id UUID, reminder_day INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE organizations
  SET last_payment_reminder_at = NOW(),
      updated_at = NOW()
  WHERE id = org_id;
  
  INSERT INTO payment_events (organization_id, event_type, metadata)
  VALUES (org_id, 'reminder_sent', jsonb_build_object('reminder_day', reminder_day));
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

-- Payment events viewable by org admins only
CREATE POLICY "Payment events viewable by org admins" ON payment_events
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'journey_master')
    )
  );
