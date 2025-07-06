-- Create scheduled_articles table for scheduling future publication of articles
CREATE TABLE scheduled_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'published', 'failed', 'cancelled')),
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    published_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Ensure only one active schedule per article using a partial unique index
CREATE UNIQUE INDEX unique_active_schedule ON scheduled_articles(article_id) 
WHERE status IN ('pending', 'processing');

-- Create indexes for performance
CREATE INDEX idx_scheduled_articles_scheduled_at ON scheduled_articles(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_scheduled_articles_article_id ON scheduled_articles(article_id);
CREATE INDEX idx_scheduled_articles_created_by ON scheduled_articles(created_by);
CREATE INDEX idx_scheduled_articles_status ON scheduled_articles(status);

-- Add scheduled_status column to articles table
ALTER TABLE articles 
ADD COLUMN scheduled_status VARCHAR(50) DEFAULT NULL,
ADD COLUMN scheduled_at TIMESTAMPTZ DEFAULT NULL;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_scheduled_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scheduled_articles_updated_at
    BEFORE UPDATE ON scheduled_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_articles_updated_at();

-- RLS policies for scheduled_articles
ALTER TABLE scheduled_articles ENABLE ROW LEVEL SECURITY;

-- Admin users can do everything
CREATE POLICY "Admin users can manage all scheduled articles" ON scheduled_articles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Users can view their own scheduled articles
CREATE POLICY "Users can view their own scheduled articles" ON scheduled_articles
    FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());

-- Function to publish scheduled articles
CREATE OR REPLACE FUNCTION publish_scheduled_articles()
RETURNS TABLE (
    article_id UUID,
    title TEXT,
    scheduled_at TIMESTAMPTZ,
    published BOOLEAN,
    error TEXT
) AS $$
DECLARE
    schedule RECORD;
    v_error TEXT;
    v_published BOOLEAN;
BEGIN
    -- Process all pending schedules that are due
    FOR schedule IN 
        SELECT sa.*, a.title as article_title, a.status as article_status
        FROM scheduled_articles sa
        JOIN articles a ON sa.article_id = a.id
        WHERE sa.status = 'pending'
        AND sa.scheduled_at <= NOW()
        ORDER BY sa.scheduled_at ASC
        FOR UPDATE OF sa SKIP LOCKED
    LOOP
        v_error := NULL;
        v_published := FALSE;
        
        BEGIN
            -- Update to processing
            UPDATE scheduled_articles
            SET status = 'processing'
            WHERE id = schedule.id;
            
            -- Check if article is in draft status
            IF schedule.article_status != 'draft' THEN
                v_error := 'Article is not in draft status';
            ELSE
                -- Publish the article
                UPDATE articles
                SET 
                    status = 'published',
                    published_at = NOW(),
                    scheduled_status = NULL,
                    scheduled_at = NULL,
                    updated_at = NOW()
                WHERE id = schedule.article_id;
                
                -- Update schedule record
                UPDATE scheduled_articles
                SET 
                    status = 'published',
                    published_at = NOW()
                WHERE id = schedule.id;
                
                v_published := TRUE;
                
                -- Log activity
                INSERT INTO activity_logs (
                    user_id,
                    action,
                    resource_type,
                    resource_id,
                    resource_name,
                    metadata
                ) VALUES (
                    schedule.created_by,
                    'publish',
                    'article',
                    schedule.article_id,
                    schedule.article_title,
                    jsonb_build_object(
                        'scheduled_at', schedule.scheduled_at,
                        'published_at', NOW(),
                        'auto_published', true
                    )
                );
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            v_error := SQLERRM;
            v_published := FALSE;
            
            -- Update schedule with error
            UPDATE scheduled_articles
            SET 
                status = 'failed',
                error_message = v_error
            WHERE id = schedule.id;
        END;
        
        -- Return result
        article_id := schedule.article_id;
        title := schedule.article_title;
        scheduled_at := schedule.scheduled_at;
        published := v_published;
        error := v_error;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel a scheduled publication
CREATE OR REPLACE FUNCTION cancel_scheduled_publication(p_article_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_schedule_id UUID;
BEGIN
    -- Find active schedule
    SELECT id INTO v_schedule_id
    FROM scheduled_articles
    WHERE article_id = p_article_id
    AND status IN ('pending', 'processing')
    LIMIT 1;
    
    IF v_schedule_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Cancel the schedule
    UPDATE scheduled_articles
    SET 
        status = 'cancelled',
        updated_at = NOW()
    WHERE id = v_schedule_id;
    
    -- Update article
    UPDATE articles
    SET 
        scheduled_status = NULL,
        scheduled_at = NULL,
        updated_at = NOW()
    WHERE id = p_article_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON scheduled_articles TO authenticated;
GRANT EXECUTE ON FUNCTION publish_scheduled_articles() TO service_role;
GRANT EXECUTE ON FUNCTION cancel_scheduled_publication(UUID) TO authenticated;