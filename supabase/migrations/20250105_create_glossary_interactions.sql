-- Create glossary_interactions table to track user interactions with glossary terms
CREATE TABLE IF NOT EXISTS glossary_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term_id UUID REFERENCES glossary_terms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('view', 'search', 'copy', 'youtube', 'bookmark', 'quiz_attempt')),
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_glossary_interactions_term_id ON glossary_interactions(term_id);
CREATE INDEX idx_glossary_interactions_user_id ON glossary_interactions(user_id);
CREATE INDEX idx_glossary_interactions_type ON glossary_interactions(interaction_type);
CREATE INDEX idx_glossary_interactions_created_at ON glossary_interactions(created_at DESC);

-- Create view for aggregated stats
CREATE OR REPLACE VIEW glossary_term_stats AS
SELECT 
  gt.id,
  gt.term,
  gt.category,
  gt.difficulty,
  COUNT(DISTINCT CASE WHEN gi.interaction_type = 'view' THEN gi.id END) as view_count,
  COUNT(DISTINCT CASE WHEN gi.interaction_type = 'search' THEN gi.id END) as search_count,
  COUNT(DISTINCT CASE WHEN gi.interaction_type = 'copy' THEN gi.id END) as copy_count,
  COUNT(DISTINCT CASE WHEN gi.interaction_type = 'youtube' THEN gi.id END) as youtube_count,
  COUNT(DISTINCT CASE WHEN gi.interaction_type = 'bookmark' THEN gi.id END) as bookmark_count,
  MAX(gi.created_at) as last_interaction
FROM glossary_terms gt
LEFT JOIN glossary_interactions gi ON gt.id = gi.term_id
GROUP BY gt.id, gt.term, gt.category, gt.difficulty;

-- Create table for quiz results
CREATE TABLE IF NOT EXISTS glossary_quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  term_id UUID REFERENCES glossary_terms(id) ON DELETE CASCADE,
  correct BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  difficulty VARCHAR(20),
  session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for quiz results
CREATE INDEX idx_quiz_results_user_id ON glossary_quiz_results(user_id);
CREATE INDEX idx_quiz_results_term_id ON glossary_quiz_results(term_id);
CREATE INDEX idx_quiz_results_created_at ON glossary_quiz_results(created_at DESC);

-- Create view for user quiz stats
CREATE OR REPLACE VIEW user_quiz_stats AS
SELECT 
  user_id,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN correct THEN 1 ELSE 0 END) as correct_answers,
  AVG(CASE WHEN correct THEN 1.0 ELSE 0.0 END) * 100 as accuracy_percentage,
  AVG(response_time_ms) as avg_response_time,
  COUNT(DISTINCT DATE(created_at)) as days_practiced,
  MAX(created_at) as last_practice
FROM glossary_quiz_results
GROUP BY user_id;

-- RLS Policies
ALTER TABLE glossary_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary_quiz_results ENABLE ROW LEVEL SECURITY;

-- Anyone can insert their own interactions
CREATE POLICY "Users can insert own interactions" ON glossary_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view their own interactions
CREATE POLICY "Users can view own interactions" ON glossary_interactions
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all interactions
CREATE POLICY "Admins can view all interactions" ON glossary_interactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Quiz policies
CREATE POLICY "Users can insert own quiz results" ON glossary_quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own quiz results" ON glossary_quiz_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz results" ON glossary_quiz_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );