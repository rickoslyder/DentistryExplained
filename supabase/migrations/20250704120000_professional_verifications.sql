-- Enhanced professional verifications (additions to existing table)

-- Create enum for verification status if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'expired');
  END IF;
END $$;

-- Add missing columns to existing professional_verifications table
ALTER TABLE professional_verifications 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS practice_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS practice_address TEXT,
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- Update verification_status column if needed
DO $$ 
BEGIN
  -- Check if column exists with wrong type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professional_verifications' 
    AND column_name = 'verification_status'
    AND data_type = 'text'
  ) THEN
    -- Drop the existing constraint
    ALTER TABLE professional_verifications DROP CONSTRAINT IF EXISTS professional_verifications_verification_status_check;
    
    -- Create temporary column
    ALTER TABLE professional_verifications ADD COLUMN temp_status verification_status;
    
    -- Copy data
    UPDATE professional_verifications 
    SET temp_status = verification_status::verification_status;
    
    -- Drop old column and rename new one
    ALTER TABLE professional_verifications DROP COLUMN verification_status;
    ALTER TABLE professional_verifications RENAME COLUMN temp_status TO verification_status;
    
    -- Set default
    ALTER TABLE professional_verifications ALTER COLUMN verification_status SET DEFAULT 'pending';
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professional_verifications' 
    AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE professional_verifications ADD COLUMN verification_status verification_status DEFAULT 'pending';
  END IF;
END $$;

-- Verification documents table
CREATE TABLE IF NOT EXISTS verification_documents (
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
CREATE TABLE IF NOT EXISTS verification_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_id UUID NOT NULL REFERENCES professional_verifications(id) ON DELETE CASCADE,
  performed_by UUID NOT NULL REFERENCES profiles(id),
  action VARCHAR(50) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON professional_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON professional_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_verifications_gdc ON professional_verifications(gdc_number);
CREATE INDEX IF NOT EXISTS idx_verification_docs_verification_id ON verification_documents(verification_id);
CREATE INDEX IF NOT EXISTS idx_verification_log_verification_id ON verification_activity_log(verification_id);

-- Enable RLS
ALTER TABLE professional_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for professional_verifications
-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view own verification" ON professional_verifications;
  DROP POLICY IF EXISTS "Users can insert own verification" ON professional_verifications;
  DROP POLICY IF EXISTS "Admins can view all verifications" ON professional_verifications;
  DROP POLICY IF EXISTS "Admins can update verifications" ON professional_verifications;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

CREATE POLICY "Users can view own verification" ON professional_verifications
  FOR SELECT USING (user_id IN (
    SELECT id FROM profiles WHERE clerk_id = public.clerk_user_id()
  ));

CREATE POLICY "Users can insert own verification" ON professional_verifications
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM profiles 
      WHERE clerk_id = public.clerk_user_id() 
      AND user_type = 'professional'
    )
  );

CREATE POLICY "Admins can view all verifications" ON professional_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE clerk_id = public.clerk_user_id() 
      AND user_type = 'professional'
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins can update verifications" ON professional_verifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE clerk_id = public.clerk_user_id() 
      AND user_type = 'professional'
      AND role = 'admin'
    )
  );

-- RLS Policies for verification_documents
-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view own documents" ON verification_documents;
  DROP POLICY IF EXISTS "Users can upload own documents" ON verification_documents;
  DROP POLICY IF EXISTS "Admins can view all documents" ON verification_documents;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

CREATE POLICY "Users can view own documents" ON verification_documents
  FOR SELECT USING (
    verification_id IN (
      SELECT id FROM professional_verifications 
      WHERE user_id IN (
        SELECT id FROM profiles WHERE clerk_id = public.clerk_user_id()
      )
    )
  );

CREATE POLICY "Users can upload own documents" ON verification_documents
  FOR INSERT WITH CHECK (
    verification_id IN (
      SELECT id FROM professional_verifications 
      WHERE user_id IN (
        SELECT id FROM profiles WHERE clerk_id = public.clerk_user_id()
      )
    )
  );

CREATE POLICY "Admins can view all documents" ON verification_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE clerk_id = public.clerk_user_id() 
      AND user_type = 'professional'
      AND role IN ('admin', 'editor')
    )
  );

-- RLS Policies for verification_activity_log
-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins can view all activity" ON verification_activity_log;
  DROP POLICY IF EXISTS "System can insert activity" ON verification_activity_log;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

CREATE POLICY "Admins can view all activity" ON verification_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE clerk_id = public.clerk_user_id() 
      AND user_type = 'professional'
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "System can insert activity" ON verification_activity_log
  FOR INSERT WITH CHECK (true);

-- Function to log verification activity
CREATE OR REPLACE FUNCTION log_verification_activity(
  p_verification_id UUID,
  p_action VARCHAR(50),
  p_details JSONB DEFAULT '{}'::JSONB
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_log_id UUID;
BEGIN
  -- Get current user
  SELECT id INTO v_user_id
  FROM profiles
  WHERE clerk_id = public.clerk_user_id()
  LIMIT 1;
  
  -- Insert activity log
  INSERT INTO verification_activity_log (verification_id, performed_by, action, details)
  VALUES (p_verification_id, v_user_id, p_action, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_verification_activity TO authenticated;

-- Add professional fields to profiles if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_professional BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gdc_number VARCHAR(7),
ADD COLUMN IF NOT EXISTS practice_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS practice_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS specialties TEXT[],
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS professional_since DATE;