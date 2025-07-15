# Dentistry Explained

A comprehensive dental education platform designed to be the UK's premier online dental resource. It provides evidence-based dental information to patients, professionals, and the general public through an intuitive, accessible interface with AI-powered assistance.

**Live at**: https://dentistry-explained.vercel.app/

## Features

### For Patients
- 🦷 Comprehensive dental topics (The Mouth, Prevention, Problems, Treatments)
- 🤖 AI-powered dental assistant with conversation memory
- 🔍 Advanced search with web search integration
- 📚 97+ dental terms glossary with interactive quiz
- 🚨 Emergency dental guide with decision trees
- 📍 Find a Dentist directory (currently using mock data)
- 📖 Reading level toggles (Basic/Advanced)

### For Professionals
- ✅ GDC number verification (mock implementation)
- 📄 Consent form templates and patient education materials
- 📊 Practice listing management
- 🔒 Professional-only content access
- 📥 Downloadable resources

### Technical Features
- 🚀 Next.js 15.3.5 with App Router
- 🔐 Clerk authentication with role-based access
- 🗄️ Supabase PostgreSQL with Row Level Security
- 🤖 LiteLLM proxy integration for AI responses
- 🔍 Perplexity & Exa API integration for web search
- 📱 Progressive Web App with offline support
- 🎨 Tailwind CSS + Shadcn/ui components

## Tech Stack

- **Frontend**: Next.js 15.3.5, React 19.1.0, TypeScript
- **UI**: Tailwind CSS, Shadcn/ui, Radix UI
- **Authentication**: Clerk (latest)
- **Database**: Supabase (PostgreSQL)
- **AI**: LiteLLM proxy (https://openai-proxy-0l7e.onrender.com)
- **Search**: Perplexity API, Exa API, PostgreSQL full-text search
- **Editor**: Tiptap with MDX support
- **Analytics**: PostHog (installed, not configured)
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Clerk account
- LiteLLM API key

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd dentistry-explained
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Copy the environment variables:
```bash
cp .env.example .env.local
```

4. Configure environment variables in `.env.local`:
```
# Required
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
NEXT_PUBLIC_LITELLM_URL=https://openai-proxy-0l7e.onrender.com
LITELLM_API_KEY=

# Recommended
PERPLEXITY_API_KEY=
EXA_API_KEY=
```

5. Run database migrations:
```bash
npx supabase db push
```

6. Start the development server:
```bash
npm run dev
```

Visit http://localhost:3000 to see the application.

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Project Structure

```
dentistry-explained/
├── app/                  # Next.js app directory
│   ├── (auth)/          # Authentication pages
│   ├── (platform)/      # Main platform pages
│   ├── admin/           # Admin dashboard
│   ├── api/             # API routes
│   └── professional/    # Professional features
├── components/          # React components
├── lib/                 # Utility functions
├── supabase/           # Database migrations
├── public/             # Static assets
└── docs/               # Documentation
```

## Current Status (January 2025)

### ✅ Implemented
- Core platform infrastructure
- Authentication and user management
- AI chat with web search
- Glossary system with quiz
- Emergency page with offline support
- Admin dashboard
- Basic content management

### ⚠️ Partially Implemented
- Professional verification (mock GDC API)
- Find a Dentist (3 hardcoded practices)
- Email notifications (Resend configured but unused)

### ❌ Not Implemented
- Real medical content (4 placeholder articles)
- Payment system (Stripe)
- Real API integrations (GDC, NHS)
- Testing suite
- PostHog analytics configuration

## Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Enhancement Plan](./ENHANCEMENT_PLAN.md)
- [Claude AI Instructions](./CLAUDE.md)
- [Supabase Setup](./supabase/README.md)
- [API Documentation](./docs/)

## Contributing

This is a private project. For contribution guidelines, please contact the project maintainer.

## Known Issues

- `web_search_cache` table missing from migrations
- React 19 used but type definitions are for React 18
- Several packages using "latest" version
- No test suite configured

## License

Private project - All rights reserved

## Contact

For questions or support, please contact the development team.