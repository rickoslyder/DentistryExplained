-- Add title column to chat_sessions table
ALTER TABLE chat_sessions 
ADD COLUMN title TEXT;

-- Add index for better performance when fetching user's sessions
CREATE INDEX idx_chat_sessions_user_id_created_at 
ON chat_sessions(user_id, created_at DESC);

-- Update RLS policies to include title in allowed columns
-- (The existing policies should already allow this, but let's be explicit)