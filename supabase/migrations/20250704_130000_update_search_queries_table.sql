-- Add columns to track clicked search results
ALTER TABLE search_queries 
ADD COLUMN IF NOT EXISTS clicked_result_id UUID,
ADD COLUMN IF NOT EXISTS clicked_result TEXT;

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_search_queries_clicked 
ON search_queries(created_at, clicked_result_id) 
WHERE clicked_result_id IS NOT NULL;