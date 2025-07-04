-- Dentistry Explained Database Schema
-- This file contains the complete database schema for the MVP

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- User profiles table (synced with Clerk)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  user_type TEXT CHECK (user_type IN ('patient', 'professional')) NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Professional verifications table
CREATE TABLE professional_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  gdc_number TEXT CHECK (gdc_number ~ '^\d{7}$'),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verification_documents JSONB,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat sessions table (180-day retention)
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  page_context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '180 days'),
  last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Practice listings table
CREATE TABLE practice_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  location GEOGRAPHY(POINT, 4326),
  address JSONB NOT NULL,
  contact JSONB NOT NULL,
  services TEXT[],
  nhs_accepted BOOLEAN DEFAULT FALSE,
  private_accepted BOOLEAN DEFAULT TRUE,
  accessibility_features TEXT[],
  opening_hours JSONB,
  photos TEXT[],
  website_url TEXT,
  claimed_by UUID REFERENCES profiles(id),
  claim_status TEXT DEFAULT 'unclaimed' CHECK (claim_status IN ('unclaimed', 'pending', 'claimed')),
  verification_documents JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article views for analytics and realtime features
CREATE TABLE article_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_slug TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- User bookmarks
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  article_slug TEXT NOT NULL,
  article_title TEXT,
  article_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_slug)
);

-- Notifications system
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- User preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  reading_level TEXT DEFAULT 'basic' CHECK (reading_level IN ('basic', 'advanced')),
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT FALSE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT DEFAULT 'en-GB',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content analytics for trending/popular content
CREATE TABLE content_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_slug TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_time_on_page INTERVAL,
  bounce_rate DECIMAL(5,2),
  search_impressions INTEGER DEFAULT 0,
  clicks_from_search INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_slug, date)
);

-- Search queries for analytics
CREATE TABLE search_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  results_count INTEGER,
  clicked_result TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consent forms and templates (for professionals)
CREATE TABLE consent_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL,
  patient_name TEXT,
  procedure_details JSONB,
  custom_fields JSONB,
  generated_pdf_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_clerk_id ON profiles(clerk_id);
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_prof_verif_user ON professional_verifications(user_id);
CREATE INDEX idx_prof_verif_status ON professional_verifications(verification_status);
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_expires ON chat_sessions(expires_at);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX idx_practices_location ON practice_listings USING GIST(location);
CREATE INDEX idx_practices_services ON practice_listings USING GIN(services);
CREATE INDEX idx_practices_claimed ON practice_listings(claimed_by) WHERE claimed_by IS NOT NULL;
CREATE INDEX idx_article_views_slug ON article_views(article_slug);
CREATE INDEX idx_article_views_time ON article_views(viewed_at);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_content_analytics_slug_date ON content_analytics(article_slug, date);
CREATE INDEX idx_search_queries_created ON search_queries(created_at);

-- Row Level Security Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_forms ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (clerk_id = auth.jwt() ->> 'sub');

-- Professional verifications: Users can only see their own
CREATE POLICY "Users can view own verification" ON professional_verifications
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Chat sessions: Users can only access their own sessions
CREATE POLICY "Users can access own chat sessions" ON chat_sessions
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Chat messages: Users can only access messages from their sessions
CREATE POLICY "Users can access own chat messages" ON chat_messages
  FOR SELECT USING (session_id IN (
    SELECT id FROM chat_sessions WHERE user_id IN (
      SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  ));

-- Bookmarks: Users can only access their own bookmarks
CREATE POLICY "Users can manage own bookmarks" ON bookmarks
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub'));

-- User preferences: Users can only manage their own preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Consent forms: Users can only access their own forms
CREATE POLICY "Users can manage own consent forms" ON consent_forms
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Practice listings: Public read, only claimed owners can edit
CREATE POLICY "Practice listings are publicly viewable" ON practice_listings
  FOR SELECT USING (true);

CREATE POLICY "Only claimed owners can edit practices" ON practice_listings
  FOR UPDATE USING (claimed_by IN (SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Article views: Anyone can insert, users can only see their own
CREATE POLICY "Anyone can track article views" ON article_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own article history" ON article_views
  FOR SELECT USING (
    user_id IS NULL OR 
    user_id IN (SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub')
  );

-- Function to automatically clean up expired chat sessions
CREATE OR REPLACE FUNCTION cleanup_expired_chat_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM chat_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prof_verif_updated_at BEFORE UPDATE ON professional_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practices_updated_at BEFORE UPDATE ON practice_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consent_forms_updated_at BEFORE UPDATE ON consent_forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get trending articles
CREATE OR REPLACE FUNCTION get_trending_articles(
  time_window TEXT DEFAULT '24h',
  result_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  article_slug TEXT,
  view_count BIGINT,
  unique_visitors BIGINT
) AS $$
DECLARE
  window_start TIMESTAMPTZ;
BEGIN
  -- Calculate window start time
  CASE time_window
    WHEN '1h' THEN window_start := NOW() - INTERVAL '1 hour';
    WHEN '24h' THEN window_start := NOW() - INTERVAL '24 hours';
    WHEN '7d' THEN window_start := NOW() - INTERVAL '7 days';
    ELSE window_start := NOW() - INTERVAL '24 hours';
  END CASE;

  RETURN QUERY
  SELECT 
    av.article_slug,
    COUNT(*) as view_count,
    COUNT(DISTINCT av.user_id) as unique_visitors
  FROM article_views av
  WHERE av.viewed_at >= window_start
  GROUP BY av.article_slug
  ORDER BY view_count DESC, unique_visitors DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;