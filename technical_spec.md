<specification_planning>

## 1. Core System Architecture and Key Workflows

**Architecture Overview:**
- Next.js 14+ App Router for frontend/backend
- Payload CMS self-hosted for content management
- Clerk for authentication and user management
- Supabase for database, realtime features, and file storage
- Vercel for hosting and edge functions

**Key Workflows to Detail:**
1. Content Publishing: Payload CMS → Next.js dynamic pages
2. User Registration: Patient vs Professional flows with Clerk
3. Professional Verification: GDC validation → manual approval → access unlock
4. AI Chat: User query → context enrichment → LiteLLM proxy → response with memory
5. Find a Dentist: Location search → filter → results with realtime status
6. Subscription: Mock Stripe flow → Clerk metadata update → feature access

**Potential Challenges:**
- Payload CMS self-hosting on Vercel (may need separate deployment)
- Syncing Clerk users with Supabase profiles
- Realtime presence management at scale
- Chat memory optimization for 180-day retention

## 2. Project Structure and Organization

**Monorepo Considerations:**
- Main app in `/app`
- Payload CMS in `/cms` (if separate)
- Shared types in `/packages/types`
- UI components in `/packages/ui`

**Key Directories:**
- `/app` - Next.js application
- `/components` - React components
- `/lib` - Utilities and configurations
- `/hooks` - Custom React hooks
- `/server` - Server actions and API logic
- `/types` - TypeScript definitions

## 3. Detailed Feature Specifications

**Complex Features Needing Breakdown:**
1. AI Chat Assistant
   - Session management
   - Context awareness
   - Memory persistence
   - PDF export functionality
   
2. Realtime Features
   - Presence system architecture
   - Debouncing strategy
   - Fallback for connection issues
   
3. Content Hierarchy
   - Parent-child relationships
   - Breadcrumb generation
   - URL slug management

**Edge Cases to Consider:**
- Offline functionality for critical content
- Rate limiting for AI chat
- Concurrent editing in CMS
- Professional verification edge cases

## 4. Database Schema Design

**Core Tables Needed:**
1. Users (synced with Clerk)
2. Profiles (extended user data)
3. Chat_sessions
4. Chat_messages
5. Article_views (for realtime)
6. Professional_verifications
7. Practice_listings
8. Bookmarks
9. Notifications

**Relationships:**
- Users → Profiles (1:1)
- Users → Chat_sessions (1:many)
- Chat_sessions → Chat_messages (1:many)
- Users → Bookmarks → Articles (many:many)

## 5. Server Actions and Integrations

**Critical Server Actions:**
1. User profile sync (Clerk webhook)
2. Chat message persistence
3. Article view tracking
4. Professional verification
5. Practice claim process
6. Subscription management

**External Integrations:**
- LiteLLM proxy for AI
- Stripe for payments
- Mapbox/Google Maps for directory
- Email service for notifications

## 6. Design System and Component Architecture

**Component Categories:**
1. Layout Components
   - Header with user menu
   - Sidebar navigation
   - Footer with links
   
2. Content Components
   - Article renderer
   - Reference expander
   - Media gallery
   
3. Interactive Components
   - AI chat interface
   - Search with filters
   - Realtime indicators

## 7. Authentication and Authorization

**User Types and Permissions:**
1. Anonymous users (limited access)
2. Registered patients (full content)
3. Verified professionals (+ professional content)
4. Admin users (CMS access)

**Protected Routes:**
- /dashboard/*
- /professional/*
- /admin/*

## 8. Data Flow and State Management

**State Management Approach:**
- Server state with React Query/SWR
- Client state with Zustand for UI
- Form state with React Hook Form
- Realtime state with Supabase subscriptions

## 9. Payment Implementation

**Stripe Integration Flow:**
1. Product/price setup in Stripe dashboard
2. Checkout session creation
3. Webhook handling for events
4. Metadata sync to Clerk
5. Access control based on subscription

## 10. Analytics Implementation

**Key Metrics to Track:**
- Page views and engagement
- Search queries and results
- AI chat interactions
- Professional dashboard usage
- Conversion funnel metrics

## 11. Testing Strategy

**Test Coverage Areas:**
1. Unit tests for utilities and hooks
2. Integration tests for server actions
3. E2E tests for critical user journeys
4. Visual regression for components
5. Performance tests for search and AI

**Critical User Flows to Test:**
- User registration (both types)
- Article search and viewing
- AI chat interaction
- Professional verification
- Find a dentist search

</specification_planning>

# Dentistry Explained Technical Specification

## 1. System Overview

### Core Purpose and Value Proposition
Dentistry Explained is a comprehensive dental education platform designed to be the UK's premier online dental resource. It provides evidence-based dental information to patients, professionals, and the general public through an intuitive, accessible interface with AI-powered assistance.

### Key Workflows
1. **Content Discovery**: Users browse hierarchical dental topics or search for specific information
2. **AI-Assisted Learning**: Interactive chat provides personalized dental guidance
3. **Professional Services**: Verified dentists access patient education materials and consent forms
4. **Practice Discovery**: Patients find and connect with local dental practices
5. **Knowledge Persistence**: Users bookmark content and maintain chat history across visits

### System Architecture
```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│   Next.js App   │────▶│ Payload CMS  │     │    Clerk    │
│  (App Router)   │     │ (Self-hosted)│     │    Auth     │
└────────┬────────┘     └──────────────┘     └──────┬──────┘
         │                                            │
         │              ┌──────────────┐              │
         └─────────────▶│   Supabase   │◀─────────────┘
                        │  PostgreSQL  │
                        │   Realtime   │
                        │   Storage    │
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │   LiteLLM    │
                        │    Proxy     │
                        └──────────────┘
```

## 2. Project Structure

```
dentistry-explained/
├── apps/
│   └── web/                    # Main Next.js application
│       ├── app/               # App Router pages
│       │   ├── (auth)/       # Auth-related pages
│       │   ├── (content)/    # Dynamic content pages
│       │   ├── (marketing)/  # Landing pages
│       │   ├── api/          # API routes
│       │   ├── dashboard/    # User dashboards
│       │   └── professional/ # Professional features
│       ├── components/       # React components
│       │   ├── auth/        # Authentication components
│       │   ├── chat/        # AI chat components
│       │   ├── content/     # Content display
│       │   ├── directory/   # Dentist directory
│       │   ├── layout/      # Layout components
│       │   ├── realtime/    # Realtime features
│       │   └── ui/          # Base UI components
│       ├── hooks/           # Custom React hooks
│       ├── lib/            # Utilities and configs
│       │   ├── api/        # API clients
│       │   ├── auth/       # Auth utilities
│       │   ├── db/         # Database utilities
│       │   └── utils/      # General utilities
│       ├── server/         # Server-side code
│       │   ├── actions/    # Server actions
│       │   ├── db/         # Database queries
│       │   └── services/   # Business logic
│       ├── styles/         # Global styles
│       └── types/          # TypeScript types
├── packages/
│   ├── ui/                # Shared UI components
│   ├── types/            # Shared TypeScript types
│   └── utils/            # Shared utilities
├── cms/                   # Payload CMS (if separate)
├── supabase/             # Supabase migrations
└── tests/                # Test suites
```

## 3. Feature Specification

### 3.1 Content Management System
**User Story**: As a content editor, I need to create and manage dental articles with rich media support.

**Implementation Steps**:
1. Configure Payload collections:
   ```typescript
   // collections/Articles.ts
   {
     slug: 'articles',
     fields: [
       { name: 'title', type: 'text', required: true },
       { name: 'slug', type: 'text', unique: true },
       { name: 'category', type: 'relationship', relationTo: 'categories' },
       { name: 'content', type: 'richText' },
       { name: 'readingLevel', type: 'select', options: ['basic', 'advanced'] },
       { name: 'references', type: 'array', fields: [...] },
       { name: 'lastMedicallyReviewed', type: 'date' },
       { name: 'sensitiveContent', type: 'checkbox' }
     ]
   }
   ```

2. Implement content hierarchy with parent-child relationships
3. Create custom rich text editor with medical formatting
4. Set up media optimization pipeline
5. Implement version control with draft/publish workflow

**Error Handling**:
- Validate slug uniqueness
- Handle media upload failures
- Prevent deletion of articles with children
- Maintain referential integrity

### 3.2 AI Dental Assistant
**User Story**: As a patient, I want to ask questions about dental topics and receive contextual, accurate responses.

**Implementation Steps**:
1. Create chat UI with slide-out panel:
   ```typescript
   // components/chat/ChatPanel.tsx
   interface ChatPanelProps {
     isOpen: boolean;
     onClose: () => void;
     currentPageContext?: PageContext;
   }
   ```

2. Implement session management:
   ```typescript
   // server/actions/chat.ts
   async function createChatSession(userId: string) {
     return await supabase
       .from('chat_sessions')
       .insert({
         user_id: userId,
         session_id: generateSessionId(),
         created_at: new Date(),
         expires_at: addDays(new Date(), 180)
       });
   }
   ```

3. Connect to LiteLLM proxy:
   ```typescript
   // lib/api/llm.ts
   const LLM_PROXY_URL = 'https://openai-proxy-0l7e.onrender.com';
   
   async function sendChatMessage(
     message: string, 
     context: ChatContext
   ): Promise<AIResponse> {
     // Include page context and chat history
   }
   ```

4. Implement memory persistence with 180-day retention
5. Add PDF export functionality
6. Create suggested questions based on current page

**Error Handling**:
- Fallback responses for API failures
- Rate limiting per user
- Context size management
- Graceful degradation for offline scenarios

### 3.3 User Authentication & Profiles
**User Story**: As a user, I need to create an account as either a patient or dental professional.

**Implementation Steps**:
1. Configure Clerk with custom metadata:
   ```typescript
   // lib/auth/clerk.ts
   interface UserMetadata {
     userType: 'patient' | 'professional';
     gdcNumber?: string;
     isVerified?: boolean;
     subscriptionTier?: 'basic' | 'pro' | 'practice';
   }
   ```

2. Create onboarding flow:
   ```typescript
   // app/(auth)/onboarding/page.tsx
   - User type selection
   - Professional GDC validation
   - Profile completion
   - Dashboard redirect
   ```

3. Sync Clerk users with Supabase:
   ```typescript
   // server/webhooks/clerk.ts
   export async function handleUserCreated(event: WebhookEvent) {
     await supabase.from('profiles').insert({
       id: event.data.id,
       email: event.data.email,
       user_type: event.data.metadata.userType
     });
   }
   ```

**Error Handling**:
- Handle webhook failures with retry logic
- Validate GDC format (7 digits)
- Prevent duplicate profiles
- Handle Clerk-Supabase sync issues

### 3.4 Find a Dentist Directory
**User Story**: As a patient, I want to find dentists near me with specific services and see their availability.

**Implementation Steps**:
1. Create practice profile schema:
   ```typescript
   interface PracticeProfile {
     id: string;
     name: string;
     location: { lat: number; lng: number };
     services: string[];
     nhsAccepted: boolean;
     privateAccepted: boolean;
     accessibility: string[];
     openingHours: OpeningHours;
     photos: string[];
     teamMembers: TeamMember[];
   }
   ```

2. Implement location-based search:
   ```typescript
   // server/actions/directory.ts
   async function searchPractices(params: {
     postcode: string;
     radius: number;
     filters: PracticeFilters;
   }) {
     // Convert postcode to coordinates
     // Query practices within radius
     // Apply filters
     // Sort by distance
   }
   ```

3. Add realtime availability status using Supabase presence

**Error Handling**:
- Invalid postcode handling
- Geocoding API failures
- No results scenarios
- Map loading failures

### 3.5 Realtime Features
**User Story**: As a user, I want to see live engagement metrics and receive notifications about new content.

**Implementation Steps**:
1. Article view tracking:
   ```typescript
   // hooks/useArticlePresence.ts
   export function useArticlePresence(articleId: string) {
     const [viewerCount, setViewerCount] = useState(0);
     
     useEffect(() => {
       const channel = supabase.channel(`article:${articleId}`);
       // Track presence
       // Update viewer count with debouncing
     }, [articleId]);
   }
   ```

2. Professional online status:
   ```typescript
   // server/services/presence.ts
   async function updateProfessionalStatus(
     userId: string, 
     status: 'online' | 'offline'
   ) {
     // Update presence with privacy settings
   }
   ```

3. Content notifications:
   ```typescript
   // components/realtime/NotificationToast.tsx
   - New article alerts
   - Category updates
   - User preferences
   ```

**Error Handling**:
- Connection recovery
- Presence cleanup on disconnect
- Notification permission handling
- Performance optimization for many subscribers

### 3.6 Professional Dashboard
**User Story**: As a verified dental professional, I need access to patient education materials and practice management tools.

**Implementation Steps**:
1. Consent form generator:
   ```typescript
   // server/actions/consent-forms.ts
   async function generateConsentForm(params: {
     procedureType: string;
     patientInfo?: PatientInfo;
     customizations: FormCustomizations;
   }): Promise<PDFDocument> {
     // Generate PDF with template
   }
   ```

2. Practice listing management
3. CPD tracking preparation
4. Patient handout customization

**Error Handling**:
- PDF generation failures
- Template validation
- Storage quota management

## 4. Database Schema

### 4.1 Tables

#### users (managed by Clerk, synced to Supabase)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  user_type TEXT CHECK (user_type IN ('patient', 'professional')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_clerk_id ON profiles(clerk_id);
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
```

#### professional_verifications
```sql
CREATE TABLE professional_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  gdc_number TEXT CHECK (gdc_number ~ '^\d{7}$'),
  verification_status TEXT DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_prof_verif_user ON professional_verifications(user_id);
CREATE INDEX idx_prof_verif_status ON professional_verifications(verification_status);
```

#### chat_sessions
```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_expires ON chat_sessions(expires_at);
```

#### chat_messages
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  page_context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
```

#### article_views
```sql
CREATE TABLE article_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_slug TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_article_views_slug ON article_views(article_slug);
CREATE INDEX idx_article_views_time ON article_views(viewed_at);
```

#### practice_listings
```sql
CREATE TABLE practice_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  address JSONB NOT NULL,
  contact JSONB NOT NULL,
  services TEXT[],
  nhs_accepted BOOLEAN DEFAULT FALSE,
  private_accepted BOOLEAN DEFAULT TRUE,
  accessibility TEXT[],
  opening_hours JSONB,
  photos TEXT[],
  claimed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_practices_location ON practice_listings USING GIST(location);
CREATE INDEX idx_practices_services ON practice_listings USING GIN(services);
```

#### bookmarks
```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  article_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_slug)
);

CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
```

#### notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read);
```

## 5. Server Actions

### 5.1 Database Actions

#### User Profile Management
```typescript
// server/actions/users.ts
export async function syncUserProfile(clerkUser: ClerkUser) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      clerk_id: clerkUser.id,
      email: clerkUser.email,
      user_type: clerkUser.metadata.userType
    }, {
      onConflict: 'clerk_id'
    });
    
  if (error) throw new Error(`Profile sync failed: ${error.message}`);
  return data;
}

export async function updateProfessionalVerification(
  userId: string,
  gdcNumber: string
) {
  // Validate GDC format
  if (!/^\d{7}$/.test(gdcNumber)) {
    throw new Error('Invalid GDC number format');
  }
  
  return await supabase
    .from('professional_verifications')
    .insert({
      user_id: userId,
      gdc_number: gdcNumber,
      verification_status: 'pending'
    });
}
```

#### Chat Management
```typescript
// server/actions/chat.ts
export async function saveChatMessage(params: {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  pageContext?: PageContext;
}) {
  // Update session last_activity
  await supabase
    .from('chat_sessions')
    .update({ last_activity: new Date() })
    .eq('session_id', params.sessionId);
    
  // Insert message
  return await supabase
    .from('chat_messages')
    .insert({
      session_id: params.sessionId,
      role: params.role,
      content: params.content,
      page_context: params.pageContext
    });
}

export async function getChatHistory(sessionId: string, limit = 50) {
  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit);
    
  return data;
}

// Scheduled job for cleanup
export async function cleanupExpiredSessions() {
  return await supabase
    .from('chat_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString());
}
```

#### Article Analytics
```typescript
// server/actions/analytics.ts
export async function trackArticleView(
  articleSlug: string,
  userId?: string
) {
  await supabase
    .from('article_views')
    .insert({
      article_slug: articleSlug,
      user_id: userId,
      session_id: getSessionId()
    });
}

export async function getArticleViewCount(
  articleSlug: string,
  timeWindow: '1h' | '24h' | '7d'
) {
  const cutoff = getTimeWindowCutoff(timeWindow);
  
  const { count } = await supabase
    .from('article_views')
    .select('*', { count: 'exact', head: true })
    .eq('article_slug', articleSlug)
    .gte('viewed_at', cutoff);
    
  return count;
}

export async function getTrendingArticles(limit = 10) {
  // Complex query to get trending articles
  const { data } = await supabase.rpc('get_trending_articles', {
    time_window: '24h',
    result_limit: limit
  });
  
  return data;
}
```

#### Directory Operations
```typescript
// server/actions/directory.ts
interface SearchParams {
  postcode: string;
  radius: number;
  services?: string[];
  nhsOnly?: boolean;
  accessibility?: string[];
}

export async function searchPractices(params: SearchParams) {
  // Convert postcode to coordinates
  const coords = await geocodePostcode(params.postcode);
  
  // Build query
  let query = supabase
    .from('practice_listings')
    .select('*')
    .rpc('nearby_practices', {
      lat: coords.lat,
      lng: coords.lng,
      radius_miles: params.radius
    });
    
  // Apply filters
  if (params.services?.length) {
    query = query.contains('services', params.services);
  }
  
  if (params.nhsOnly) {
    query = query.eq('nhs_accepted', true);
  }
  
  const { data } = await query;
  return data;
}

export async function claimPracticeListing(
  practiceId: string,
  userId: string
) {
  // Verify user is a professional
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', userId)
    .single();
    
  if (profile?.user_type !== 'professional') {
    throw new Error('Only professionals can claim practices');
  }
  
  return await supabase
    .from('practice_listings')
    .update({ claimed_by: userId })
    .eq('id', practiceId)
    .is('claimed_by', null);
}
```

### 5.2 Other Actions

#### LiteLLM Integration
```typescript
// server/actions/ai.ts
interface ChatRequest {
  message: string;
  sessionId: string;
  pageContext?: {
    title: string;
    category: string;
    content: string;
  };
}

export async function sendAIMessage(request: ChatRequest) {
  // Get chat history
  const history = await getChatHistory(request.sessionId);
  
  // Build prompt with context
  const prompt = buildDentalPrompt({
    message: request.message,
    history,
    pageContext: request.pageContext
  });
  
  // Call LiteLLM proxy
  const response = await fetch(process.env.LITELLM_PROXY_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: prompt,
      temperature: 0.7,
      max_tokens: 1000
    })
  });
  
  if (!response.ok) {
    throw new Error('AI service unavailable');
  }
  
  const data = await response.json();
  
  // Save to database
  await saveChatMessage({
    sessionId: request.sessionId,
    role: 'assistant',
    content: data.choices[0].message.content,
    pageContext: request.pageContext
  });
  
  return data.choices[0].message.content;
}
```

#### Stripe Integration
```typescript
// server/actions/stripe.ts
export async function createCheckoutSession(params: {
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    customer_email: params.userEmail,
    line_items: [{
      price: params.priceId,
      quantity: 1
    }],
    mode: 'subscription',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      userId: params.userId
    }
  });
  
  return session;
}

// Webhook handler
export async function handleStripeWebhook(
  signature: string,
  payload: string
) {
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
  
  switch (event.type) {
    case 'checkout.session.completed':
      await updateUserSubscription(
        event.data.object.metadata.userId,
        event.data.object.subscription
      );
      break;
      
    case 'customer.subscription.deleted':
      await cancelUserSubscription(
        event.data.object.metadata.userId
      );
      break;
  }
}
```

#### PDF Generation
```typescript
// server/actions/pdf.ts
import PDFDocument from 'pdfkit';

export async function generateConsentForm(params: {
  procedureType: string;
  patientName?: string;
  customFields?: Record<string, string>;
}) {
  const doc = new PDFDocument();
  
  // Add header
  doc.fontSize(20)
     .text('Dental Consent Form', { align: 'center' });
     
  // Add procedure details
  doc.fontSize(12)
     .text(`Procedure: ${params.procedureType}`);
     
  // Add consent text from template
  const template = await getConsentTemplate(params.procedureType);
  doc.text(template.content);
  
  // Add signature fields
  doc.text('Patient Signature: _________________');
  doc.text('Date: _________________');
  
  // Convert to buffer
  const buffer = await streamToBuffer(doc);
  
  // Upload to Supabase storage
  const { data } = await supabase.storage
    .from('consent-forms')
    .upload(`${Date.now()}-consent.pdf`, buffer);
    
  return data.path;
}
```

## 6. Design System

### 6.1 Visual Style

#### Color Palette
```typescript
// styles/colors.ts
export const colors = {
  primary: {
    50: '#E6F3FF',
    100: '#CCE7FF',
    200: '#99CFFF',
    300: '#66B7FF',
    400: '#339FFF',
    500: '#005EB8', // NHS Blue
    600: '#004A93',
    700: '#00376E',
    800: '#002349',
    900: '#001024'
  },
  secondary: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E'
  },
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717'
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6'
};
```

#### Typography
```typescript
// styles/typography.ts
export const typography = {
  fonts: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, monospace'
  },
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem'     // 48px
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75
  }
};
```

#### Spacing System
```typescript
// styles/spacing.ts
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem'      // 96px
};
```

### 6.2 Core Components

#### Layout Structure
```typescript
// components/layout/PageLayout.tsx
interface PageLayoutProps {
  children: React.ReactNode;
  sidebar?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function PageLayout({ 
  children, 
  sidebar = false,
  maxWidth = 'lg' 
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <main className="flex">
        {sidebar && <Sidebar />}
        <div className={cn(
          "flex-1 px-4 py-8 mx-auto",
          maxWidthClasses[maxWidth]
        )}>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

#### Navigation Components
```typescript
// components/layout/Header.tsx
export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo />
          <nav className="hidden md:flex space-x-8">
            <NavLink href="/topics">Topics</NavLink>
            <NavLink href="/find-dentist">Find a Dentist</NavLink>
            <NavLink href="/professional">For Professionals</NavLink>
          </nav>
          <div className="flex items-center space-x-4">
            <SearchButton />
            <AIAssistantButton />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
```

#### Shared Components
```typescript
// components/ui/Card.tsx
interface CardProps {
  title?: string;
  description?: string;
  image?: string;
  href?: string;
  badge?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Card({ 
  title, 
  description, 
  image,
  href,
  badge,
  className,
  children 
}: CardProps) {
  const Component = href ? Link : 'div';
  
  return (
    <Component
      href={href}
      className={cn(
        "block bg-white rounded-lg shadow-sm hover:shadow-md",
        "transition-shadow duration-200",
        "overflow-hidden",
        className
      )}
    >
      {image && (
        <div className="aspect-video relative">
          <Image
            src={image}
            alt={title || ''}
            fill
            className="object-cover"
          />
          {badge && (
            <span className="absolute top-2 right-2 px-2 py-1 
                           bg-primary-500 text-white text-xs 
                           rounded-full">
              {badge}
            </span>
          )}
        </div>
      )}
      <div className="p-6">
        {title && (
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
        )}
        {description && (
          <p className="text-neutral-600">{description}</p>
        )}
        {children}
      </div>
    </Component>
  );
}

// components/ui/Button.tsx
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ 
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center",
        "font-medium rounded-md transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        variantClasses[variant],
        sizeClasses[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
}
```

#### Interactive States
```css
/* styles/interactions.css */
/* Hover States */
.hover-lift {
  @apply transition-transform duration-200 hover:-translate-y-1;
}

.hover-glow {
  @apply transition-shadow duration-200 hover:shadow-lg;
}

/* Focus States */
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
}

/* Active States */
.active-scale {
  @apply active:scale-95 transition-transform duration-100;
}

/* Disabled States */
.disabled {
  @apply opacity-50 cursor-not-allowed pointer-events-none;
}
```

## 7. Component Architecture

### 7.1 Server Components

#### Article Page Component
```typescript
// app/(content)/[category]/[slug]/page.tsx
interface ArticlePageProps {
  params: {
    category: string;
    slug: string;
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  // Fetch article from Payload CMS
  const article = await getArticleBySlug(params.slug);
  
  if (!article) {
    notFound();
  }
  
  // Get related articles
  const related = await getRelatedArticles(article.id);
  
  return (
    <>
      <ArticleHeader article={article} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ArticleContent article={article} />
          <ArticleReferences references={article.references} />
        </div>
        <aside className="space-y-6">
          <TableOfContents content={article.content} />
          <RelatedArticles articles={related} />
          <ArticleActions articleId={article.id} />
        </aside>
      </div>
    </>
  );
}
```

#### Dashboard Layout
```typescript
// app/dashboard/layout.tsx
interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ 
  children 
}: DashboardLayoutProps) {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  const profile = await getUserProfile(user.id);
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader user={user} />
      <div className="flex">
        <DashboardSidebar 
          userType={profile.userType}
          isVerified={profile.isVerified} 
        />
        <main className="flex-1 p-8">
          <Suspense fallback={<DashboardSkeleton />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
```

### 7.2 Client Components

#### AI Chat Interface
```typescript
// components/chat/ChatInterface.tsx
'use client';

interface ChatInterfaceProps {
  sessionId: string;
  pageContext?: PageContext;
}

export function ChatInterface({ 
  sessionId, 
  pageContext 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Load chat history
  useEffect(() => {
    loadChatHistory(sessionId).then(setMessages);
  }, [sessionId]);
  
  // Send message
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await sendAIMessage({
        message: input,
        sessionId,
        pageContext
      });
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }]);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <ChatHeader onExport={() => exportChatPDF(messages)} />
      <ChatMessages 
        messages={messages}
        isLoading={isLoading}
      />
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={sendMessage}
        disabled={isLoading}
        suggestions={getSuggestions(pageContext)}
      />
    </div>
  );
}
```

#### Search with Filters
```typescript
// components/search/SearchInterface.tsx
'use client';

interface SearchInterfaceProps {
  initialResults?: SearchResult[];
  categories: Category[];
}

export function SearchInterface({ 
  initialResults = [],
  categories 
}: SearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    readingLevel: 'all',
    contentType: 'all'
  });
  const [results, setResults] = useState(initialResults);
  
  const debouncedSearch = useDebouncedCallback(
    async (searchQuery: string, searchFilters: SearchFilters) => {
      const data = await searchContent({
        query: searchQuery,
        ...searchFilters
      });
      setResults(data);
    },
    300
  );
  
  useEffect(() => {
    if (query.length > 2) {
      debouncedSearch(query, filters);
    }
  }, [query, filters, debouncedSearch]);
  
  return (
    <div className="space-y-6">
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search dental topics..."
      />
      
      <div className="flex gap-6">
        <SearchFilters
          filters={filters}
          onChange={setFilters}
          categories={categories}
        />
        
        <div className="flex-1">
          <SearchResults
            results={results}
            query={query}
            isSearching={isSearching}
          />
        </div>
      </div>
    </div>
  );
}
```

#### Realtime Presence Indicator
```typescript
// components/realtime/PresenceIndicator.tsx
'use client';

interface PresenceIndicatorProps {
  articleId: string;
  className?: string;
}

export function PresenceIndicator({ 
  articleId,
  className 
}: PresenceIndicatorProps) {
  const [viewerCount, setViewerCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const channel = supabase.channel(`article:${articleId}`);
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setViewerCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          await channel.track({ 
            user_id: getUserId(),
            online_at: new Date().toISOString() 
          });
        }
      });
      
    return () => {
      channel.unsubscribe();
    };
  }, [articleId]);
  
  if (!isConnected || viewerCount < 2) return null;
  
  return (
    <div className={cn(
      "flex items-center gap-2 text-sm text-neutral-600",
      className
    )}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full 
                       w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 
                       bg-green-500" />
      </span>
      {viewerCount} people reading now
    </div>
  );
}
```

## 8. Authentication & Authorization

### Clerk Configuration
```typescript
// lib/auth/clerk-config.ts
export const clerkConfig = {
  publicRoutes: [
    '/',
    '/topics',
    '/topics/(.*)',
    '/find-dentist',
    '/api/webhooks/(.*)'
  ],
  
  afterSignInUrl: '/dashboard',
  afterSignUpUrl: '/onboarding',
  
  appearance: {
    elements: {
      formButtonPrimary: 'bg-primary-500 hover:bg-primary-600',
      card: 'shadow-lg',
      headerTitle: 'text-2xl font-bold',
      socialButtonsBlockButton: 'border-neutral-300'
    }
  }
};
```

### Protected Routes
```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  publicRoutes: clerkConfig.publicRoutes,
  
  beforeAuth: (req) => {
    // Add custom headers
  },
  
  afterAuth: (auth, req) => {
    // Handle post-auth logic
    if (!auth.userId && !auth.isPublicRoute) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }
    
    // Check professional routes
    if (req.nextUrl.pathname.startsWith('/professional')) {
      const userType = auth.sessionClaims?.metadata?.userType;
      if (userType !== 'professional') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)']
};
```

### Session Management
```typescript
// lib/auth/session.ts
import { currentUser } from '@clerk/nextjs';

export async function getSession() {
  const user = await currentUser();
  
  if (!user) return null;
  
  return {
    userId: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    userType: user.publicMetadata.userType as UserType,
    isVerified: user.publicMetadata.isVerified as boolean,
    subscriptionTier: user.publicMetadata.subscriptionTier as SubscriptionTier
  };
}

export async function requireAuth() {
  const session = await getSession();
  
  if (!session) {
    redirect('/sign-in');
  }
  
  return session;
}

export async function requireProfessional() {
  const session = await requireAuth();
  
  if (session.userType !== 'professional') {
    redirect('/dashboard');
  }
  
  return session;
}
```

## 9. Data Flow

### Server to Client Data Passing
```typescript
// app/topics/[category]/page.tsx
// Server Component
export default async function CategoryPage({ 
  params 
}: { 
  params: { category: string } 
}) {
  const articles = await getArticlesByCategory(params.category);
  const user = await currentUser();
  
  return (
    <div>
      <CategoryHeader category={params.category} />
      <ArticleGrid 
        articles={articles}
        userId={user?.id}
      />
    </div>
  );
}

// components/ArticleGrid.tsx
// Client Component with server data
'use client';

interface ArticleGridProps {
  articles: Article[];
  userId?: string;
}

export function ArticleGrid({ articles, userId }: ArticleGridProps) {
  const [bookmarked, setBookmarked] = useState<string[]>([]);
  
  useEffect(() => {
    if (userId) {
      loadUserBookmarks(userId).then(setBookmarked);
    }
  }, [userId]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map(article => (
        <ArticleCard
          key={article.id}
          article={article}
          isBookmarked={bookmarked.includes(article.id)}
          onBookmark={() => toggleBookmark(article.id, userId)}
        />
      ))}
    </div>
  );
}
```

### State Management Architecture
```typescript
// lib/store/chat-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChatStore {
  isOpen: boolean;
  sessionId: string | null;
  messages: ChatMessage[];
  
  openChat: () => void;
  closeChat: () => void;
  setSessionId: (id: string) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      isOpen: false,
      sessionId: null,
      messages: [],
      
      openChat: () => set({ isOpen: true }),
      closeChat: () => set({ isOpen: false }),
      setSessionId: (id) => set({ sessionId: id }),
      addMessage: (message) => set((state) => ({ 
        messages: [...state.messages, message] 
      })),
      clearMessages: () => set({ messages: [] })
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ 
        sessionId: state.sessionId,
        messages: state.messages 
      })
    }
  )
);
```

### React Query Configuration
```typescript
// lib/query/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// hooks/useArticle.ts
export function useArticle(slug: string) {
  return useQuery({
    queryKey: ['article', slug],
    queryFn: () => getArticleBySlug(slug),
    enabled: !!slug
  });
}

// hooks/useBookmarks.ts
export function useBookmarks() {
  const { userId } = useAuth();
  
  return useQuery({
    queryKey: ['bookmarks', userId],
    queryFn: () => getUserBookmarks(userId!),
    enabled: !!userId
  });
}
```

## 10. Stripe Integration

### Payment Flow Diagram
```
User clicks "Upgrade" → Create Checkout Session → Redirect to Stripe
                                                           ↓
Dashboard ← Update Clerk Metadata ← Webhook Handler ← Payment Success
```

### Product Configuration
```typescript
// config/stripe-products.ts
export const stripeProducts = {
  basic: {
    name: 'Basic',
    priceId: process.env.STRIPE_BASIC_PRICE_ID!,
    features: [
      'Access to all dental content',
      'Basic search functionality',
      'Save up to 10 bookmarks'
    ]
  },
  pro: {
    name: 'Professional',
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    features: [
      'Everything in Basic',
      'Consent form templates',
      'Patient handouts',
      'Priority support',
      'Unlimited bookmarks'
    ]
  },
  practice: {
    name: 'Practice',
    priceId: process.env.STRIPE_PRACTICE_PRICE_ID!,
    features: [
      'Everything in Pro',
      'Multiple team members',
      'Practice listing management',
      'Analytics dashboard',
      'Custom branding'
    ]
  }
};
```

### Webhook Configuration
```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;
  
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Update user metadata in Clerk
        await clerkClient.users.updateUserMetadata(
          session.metadata.userId,
          {
            publicMetadata: {
              subscriptionTier: session.metadata.tier,
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription
            }
          }
        );
        break;
        
      case 'customer.subscription.updated':
        // Handle subscription changes
        break;
        
      case 'customer.subscription.deleted':
        // Handle cancellations
        const subscription = event.data.object;
        
        await clerkClient.users.updateUserMetadata(
          subscription.metadata.userId,
          {
            publicMetadata: {
              subscriptionTier: 'basic',
              stripeSubscriptionId: null
            }
          }
        );
        break;
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 400 }
    );
  }
}
```

## 11. PostHog Analytics

### Analytics Strategy
```typescript
// lib/analytics/posthog.ts
import posthog from 'posthog-js';

export function initPostHog() {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          posthog.debug();
        }
      }
    });
  }
}

// Event tracking
export const analytics = {
  track: (event: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      posthog.capture(event, properties);
    }
  },
  
  identify: (userId: string, traits?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      posthog.identify(userId, traits);
    }
  },
  
  page: (name?: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
        $pathname: window.location.pathname,
        name,
        ...properties
      });
    }
  }
};
```

### Event Implementation
```typescript
// hooks/useAnalytics.ts
export function useAnalytics() {
  const { userId } = useAuth();
  
  const trackEvent = useCallback((
    event: AnalyticsEvent,
    properties?: Record<string, any>
  ) => {
    analytics.track(event, {
      userId,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [userId]);
  
  const trackSearch = (query: string, results: number) => {
    trackEvent('search_performed', {
      query,
      results_count: results,
      has_results: results > 0
    });
  };
  
  const trackArticleView = (article: Article) => {
    trackEvent('article_viewed', {
      article_id: article.id,
      article_slug: article.slug,
      category: article.category,
      reading_level: article.readingLevel
    });
  };
  
  const trackChatInteraction = (
    action: 'opened' | 'message_sent' | 'exported'
  ) => {
    trackEvent('chat_interaction', {
      action,
      session_id: getChatSessionId()
    });
  };
  
  return {
    trackEvent,
    trackSearch,
    trackArticleView,
    trackChatInteraction
  };
}
```

### Custom Properties
```typescript
// types/analytics.ts
export interface UserProperties {
  user_type: 'patient' | 'professional';
  is_verified: boolean;
  subscription_tier: 'basic' | 'pro' | 'practice';
  signup_date: string;
  last_active: string;
}

export interface EventProperties {
  // Search events
  search_query?: string;
  search_results_count?: number;
  search_filters?: string[];
  
  // Article events
  article_id?: string;
  article_category?: string;
  reading_time?: number;
  scroll_depth?: number;
  
  // Chat events
  chat_session_id?: string;
  message_count?: number;
  ai_response_time?: number;
  
  // Directory events
  practice_id?: string;
  search_radius?: number;
  filters_applied?: string[];
}
```

## 12. Testing

### Unit Tests with Jest

#### Component Tests
```typescript
// __tests__/components/ArticleCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ArticleCard } from '@/components/content/ArticleCard';

describe('ArticleCard', () => {
  const mockArticle = {
    id: '1',
    title: 'Understanding Tooth Decay',
    description: 'Learn about causes and prevention',
    slug: 'tooth-decay',
    category: 'dental-problems',
    image: '/images/tooth-decay.jpg'
  };
  
  it('renders article information correctly', () => {
    render(<ArticleCard article={mockArticle} />);
    
    expect(screen.getByText(mockArticle.title)).toBeInTheDocument();
    expect(screen.getByText(mockArticle.description)).toBeInTheDocument();
  });
  
  it('handles bookmark click when authenticated', async () => {
    const onBookmark = jest.fn();
    render(
      <ArticleCard 
        article={mockArticle}
        isBookmarked={false}
        onBookmark={onBookmark}
      />
    );
    
    const bookmarkButton = screen.getByLabelText('Bookmark article');
    fireEvent.click(bookmarkButton);
    
    expect(onBookmark).toHaveBeenCalledWith(mockArticle.id);
  });
  
  it('shows login prompt when unauthenticated', () => {
    render(
      <ArticleCard 
        article={mockArticle}
        isBookmarked={false}
      />
    );
    
    const bookmarkButton = screen.getByLabelText('Bookmark article');
    fireEvent.click(bookmarkButton);
    
    expect(screen.getByText(/sign in to bookmark/i)).toBeInTheDocument();
  });
});
```

#### Server Action Tests
```typescript
// __tests__/server/actions/chat.test.ts
import { createChatSession, saveChatMessage } from '@/server/actions/chat';
import { createMockSupabaseClient } from '@/tests/mocks/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: createMockSupabaseClient()
}));

describe('Chat Actions', () => {
  describe('createChatSession', () => {
    it('creates a new chat session with expiry', async () => {
      const userId = 'user123';
      const session = await createChatSession(userId);
      
      expect(session).toMatchObject({
        user_id: userId,
        session_id: expect.any(String),
        expires_at: expect.any(Date)
      });
      
      // Check expiry is 180 days
      const daysDiff = differenceInDays(
        session.expires_at,
        new Date()
      );
      expect(daysDiff).toBe(180);
    });
  });
  
  describe('saveChatMessage', () => {
    it('saves message and updates session activity', async () => {
      const params = {
        sessionId: 'session123',
        role: 'user' as const,
        content: 'What causes tooth decay?',
        pageContext: {
          title: 'Dental Problems',
          category: 'problems'
        }
      };
      
      const message = await saveChatMessage(params);
      
      expect(message).toMatchObject({
        session_id: params.sessionId,
        role: params.role,
        content: params.content,
        page_context: params.pageContext
      });
    });
  });
});
```

### E2E Tests with Playwright

#### Critical User Flows
```typescript
// tests/e2e/user-registration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('patient registration', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Fill registration form
    await page.fill('[name="email"]', 'patient@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    // Select user type
    await page.waitForURL('/onboarding');
    await page.click('[data-user-type="patient"]');
    await page.click('button:has-text("Continue")');
    
    // Verify redirect to dashboard
    await page.waitForURL('/dashboard');
    expect(await page.textContent('h1')).toContain('Welcome');
  });
  
  test('professional registration with GDC', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Complete registration
    await page.fill('[name="email"]', 'dentist@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    // Select professional
    await page.waitForURL('/onboarding');
    await page.click('[data-user-type="professional"]');
    
    // Enter GDC number
    await page.fill('[name="gdcNumber"]', '1234567');
    await page.click('button:has-text("Verify")');
    
    // Check verification pending
    await expect(page.locator('.verification-status'))
      .toContainText('Verification pending');
  });
});

// tests/e2e/article-search.spec.ts
test.describe('Article Search', () => {
  test('search and filter articles', async ({ page }) => {
    await page.goto('/topics');
    
    // Perform search
    await page.fill('[placeholder="Search dental topics..."]', 'cavity');
    await page.waitForTimeout(500); // Debounce
    
    // Check results
    const results = page.locator('[data-testid="search-result"]');
    await expect(results).toHaveCount(greaterThan(0));
    
    // Apply filter
    await page.click('button:has-text("Filters")');
    await page.check('input[value="dental-problems"]');
    await page.click('button:has-text("Apply")');
    
    // Verify filtered results
    await expect(results.first())
      .toContainText('Dental Problems');
  });
});

// tests/e2e/ai-chat.spec.ts
test.describe('AI Chat Assistant', () => {
  test('chat interaction with context', async ({ page }) => {
    // Navigate to article
    await page.goto('/dental-problems/tooth-decay');
    
    // Open chat
    await page.click('[aria-label="Open AI assistant"]');
    await expect(page.locator('.chat-panel')).toBeVisible();
    
    // Send message
    await page.fill('[placeholder="Ask about dental health..."]', 
      'How can I prevent cavities?');
    await page.keyboard.press('Enter');
    
    // Wait for response
    await expect(page.locator('.chat-message.assistant'))
      .toBeVisible({ timeout: 10000 });
    
    // Verify context awareness
    const response = await page.textContent('.chat-message.assistant');
    expect(response).toContain('prevent');
    
    // Export chat
    await page.click('button:has-text("Export")');
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('chat-export');
  });
});
```

This comprehensive technical specification provides detailed implementation guidance for the Dentistry Explained MVP. The specification covers all major aspects including architecture, database design, component structure, authentication, real-time features, payment integration, and testing strategies. Each section includes concrete examples and implementation details that can be directly used by AI code generation systems.