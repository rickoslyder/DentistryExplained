-- Drop existing email templates and related objects to recreate with new structure
DROP TABLE IF EXISTS email_template_versions CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TYPE IF EXISTS email_template_type CASCADE;

-- Create email_templates table with varchar template_type
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type VARCHAR(50) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_email_templates_template_type ON email_templates(template_type);
CREATE INDEX idx_email_templates_is_active ON email_templates(is_active);

-- Add unique constraint on name and template_type
ALTER TABLE email_templates ADD CONSTRAINT unique_name_template_type UNIQUE (name, template_type);

-- Enable Row Level Security
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using Clerk JWT pattern
-- SELECT policy: Only admins can view
CREATE POLICY "Admins can select email templates" ON email_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub')
      AND role = 'admin'
    )
  );

-- INSERT policy: Only admins can create
CREATE POLICY "Admins can insert email templates" ON email_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub')
      AND role = 'admin'
    )
  );

-- UPDATE policy: Only admins can update
CREATE POLICY "Admins can update email templates" ON email_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub')
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub')
      AND role = 'admin'
    )
  );

-- DELETE policy: Only admins can delete
CREATE POLICY "Admins can delete email templates" ON email_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT id FROM profiles WHERE clerk_id = auth.jwt() ->> 'sub')
      AND role = 'admin'
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER email_templates_updated_at_trigger
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- Insert some default email templates
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