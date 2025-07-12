# Content Moderation System - Complete Implementation Guide

## Overview

The Dentistry Explained content moderation system is a comprehensive solution for managing user-generated content. It combines AI-powered moderation, content filtering, workflow automation, and a reputation system to maintain content quality and community standards.

## System Architecture

### Core Components

1. **AI Moderation** (`/lib/moderation/ai-moderation/`)
   - OpenAI and Google Perspective API integration
   - Toxicity, spam, and content quality detection
   - Dental-specific medical misinformation detection

2. **Content Filters** (`/lib/moderation/filters/`)
   - Word filter with obfuscation detection
   - Pattern matching for emails, phones, URLs
   - Link validation for phishing/malicious URLs

3. **Workflow System** (`/lib/moderation/workflows/`)
   - Review queue management
   - Automated decision workflows
   - Progressive discipline system

4. **Reputation System** (`/lib/moderation/reputation/`)
   - 7-level user reputation tracking
   - Achievement badges
   - Reputation-based privileges

5. **Admin Dashboard** (`/app/admin/moderation/`)
   - Review queue interface
   - Statistics and analytics
   - Configuration management

## Key Features

### Automated Moderation
- **Multi-provider AI analysis**: OpenAI + Google Perspective
- **Confidence-based actions**: Auto-approve, review, or reject
- **Trust-based relaxation**: Higher reputation users get more lenient moderation

### Content Analysis
- **Toxicity Detection**: Hate speech, threats, profanity
- **Spam Classification**: Keyword density, link ratios, patterns
- **Medical Misinformation**: Dental-specific claim detection
- **Personal Information**: Email, phone, NHS number extraction

### Review Workflow
- **Priority Queue**: Critical → High → Medium → Low
- **Bulk Actions**: Process multiple items efficiently
- **Decision Tracking**: Complete audit trail
- **Automated Actions**: Apply decisions consistently

### User Management
- **Progressive Discipline**:
  - Warning (3 warnings → suspension)
  - Suspension (temporary)
  - Ban (permanent)
  - Shadowban (invisible)
- **Reputation Levels**:
  - New (0-9 points)
  - Member (10-49 points)
  - Contributor (50-99 points)
  - Regular (100-249 points)
  - Trusted (250-499 points)
  - Expert (500-999 points)
  - Elite (1000+ points)

## Database Schema

### Core Tables
- `moderation_queue`: Items pending review
- `moderation_logs`: Action history
- `user_warnings`: Warning records
- `reputation_history`: Reputation changes
- `user_permissions`: Permission grants
- `user_stats`: Aggregated statistics
- `workflow_logs`: Workflow execution logs
- `user_actions`: Rate limiting data

### Profile Extensions
```sql
-- Added to profiles table
reputation_score INTEGER DEFAULT 0
reputation_level VARCHAR(20) DEFAULT 'new'
reputation_badges JSONB DEFAULT '[]'
is_banned BOOLEAN DEFAULT FALSE
is_shadowbanned BOOLEAN DEFAULT FALSE
is_suspended BOOLEAN DEFAULT FALSE
suspended_until TIMESTAMPTZ
```

## API Endpoints

### Moderation APIs
- `GET /api/admin/moderation/stats` - Dashboard statistics
- `GET /api/admin/moderation/queue` - Review queue items
- `POST /api/admin/moderation/review/[id]` - Submit review decision
- `GET /api/admin/moderation/leaderboard` - Reputation rankings
- `POST /api/admin/moderation/test` - Test moderation

### Public APIs (for content submission)
- Content is automatically moderated when submitted through existing APIs
- Moderation results affect content visibility

## Configuration

### Environment Variables
```env
# Required for AI moderation
OPENAI_API_KEY=your-openai-key
PERSPECTIVE_API_KEY=your-perspective-key
```

### Settings Structure
```typescript
{
  moderation: {
    enabled: true,
    providers: {
      openai: { enabled: true },
      perspective: { enabled: true }
    },
    thresholds: {
      autoApprove: 0.2,    // Below 20% confidence
      autoReject: 0.9,     // Above 90% confidence
      reviewRequired: 0.5  // 50-90% requires review
    },
    wordFilter: {
      enabled: true,
      customWords: []
    },
    patterns: {
      enabled: true,
      customPatterns: []
    },
    workflows: {
      enabled: true,
      customRules: []
    }
  }
}
```

## Usage Examples

### Moderating Content
```typescript
import { ModerationAggregator } from '@/lib/moderation'

const result = await ModerationAggregator.moderate({
  id: 'comment-123',
  type: 'comment',
  content: 'User comment text here',
  authorId: 'user-456',
  source: 'article-comment',
  createdAt: new Date()
})

if (!result.passed) {
  // Handle moderation failure
  console.log('Flags:', result.flags)
  console.log('Action:', result.suggestedAction)
}
```

### Updating User Reputation
```typescript
import { UserReputation } from '@/lib/moderation'

await UserReputation.updateReputation(
  userId,
  'content_approved', // Action type
  { contentId: 'article-123' } // Metadata
)
```

### Processing Review Queue
```typescript
import { ReviewQueue } from '@/lib/moderation'

// Get pending items
const { items } = await ReviewQueue.getPendingItems({
  priority: 'high',
  limit: 10
})

// Review an item
await ReviewQueue.reviewItem(
  itemId,
  moderatorId,
  'approve', // Decision
  'Looks good' // Notes
)
```

## Admin Dashboard

### Access
Navigate to `/admin/moderation` in the admin panel.

### Features
1. **Review Queue Tab**
   - Filter by content type and priority
   - View moderation analysis details
   - Make decisions with notes
   - Bulk actions support

2. **Statistics Tab**
   - Processing metrics
   - Violation breakdowns
   - Trend analysis
   - Hourly/daily activity

3. **Reputation Tab**
   - User leaderboard
   - Badge achievements
   - Reputation adjustments

4. **Settings Tab**
   - Enable/disable providers
   - Adjust thresholds
   - Manage word filters
   - Test moderation

## Performance Optimizations

### Caching
- All moderation results cached for 1 hour
- User reputation cached with tag-based invalidation
- Review queue cached for 5 minutes

### Parallel Processing
- AI providers called concurrently
- Multiple filters run in parallel
- Batch processing for bulk moderation

### Database Optimization
- Proper indexes on all foreign keys
- Composite indexes for common queries
- RLS policies for security

## Security Considerations

### API Security
- All moderation APIs require authentication
- Moderator permissions checked
- Rate limiting on all endpoints

### Data Protection
- Personal information detection and flagging
- GDPR-compliant data retention
- Audit logs for all actions

### Content Security
- XSS prevention through sanitization
- SQL injection protection via parameterized queries
- CSRF protection on all mutations

## Monitoring & Maintenance

### Key Metrics
- Queue size and processing time
- False positive/negative rates
- API provider availability
- User satisfaction scores

### Regular Tasks
- Review flagged content patterns
- Update word filters and patterns
- Analyze moderation accuracy
- Adjust thresholds based on data

### Troubleshooting
1. **High false positive rate**: Lower confidence thresholds
2. **Slow processing**: Check API provider status
3. **Queue buildup**: Add more moderators or adjust auto-approval
4. **User complaints**: Review specific cases and adjust rules

## Future Enhancements

### Planned Features
- Machine learning model training on local data
- Image and video moderation
- Multi-language support
- Real-time moderation for chat
- Community-driven moderation

### Integration Opportunities
- Webhook notifications for critical content
- Integration with customer support systems
- Export moderation data for analysis
- Public transparency reports

## Conclusion

The moderation system provides a robust foundation for maintaining content quality while scaling the platform. The combination of automated and manual review ensures efficiency while maintaining human oversight for complex cases. The reputation system incentivizes positive contributions while the progressive discipline system handles violations fairly.

For questions or support, contact the development team.