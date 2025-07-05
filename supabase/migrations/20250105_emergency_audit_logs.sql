-- Create emergency audit logs table
CREATE TABLE IF NOT EXISTS emergency_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'symptom_check', 'service_search', 'emergency_contact', 'guidance_viewed')),
  event_data JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_emergency_audit_logs_session_id ON emergency_audit_logs(session_id);
CREATE INDEX idx_emergency_audit_logs_user_id ON emergency_audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_emergency_audit_logs_event_type ON emergency_audit_logs(event_type);
CREATE INDEX idx_emergency_audit_logs_created_at ON emergency_audit_logs(created_at);

-- Add RLS policies
ALTER TABLE emergency_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy for inserting audit logs (anyone can insert)
CREATE POLICY "Anyone can insert audit logs" ON emergency_audit_logs
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Policy for reading audit logs (only admins)
CREATE POLICY "Only admins can read audit logs" ON emergency_audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comment
COMMENT ON TABLE emergency_audit_logs IS 'Audit logs for emergency page interactions to ensure appropriate guidance was provided';