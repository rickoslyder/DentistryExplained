-- Security Tables Migration
-- Creates tables for API keys, security logs, and alerts

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  scopes TEXT[] DEFAULT '{}',
  rate_limit_override JSONB,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Indexes for API keys
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at) WHERE expires_at IS NOT NULL;

-- Security logs table
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  path TEXT,
  method VARCHAR(20),
  details JSONB DEFAULT '{}',
  resolution JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for security logs
CREATE INDEX idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_severity ON security_logs(severity);
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_security_logs_ip_address ON security_logs(ip_address);
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at DESC);

-- Security alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for security alerts
CREATE INDEX idx_security_alerts_type ON security_alerts(type);
CREATE INDEX idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_security_alerts_acknowledged ON security_alerts(acknowledged);
CREATE INDEX idx_security_alerts_created_at ON security_alerts(created_at DESC);

-- Rate limit violations table (for persistent tracking)
CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_identifier VARCHAR(255) NOT NULL, -- IP, user ID, or API key
  rule_id VARCHAR(100),
  path TEXT,
  method VARCHAR(20),
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for rate limit violations
CREATE INDEX idx_rate_limit_violations_key ON rate_limit_violations(key_identifier);
CREATE INDEX idx_rate_limit_violations_window ON rate_limit_violations(window_start, window_end);
CREATE INDEX idx_rate_limit_violations_created_at ON rate_limit_violations(created_at DESC);

-- Blocked IPs table
CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for blocked IPs
CREATE INDEX idx_blocked_ips_ip_address ON blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_expires_at ON blocked_ips(expires_at) WHERE expires_at IS NOT NULL;

-- API key scopes reference table
CREATE TABLE IF NOT EXISTS api_key_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default scopes
INSERT INTO api_key_scopes (scope, description, category) VALUES
  ('read:articles', 'Read access to articles', 'content'),
  ('write:articles', 'Write access to articles', 'content'),
  ('read:users', 'Read access to user data', 'users'),
  ('write:users', 'Write access to user data', 'users'),
  ('read:analytics', 'Read access to analytics data', 'analytics'),
  ('admin:all', 'Full administrative access', 'admin'),
  ('*', 'Full access to all resources', 'admin')
ON CONFLICT (scope) DO NOTHING;

-- Row Level Security Policies

-- API Keys RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can create their own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can delete their own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid()::TEXT = user_id::TEXT);

-- Security logs RLS (admin only)
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security logs"
  ON security_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Security alerts RLS (admin only)
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security alerts"
  ON security_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update security alerts"
  ON security_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Blocked IPs RLS (admin only)
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blocked IPs"
  ON blocked_ips FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Functions

-- Function to clean up expired data
CREATE OR REPLACE FUNCTION cleanup_expired_security_data()
RETURNS void AS $$
BEGIN
  -- Delete expired API keys
  DELETE FROM api_keys
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  -- Delete expired IP blocks
  DELETE FROM blocked_ips
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  -- Delete old security logs (older than 90 days)
  DELETE FROM security_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Delete old rate limit violations (older than 7 days)
  DELETE FROM rate_limit_violations
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (requires pg_cron extension)
-- This would be set up separately in Supabase dashboard

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blocked_ips_updated_at
  BEFORE UPDATE ON blocked_ips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();