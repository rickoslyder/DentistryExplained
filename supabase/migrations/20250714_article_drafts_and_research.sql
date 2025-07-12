-- Create table for article drafts (auto-saved versions)
CREATE TABLE IF NOT EXISTS article_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT,
  slug TEXT,
  content TEXT,
  excerpt TEXT,
  seo_title TEXT,
  seo_description TEXT,
  category_id UUID REFERENCES categories(id),
  tags TEXT[],
  featured BOOLEAN DEFAULT false,
  featured_image TEXT,
  reading_time INTEGER,
  difficulty_level TEXT,
  metadata JSONB DEFAULT '{}',
  is_auto_save BOOLEAN DEFAULT true,
  draft_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for research outputs
CREATE TABLE IF NOT EXISTS research_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  draft_id UUID REFERENCES article_drafts(id) ON DELETE SET NULL,
  research_topic TEXT NOT NULL,
  research_type TEXT NOT NULL, -- 'comprehensive', 'quick', 'specific'
  research_params JSONB NOT NULL DEFAULT '{}',
  research_result JSONB NOT NULL DEFAULT '{}',
  generated_content TEXT,
  generated_metadata JSONB DEFAULT '{}',
  references JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_article_drafts_article_user ON article_drafts(article_id, user_id);
CREATE INDEX idx_article_drafts_created_at ON article_drafts(created_at DESC);
CREATE INDEX idx_article_drafts_is_auto_save ON article_drafts(is_auto_save);
CREATE INDEX idx_research_outputs_user ON research_outputs(user_id);
CREATE INDEX idx_research_outputs_status ON research_outputs(status);
CREATE INDEX idx_research_outputs_created_at ON research_outputs(created_at DESC);

-- Function to get latest draft for an article
CREATE OR REPLACE FUNCTION get_latest_draft(p_article_id UUID, p_user_id UUID)
RETURNS article_drafts AS $$
BEGIN
  RETURN (
    SELECT * FROM article_drafts
    WHERE article_id = p_article_id 
    AND user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old auto-save drafts (keep last 10)
CREATE OR REPLACE FUNCTION cleanup_old_drafts(p_article_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM article_drafts
  WHERE id IN (
    SELECT id FROM article_drafts
    WHERE article_id = p_article_id 
    AND user_id = p_user_id
    AND is_auto_save = true
    ORDER BY created_at DESC
    OFFSET 10
  );
END;
$$ LANGUAGE plpgsql;

-- RLS policies for article_drafts
ALTER TABLE article_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drafts" ON article_drafts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drafts" ON article_drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts" ON article_drafts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts" ON article_drafts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for research_outputs
ALTER TABLE research_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own research outputs" ON research_outputs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own research outputs" ON research_outputs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own research outputs" ON research_outputs
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to create draft from research output
CREATE OR REPLACE FUNCTION create_draft_from_research(
  p_research_id UUID,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_draft_id UUID;
  v_research research_outputs;
BEGIN
  -- Get research output
  SELECT * INTO v_research
  FROM research_outputs
  WHERE id = p_research_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Research output not found';
  END IF;
  
  -- Create draft
  INSERT INTO article_drafts (
    user_id,
    title,
    content,
    excerpt,
    metadata,
    is_auto_save
  ) VALUES (
    p_user_id,
    v_research.research_topic,
    v_research.generated_content,
    LEFT(v_research.generated_content, 200) || '...',
    v_research.generated_metadata,
    false
  ) RETURNING id INTO v_draft_id;
  
  -- Update research output with draft reference
  UPDATE research_outputs
  SET draft_id = v_draft_id
  WHERE id = p_research_id;
  
  RETURN v_draft_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;