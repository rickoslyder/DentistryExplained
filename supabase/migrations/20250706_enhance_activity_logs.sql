-- Enhance activity_logs table for comprehensive audit trail
ALTER TABLE activity_logs 
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS entity_id UUID,
ADD COLUMN IF NOT EXISTS changes JSONB,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS request_id VARCHAR(100);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_request_id ON activity_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at_desc ON activity_logs(created_at DESC);

-- Create enum for audit actions if not exists
DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM (
    'create',
    'update', 
    'delete',
    'view',
    'login',
    'logout',
    'approve',
    'reject',
    'publish',
    'unpublish',
    'archive',
    'restore',
    'import',
    'export',
    'email_sent',
    'settings_changed',
    'permission_changed',
    'bulk_action'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add action enum column
ALTER TABLE activity_logs 
ADD COLUMN IF NOT EXISTS action_type audit_action;

-- Create function to automatically log changes
CREATE OR REPLACE FUNCTION log_table_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_old_data JSONB;
  v_new_data JSONB;
  v_changes JSONB;
  v_action audit_action;
BEGIN
  -- Get current user ID from context
  v_user_id := current_setting('app.current_user_id', true)::UUID;
  
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_new_data := to_jsonb(NEW);
    v_changes := v_new_data;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    -- Calculate changes
    SELECT jsonb_object_agg(key, value)
    INTO v_changes
    FROM (
      SELECT key, value
      FROM jsonb_each(v_new_data)
      WHERE v_old_data->key IS DISTINCT FROM value
    ) AS changes;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_old_data := to_jsonb(OLD);
    v_changes := jsonb_build_object('deleted_data', v_old_data);
  END IF;
  
  -- Only log if there are actual changes (for updates)
  IF TG_OP != 'UPDATE' OR v_changes IS NOT NULL THEN
    INSERT INTO activity_logs (
      user_id,
      action,
      action_type,
      entity_type,
      entity_id,
      changes,
      details,
      request_id,
      created_at
    ) VALUES (
      v_user_id,
      TG_OP || ' ' || TG_TABLE_NAME,
      v_action,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      v_changes,
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'schema', TG_TABLE_SCHEMA
      ),
      current_setting('app.current_request_id', true),
      NOW()
    );
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for important tables
CREATE TRIGGER articles_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON articles
FOR EACH ROW EXECUTE FUNCTION log_table_changes();

CREATE TRIGGER categories_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON categories
FOR EACH ROW EXECUTE FUNCTION log_table_changes();

CREATE TRIGGER profiles_audit_trigger
AFTER UPDATE OR DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION log_table_changes();

CREATE TRIGGER email_templates_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON email_templates
FOR EACH ROW EXECUTE FUNCTION log_table_changes();

CREATE TRIGGER settings_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON settings
FOR EACH ROW EXECUTE FUNCTION log_table_changes();

CREATE TRIGGER professional_verifications_audit_trigger
AFTER UPDATE ON professional_verifications
FOR EACH ROW EXECUTE FUNCTION log_table_changes();

-- Create view for easier audit log querying
CREATE OR REPLACE VIEW audit_log_view AS
SELECT 
  al.*,
  p.display_name as user_name,
  p.email as user_email,
  CASE 
    WHEN al.entity_type = 'articles' THEN (SELECT title FROM articles WHERE id = al.entity_id)
    WHEN al.entity_type = 'categories' THEN (SELECT name FROM categories WHERE id = al.entity_id)
    WHEN al.entity_type = 'email_templates' THEN (SELECT name FROM email_templates WHERE id = al.entity_id)
    ELSE NULL
  END as entity_name
FROM activity_logs al
LEFT JOIN profiles p ON al.user_id = p.id
ORDER BY al.created_at DESC;