-- Create reading history table
CREATE TABLE reading_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  article_slug TEXT NOT NULL,
  article_title TEXT,
  article_category TEXT,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  read_duration_seconds INTEGER DEFAULT 0,
  scroll_percentage INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_slug)
);

-- Create indexes for performance
CREATE INDEX idx_reading_history_user_id ON reading_history(user_id);
CREATE INDEX idx_reading_history_last_read ON reading_history(last_read_at DESC);
CREATE INDEX idx_reading_history_completed ON reading_history(completed);

-- Enable RLS
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own reading history" ON reading_history
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert own reading history" ON reading_history
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update own reading history" ON reading_history
  FOR UPDATE USING (user_id IN (SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete own reading history" ON reading_history
  FOR DELETE USING (user_id IN (SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Function to update reading history
CREATE OR REPLACE FUNCTION update_reading_history(
  p_user_id UUID,
  p_article_slug TEXT,
  p_article_title TEXT,
  p_article_category TEXT,
  p_duration_seconds INTEGER DEFAULT 0,
  p_scroll_percentage INTEGER DEFAULT 0,
  p_completed BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO reading_history (
    user_id,
    article_slug,
    article_title,
    article_category,
    read_duration_seconds,
    scroll_percentage,
    completed,
    last_read_at
  ) VALUES (
    p_user_id,
    p_article_slug,
    p_article_title,
    p_article_category,
    p_duration_seconds,
    p_scroll_percentage,
    p_completed,
    NOW()
  )
  ON CONFLICT (user_id, article_slug) 
  DO UPDATE SET
    last_read_at = NOW(),
    read_duration_seconds = reading_history.read_duration_seconds + EXCLUDED.read_duration_seconds,
    scroll_percentage = GREATEST(reading_history.scroll_percentage, EXCLUDED.scroll_percentage),
    completed = reading_history.completed OR EXCLUDED.completed,
    article_title = COALESCE(EXCLUDED.article_title, reading_history.article_title),
    article_category = COALESCE(EXCLUDED.article_category, reading_history.article_category);
END;
$$ LANGUAGE plpgsql;

-- Function to get reading stats
CREATE OR REPLACE FUNCTION get_reading_stats(p_user_id UUID)
RETURNS TABLE (
  total_articles_read BIGINT,
  total_reading_time_minutes INTEGER,
  articles_completed BIGINT,
  current_streak_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT article_slug) as total_articles_read,
    COALESCE(SUM(read_duration_seconds) / 60, 0)::INTEGER as total_reading_time_minutes,
    COUNT(DISTINCT article_slug) FILTER (WHERE completed = true) as articles_completed,
    CASE 
      WHEN MAX(last_read_at::DATE) = CURRENT_DATE THEN
        COUNT(DISTINCT last_read_at::DATE) FILTER (
          WHERE last_read_at::DATE >= CURRENT_DATE - INTERVAL '30 days'
        )
      ELSE 0
    END::INTEGER as current_streak_days
  FROM reading_history
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;