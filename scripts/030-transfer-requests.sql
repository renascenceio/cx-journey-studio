-- B12: Ownership Transfer - Transfer Requests Table
-- This table tracks ownership transfer requests for workspaces, journeys, and archetypes

-- Create the transfer_requests table
CREATE TABLE IF NOT EXISTS public.transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL CHECK (asset_type IN ('workspace', 'journey', 'archetype')),
  asset_id UUID NOT NULL,
  asset_name TEXT NOT NULL, -- Store asset name for easy reference
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL if inviting by email
  to_email TEXT, -- Email for inviting non-registered users
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  message TEXT, -- Optional message from the sender
  previous_owner_role TEXT DEFAULT 'contributor', -- Role to assign to previous owner after transfer
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  CONSTRAINT valid_recipient CHECK (to_user_id IS NOT NULL OR to_email IS NOT NULL)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transfer_requests_from_user ON public.transfer_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_to_user ON public.transfer_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_to_email ON public.transfer_requests(to_email);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_status ON public.transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_asset ON public.transfer_requests(asset_type, asset_id);

-- Enable RLS
ALTER TABLE public.transfer_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see transfer requests they created or are targeted to them
CREATE POLICY "Users can view their transfer requests"
  ON public.transfer_requests
  FOR SELECT
  TO authenticated
  USING (
    from_user_id = auth.uid() 
    OR to_user_id = auth.uid()
    OR to_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy: Users can create transfer requests for assets they own
CREATE POLICY "Users can create transfer requests"
  ON public.transfer_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

-- Policy: Senders can cancel pending requests they created
CREATE POLICY "Senders can update their pending requests"
  ON public.transfer_requests
  FOR UPDATE
  TO authenticated
  USING (from_user_id = auth.uid() AND status = 'pending')
  WITH CHECK (from_user_id = auth.uid());

-- Policy: Recipients can accept/decline pending requests
CREATE POLICY "Recipients can respond to pending requests"
  ON public.transfer_requests
  FOR UPDATE
  TO authenticated
  USING (
    (to_user_id = auth.uid() OR to_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    AND status = 'pending'
  )
  WITH CHECK (
    (to_user_id = auth.uid() OR to_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Add comments
COMMENT ON TABLE public.transfer_requests IS 'B12: Tracks ownership transfer requests for assets';
COMMENT ON COLUMN public.transfer_requests.asset_type IS 'Type of asset: workspace, journey, or archetype';
COMMENT ON COLUMN public.transfer_requests.to_email IS 'Email for non-registered recipients (triggers invitation)';
COMMENT ON COLUMN public.transfer_requests.previous_owner_role IS 'Role to assign to previous owner after successful transfer';
COMMENT ON COLUMN public.transfer_requests.expires_at IS 'Request expires 7 days after creation if not acted upon';
