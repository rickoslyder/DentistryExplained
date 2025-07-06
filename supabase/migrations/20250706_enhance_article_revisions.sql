-- Enhance article_revisions table for complete version tracking
-- First, let's check what columns already exist and add missing ones

-- Add missing columns to article_revisions table
ALTER TABLE article_revisions 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS meta_title VARCHAR(160),
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS meta_keywords TEXT[],
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS featured_image VARCHAR(500);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_article_revisions_article_id ON article_revisions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_revisions_created_at ON article_revisions(created_at);
CREATE INDEX IF NOT EXISTS idx_article_revisions_author_id ON article_revisions(author_id);

-- Create a function to get the next revision number
CREATE OR REPLACE FUNCTION get_next_revision_number(p_article_id UUID)
RETURNS INTEGER AS $$
DECLARE
  max_revision INTEGER;
BEGIN
  SELECT COALESCE(MAX(revision_number), 0) INTO max_revision
  FROM article_revisions
  WHERE article_id = p_article_id;
  
  RETURN max_revision + 1;
END;
$$ LANGUAGE plpgsql;

-- Create a function to save article revision
CREATE OR REPLACE FUNCTION save_article_revision(
  p_article_id UUID,
  p_author_id UUID,
  p_change_summary TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_revision_id UUID;
  v_article RECORD;
  v_revision_number INTEGER;
BEGIN
  -- Get current article data
  SELECT * INTO v_article FROM articles WHERE id = p_article_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Article not found';
  END IF;
  
  -- Get next revision number
  v_revision_number := get_next_revision_number(p_article_id);
  
  -- Insert revision
  INSERT INTO article_revisions (
    article_id,
    title,
    content,
    excerpt,
    revision_number,
    author_id,
    change_summary,
    category_id,
    tags,
    meta_title,
    meta_description,
    meta_keywords,
    status,
    is_featured,
    allow_comments,
    featured_image
  ) VALUES (
    p_article_id,
    v_article.title,
    v_article.content,
    v_article.excerpt,
    v_revision_number,
    p_author_id,
    p_change_summary,
    v_article.category_id,
    v_article.tags,
    v_article.meta_title,
    v_article.meta_description,
    v_article.meta_keywords,
    v_article.status,
    v_article.is_featured,
    v_article.allow_comments,
    v_article.featured_image
  ) RETURNING id INTO v_revision_id;
  
  RETURN v_revision_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for article_revisions
ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;

-- Admin and editor can view all revisions
CREATE POLICY "Admin and editor can view article revisions" ON article_revisions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Only admins can insert revisions (through functions)
CREATE POLICY "Admin can insert article revisions" ON article_revisions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- No one can update revisions (immutable)
-- No one can delete revisions (immutable)

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_next_revision_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION save_article_revision(UUID, UUID, TEXT) TO authenticated;