-- Moderation Tables Migration
-- Created: 2025-01-12

-- Moderation queue table
CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  moderation_result JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, in_review, reviewed
  priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  assigned_to UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  decision VARCHAR(50), -- approve, reject, edit, warn, ban, shadowban
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for moderation queue
CREATE INDEX idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX idx_moderation_queue_priority ON moderation_queue(priority);
CREATE INDEX idx_moderation_queue_author ON moderation_queue(author_id);
CREATE INDEX idx_moderation_queue_assigned ON moderation_queue(assigned_to);
CREATE INDEX idx_moderation_queue_created ON moderation_queue(created_at);

-- Moderation logs table
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(50) NOT NULL,
  content_id UUID,
  content_type VARCHAR(50),
  user_id UUID REFERENCES profiles(id),
  moderator_id UUID REFERENCES profiles(id),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for moderation logs
CREATE INDEX idx_moderation_logs_action ON moderation_logs(action);
CREATE INDEX idx_moderation_logs_user ON moderation_logs(user_id);
CREATE INDEX idx_moderation_logs_created ON moderation_logs(created_at);

-- User warnings table
CREATE TABLE IF NOT EXISTS user_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  content_id UUID,
  moderator_id UUID REFERENCES profiles(id),
  severity VARCHAR(20) DEFAULT 'medium',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user warnings
CREATE INDEX idx_user_warnings_user ON user_warnings(user_id);
CREATE INDEX idx_user_warnings_created ON user_warnings(created_at);

-- Reputation history table
CREATE TABLE IF NOT EXISTS reputation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  weight INTEGER NOT NULL,
  old_score INTEGER NOT NULL,
  new_score INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for reputation history
CREATE INDEX idx_reputation_history_user ON reputation_history(user_id);
CREATE INDEX idx_reputation_history_action ON reputation_history(action);
CREATE INDEX idx_reputation_history_created ON reputation_history(created_at);

-- User permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  permissions TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User stats table
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_posts INTEGER DEFAULT 0,
  helpful_flags INTEGER DEFAULT 0,
  quality_content INTEGER DEFAULT 0,
  violations INTEGER DEFAULT 0,
  last_violation_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow logs table
CREATE TABLE IF NOT EXISTS workflow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(50) NOT NULL,
  moderation_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for workflow logs
CREATE INDEX idx_workflow_logs_content ON workflow_logs(content_id);
CREATE INDEX idx_workflow_logs_user ON workflow_logs(user_id);
CREATE INDEX idx_workflow_logs_created ON workflow_logs(created_at);

-- User actions table (for rate limiting)
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user actions
CREATE INDEX idx_user_actions_user_action ON user_actions(user_id, action);
CREATE INDEX idx_user_actions_created ON user_actions(created_at);

-- Add moderation fields to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation_level VARCHAR(20) DEFAULT 'new';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation_badges JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation_updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_shadowbanned BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shadowbanned_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();

-- Add moderation fields to content tables
-- Comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE comments ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS edit_suggestions TEXT[];

-- Articles (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'articles') THEN
    ALTER TABLE articles ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending';
    ALTER TABLE articles ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;
    ALTER TABLE articles ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE;
    ALTER TABLE articles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
    ALTER TABLE articles ADD COLUMN IF NOT EXISTS edit_suggestions TEXT[];
  END IF;
END $$;

-- Chat messages
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edit_suggestions TEXT[];

-- Create function to update user reputation
CREATE OR REPLACE FUNCTION update_user_reputation(
  user_id UUID,
  change INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET 
    reputation_score = GREATEST(0, reputation_score + change),
    reputation_updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old actions (for rate limiting)
CREATE OR REPLACE FUNCTION cleanup_old_actions() RETURNS VOID AS $$
BEGIN
  DELETE FROM user_actions 
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create function to check user suspension status
CREATE OR REPLACE FUNCTION check_user_suspension() RETURNS TRIGGER AS $$
BEGIN
  -- Auto-unsuspend users when suspension expires
  IF NEW.is_suspended AND NEW.suspended_until IS NOT NULL AND NEW.suspended_until < NOW() THEN
    NEW.is_suspended := FALSE;
    NEW.suspended_until := NULL;
    NEW.suspension_reason := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for suspension check
CREATE TRIGGER check_suspension_before_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_user_suspension();

-- Row Level Security
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Moderation queue: Only moderators and admins can view/edit
CREATE POLICY "Moderators can view moderation queue" ON moderation_queue
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_permissions 
      WHERE 'moderate_basic' = ANY(permissions) 
      OR 'moderate_full' = ANY(permissions)
      OR 'admin_access' = ANY(permissions)
    )
  );

CREATE POLICY "Moderators can update moderation queue" ON moderation_queue
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM user_permissions 
      WHERE 'moderate_basic' = ANY(permissions) 
      OR 'moderate_full' = ANY(permissions)
      OR 'admin_access' = ANY(permissions)
    )
  );

-- User warnings: Users can view their own, moderators can view all
CREATE POLICY "Users can view own warnings" ON user_warnings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Moderators can view all warnings" ON user_warnings
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_permissions 
      WHERE 'moderate_basic' = ANY(permissions) 
      OR 'moderate_full' = ANY(permissions)
      OR 'admin_access' = ANY(permissions)
    )
  );

-- Reputation history: Users can view their own
CREATE POLICY "Users can view own reputation history" ON reputation_history
  FOR SELECT USING (auth.uid() = user_id);

-- User stats: Users can view their own
CREATE POLICY "Users can view own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

-- User actions: Only system can insert, users can view their own
CREATE POLICY "Users can view own actions" ON user_actions
  FOR SELECT USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON moderation_queue TO authenticated;
GRANT SELECT ON user_warnings TO authenticated;
GRANT SELECT ON reputation_history TO authenticated;
GRANT SELECT ON user_stats TO authenticated;
GRANT SELECT ON user_actions TO authenticated;