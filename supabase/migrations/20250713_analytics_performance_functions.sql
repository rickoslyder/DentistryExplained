-- Function to get daily article views aggregated
CREATE OR REPLACE FUNCTION get_daily_article_views(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  view_date DATE,
  view_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(viewed_at) as view_date,
    COUNT(*)::BIGINT as view_count
  FROM article_views
  WHERE viewed_at >= start_date 
    AND viewed_at <= end_date
  GROUP BY DATE(viewed_at)
  ORDER BY view_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get top articles by views with article details
CREATE OR REPLACE FUNCTION get_top_articles_by_views(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  article_id UUID,
  title TEXT,
  slug TEXT,
  category TEXT,
  view_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH view_counts AS (
    SELECT 
      article_slug,
      COUNT(*)::BIGINT as view_count
    FROM article_views
    WHERE viewed_at >= start_date 
      AND viewed_at <= end_date
    GROUP BY article_slug
    ORDER BY view_count DESC
    LIMIT limit_count
  )
  SELECT 
    a.id as article_id,
    a.title,
    a.slug,
    a.category,
    vc.view_count
  FROM view_counts vc
  JOIN articles a ON a.slug = vc.article_slug
  ORDER BY vc.view_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get professional funnel metrics
CREATE OR REPLACE FUNCTION get_professional_funnel_metrics(
  current_start TIMESTAMP WITH TIME ZONE,
  current_end TIMESTAMP WITH TIME ZONE,
  previous_start TIMESTAMP WITH TIME ZONE,
  previous_end TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  professional_visitors BIGINT,
  professional_signups BIGINT,
  verifications_started BIGINT,
  verifications_submitted BIGINT,
  verifications_approved BIGINT,
  active_subscribers BIGINT,
  total_professionals BIGINT,
  avg_time_to_convert NUMERIC,
  prev_visitors BIGINT,
  prev_signups BIGINT,
  prev_verified BIGINT,
  prev_views BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH current_period AS (
    SELECT 
      -- Professional page visitors
      (SELECT COUNT(*) FROM activity_logs 
       WHERE resource_type = 'page' 
         AND resource_id = '/professional'
         AND created_at >= current_start 
         AND created_at <= current_end)::BIGINT as visitors,
      
      -- Professional signups
      (SELECT COUNT(*) FROM profiles 
       WHERE user_type = 'professional'
         AND created_at >= current_start 
         AND created_at <= current_end)::BIGINT as signups,
      
      -- Verifications
      (SELECT COUNT(*) FROM professional_verifications 
       WHERE created_at >= current_start 
         AND created_at <= current_end)::BIGINT as started,
      
      (SELECT COUNT(*) FROM professional_verifications 
       WHERE created_at >= current_start 
         AND created_at <= current_end
         AND status != 'pending')::BIGINT as submitted,
      
      (SELECT COUNT(*) FROM professional_verifications 
       WHERE created_at >= current_start 
         AND created_at <= current_end
         AND status = 'approved')::BIGINT as approved,
      
      -- Active subscribers (all approved)
      (SELECT COUNT(*) FROM professional_verifications 
       WHERE status = 'approved')::BIGINT as active_subs,
      
      -- Total professionals
      (SELECT COUNT(*) FROM profiles 
       WHERE user_type = 'professional')::BIGINT as total_pros,
      
      -- Average time to convert (in days)
      (SELECT AVG(EXTRACT(EPOCH FROM (approved_at - created_at)) / 86400)
       FROM professional_verifications 
       WHERE status = 'approved'
         AND approved_at IS NOT NULL
         AND created_at >= current_start 
         AND created_at <= current_end)::NUMERIC as avg_convert_time
  ),
  previous_period AS (
    SELECT 
      (SELECT COUNT(*) FROM activity_logs 
       WHERE resource_type = 'page' 
         AND resource_id = '/professional'
         AND created_at >= previous_start 
         AND created_at <= previous_end)::BIGINT as prev_visitors,
      
      (SELECT COUNT(*) FROM profiles 
       WHERE user_type = 'professional'
         AND created_at >= previous_start 
         AND created_at <= previous_end)::BIGINT as prev_signups,
      
      (SELECT COUNT(*) FROM professional_verifications 
       WHERE created_at >= previous_start 
         AND created_at <= previous_end
         AND status = 'approved')::BIGINT as prev_verified,
      
      (SELECT COUNT(*) FROM article_views 
       WHERE viewed_at >= previous_start 
         AND viewed_at <= previous_end)::BIGINT as prev_views
  )
  SELECT 
    c.visitors as professional_visitors,
    c.signups as professional_signups,
    c.started as verifications_started,
    c.submitted as verifications_submitted,
    c.approved as verifications_approved,
    c.active_subs as active_subscribers,
    c.total_pros as total_professionals,
    COALESCE(c.avg_convert_time, 0) as avg_time_to_convert,
    p.prev_visitors,
    p.prev_signups,
    p.prev_verified,
    p.prev_views
  FROM current_period c, previous_period p;
END;
$$ LANGUAGE plpgsql;

-- Function to get content performance metrics
CREATE OR REPLACE FUNCTION get_content_performance_metrics(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  article_id UUID,
  title TEXT,
  category TEXT,
  view_count BIGINT,
  avg_time_on_page NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH article_metrics AS (
    SELECT 
      av.article_slug,
      COUNT(*)::BIGINT as view_count
    FROM article_views av
    WHERE av.viewed_at >= start_date 
      AND av.viewed_at <= end_date
    GROUP BY av.article_slug
    ORDER BY view_count DESC
    LIMIT limit_count
  )
  SELECT 
    a.id as article_id,
    a.title,
    a.category,
    am.view_count,
    -- Estimate based on word count (200 words per minute)
    CASE 
      WHEN LENGTH(a.content) > 0 
      THEN (LENGTH(a.content) - LENGTH(REPLACE(a.content, ' ', ''))) / 200.0
      ELSE 3.5
    END as avg_time_on_page
  FROM article_metrics am
  JOIN articles a ON a.slug = am.article_slug
  ORDER BY am.view_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get user activity metrics
CREATE OR REPLACE FUNCTION get_user_activity_metrics(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  active_users BIGINT,
  avg_engagement INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Count unique users from activity logs
    (SELECT COUNT(DISTINCT user_id) 
     FROM activity_logs 
     WHERE created_at >= start_date 
       AND created_at <= end_date)::BIGINT as active_users,
    
    -- Calculate engagement rate (chat sessions / page views)
    CASE 
      WHEN (SELECT COUNT(*) FROM article_views WHERE viewed_at >= start_date AND viewed_at <= end_date) > 0
      THEN (
        (SELECT COUNT(*) FROM chat_sessions WHERE created_at >= start_date AND created_at <= end_date)::NUMERIC /
        (SELECT COUNT(*) FROM article_views WHERE viewed_at >= start_date AND viewed_at <= end_date)::NUMERIC * 100
      )::INTEGER
      ELSE 0
    END as avg_engagement;
END;
$$ LANGUAGE plpgsql;

-- Create indexes to speed up these queries if they don't exist
CREATE INDEX IF NOT EXISTS idx_article_views_viewed_at ON article_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_article_views_article_slug ON article_views(article_slug);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_professional_verifications_created_at ON professional_verifications(created_at);
CREATE INDEX IF NOT EXISTS idx_professional_verifications_status ON professional_verifications(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_web_searches_created_at ON web_searches(created_at);