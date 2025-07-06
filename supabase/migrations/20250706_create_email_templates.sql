-- Create enum for email template types
CREATE TYPE email_template_type AS ENUM (
  'welcome',
  'email_verification',
  'password_reset',
  'professional_approved',
  'professional_rejected',
  'article_published',
  'appointment_reminder',
  'newsletter',
  'custom'
);

-- Create email_templates table
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  template_type email_template_type NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create email_template_versions table for history
CREATE TABLE email_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  change_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(template_id, version_number)
);

-- Create index for faster lookups
CREATE INDEX idx_email_templates_type ON email_templates(template_type);
CREATE INDEX idx_email_templates_active ON email_templates(is_active);
CREATE INDEX idx_email_template_versions_template ON email_template_versions(template_id);

-- Create function to automatically create version on update
CREATE OR REPLACE FUNCTION create_email_template_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if content has changed
  IF OLD.subject != NEW.subject OR 
     OLD.body_html != NEW.body_html OR 
     OLD.body_text IS DISTINCT FROM NEW.body_text OR
     OLD.variables::text != NEW.variables::text THEN
    
    INSERT INTO email_template_versions (
      template_id,
      version_number,
      subject,
      body_html,
      body_text,
      variables,
      created_by
    )
    SELECT 
      NEW.id,
      COALESCE(MAX(version_number), 0) + 1,
      OLD.subject,
      OLD.body_html,
      OLD.body_text,
      OLD.variables,
      NEW.updated_by
    FROM email_template_versions
    WHERE template_id = NEW.id;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for version tracking
CREATE TRIGGER email_template_version_trigger
BEFORE UPDATE ON email_templates
FOR EACH ROW
EXECUTE FUNCTION create_email_template_version();

-- Create RLS policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_versions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage email templates
CREATE POLICY "Admins can manage email templates" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view email template versions" ON email_template_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default email templates
INSERT INTO email_templates (name, description, template_type, subject, body_html, body_text, variables) VALUES
(
  'Welcome Email',
  'Sent to new users after registration',
  'welcome',
  'Welcome to Dentistry Explained, {{userName}}!',
  '<h1>Welcome to Dentistry Explained!</h1>
<p>Hi {{userName}},</p>
<p>Thank you for joining Dentistry Explained, the UK''s premier dental education platform.</p>
<p>Here''s what you can do:</p>
<ul>
  <li>Browse our comprehensive dental articles</li>
  <li>Use our AI dental assistant for personalized advice</li>
  <li>Find dentists in your area</li>
  <li>Track your dental health journey</li>
</ul>
<p>If you have any questions, feel free to reach out to our support team.</p>
<p>Best regards,<br>The Dentistry Explained Team</p>',
  'Welcome to Dentistry Explained!

Hi {{userName}},

Thank you for joining Dentistry Explained, the UK''s premier dental education platform.

Here''s what you can do:
- Browse our comprehensive dental articles
- Use our AI dental assistant for personalized advice
- Find dentists in your area
- Track your dental health journey

If you have any questions, feel free to reach out to our support team.

Best regards,
The Dentistry Explained Team',
  '[{"name": "userName", "description": "User''s display name", "required": true}]'::jsonb
),
(
  'Professional Approved',
  'Sent when a professional verification is approved',
  'professional_approved',
  'Your Professional Verification Has Been Approved',
  '<h1>Congratulations!</h1>
<p>Dear {{professionalName}},</p>
<p>We''re pleased to inform you that your professional verification has been approved.</p>
<p>Your GDC Number: {{gdcNumber}}</p>
<p>You now have access to:</p>
<ul>
  <li>Professional-only content and resources</li>
  <li>Patient education materials</li>
  <li>Practice listing in our directory</li>
  <li>Professional discussion forums</li>
</ul>
<p>Thank you for being part of our professional community.</p>
<p>Best regards,<br>The Dentistry Explained Team</p>',
  'Congratulations!

Dear {{professionalName}},

We''re pleased to inform you that your professional verification has been approved.

Your GDC Number: {{gdcNumber}}

You now have access to:
- Professional-only content and resources
- Patient education materials
- Practice listing in our directory
- Professional discussion forums

Thank you for being part of our professional community.

Best regards,
The Dentistry Explained Team',
  '[{"name": "professionalName", "description": "Professional''s name", "required": true}, {"name": "gdcNumber", "description": "GDC registration number", "required": true}]'::jsonb
),
(
  'Article Published Notification',
  'Sent to subscribers when a new article is published',
  'article_published',
  'New Article: {{articleTitle}}',
  '<h1>New Article Published!</h1>
<p>Hi {{userName}},</p>
<p>We''ve just published a new article that might interest you:</p>
<h2>{{articleTitle}}</h2>
<p>{{articleExcerpt}}</p>
<p><a href="{{articleUrl}}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Read Article</a></p>
<p>Category: {{articleCategory}}</p>
<p>Happy reading!</p>
<p>Best regards,<br>The Dentistry Explained Team</p>',
  'New Article Published!

Hi {{userName}},

We''ve just published a new article that might interest you:

{{articleTitle}}

{{articleExcerpt}}

Read it here: {{articleUrl}}

Category: {{articleCategory}}

Happy reading!

Best regards,
The Dentistry Explained Team',
  '[{"name": "userName", "description": "Recipient name", "required": true}, {"name": "articleTitle", "description": "Article title", "required": true}, {"name": "articleExcerpt", "description": "Article excerpt", "required": true}, {"name": "articleUrl", "description": "Article URL", "required": true}, {"name": "articleCategory", "description": "Article category", "required": true}]'::jsonb
);