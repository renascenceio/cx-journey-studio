-- Voice of Customer (VoC) Tables
-- Migration to create tables for storing VoC data sources and metrics

-- Data sources table - stores connections to external VoC systems
CREATE TABLE IF NOT EXISTS voc_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  journey_id UUID REFERENCES journeys(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('google_sheets', 'qualtrics', 'medallia', 'questionpro', 'surveymonkey', 'custom_api')),
  config JSONB NOT NULL DEFAULT '{}',
  -- config structure varies by type:
  -- google_sheets: { spreadsheetId, sheetName, range }
  -- qualtrics: { surveyId, datacenterId }
  -- medallia: { programId }
  -- questionpro: { surveyId }
  -- surveymonkey: { surveyId }
  -- custom_api: { url, method, headers, auth }
  credentials_encrypted TEXT, -- encrypted API keys/tokens
  field_mappings JSONB NOT NULL DEFAULT '[]',
  -- field_mappings: [{ sourceField, targetType, targetId, metricType }]
  -- targetType: 'journey' | 'stage' | 'step' | 'touchpoint'
  -- metricType: 'nps' | 'csat' | 'ces' | 'sentiment' | 'custom'
  sync_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'failed', 'partial')),
  last_sync_error TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- VoC metrics table - aggregated metrics per journey element
CREATE TABLE IF NOT EXISTS voc_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id UUID NOT NULL REFERENCES voc_data_sources(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('journey', 'stage', 'step', 'touchpoint')),
  target_id UUID, -- NULL for journey-level metrics
  metric_type TEXT NOT NULL CHECK (metric_type IN ('nps', 'csat', 'ces', 'sentiment', 'custom')),
  metric_name TEXT, -- for custom metrics
  value NUMERIC NOT NULL,
  sample_size INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  breakdown JSONB, -- optional breakdown by segment, channel, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- VoC feedback table - individual feedback entries
CREATE TABLE IF NOT EXISTS voc_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id UUID NOT NULL REFERENCES voc_data_sources(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('journey', 'stage', 'step', 'touchpoint')),
  target_id UUID,
  external_id TEXT, -- ID from the source system
  respondent_id TEXT, -- anonymized respondent identifier
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('survey', 'review', 'support', 'social', 'other')),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score NUMERIC, -- -1 to 1
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  csat_score INTEGER CHECK (csat_score >= 1 AND csat_score <= 5),
  ces_score INTEGER CHECK (ces_score >= 1 AND ces_score <= 7),
  text_content TEXT,
  tags TEXT[],
  metadata JSONB,
  responded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- VoC sync logs - track sync history
CREATE TABLE IF NOT EXISTS voc_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id UUID NOT NULL REFERENCES voc_data_sources(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'partial')),
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  error_details JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voc_data_sources_org ON voc_data_sources(organization_id);
CREATE INDEX IF NOT EXISTS idx_voc_data_sources_journey ON voc_data_sources(journey_id);
CREATE INDEX IF NOT EXISTS idx_voc_metrics_journey ON voc_metrics(journey_id);
CREATE INDEX IF NOT EXISTS idx_voc_metrics_target ON voc_metrics(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_voc_metrics_period ON voc_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_voc_feedback_journey ON voc_feedback(journey_id);
CREATE INDEX IF NOT EXISTS idx_voc_feedback_target ON voc_feedback(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_voc_feedback_responded ON voc_feedback(responded_at);
CREATE INDEX IF NOT EXISTS idx_voc_sync_logs_source ON voc_sync_logs(data_source_id);

-- Enable RLS
ALTER TABLE voc_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE voc_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE voc_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE voc_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voc_data_sources
CREATE POLICY "Users can view voc_data_sources in their workspace" ON voc_data_sources
  FOR SELECT USING (
    organization_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage voc_data_sources" ON voc_data_sources
  FOR ALL USING (
    organization_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for voc_metrics
CREATE POLICY "Users can view voc_metrics in their workspace" ON voc_metrics
  FOR SELECT USING (
    journey_id IN (
      SELECT j.id FROM journeys j
      JOIN workspace_members wm ON wm.workspace_id = j.organization_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage voc_metrics" ON voc_metrics
  FOR ALL USING (
    journey_id IN (
      SELECT j.id FROM journeys j
      JOIN workspace_members wm ON wm.workspace_id = j.organization_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for voc_feedback
CREATE POLICY "Users can view voc_feedback in their workspace" ON voc_feedback
  FOR SELECT USING (
    journey_id IN (
      SELECT j.id FROM journeys j
      JOIN workspace_members wm ON wm.workspace_id = j.organization_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage voc_feedback" ON voc_feedback
  FOR ALL USING (
    journey_id IN (
      SELECT j.id FROM journeys j
      JOIN workspace_members wm ON wm.workspace_id = j.organization_id
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for voc_sync_logs
CREATE POLICY "Users can view voc_sync_logs for their sources" ON voc_sync_logs
  FOR SELECT USING (
    data_source_id IN (
      SELECT ds.id FROM voc_data_sources ds
      JOIN workspace_members wm ON wm.workspace_id = ds.organization_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_voc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER voc_data_sources_updated_at
  BEFORE UPDATE ON voc_data_sources
  FOR EACH ROW EXECUTE FUNCTION update_voc_updated_at();

CREATE TRIGGER voc_metrics_updated_at
  BEFORE UPDATE ON voc_metrics
  FOR EACH ROW EXECUTE FUNCTION update_voc_updated_at();
