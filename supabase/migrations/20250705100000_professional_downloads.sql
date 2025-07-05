-- Create professional downloads table for tracking resource downloads
CREATE TABLE professional_downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('consent_form', 'patient_material', 'clinical_guide', 'other')),
  resource_name TEXT NOT NULL,
  resource_slug TEXT NOT NULL,
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_slug, downloaded_at)
);

-- Create indexes for performance
CREATE INDEX idx_professional_downloads_user_id ON professional_downloads(user_id);
CREATE INDEX idx_professional_downloads_downloaded_at ON professional_downloads(downloaded_at DESC);
CREATE INDEX idx_professional_downloads_resource_type ON professional_downloads(resource_type);

-- Enable RLS
ALTER TABLE professional_downloads ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own downloads" ON professional_downloads
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert own downloads" ON professional_downloads
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Function to track downloads
CREATE OR REPLACE FUNCTION track_professional_download(
  p_user_id UUID,
  p_resource_type TEXT,
  p_resource_name TEXT,
  p_resource_slug TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO professional_downloads (
    user_id,
    resource_type,
    resource_name,
    resource_slug,
    downloaded_at
  ) VALUES (
    p_user_id,
    p_resource_type,
    p_resource_name,
    p_resource_slug,
    NOW()
  )
  ON CONFLICT (user_id, resource_slug, downloaded_at) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to get download stats
CREATE OR REPLACE FUNCTION get_download_stats(p_user_id UUID)
RETURNS TABLE (
  total_downloads BIGINT,
  downloads_this_month BIGINT,
  recent_downloads JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_downloads,
    COUNT(*) FILTER (WHERE downloaded_at >= date_trunc('month', CURRENT_DATE))::BIGINT as downloads_this_month,
    (
      SELECT json_agg(json_build_object(
        'resource_name', resource_name,
        'resource_type', resource_type,
        'downloaded_at', downloaded_at
      ) ORDER BY downloaded_at DESC)
      FROM (
        SELECT DISTINCT ON (resource_slug) 
          resource_name, 
          resource_type, 
          downloaded_at
        FROM professional_downloads
        WHERE user_id = p_user_id
        ORDER BY resource_slug, downloaded_at DESC
        LIMIT 5
      ) recent
    ) as recent_downloads
  FROM professional_downloads
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;