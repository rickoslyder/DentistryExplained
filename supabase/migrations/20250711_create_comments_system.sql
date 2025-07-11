-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comment reactions table for upvotes/downvotes
CREATE TABLE IF NOT EXISTS public.comment_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('upvote', 'downvote')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Create comment reports table
CREATE TABLE IF NOT EXISTS public.comment_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'misinformation', 'other')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_comments_article_id ON public.comments(article_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX idx_comments_status ON public.comments(status);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);
CREATE INDEX idx_comment_reactions_comment_id ON public.comment_reactions(comment_id);
CREATE INDEX idx_comment_reactions_user_id ON public.comment_reactions(user_id);
CREATE INDEX idx_comment_reports_comment_id ON public.comment_reports(comment_id);
CREATE INDEX idx_comment_reports_status ON public.comment_reports(status);

-- Create function to update comment vote counts
CREATE OR REPLACE FUNCTION update_comment_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE comments
        SET 
            upvotes = (SELECT COUNT(*) FROM comment_reactions WHERE comment_id = NEW.comment_id AND reaction_type = 'upvote'),
            downvotes = (SELECT COUNT(*) FROM comment_reactions WHERE comment_id = NEW.comment_id AND reaction_type = 'downvote')
        WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE comments
        SET 
            upvotes = (SELECT COUNT(*) FROM comment_reactions WHERE comment_id = OLD.comment_id AND reaction_type = 'upvote'),
            downvotes = (SELECT COUNT(*) FROM comment_reactions WHERE comment_id = OLD.comment_id AND reaction_type = 'downvote')
        WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update vote counts
CREATE TRIGGER update_comment_votes_trigger
AFTER INSERT OR UPDATE OR DELETE ON comment_reactions
FOR EACH ROW EXECUTE FUNCTION update_comment_votes();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF NEW.content != OLD.content THEN
        NEW.is_edited = TRUE;
        NEW.edited_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
CREATE TRIGGER update_comments_updated_at_trigger
BEFORE UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION update_comments_updated_at();

-- Create trigger for updating comment reports timestamp
CREATE TRIGGER update_comment_reports_updated_at_trigger
BEFORE UPDATE ON comment_reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Users can view approved comments and their own comments
CREATE POLICY "Users can view approved comments" ON public.comments
    FOR SELECT USING (status = 'approved' OR user_id = auth.uid());

-- Users can create comments
CREATE POLICY "Users can create comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for comment reactions
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

-- Users can view all reactions
CREATE POLICY "Users can view reactions" ON public.comment_reactions
    FOR SELECT USING (true);

-- Users can manage their own reactions
CREATE POLICY "Users can manage own reactions" ON public.comment_reactions
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for comment reports
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports" ON public.comment_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON public.comment_reports
    FOR SELECT USING (auth.uid() = reporter_id);

-- Create admin policies for comment moderation
CREATE POLICY "Admins can manage all comments" ON public.comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can view all reports" ON public.comment_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update reports" ON public.comment_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Add activity log entries for comment actions
CREATE OR REPLACE FUNCTION log_comment_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
        VALUES (NEW.user_id, 'create', 'comment', NEW.id, jsonb_build_object(
            'article_id', NEW.article_id,
            'parent_id', NEW.parent_id,
            'content_preview', LEFT(NEW.content, 100)
        ));
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
        VALUES (auth.uid(), 'moderate', 'comment', NEW.id, jsonb_build_object(
            'old_status', OLD.status,
            'new_status', NEW.status
        ));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
        VALUES (auth.uid(), 'delete', 'comment', OLD.id, jsonb_build_object(
            'article_id', OLD.article_id,
            'content_preview', LEFT(OLD.content, 100)
        ));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_comment_activity_trigger
AFTER INSERT OR UPDATE OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION log_comment_activity();