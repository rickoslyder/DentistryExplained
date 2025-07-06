-- Create an enhanced search function that supports advanced filtering
CREATE OR REPLACE FUNCTION search_articles_advanced(
  search_query TEXT DEFAULT NULL,
  filter_status TEXT[] DEFAULT NULL,
  filter_categories TEXT[] DEFAULT NULL,
  filter_authors UUID[] DEFAULT NULL,
  filter_tags UUID[] DEFAULT NULL,
  filter_date_start TIMESTAMPTZ DEFAULT NULL,
  filter_date_end TIMESTAMPTZ DEFAULT NULL,
  filter_reading_level TEXT[] DEFAULT NULL,
  filter_content_type TEXT[] DEFAULT NULL,
  filter_has_images BOOLEAN DEFAULT NULL,
  filter_word_count_min INTEGER DEFAULT NULL,
  filter_word_count_max INTEGER DEFAULT NULL,
  sort_field TEXT DEFAULT 'relevance',
  sort_order TEXT DEFAULT 'desc',
  result_limit INTEGER DEFAULT 20,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  content TEXT,
  status TEXT,
  published_at TIMESTAMPTZ,
  view_count INTEGER,
  read_time INTEGER,
  word_count INTEGER,
  featured_image TEXT,
  reading_level TEXT,
  content_type TEXT,
  category_id UUID,
  author_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  search_rank REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_articles AS (
    SELECT 
      a.*,
      CASE 
        WHEN search_query IS NOT NULL AND LENGTH(search_query) > 0 THEN
          ts_rank(a.search_vector, websearch_to_tsquery('english', search_query))
        ELSE 1.0
      END AS rank
    FROM articles a
    WHERE 
      -- Text search filter
      (search_query IS NULL OR LENGTH(search_query) = 0 OR 
       a.search_vector @@ websearch_to_tsquery('english', search_query))
      
      -- Status filter
      AND (filter_status IS NULL OR a.status = ANY(filter_status))
      
      -- Category filter
      AND (filter_categories IS NULL OR EXISTS (
        SELECT 1 FROM categories c 
        WHERE c.id = a.category_id AND c.slug = ANY(filter_categories)
      ))
      
      -- Author filter
      AND (filter_authors IS NULL OR a.author_id = ANY(filter_authors))
      
      -- Tags filter
      AND (filter_tags IS NULL OR EXISTS (
        SELECT 1 FROM article_tags at 
        WHERE at.article_id = a.id AND at.tag_id = ANY(filter_tags)
      ))
      
      -- Date range filter
      AND (filter_date_start IS NULL OR a.published_at >= filter_date_start)
      AND (filter_date_end IS NULL OR a.published_at <= filter_date_end)
      
      -- Reading level filter
      AND (filter_reading_level IS NULL OR a.reading_level = ANY(filter_reading_level))
      
      -- Content type filter
      AND (filter_content_type IS NULL OR a.content_type = ANY(filter_content_type))
      
      -- Has images filter
      AND (filter_has_images IS NULL OR 
           (filter_has_images = TRUE AND a.featured_image IS NOT NULL) OR
           (filter_has_images = FALSE AND a.featured_image IS NULL))
      
      -- Word count filter
      AND (filter_word_count_min IS NULL OR a.word_count >= filter_word_count_min)
      AND (filter_word_count_max IS NULL OR a.word_count <= filter_word_count_max)
  )
  SELECT 
    fa.id,
    fa.title::TEXT,
    fa.slug::TEXT,
    fa.excerpt::TEXT,
    fa.content::TEXT,
    fa.status::TEXT,
    fa.published_at,
    fa.view_count,
    fa.read_time,
    fa.word_count,
    fa.featured_image::TEXT,
    fa.reading_level::TEXT,
    fa.content_type::TEXT,
    fa.category_id,
    fa.author_id,
    fa.created_at,
    fa.updated_at,
    fa.rank::REAL
  FROM filtered_articles fa
  ORDER BY
    CASE 
      WHEN sort_field = 'relevance' AND sort_order = 'desc' THEN fa.rank
      WHEN sort_field = 'relevance' AND sort_order = 'asc' THEN -fa.rank
      ELSE NULL
    END DESC NULLS LAST,
    CASE 
      WHEN sort_field = 'date' AND sort_order = 'desc' THEN fa.published_at
      WHEN sort_field = 'views' AND sort_order = 'desc' THEN fa.view_count::NUMERIC
      WHEN sort_field = 'readTime' AND sort_order = 'desc' THEN fa.read_time::NUMERIC
      ELSE NULL
    END DESC NULLS LAST,
    CASE 
      WHEN sort_field = 'date' AND sort_order = 'asc' THEN fa.published_at
      WHEN sort_field = 'views' AND sort_order = 'asc' THEN fa.view_count::NUMERIC
      WHEN sort_field = 'readTime' AND sort_order = 'asc' THEN fa.read_time::NUMERIC
      ELSE NULL
    END ASC NULLS LAST,
    CASE 
      WHEN sort_field = 'title' AND sort_order = 'asc' THEN fa.title
      ELSE NULL
    END ASC,
    CASE 
      WHEN sort_field = 'title' AND sort_order = 'desc' THEN fa.title
      ELSE NULL
    END DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;

-- Create indexes to optimize the search function
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_view_count ON articles(view_count);
CREATE INDEX IF NOT EXISTS idx_articles_read_time ON articles(read_time);
CREATE INDEX IF NOT EXISTS idx_articles_word_count ON articles(word_count);
CREATE INDEX IF NOT EXISTS idx_articles_reading_level ON articles(reading_level);
CREATE INDEX IF NOT EXISTS idx_articles_content_type ON articles(content_type);
CREATE INDEX IF NOT EXISTS idx_articles_featured_image ON articles(featured_image);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_articles_advanced TO authenticated;
GRANT EXECUTE ON FUNCTION search_articles_advanced TO service_role;