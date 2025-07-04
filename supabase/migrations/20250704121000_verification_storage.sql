-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents',
  'verification-documents',
  true, -- Public bucket with RLS
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']::text[]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for verification documents
CREATE POLICY "Users can upload verification documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own verification documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own verification documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can view all verification documents
CREATE POLICY "Admins can view all verification documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'verification-documents' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid()::uuid 
      AND role = 'admin'
    )
  );