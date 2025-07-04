-- Clerk Authentication Integration
-- This migration updates the RLS policies to work with Clerk JWT tokens

-- Create a custom function to extract Clerk user ID from JWT
CREATE OR REPLACE FUNCTION auth.clerk_user_id()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', ''),
    NULLIF(current_setting('request.jwt.claims', true)::json->>'userId', '')
  )::text;
$$;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own verification" ON professional_verifications;
DROP POLICY IF EXISTS "Users can access own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can access own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can manage own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can manage own consent forms" ON consent_forms;
DROP POLICY IF EXISTS "Practice listings are publicly viewable" ON practice_listings;
DROP POLICY IF EXISTS "Only claimed owners can edit practices" ON practice_listings;
DROP POLICY IF EXISTS "Anyone can track article views" ON article_views;
DROP POLICY IF EXISTS "Users can view own article history" ON article_views;

-- Create new RLS policies that work with Clerk

-- Profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (clerk_id = auth.clerk_user_id());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (clerk_id = auth.clerk_user_id());

-- Professional verifications: Users can only see their own
CREATE POLICY "Users can view own verification" ON professional_verifications
  FOR SELECT USING (user_id IN (
    SELECT id FROM profiles WHERE clerk_id = auth.clerk_user_id()
  ));

-- Chat sessions: Users can only access their own sessions
CREATE POLICY "Users can access own chat sessions" ON chat_sessions
  FOR ALL USING (user_id IN (
    SELECT id FROM profiles WHERE clerk_id = auth.clerk_user_id()
  ));

-- Chat messages: Users can only access messages from their sessions
CREATE POLICY "Users can access own chat messages" ON chat_messages
  FOR SELECT USING (session_id IN (
    SELECT id FROM chat_sessions WHERE user_id IN (
      SELECT id FROM profiles WHERE clerk_id = auth.clerk_user_id()
    )
  ));

CREATE POLICY "Users can insert own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (session_id IN (
    SELECT id FROM chat_sessions WHERE user_id IN (
      SELECT id FROM profiles WHERE clerk_id = auth.clerk_user_id()
    )
  ));

-- Bookmarks: Users can only access their own bookmarks
CREATE POLICY "Users can manage own bookmarks" ON bookmarks
  FOR ALL USING (user_id IN (
    SELECT id FROM profiles WHERE clerk_id = auth.clerk_user_id()
  ));

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id IN (
    SELECT id FROM profiles WHERE clerk_id = auth.clerk_user_id()
  ));

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id IN (
    SELECT id FROM profiles WHERE clerk_id = auth.clerk_user_id()
  ));

-- User preferences: Users can only manage their own preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (user_id IN (
    SELECT id FROM profiles WHERE clerk_id = auth.clerk_user_id()
  ));

-- Consent forms: Users can only access their own forms
CREATE POLICY "Users can manage own consent forms" ON consent_forms
  FOR ALL USING (user_id IN (
    SELECT id FROM profiles WHERE clerk_id = auth.clerk_user_id()
  ));

-- Practice listings: Public read, only claimed owners can edit
CREATE POLICY "Practice listings are publicly viewable" ON practice_listings
  FOR SELECT USING (true);

CREATE POLICY "Only claimed owners can edit practices" ON practice_listings
  FOR UPDATE USING (claimed_by IN (
    SELECT id FROM profiles WHERE clerk_id = auth.clerk_user_id()
  ));

CREATE POLICY "Professionals can insert new practices" ON practice_listings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE clerk_id = auth.clerk_user_id() 
      AND user_type = 'professional'
    )
  );

-- Article views: Anyone can insert, users can only see their own
CREATE POLICY "Anyone can track article views" ON article_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own article history" ON article_views
  FOR SELECT USING (
    user_id IS NULL OR 
    user_id IN (SELECT id FROM profiles WHERE clerk_id = auth.clerk_user_id())
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.clerk_user_id() TO anon, authenticated;