# Glossary Migration Plan

## Current Status
- Database has only 10 basic terms
- Code has 97 comprehensive terms with enhanced data
- Glossary page uses hardcoded data instead of database
- Database schema is missing fields: also_known_as, difficulty, example

## What I've Done So Far
1. Created migration file: `20250105_add_glossary_enhanced_fields.sql`
   - Adds missing fields to glossary_terms table
   - Updates search vector function to include new fields
   
2. Created migration script: `scripts/migrate-glossary-terms.ts`
   - Will migrate all 97 terms from code to database
   - Handles batch insertion to avoid timeouts

## Next Steps When Out of Readonly Mode

### 1. Run Database Migration
```bash
# Apply the schema changes
npx supabase db push
```

### 2. Run Data Migration
```bash
# Install dotenv if needed
npm install --save-dev dotenv

# Run the migration script
npx tsx scripts/migrate-glossary-terms.ts
```

### 3. Update Glossary Page Component
- Modify `/components/glossary/glossary-enhanced.tsx` to:
  - Add copy button for each term
  - Add YouTube search button
  - Fetch data from API instead of hardcoded file

### 4. Create API Routes
- Update `/app/api/glossary/route.ts` to support:
  - Filtering by category and difficulty
  - Random term selection for "Term of the Day"
  - Pagination if needed

### 5. Key Opportunities Unlocked by DB Storage

#### Immediate Opportunities:
1. **Dynamic Term of the Day** - Pull random term daily, track which have been featured
2. **User Interactions** - Track views, bookmarks, searches per term
3. **Related Terms Navigation** - Click-through related terms dynamically
4. **Admin Management** - Add/edit terms through UI without code changes
5. **Personalization** - Track user's viewed terms, suggest unread ones

#### Advanced Opportunities:
1. **Quiz Generation** - Auto-generate quizzes from terms
2. **Learning Paths** - Create guided journeys through related terms
3. **Professional Content** - Show advanced terms only to verified professionals
4. **Analytics Dashboard** - Most searched terms, common misconceptions
5. **AI Integration** - Use term definitions for chat context
6. **Cross-Content Linking** - Auto-link terms in articles to glossary

### 6. Implementation Priority
1. Copy/YouTube buttons (quick win)
2. Dynamic Term of the Day
3. View/interaction tracking
4. Admin management interface
5. Quiz mode
6. Cross-content linking

## Code Changes Needed

### glossary-enhanced.tsx additions:
```tsx
// Add to imports
import { Copy, Youtube } from 'lucide-react'

// Add copy function
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  // Show toast notification
}

// Add YouTube search
const searchYouTube = (term: string) => {
  window.open(`https://www.youtube.com/results?search_query=dental+${encodeURIComponent(term)}`, '_blank')
}

// Add buttons to term card
<Button size="sm" variant="ghost" onClick={() => copyToClipboard(term.term)}>
  <Copy className="h-4 w-4" />
</Button>
<Button size="sm" variant="ghost" onClick={() => searchYouTube(term.term)}>
  <Youtube className="h-4 w-4" />
</Button>
```