-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For fuzzy search

-- Add tsvector columns
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

ALTER TABLE practice_listings 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update article search vector
CREATE OR REPLACE FUNCTION update_article_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update category search vector
CREATE OR REPLACE FUNCTION update_category_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update practice listing search vector
CREATE OR REPLACE FUNCTION update_practice_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.services, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.address->>'city', '') || ' ' || COALESCE(NEW.address->>'postcode', '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_article_search_vector_trigger ON articles;
CREATE TRIGGER update_article_search_vector_trigger
BEFORE INSERT OR UPDATE ON articles
FOR EACH ROW
EXECUTE FUNCTION update_article_search_vector();

DROP TRIGGER IF EXISTS update_category_search_vector_trigger ON categories;
CREATE TRIGGER update_category_search_vector_trigger
BEFORE INSERT OR UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_category_search_vector();

DROP TRIGGER IF EXISTS update_practice_search_vector_trigger ON practice_listings;
CREATE TRIGGER update_practice_search_vector_trigger
BEFORE INSERT OR UPDATE ON practice_listings
FOR EACH ROW
EXECUTE FUNCTION update_practice_search_vector();

-- Update existing records
UPDATE articles SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(excerpt, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(content, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'C')
WHERE search_vector IS NULL;

UPDATE categories SET search_vector = 
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B')
WHERE search_vector IS NULL;

UPDATE practice_listings SET search_vector = 
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(services, ' '), '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(address->>'city', '') || ' ' || COALESCE(address->>'postcode', '')), 'C')
WHERE search_vector IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_articles_search 
ON articles USING gin(search_vector) 
WITH (fastupdate = off);

CREATE INDEX IF NOT EXISTS idx_articles_title_trgm 
ON articles USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_categories_search 
ON categories USING gin(search_vector) 
WITH (fastupdate = off);

CREATE INDEX IF NOT EXISTS idx_practice_listings_search 
ON practice_listings USING gin(search_vector) 
WITH (fastupdate = off);

-- Create glossary_terms table
CREATE TABLE IF NOT EXISTS glossary_terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term VARCHAR(100) UNIQUE NOT NULL,
  definition TEXT NOT NULL,
  pronunciation VARCHAR(100),
  related_terms TEXT[],
  category VARCHAR(50),
  search_vector tsvector,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function for glossary search vector
CREATE OR REPLACE FUNCTION update_glossary_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.term, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.definition, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.related_terms, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for glossary
DROP TRIGGER IF EXISTS update_glossary_search_vector_trigger ON glossary_terms;
CREATE TRIGGER update_glossary_search_vector_trigger
BEFORE INSERT OR UPDATE ON glossary_terms
FOR EACH ROW
EXECUTE FUNCTION update_glossary_search_vector();

-- Create search queries table for analytics
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  category VARCHAR(50),
  results_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES profiles(id),
  session_id VARCHAR(100),
  clicked_result_id UUID,
  clicked_result_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_queries_created 
ON search_queries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_queries_user 
ON search_queries(user_id);

-- Create trending searches materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_searches AS
SELECT 
  query,
  COUNT(*) as search_count,
  COUNT(DISTINCT COALESCE(user_id::text, session_id)) as unique_users,
  AVG(results_count) as avg_results
FROM search_queries
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY query
HAVING COUNT(*) > 5
ORDER BY search_count DESC
LIMIT 20;

CREATE UNIQUE INDEX IF NOT EXISTS idx_trending_searches_query 
ON trending_searches(query);

-- Create search suggestions table
CREATE TABLE IF NOT EXISTS search_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term VARCHAR(100) UNIQUE NOT NULL,
  suggestion_type VARCHAR(50) DEFAULT 'general',
  weight INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_suggestions_term 
ON search_suggestions USING gin(term gin_trgm_ops);

-- Insert initial glossary terms
INSERT INTO glossary_terms (term, definition, pronunciation, related_terms, category) VALUES
  ('Cavity', 'A hole in a tooth caused by tooth decay', 'KAV-ih-tee', ARRAY['tooth decay', 'dental caries'], 'common'),
  ('Plaque', 'A sticky film of bacteria that forms on teeth', 'plak', ARRAY['tartar', 'bacteria'], 'common'),
  ('Gingivitis', 'Inflammation of the gums', 'jin-jih-VY-tis', ARRAY['gum disease', 'periodontal disease'], 'conditions'),
  ('Root Canal', 'A dental procedure to remove infected tooth pulp', 'root kuh-NAL', ARRAY['endodontic treatment', 'pulp'], 'procedures'),
  ('Crown', 'A cap placed over a damaged tooth', 'kroun', ARRAY['dental cap', 'restoration'], 'procedures'),
  ('Fluoride', 'A mineral that helps prevent tooth decay', 'FLOOR-ide', ARRAY['cavity prevention', 'enamel'], 'prevention'),
  ('Orthodontics', 'Branch of dentistry dealing with tooth alignment', 'or-thoh-DON-tiks', ARRAY['braces', 'alignment'], 'specialties'),
  ('Periodontitis', 'Advanced gum disease affecting tooth-supporting structures', 'per-ee-oh-don-TY-tis', ARRAY['gum disease', 'bone loss'], 'conditions'),
  ('Enamel', 'The hard outer layer of teeth', 'ih-NAM-ul', ARRAY['tooth structure', 'protection'], 'anatomy'),
  ('Dental Implant', 'An artificial tooth root placed in the jaw', 'DEN-tul IM-plant', ARRAY['tooth replacement', 'prosthetic'], 'procedures')
ON CONFLICT (term) DO NOTHING;

-- Update glossary search vectors
UPDATE glossary_terms SET search_vector = 
  setweight(to_tsvector('english', COALESCE(term, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(definition, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(related_terms, ' '), '')), 'C')
WHERE search_vector IS NULL;

-- Create comprehensive search function
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
      a.title,
      a.excerpt,
      a.slug::TEXT,
      c.name as category,
      ts_rank(a.search_vector, websearch_to_tsquery('english', search_query)) as rank
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
      p.name as title,
      p.description as excerpt,
      p.id::TEXT as slug,
      'Dental Practice'::TEXT as category,
      ts_rank(p.search_vector, websearch_to_tsquery('english', search_query)) * 0.8 as rank
    FROM practice_listings p
    WHERE p.search_vector @@ websearch_to_tsquery('english', search_query)
      AND p.claim_status = 'claimed'
      AND (search_category IS NULL OR search_category = 'practices')
    
    UNION ALL
    
    -- Search glossary terms
    SELECT 
      g.id,
      'glossary'::TEXT as type,
      g.term as title,
      g.definition as excerpt,
      g.term::TEXT as slug,
      'Glossary'::TEXT as category,
      ts_rank(g.search_vector, websearch_to_tsquery('english', search_query)) * 0.9 as rank
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

-- Create search suggestions function
CREATE OR REPLACE FUNCTION get_search_suggestions(
  partial_query TEXT,
  suggestion_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  suggestion TEXT,
  type TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH suggestions AS (
    -- Get article title suggestions
    (SELECT DISTINCT
      title as suggestion,
      'article'::TEXT as type,
      1 as priority
    FROM articles
    WHERE title ILIKE partial_query || '%'
      AND status = 'published'
    LIMIT 5)
    
    UNION ALL
    
    -- Get glossary term suggestions
    (SELECT DISTINCT
      term as suggestion,
      'glossary'::TEXT as type,
      2 as priority
    FROM glossary_terms
    WHERE term ILIKE partial_query || '%'
    LIMIT 5)
    
    UNION ALL
    
    -- Get search suggestion table entries
    (SELECT DISTINCT
      term as suggestion,
      suggestion_type as type,
      3 as priority
    FROM search_suggestions
    WHERE term ILIKE partial_query || '%'
    LIMIT 5)
  )
  SELECT suggestion, type 
  FROM suggestions
  ORDER BY priority, suggestion
  LIMIT suggestion_limit;
END;
$$ LANGUAGE plpgsql;

-- Create function to get trending searches
CREATE OR REPLACE FUNCTION get_trending_searches(
  limit_count INTEGER DEFAULT 10
) RETURNS TABLE (
  query TEXT,
  search_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.query, t.search_count
  FROM trending_searches t
  ORDER BY t.search_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON articles, categories, practice_listings, glossary_terms TO anon, authenticated;
GRANT SELECT, INSERT ON search_queries TO anon, authenticated;
GRANT SELECT ON trending_searches TO anon, authenticated;
GRANT SELECT ON search_suggestions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_content TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_search_suggestions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_trending_searches TO anon, authenticated;