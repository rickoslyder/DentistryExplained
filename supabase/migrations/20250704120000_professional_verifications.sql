-- Create enum for verification status
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'expired');

-- Professional verifications table
CREATE TABLE professional_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  gdc_number VARCHAR(7) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  practice_name VARCHAR(255),
  practice_address TEXT,
  verification_status verification_status DEFAULT 'pending',
  verification_date TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES user_profiles(id),
  rejection_reason TEXT,
  additional_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one active verification per user
  CONSTRAINT unique_active_verification UNIQUE (user_id, verification_status) 
    WHERE verification_status IN ('pending', 'verified')
);

-- Verification documents table
CREATE TABLE verification_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_id UUID NOT NULL REFERENCES professional_verifications(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification activity log
CREATE TABLE verification_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_id UUID NOT NULL REFERENCES professional_verifications(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- submitted, approved, rejected, document_uploaded, etc.
  performed_by UUID NOT NULL REFERENCES user_profiles(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_verifications_user_id ON professional_verifications(user_id);
CREATE INDEX idx_verifications_status ON professional_verifications(verification_status);
CREATE INDEX idx_verifications_gdc_number ON professional_verifications(gdc_number);
CREATE INDEX idx_verification_docs_verification_id ON verification_documents(verification_id);
CREATE INDEX idx_activity_log_verification_id ON verification_activity_log(verification_id);

-- RLS policies for professional_verifications
ALTER TABLE professional_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own verifications
CREATE POLICY "Users can view own verifications" ON professional_verifications
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can create their own verifications
CREATE POLICY "Users can create own verifications" ON professional_verifications
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own pending verifications
CREATE POLICY "Users can update own pending verifications" ON professional_verifications
  FOR UPDATE USING (
    auth.uid()::text = user_id::text 
    AND verification_status = 'pending'
  );

-- Admins can view all verifications
CREATE POLICY "Admins can view all verifications" ON professional_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid()::uuid 
      AND role = 'admin'
    )
  );

-- Admins can update all verifications
CREATE POLICY "Admins can update all verifications" ON professional_verifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid()::uuid 
      AND role = 'admin'
    )
  );

-- RLS policies for verification_documents
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;

-- Users can view documents for their verifications
CREATE POLICY "Users can view own verification documents" ON verification_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM professional_verifications 
      WHERE id = verification_documents.verification_id 
      AND user_id = auth.uid()::uuid
    )
  );

-- Users can upload documents for their verifications
CREATE POLICY "Users can upload verification documents" ON verification_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM professional_verifications 
      WHERE id = verification_documents.verification_id 
      AND user_id = auth.uid()::uuid
      AND verification_status = 'pending'
    )
  );

-- Admins can view all documents
CREATE POLICY "Admins can view all documents" ON verification_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid()::uuid 
      AND role = 'admin'
    )
  );

-- RLS policies for verification_activity_log
ALTER TABLE verification_activity_log ENABLE ROW LEVEL SECURITY;

-- Users can view activity for their verifications
CREATE POLICY "Users can view own verification activity" ON verification_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM professional_verifications 
      WHERE id = verification_activity_log.verification_id 
      AND user_id = auth.uid()::uuid
    )
  );

-- Anyone can insert activity (but controlled by functions)
CREATE POLICY "Insert verification activity" ON verification_activity_log
  FOR INSERT WITH CHECK (true);

-- Admins can view all activity
CREATE POLICY "Admins can view all activity" ON verification_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid()::uuid 
      AND role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_professional_verifications_updated_at 
  BEFORE UPDATE ON professional_verifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log verification activity
CREATE OR REPLACE FUNCTION log_verification_activity(
  p_verification_id UUID,
  p_action VARCHAR,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO verification_activity_log (
    verification_id, 
    action, 
    performed_by, 
    details
  ) VALUES (
    p_verification_id,
    p_action,
    auth.uid()::uuid,
    p_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has verified status
CREATE OR REPLACE FUNCTION is_user_verified(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM professional_verifications
    WHERE user_id = p_user_id
    AND verification_status = 'verified'
    AND (expiry_date IS NULL OR expiry_date > NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- Add professional fields to user_profiles if not exists
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_professional BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS professional_title VARCHAR(100),
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER;