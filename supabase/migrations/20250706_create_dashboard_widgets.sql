-- Create dashboard layouts table
CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create index for user lookups
CREATE INDEX idx_dashboard_layouts_user_id ON dashboard_layouts(user_id);

-- Create unique index for default layout per user
CREATE UNIQUE INDEX idx_dashboard_layouts_default ON dashboard_layouts(user_id) WHERE is_default = TRUE;

-- Create RLS policies
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own layouts
CREATE POLICY "Users can view own dashboard layouts" ON dashboard_layouts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own layouts
CREATE POLICY "Users can create own dashboard layouts" ON dashboard_layouts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own layouts
CREATE POLICY "Users can update own dashboard layouts" ON dashboard_layouts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own layouts
CREATE POLICY "Users can delete own dashboard layouts" ON dashboard_layouts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to ensure only one default layout per user
CREATE OR REPLACE FUNCTION ensure_single_default_layout()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    -- Set all other layouts for this user to non-default
    UPDATE dashboard_layouts
    SET is_default = FALSE
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain single default layout
CREATE TRIGGER ensure_single_default_layout_trigger
  BEFORE INSERT OR UPDATE ON dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_layout();

-- Function to get user's dashboard layout
CREATE OR REPLACE FUNCTION get_user_dashboard_layout(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_layout JSONB;
BEGIN
  -- Get the default layout or the most recent one
  SELECT 
    jsonb_build_object(
      'id', id,
      'name', name,
      'description', description,
      'widgets', widgets,
      'settings', settings,
      'is_default', is_default
    )
  INTO v_layout
  FROM dashboard_layouts
  WHERE user_id = p_user_id
  ORDER BY is_default DESC, updated_at DESC
  LIMIT 1;
  
  -- If no layout exists, return default configuration
  IF v_layout IS NULL THEN
    RETURN jsonb_build_object(
      'id', NULL,
      'name', 'Default Layout',
      'description', 'Default dashboard layout',
      'widgets', '[]'::jsonb,
      'settings', '{}'::jsonb,
      'is_default', TRUE
    );
  END IF;
  
  RETURN v_layout;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_dashboard_layout TO authenticated;