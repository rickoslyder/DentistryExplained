-- Drop and recreate the search function with proper type casting
DROP FUNCTION IF EXISTS search_content;

CREATE OR REPLACE FUNCTION search_content(
  search_query TEXT,
  search_category TEXT DEFAULT NULL,
  result_limit INTEGER DEFAULT 20,
  result_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  excerpt TEXT,
  slug TEXT,
  category TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  WITH search_results AS (
    -- Search articles
    SELECT 
      a.id,
      'article'::TEXT as type,
      a.title::TEXT,
      a.excerpt::TEXT,
      a.slug::TEXT,
      c.name::TEXT as category,
      ts_rank(a.search_vector, websearch_to_tsquery('english', search_query))::REAL as rank
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.search_vector @@ websearch_to_tsquery('english', search_query)
      AND a.status = 'published'
      AND (search_category IS NULL OR c.slug = search_category)
    
    UNION ALL
    
    -- Search practice listings
    SELECT 
      p.id,
      'practice'::TEXT as type,
      p.name::TEXT as title,
      p.description::TEXT as excerpt,
      p.id::TEXT as slug,
      'Dental Practice'::TEXT as category,
      (ts_rank(p.search_vector, websearch_to_tsquery('english', search_query)) * 0.8)::REAL as rank
    FROM practice_listings p
    WHERE p.search_vector @@ websearch_to_tsquery('english', search_query)
      AND p.claim_status = 'claimed'
      AND (search_category IS NULL OR search_category = 'practices')
    
    UNION ALL
    
    -- Search glossary terms
    SELECT 
      g.id,
      'glossary'::TEXT as type,
      g.term::TEXT as title,
      g.definition::TEXT as excerpt,
      g.term::TEXT as slug,
      'Glossary'::TEXT as category,
      (ts_rank(g.search_vector, websearch_to_tsquery('english', search_query)) * 0.9)::REAL as rank
    FROM glossary_terms g
    WHERE g.search_vector @@ websearch_to_tsquery('english', search_query)
      AND (search_category IS NULL OR search_category = 'glossary')
  )
  SELECT * FROM search_results
  ORDER BY rank DESC, title
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql;