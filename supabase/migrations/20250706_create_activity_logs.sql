-- Create activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id TEXT,
  resource_name TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT activity_logs_action_check CHECK (
    action IN (
      'create', 'update', 'delete', 'login', 'logout', 
      'role_change', 'bulk_delete', 'upload', 'export', 
      'import', 'verify', 'approve', 'reject', 'view'
    )
  ),
  CONSTRAINT activity_logs_resource_type_check CHECK (
    resource_type IN (
      'article', 'category', 'user', 'media', 'settings', 
      'verification', 'glossary_term', 'chat_session'
    )
  )
);

-- Create indexes for performance
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_resource_type ON activity_logs(resource_type);
CREATE INDEX idx_activity_logs_resource_id ON activity_logs(resource_id);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view activity logs
CREATE POLICY "Only admins can view activity logs" ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Any authenticated user can insert logs (for tracking their own actions)
CREATE POLICY "Authenticated users can insert activity logs" ON activity_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- No one can update or delete logs (immutable for audit trail)
-- No UPDATE or DELETE policies means these operations are blocked