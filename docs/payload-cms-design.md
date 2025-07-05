# Payload CMS Content Management System Design

**Status**: July 2025 - Payload CMS is installed (v3.45.0) but NOT integrated. The platform currently uses a custom admin panel built with Next.js.

## Overview
This document outlines the original plan for Payload CMS to serve as the content management backbone for Dentistry Explained. However, as of July 2025, a custom solution has been implemented instead.

## Core Requirements

### 1. Content Types

#### Articles
- **Fields:**
  - Title (text)
  - Slug (auto-generated from title)
  - Category (relationship to Categories)
  - Content (rich text with medical formatting)
  - Summary (textarea)
  - Read Time (auto-calculated)
  - Difficulty Level (select: Basic/Advanced)
  - Medical References (array of references)
  - Related Articles (relationship)
  - Meta Tags (SEO)
  - Featured Image
  - Status (draft/review/published)
  - Author (relationship to Users)
  - Medical Reviewer (relationship to Users)
  - Review Notes (textarea)
  - Last Medical Review Date
  - Version History

#### Categories
- **Structure:**
  - The Mouth (Overview)
  - Prevention & Maintenance
  - Dental Problems
  - Dental Treatments
  - Other (subcategories for specialized content)

#### Media Library
- **Features:**
  - Image optimization pipeline
  - Medical diagram management
  - Video embedding support
  - Alt text requirements for accessibility
  - Copyright/attribution tracking

#### References
- **Fields:**
  - Title
  - Authors
  - Publication
  - Year
  - DOI/URL
  - Type (journal/guideline/book)
  - Evidence Level

### 2. User Roles & Permissions

#### Content Creator (Curran/Vimal)
- Create/edit/delete articles
- Upload media
- Manage references
- View all content

#### Medical Reviewer
- Review articles
- Add review notes
- Approve for publication
- Cannot delete content

#### Administrator
- Full access to all content
- User management
- System configuration
- Publishing controls

### 3. Editorial Workflow

```
Draft → Medical Review → Revisions → Final Approval → Published
  ↓           ↓              ↓              ↓
[Save]  [Request Review] [Make Changes] [Approve & Publish]
```

#### Features:
- Version control with rollback
- Review assignment notifications
- Change tracking
- Approval workflows
- Scheduled publishing

### 4. Rich Text Editor Configuration

#### Medical Formatting Tools:
- Medical terminology highlighting
- Dosage formatting
- Procedure steps
- Risk/benefit sections
- Patient instructions
- Warning/caution boxes
- Clinical images with annotations

#### Standard Features:
- Headings (H2-H6)
- Bold/Italic/Underline
- Lists (ordered/unordered)
- Tables
- Links (internal/external)
- Code blocks (for technical content)
- Blockquotes

### 5. Content Templates

#### Article Templates:
1. **Condition/Problem Template**
   - What is [condition]?
   - Causes
   - Symptoms
   - Diagnosis
   - Treatment Options
   - Prevention
   - When to See a Dentist

2. **Treatment/Procedure Template**
   - Overview
   - Who Needs This Treatment
   - The Procedure
   - Risks and Benefits
   - Recovery
   - Aftercare
   - Costs (NHS/Private)

3. **Prevention/Maintenance Template**
   - Why It Matters
   - Step-by-Step Guide
   - Common Mistakes
   - Recommended Products
   - Professional Care

### 6. Integration Points

#### Frontend Integration:
- REST API endpoints
- GraphQL support
- Webhook notifications for content updates
- Preview URLs for draft content

#### External Services:
- Cloudinary/similar for image optimization
- Citation management tools
- Grammar/readability checkers
- Translation services (future)

### 7. Quality Assurance Features

#### Content Validation:
- Required field validation
- Readability score checking
- Medical term verification
- Reference validation
- Image quality checks

#### Review Dashboard:
- Pending reviews queue
- Review history
- Reviewer performance metrics
- Content quality scores

### 8. Advanced Features

#### AI Integration:
- Content suggestions based on gaps
- Readability improvements
- SEO optimization suggestions
- Related content recommendations

#### Analytics:
- Content performance tracking
- Popular topics identification
- User engagement metrics
- Search query analysis

## Current Implementation Status (July 2025)

### What Was Built Instead
The platform currently uses a **custom admin panel** at `/admin` with:
- ✅ Article CRUD operations
- ✅ Basic user management
- ✅ Professional verification queue
- ✅ Direct Supabase integration
- ✅ Simple content editing (no rich text)
- ❌ No medical review workflow
- ❌ No version control
- ❌ No content templates

### Why Payload CMS Wasn't Used
- Time constraints for MVP
- Complexity of integration
- Custom solution was faster to implement
- Direct Supabase integration was simpler

### Future Considerations
Payload CMS could still be integrated for:
- Advanced editorial workflows
- Better content versioning
- Rich media management
- Multi-language support
- Collaborative editing

## Technical Architecture

```
Payload CMS (Self-hosted)
    ↓
PostgreSQL (Supabase)
    ↓
Next.js API Routes
    ↓
Frontend Components
```

### Database Schema Extensions:
```sql
-- Articles table (extends existing)
ALTER TABLE articles ADD COLUMN payload_id VARCHAR(255);
ALTER TABLE articles ADD COLUMN medical_reviewer_id UUID;
ALTER TABLE articles ADD COLUMN review_status VARCHAR(50);
ALTER TABLE articles ADD COLUMN review_notes TEXT;
ALTER TABLE articles ADD COLUMN last_medical_review TIMESTAMP;

-- References table
CREATE TABLE references (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT[],
  publication TEXT,
  year INTEGER,
  doi TEXT,
  url TEXT,
  type VARCHAR(50),
  evidence_level VARCHAR(10)
);

-- Article references junction
CREATE TABLE article_references (
  article_id UUID REFERENCES articles(id),
  reference_id UUID REFERENCES references(id),
  PRIMARY KEY (article_id, reference_id)
);
```

## Security Considerations

1. **Access Control:**
   - JWT-based authentication
   - Role-based permissions
   - API key management
   - IP whitelisting for admin access

2. **Content Security:**
   - XSS prevention in rich text
   - File upload restrictions
   - CORS configuration
   - Rate limiting

3. **Audit Trail:**
   - All content changes logged
   - User action tracking
   - Review history preservation
   - Compliance documentation

## Success Metrics

1. **Content Creation Efficiency:**
   - Time to create new article < 30 minutes
   - Review cycle time < 24 hours
   - Publishing time < 5 minutes

2. **Content Quality:**
   - 100% medical review coverage
   - Readability score > 70
   - Reference accuracy > 95%
   - Zero medical inaccuracies

3. **System Performance:**
   - API response time < 200ms
   - Image optimization > 80% reduction
   - 99.9% uptime
   - Concurrent editor support

## Future Enhancements

1. **Multi-language Support:**
   - Translation workflow
   - Locale-specific content
   - RTL language support

2. **Collaboration Features:**
   - Real-time collaborative editing
   - Comment threads
   - Task assignments

3. **Advanced Analytics:**
   - A/B testing for content
   - User journey tracking
   - Content recommendation engine

4. **Mobile App:**
   - Native CMS app for content creation
   - Offline editing support
   - Push notifications