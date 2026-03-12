-- B16: Referral Program
-- Tables for tracking referrals, domain lists, and credit awards

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referee_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'qualified', 'credited', 'rejected')),
  is_premium BOOLEAN DEFAULT FALSE,
  credits_awarded INTEGER DEFAULT 0,
  credits_expires_at TIMESTAMPTZ,
  qualified_at TIMESTAMPTZ,
  credited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_email ON referrals(referee_email);

-- Blocked email domains (consumer domains that don't qualify)
CREATE TABLE IF NOT EXISTS blocked_email_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Premium referral domains (consultancy firms that earn bonus credits)
CREATE TABLE IF NOT EXISTS premium_referral_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  bonus_multiplier NUMERIC DEFAULT 2.0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default blocked domains (consumer email providers)
INSERT INTO blocked_email_domains (domain) VALUES
  ('gmail.com'),
  ('yahoo.com'),
  ('hotmail.com'),
  ('outlook.com'),
  ('live.com'),
  ('msn.com'),
  ('aol.com'),
  ('icloud.com'),
  ('me.com'),
  ('mac.com'),
  ('protonmail.com'),
  ('proton.me'),
  ('mail.com'),
  ('zoho.com'),
  ('yandex.com'),
  ('gmx.com'),
  ('fastmail.com')
ON CONFLICT (domain) DO NOTHING;

-- Insert default premium domains (major consultancy firms)
INSERT INTO premium_referral_domains (domain, bonus_multiplier) VALUES
  ('mckinsey.com', 2.0),
  ('bcg.com', 2.0),
  ('bain.com', 2.0),
  ('deloitte.com', 2.0),
  ('ey.com', 2.0),
  ('pwc.com', 2.0),
  ('kpmg.com', 2.0),
  ('accenture.com', 2.0),
  ('oliverwyman.com', 2.0),
  ('rolandberger.com', 2.0),
  ('lek.com', 2.0),
  ('strategyand.pwc.com', 2.0),
  ('boozallen.com', 2.0),
  ('capgemini.com', 2.0),
  ('ibm.com', 2.0)
ON CONFLICT (domain) DO NOTHING;

-- Add referral_code to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referral_code') THEN
    ALTER TABLE profiles ADD COLUMN referral_code TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referred_by') THEN
    ALTER TABLE profiles ADD COLUMN referred_by UUID REFERENCES profiles(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'premium_referrals_used') THEN
    ALTER TABLE profiles ADD COLUMN premium_referrals_used INTEGER DEFAULT 0;
  END IF;
END $$;

-- RLS policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_email_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_referral_domains ENABLE ROW LEVEL SECURITY;

-- Users can see their own referrals (as referrer)
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

-- Users can create referrals
CREATE POLICY "Users can create referrals" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Service role can manage all referrals
CREATE POLICY "Service role manages referrals" ON referrals
  FOR ALL USING (auth.role() = 'service_role');

-- Anyone can read domain lists
CREATE POLICY "Anyone can read blocked domains" ON blocked_email_domains
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read premium domains" ON premium_referral_domains
  FOR SELECT USING (true);

-- Only service role can modify domain lists
CREATE POLICY "Service role manages blocked domains" ON blocked_email_domains
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages premium domains" ON premium_referral_domains
  FOR ALL USING (auth.role() = 'service_role');
