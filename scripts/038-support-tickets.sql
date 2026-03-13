-- Support Tickets System
-- Creates tables for support ticket tracking and messaging

-- Support Tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'bug', 'feature', 'billing', 'account', 'data')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  sla_deadline TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Ticket Messages table (for conversation thread)
CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_type TEXT DEFAULT 'user' CHECK (sender_type IN ('user', 'agent', 'system')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_by ON support_tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_support_tickets_organization ON support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON support_ticket_messages(ticket_id);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets
-- Users can see their own tickets
CREATE POLICY "Users can view their own tickets" ON support_tickets
  FOR SELECT USING (created_by = auth.uid());

-- Users can create tickets
CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Admins can see all tickets in their org
CREATE POLICY "Admins can view org tickets" ON support_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'project_manager')
      AND p.organization_id = support_tickets.organization_id
    )
  );

-- Admins can update tickets in their org
CREATE POLICY "Admins can update org tickets" ON support_tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'project_manager')
      AND p.organization_id = support_tickets.organization_id
    )
  );

-- RLS Policies for support_ticket_messages
-- Users can view messages for tickets they created or are assigned to
CREATE POLICY "Users can view messages for their tickets" ON support_ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets st 
      WHERE st.id = support_ticket_messages.ticket_id 
      AND (st.created_by = auth.uid() OR st.assigned_to = auth.uid())
    )
  );

-- Users can send messages to their tickets
CREATE POLICY "Users can send messages to their tickets" ON support_ticket_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM support_tickets st 
      WHERE st.id = support_ticket_messages.ticket_id 
      AND (st.created_by = auth.uid() OR st.assigned_to = auth.uid())
    )
  );

-- Admins can view all messages in their org
CREATE POLICY "Admins can view org messages" ON support_ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets st
      JOIN profiles p ON p.id = auth.uid()
      WHERE st.id = support_ticket_messages.ticket_id
      AND p.role IN ('admin', 'project_manager')
      AND st.organization_id = p.organization_id
    )
  );

-- Admins can send messages to org tickets
CREATE POLICY "Admins can send messages to org tickets" ON support_ticket_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM support_tickets st
      JOIN profiles p ON p.id = auth.uid()
      WHERE st.id = support_ticket_messages.ticket_id
      AND p.role IN ('admin', 'project_manager')
      AND st.organization_id = p.organization_id
    )
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS support_tickets_updated_at ON support_tickets;
CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();
