-- Content Management System Schema

-- Categories table for organizing articles
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles table for content
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  content TEXT NOT NULL, -- MDX content
  excerpt TEXT,
  featured_image VARCHAR(500),
  meta_title VARCHAR(160),
  meta_description TEXT,
  meta_keywords TEXT[],
  tags TEXT[],
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  read_time INTEGER, -- in minutes
  views INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  allow_comments BOOLEAN DEFAULT TRUE
);

-- Article revisions for version control
CREATE TABLE IF NOT EXISTS article_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  revision_number INTEGER NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  change_summary TEXT,
  UNIQUE(article_id, revision_number)
);

-- Related articles for cross-linking
CREATE TABLE IF NOT EXISTS related_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  related_article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  relevance_score DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, related_article_id),
  CHECK (article_id != related_article_id)
);

-- Article images for managing uploaded images
CREATE TABLE IF NOT EXISTS article_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  caption TEXT,
  width INTEGER,
  height INTEGER,
  size_bytes INTEGER,
  mime_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content blocks for modular content (optional)
CREATE TABLE IF NOT EXISTS content_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  block_type VARCHAR(50) DEFAULT 'text' CHECK (block_type IN ('text', 'callout', 'faq', 'video', 'quiz')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article content blocks junction table
CREATE TABLE IF NOT EXISTS article_content_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  content_block_id UUID REFERENCES content_blocks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, position)
);

-- Create indexes for performance
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- Functions for content management

-- Function to update article timestamps
CREATE OR REPLACE FUNCTION update_article_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for article timestamp updates
CREATE TRIGGER update_articles_timestamp
BEFORE UPDATE ON articles
FOR EACH ROW
EXECUTE FUNCTION update_article_timestamp();

-- Function to calculate read time based on content length
CREATE OR REPLACE FUNCTION calculate_read_time(content TEXT)
RETURNS INTEGER AS $$
DECLARE
  word_count INTEGER;
  read_time INTEGER;
BEGIN
  -- Estimate word count (rough approximation)
  word_count := array_length(string_to_array(content, ' '), 1);
  -- Average reading speed: 200-250 words per minute
  read_time := CEIL(word_count::DECIMAL / 225);
  RETURN GREATEST(read_time, 1); -- Minimum 1 minute
END;
$$ LANGUAGE plpgsql;

-- Function to generate article slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          title,
          '[^a-zA-Z0-9\s-]', '', 'g'  -- Remove special characters
        ),
        '\s+', '-', 'g'  -- Replace spaces with hyphens
      ),
      '-+', '-', 'g'  -- Replace multiple hyphens with single hyphen
    )
  );
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for content management

-- Articles: Public can read published articles
CREATE POLICY "Public can view published articles" ON articles
  FOR SELECT USING (status = 'published');

-- Articles: Authors can view their own drafts
CREATE POLICY "Authors can view own articles" ON articles
  FOR SELECT USING (
    author_id IN (
      SELECT id FROM profiles WHERE clerk_id = auth.clerk_user_id()
    )
  );

-- Articles: Admins and editors can manage all articles
CREATE POLICY "Admins can manage articles" ON articles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE clerk_id = auth.clerk_user_id() 
      AND user_type = 'professional'
      AND role IN ('admin', 'editor')
    )
  );

-- Categories: Public can view all categories
CREATE POLICY "Public can view categories" ON categories
  FOR SELECT USING (true);

-- Categories: Only admins can manage categories
CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE clerk_id = auth.clerk_user_id() 
      AND user_type = 'professional'
      AND role = 'admin'
    )
  );

-- Article images: Inherit from article permissions
CREATE POLICY "Article image permissions follow articles" ON article_images
  FOR ALL USING (
    article_id IN (
      SELECT id FROM articles
      WHERE status = 'published'
      OR author_id IN (
        SELECT id FROM profiles WHERE clerk_id = auth.clerk_user_id()
      )
    )
  );

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE related_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_content_blocks ENABLE ROW LEVEL SECURITY;

-- Insert default categories
INSERT INTO categories (name, slug, description, display_order, icon) VALUES
  ('General Oral Health', 'general-oral-health', 'Essential information about maintaining good oral health', 1, 'Heart'),
  ('Dental Problems', 'dental-problems', 'Common dental issues and their solutions', 2, 'AlertCircle'),
  ('Treatments', 'treatments', 'Various dental treatments and procedures', 3, 'Stethoscope'),
  ('Prevention', 'prevention', 'Preventive care and oral hygiene tips', 4, 'Shield'),
  ('Cosmetic Dentistry', 'cosmetic-dentistry', 'Aesthetic dental procedures and treatments', 5, 'Sparkles'),
  ('Pediatric Dentistry', 'pediatric-dentistry', 'Dental care for children and adolescents', 6, 'Baby'),
  ('Oral Surgery', 'oral-surgery', 'Surgical dental procedures', 7, 'Scissors'),
  ('Emergency Care', 'emergency-care', 'Handling dental emergencies', 8, 'AlertTriangle')
ON CONFLICT (slug) DO NOTHING;

-- Add role column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('member', 'author', 'editor', 'admin'));