-- Add role column to profiles table for admin/editor permissions
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('user', 'admin', 'editor')) DEFAULT 'user';