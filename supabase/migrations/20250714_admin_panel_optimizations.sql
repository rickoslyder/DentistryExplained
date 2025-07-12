-- Enable pg_trgm extension for text search indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Function to get user statistics in a single query
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS json AS $$
SELECT json_build_object(
  'total', COUNT(*),
  'patients', COUNT(*) FILTER (WHERE user_type = 'patient'),
  'professionals', COUNT(*) FILTER (WHERE user_type = 'professional'),
  'admins', COUNT(*) FILTER (WHERE role = 'admin'),
  'verified_professionals', COUNT(*) FILTER (WHERE user_type = 'professional' AND EXISTS (
    SELECT 1 FROM professional_verifications pv 
    WHERE pv.user_id = profiles.id AND pv.verification_status = 'approved'
  ))
) FROM profiles;
$$ LANGUAGE sql STABLE;

-- 2. Function to get article statistics
CREATE OR REPLACE FUNCTION get_article_stats()
RETURNS json AS $$
SELECT json_build_object(
  'total', COUNT(*),
  'published', COUNT(*) FILTER (WHERE status = 'published'),
  'draft', COUNT(*) FILTER (WHERE status = 'draft'),
  'archived', COUNT(*) FILTER (WHERE status = 'archived'),
  'recent_7_days', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'),
  'previous_7_days', COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '7 days' AND created_at >= NOW() - INTERVAL '14 days')
) FROM articles;
$$ LANGUAGE sql STABLE;

-- 3. Function to get user growth statistics
CREATE OR REPLACE FUNCTION get_user_growth_stats(days INTEGER DEFAULT 30)
RETURNS json AS $$
WITH daily_stats AS (
  SELECT 
    DATE(created_at) as date,
    user_type,
    COUNT(*) as count
  FROM profiles
  WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * days
  GROUP BY DATE(created_at), user_type
),
aggregated AS (
  SELECT 
    date,
    COALESCE(SUM(count) FILTER (WHERE user_type = 'patient'), 0) as patients,
    COALESCE(SUM(count) FILTER (WHERE user_type = 'professional'), 0) as professionals,
    COALESCE(SUM(count), 0) as total
  FROM daily_stats
  GROUP BY date
  ORDER BY date
)
SELECT json_build_object(
  'daily', json_agg(
    json_build_object(
      'date', date,
      'patients', patients,
      'professionals', professionals,
      'total', total
    )
  ),
  'summary', json_build_object(
    'total_patients', SUM(patients),
    'total_professionals', SUM(professionals),
    'total_users', SUM(total),
    'avg_daily_patients', AVG(patients)::numeric(10,2),
    'avg_daily_professionals', AVG(professionals)::numeric(10,2)
  )
) FROM aggregated;
$$ LANGUAGE sql STABLE;

-- 4. Function to get verification statistics with trends
CREATE OR REPLACE FUNCTION get_verification_stats()
RETURNS json AS $$
WITH current_stats AS (
  SELECT 
    verification_status,
    COUNT(*) as count
  FROM professional_verifications
  GROUP BY verification_status
),
recent_stats AS (
  SELECT 
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7d,
    COUNT(*) FILTER (WHERE verification_status = 'approved' AND approved_at >= NOW() - INTERVAL '7 days') as approved_last_7d
  FROM professional_verifications
)
SELECT json_build_object(
  'by_status', json_object_agg(
    COALESCE(verification_status, 'unknown'), 
    count
  ),
  'recent', json_build_object(
    'last_24h', last_24h,
    'last_7d', last_7d,
    'approved_last_7d', approved_last_7d
  )
) FROM current_stats, recent_stats
GROUP BY last_24h, last_7d, approved_last_7d;
$$ LANGUAGE sql STABLE;

-- 5. Function to get dashboard widget stats in one call
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json AS $$
WITH user_stats AS (
  SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_7d,
    COUNT(*) FILTER (WHERE user_type = 'professional') as total_professionals,
    COUNT(*) FILTER (WHERE user_type = 'patient') as total_patients
  FROM profiles
),
article_stats AS (
  SELECT 
    COUNT(*) as total_articles,
    COUNT(*) FILTER (WHERE status = 'published') as published_articles,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_articles_7d
  FROM articles
),
chat_stats AS (
  SELECT 
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(*) as total_messages,
    COUNT(DISTINCT session_id) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as sessions_7d
  FROM chat_messages
),
view_stats AS (
  SELECT 
    COUNT(*) as total_views,
    COUNT(*) FILTER (WHERE viewed_at >= NOW() - INTERVAL '24 hours') as views_24h,
    COUNT(DISTINCT user_id) FILTER (WHERE viewed_at >= NOW() - INTERVAL '24 hours') as unique_viewers_24h
  FROM article_views
)
SELECT json_build_object(
  'users', row_to_json(user_stats),
  'articles', row_to_json(article_stats),
  'chat', row_to_json(chat_stats),
  'views', row_to_json(view_stats),
  'timestamp', NOW()
) 
FROM user_stats, article_stats, chat_stats, view_stats;
$$ LANGUAGE sql STABLE;

-- 6. Create optimized indexes for common query patterns

-- Text search indexes for user search
CREATE INDEX IF NOT EXISTS idx_profiles_email_search 
ON profiles USING gin(email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_name_search 
ON profiles USING gin((COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) gin_trgm_ops);

-- Indexes for article queries
CREATE INDEX IF NOT EXISTS idx_articles_status_created 
ON articles(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_category_status 
ON articles(category_id, status) WHERE status = 'published';

-- Index for verification lookups
CREATE INDEX IF NOT EXISTS idx_professional_verifications_user_status 
ON professional_verifications(user_id, verification_status);

-- Indexes for activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created 
ON activity_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_resource 
ON activity_logs(resource_type, resource_id, created_at DESC);

-- Index for chat sessions
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created 
ON chat_messages(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_created 
ON chat_sessions(user_id, created_at DESC);

-- Composite indexes for common join patterns
CREATE INDEX IF NOT EXISTS idx_profiles_type_created 
ON profiles(user_type, created_at DESC);

-- 7. Function to get user details with verification status efficiently
CREATE OR REPLACE FUNCTION get_users_with_verification(
  search_query TEXT DEFAULT NULL,
  user_type_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS json AS $$
SELECT json_build_object(
  'users', json_agg(
    json_build_object(
      'id', p.id,
      'email', p.email,
      'first_name', p.first_name,
      'last_name', p.last_name,
      'user_type', p.user_type,
      'role', p.role,
      'created_at', p.created_at,
      'verification_status', pv.verification_status,
      'verification_submitted_at', pv.created_at,
      'verification_approved_at', pv.approved_at
    )
  ),
  'total', COUNT(*) OVER()
)
FROM profiles p
LEFT JOIN professional_verifications pv ON p.id = pv.user_id
WHERE 
  (search_query IS NULL OR 
   p.email ILIKE '%' || search_query || '%' OR 
   (p.first_name || ' ' || p.last_name) ILIKE '%' || search_query || '%')
  AND (user_type_filter IS NULL OR p.user_type = user_type_filter)
ORDER BY p.created_at DESC
LIMIT limit_count
OFFSET offset_count;
$$ LANGUAGE sql STABLE;

-- 8. Materialized view for expensive dashboard metrics (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_metrics AS
WITH date_series AS (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    INTERVAL '1 day'
  )::date AS date
),
daily_users AS (
  SELECT 
    DATE(created_at) as date,
    user_type,
    COUNT(*) as count
  FROM profiles
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY DATE(created_at), user_type
),
daily_articles AS (
  SELECT 
    DATE(created_at) as date,
    COUNT(*) as count
  FROM articles
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY DATE(created_at)
),
daily_views AS (
  SELECT 
    DATE(viewed_at) as date,
    COUNT(*) as views,
    COUNT(DISTINCT user_id) as unique_viewers
  FROM article_views
  WHERE viewed_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY DATE(viewed_at)
)
SELECT 
  ds.date,
  COALESCE(SUM(du.count) FILTER (WHERE du.user_type = 'patient'), 0) as new_patients,
  COALESCE(SUM(du.count) FILTER (WHERE du.user_type = 'professional'), 0) as new_professionals,
  COALESCE(SUM(da.count), 0) as new_articles,
  COALESCE(SUM(dv.views), 0) as total_views,
  COALESCE(SUM(dv.unique_viewers), 0) as unique_viewers
FROM date_series ds
LEFT JOIN daily_users du ON ds.date = du.date
LEFT JOIN daily_articles da ON ds.date = da.date
LEFT JOIN daily_views dv ON ds.date = dv.date
GROUP BY ds.date
ORDER BY ds.date;

-- Create index on materialized view
CREATE INDEX idx_dashboard_metrics_date ON dashboard_metrics(date DESC);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics;
END;
$$ LANGUAGE plpgsql;

-- Schedule periodic refresh (you'll need to set up a cron job or use pg_cron)
-- Example: SELECT cron.schedule('refresh-dashboard-metrics', '0 * * * *', 'SELECT refresh_dashboard_metrics();');