-- Create table for tracking web searches
CREATE TABLE IF NOT EXISTS web_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  search_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_web_searches_user_id ON web_searches(user_id);
CREATE INDEX idx_web_searches_created_at ON web_searches(created_at DESC);
CREATE INDEX idx_web_searches_search_type ON web_searches(search_type);

-- Enable RLS
ALTER TABLE web_searches ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own searches" ON web_searches
  FOR SELECT USING (auth.uid()::uuid = (SELECT user_id FROM profiles WHERE id = web_searches.user_id));

CREATE POLICY "Admins can view all searches" ON web_searches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()::uuid
      AND profiles.role = 'admin'
    )
  );

-- Create analytics view for search trends
CREATE OR REPLACE VIEW search_trends AS
SELECT 
  search_type,
  COUNT(*) as search_count,
  COUNT(DISTINCT user_id) as unique_users,
  DATE_TRUNC('day', created_at) as search_date
FROM web_searches
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY search_type, DATE_TRUNC('day', created_at)
ORDER BY search_date DESC, search_count DESC;

-- Grant permissions
GRANT SELECT ON search_trends TO authenticated;