-- Create settings table for persisting admin settings
CREATE TABLE settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Create indexes
CREATE INDEX idx_settings_key ON settings(key);
CREATE INDEX idx_settings_category ON settings(category);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_settings_updated_at();

-- RLS policies
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all settings
CREATE POLICY "Admin users can manage all settings" ON settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Regular users can read specific public settings
CREATE POLICY "Users can read public settings" ON settings
    FOR SELECT
    TO authenticated
    USING (
        category = 'public'
    );

-- Insert default settings
INSERT INTO settings (key, value, description, category) VALUES
    ('site_maintenance', '{"enabled": false, "message": ""}', 'Site maintenance mode settings', 'general'),
    ('ai_config', '{"model": "o4-mini", "temperature": 0.7, "max_tokens": 4096, "system_prompt": "You are a helpful dental assistant. Provide accurate, evidence-based dental information."}', 'AI assistant configuration', 'ai'),
    ('analytics_config', '{"ga4_enabled": true, "meta_pixel_enabled": true}', 'Analytics configuration', 'analytics'),
    ('email_config', '{"notifications_enabled": true, "from_name": "Dentistry Explained", "from_email": "noreply@dentistryexplained.com"}', 'Email configuration', 'email'),
    ('seo_defaults', '{"title_suffix": " | Dentistry Explained", "default_description": "Learn about dental health with evidence-based information from UK dental professionals.", "default_keywords": ["dentistry", "dental health", "oral care", "UK dentist"]}', 'Default SEO settings', 'seo'),
    ('content_config', '{"auto_save_interval": 30, "version_retention_days": 90, "max_versions_per_article": 50}', 'Content management settings', 'content'),
    ('chat_config', '{"retention_days": 180, "max_messages_per_session": 100, "rate_limit_per_hour": 20}', 'Chat configuration', 'chat'),
    ('professional_verification', '{"auto_approve": false, "gdc_api_enabled": false, "verification_email_template": "professional_verification"}', 'Professional verification settings', 'verification')
ON CONFLICT (key) DO NOTHING;

-- Function to get setting value
CREATE OR REPLACE FUNCTION get_setting(p_key TEXT)
RETURNS JSONB AS $$
DECLARE
    v_value JSONB;
BEGIN
    SELECT value INTO v_value
    FROM settings
    WHERE key = p_key;
    
    RETURN COALESCE(v_value, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update setting value
CREATE OR REPLACE FUNCTION update_setting(p_key TEXT, p_value JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can update settings';
    END IF;
    
    UPDATE settings
    SET value = p_value,
        updated_at = NOW(),
        updated_by = auth.uid()
    WHERE key = p_key;
    
    v_updated := FOUND;
    
    -- Log the change
    IF v_updated THEN
        INSERT INTO activity_logs (
            user_id,
            action,
            resource_type,
            resource_id,
            resource_name,
            metadata
        ) VALUES (
            auth.uid(),
            'update',
            'setting',
            p_key,
            p_key,
            jsonb_build_object(
                'new_value', p_value,
                'category', (SELECT category FROM settings WHERE key = p_key)
            )
        );
    END IF;
    
    RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON settings TO authenticated;
GRANT EXECUTE ON FUNCTION get_setting(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_setting(TEXT, JSONB) TO authenticated;