-- Create table for tracking professional research usage
CREATE TABLE IF NOT EXISTS professional_research_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    report_type TEXT NOT NULL DEFAULT 'research_report',
    sources_count INTEGER NOT NULL DEFAULT 0,
    word_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Add indexes for common queries
    INDEX idx_professional_research_user_id (user_id),
    INDEX idx_professional_research_created_at (created_at DESC)
);

-- Create table for tracking research jobs (for async processing)
CREATE TABLE IF NOT EXISTS research_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    report_type TEXT NOT NULL DEFAULT 'research_report',
    sources_count INTEGER NOT NULL DEFAULT 10,
    focus_medical BOOLEAN DEFAULT true,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    result JSONB,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Add indexes
    INDEX idx_research_jobs_user_id (user_id),
    INDEX idx_research_jobs_status (status),
    INDEX idx_research_jobs_created_at (created_at DESC)
);

-- Create table for caching research results
CREATE TABLE IF NOT EXISTS research_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key TEXT NOT NULL UNIQUE,
    topic TEXT NOT NULL,
    report_type TEXT NOT NULL,
    result JSONB NOT NULL,
    sources_count INTEGER NOT NULL DEFAULT 0,
    word_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Add indexes
    INDEX idx_research_cache_key (cache_key),
    INDEX idx_research_cache_expires (expires_at),
    INDEX idx_research_cache_topic (topic)
);

-- Create function to clean expired research cache
CREATE OR REPLACE FUNCTION clean_expired_research_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM research_cache
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for professional_research_logs
ALTER TABLE professional_research_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own research logs"
    ON professional_research_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert research logs"
    ON professional_research_logs FOR INSERT
    WITH CHECK (true);

-- RLS Policies for research_jobs
ALTER TABLE research_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own research jobs"
    ON research_jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own research jobs"
    ON research_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update research jobs"
    ON research_jobs FOR UPDATE
    USING (true);

-- RLS Policies for research_cache
ALTER TABLE research_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read research cache"
    ON research_cache FOR SELECT
    USING (true);

CREATE POLICY "System can manage research cache"
    ON research_cache FOR ALL
    USING (true);

-- Add column to web_searches table to track GPT-Researcher usage
ALTER TABLE web_searches 
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'perplexity' 
CHECK (provider IN ('perplexity', 'exa', 'gpt-researcher'));

-- Create index on provider column
CREATE INDEX IF NOT EXISTS idx_web_searches_provider ON web_searches(provider);