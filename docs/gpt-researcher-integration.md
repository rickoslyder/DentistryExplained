# GPT-Researcher Integration Guide

This document describes the integration of GPT-Researcher into the Dentistry Explained platform for advanced content generation and research capabilities.

## Overview

GPT-Researcher has been integrated to provide:
1. **AI-powered article draft generation** in the admin panel
2. **Deep research capabilities** for professional users
3. **Enhanced web search** with comprehensive report generation

## Architecture

The integration consists of:
- **Python Research Service**: A FastAPI microservice running GPT-Researcher
- **Next.js API Routes**: Endpoints for admin and professional research
- **UI Components**: Research tools in admin and professional dashboards
- **Database Schema**: Tables for tracking research usage and caching

## Setup Instructions

### 1. Python Research Service

#### Local Development

```bash
cd python-research-service
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
python main.py
```

#### Docker Deployment

```bash
cd python-research-service
docker build -t gpt-researcher-service .
docker run -p 8000:8000 --env-file .env gpt-researcher-service
```

### 2. Environment Variables

Add to your Next.js `.env.local`:

```env
# GPT-Researcher Service
RESEARCH_SERVICE_URL=http://localhost:8000
RESEARCH_SERVICE_AUTH_TOKEN=your-secure-token

# Required API Keys (in Python service .env)
OPENAI_API_KEY=your-openai-key
TAVILY_API_KEY=your-tavily-key
```

### 3. Database Migration

Run the migration to create research tracking tables:

```bash
supabase migration up
```

## Features

### 1. Article Draft Generation (Admin)

In the article editor, admins can:
- Click the "Research" button next to the title field
- Generate AI-powered drafts based on the article title
- Drafts include citations and are marked as AI-generated

### 2. Professional Research Tool

Verified professionals can access `/professional/research` to:
- Generate comprehensive research reports
- Choose report types (summary, detailed, outline)
- Download reports as Markdown files
- Access up to 20 sources per research

### 3. Enhanced Web Search

The chat assistant can now trigger deep research:
- Users can request "deep research" or "comprehensive report"
- GPT-Researcher is used for academic/medical queries
- Results are cached for efficiency

## LLM Provider Configuration

The service supports multiple LLM providers:

### OpenAI (Default)
```env
LLM_PROVIDER=openai
FAST_LLM_MODEL=gpt-4o-mini
SMART_LLM_MODEL=gpt-4o
EMBEDDING_MODEL=text-embedding-3-small
```

### Azure OpenAI
```env
LLM_PROVIDER=azure
OPENAI_API_VERSION=2024-05-01-preview
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-key
```

### HuggingFace
```env
LLM_PROVIDER=huggingface
HUGGINGFACE_API_KEY=your-key
FAST_LLM_MODEL=HuggingFaceH4/zephyr-7b-beta
SMART_LLM_MODEL=HuggingFaceH4/zephyr-7b-beta
```

## API Endpoints

### Admin Research
```
POST /api/admin/research
Authorization: Bearer <clerk-token>
Body: {
  topic: string,
  reportType: "research_report" | "outline_report" | "detailed_report",
  sourcesCount: number (5-20),
  focusMedical: boolean,
  includeCitations: boolean
}
```

### Professional Research
```
POST /api/professional/research
Authorization: Bearer <clerk-token>
Body: Same as admin endpoint
```

## Security Considerations

1. **Authentication**: All endpoints require Clerk authentication
2. **Authorization**: 
   - Admin endpoint requires admin role
   - Professional endpoint requires verified professional status
3. **Rate Limiting**: Consider implementing rate limits to prevent abuse
4. **API Key Security**: Store all API keys securely in environment variables

## Monitoring & Analytics

Research usage is tracked in the following tables:
- `professional_research_logs`: Tracks professional research usage
- `research_jobs`: For async job processing (future enhancement)
- `research_cache`: Caches research results
- `web_searches`: Enhanced to track GPT-Researcher usage

## Future Enhancements

1. **Async Processing**: Implement job queue for long-running research
2. **Webhook Notifications**: Notify users when research completes
3. **Custom Sources**: Allow users to specify preferred research sources
4. **Export Formats**: Support PDF, DOCX export formats
5. **Research Templates**: Pre-configured research prompts for common topics

## Troubleshooting

### Service Not Available
- Check Python service is running on correct port
- Verify RESEARCH_SERVICE_URL in Next.js env
- Check firewall/network settings

### Authentication Errors
- Verify RESEARCH_SERVICE_AUTH_TOKEN matches in both services
- Check Clerk authentication is working

### No Results
- Verify API keys (OpenAI, Tavily) are valid
- Check rate limits haven't been exceeded
- Review Python service logs for errors

## Cost Considerations

GPT-Researcher makes multiple API calls per research:
- OpenAI API calls for analysis
- Tavily API calls for web search
- Consider implementing usage limits per user
- Monitor API usage in provider dashboards