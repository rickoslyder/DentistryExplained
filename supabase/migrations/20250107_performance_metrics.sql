-- Create performance_metrics table for storing web vitals and performance data
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  url TEXT NOT NULL,
  metrics_summary JSONB NOT NULL DEFAULT '{}',
  raw_metrics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX idx_performance_metrics_url ON performance_metrics(url);
CREATE INDEX idx_performance_metrics_summary ON performance_metrics USING GIN (metrics_summary);

-- Create a view for easy access to web vitals
CREATE OR REPLACE VIEW web_vitals_summary AS
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as sample_count,
  AVG((metrics_summary->>'lcp')::NUMERIC) as avg_lcp,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (metrics_summary->>'lcp')::NUMERIC) as p75_lcp,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metrics_summary->>'lcp')::NUMERIC) as p95_lcp,
  AVG((metrics_summary->>'fid')::NUMERIC) as avg_fid,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (metrics_summary->>'fid')::NUMERIC) as p75_fid,
  AVG((metrics_summary->>'cls')::NUMERIC) as avg_cls,
  AVG((metrics_summary->>'ttfb')::NUMERIC) as avg_ttfb,
  AVG((metrics_summary->>'page_load_time')::NUMERIC) as avg_page_load_time
FROM performance_metrics
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour DESC;

-- RLS policies
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Only allow inserts from authenticated users (for metric collection)
CREATE POLICY "Users can insert performance metrics" ON performance_metrics
  FOR INSERT TO authenticated
  USING (true);

-- Only admins can read performance metrics
CREATE POLICY "Admins can read performance metrics" ON performance_metrics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'professional'
    )
  );

-- Function to clean up old metrics (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_performance_metrics()
RETURNS void AS $$
BEGIN
  DELETE FROM performance_metrics
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (would need pg_cron extension in production)
-- SELECT cron.schedule('cleanup-performance-metrics', '0 2 * * *', 'SELECT cleanup_old_performance_metrics();');