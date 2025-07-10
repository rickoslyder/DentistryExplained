# GPT-Researcher Service for Dentistry Explained

This is a Python microservice that provides GPT-Researcher functionality for the Dentistry Explained platform.

## Features

- AI-powered research report generation
- Medical source prioritization for dental content
- LiteLLM proxy integration for centralized model management
- Support for any model available through your LiteLLM proxy
- FastAPI-based REST API
- Docker support for easy deployment

## Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. Run the service:
```bash
python main.py
```

The service will be available at http://localhost:8000

## Deployment on Render

### Option 1: Deploy via Render Dashboard

1. Push this code to a GitHub repository
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" and select "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - **Name**: gpt-researcher-dentistry
   - **Runtime**: Docker
   - **Root Directory**: python-research-service (if in a subdirectory)
   - **Plan**: Starter ($7/month) or Free (with limitations)
6. Add environment variables:
   - `OPENAI_API_KEY`
   - `TAVILY_API_KEY`
   - `RESEARCH_SERVICE_AUTH_TOKEN` (generate a secure token)
   - `LLM_PROVIDER` (default: openai)
   - `FRONTEND_URL` (your Vercel URL)
7. Click "Create Web Service"

### Option 2: Deploy via render.yaml

1. The `render.yaml` file is already configured
2. Push to GitHub
3. In Render Dashboard, create new Blueprint
4. Connect your repository
5. Render will automatically detect render.yaml
6. Add the sensitive environment variables in the dashboard

## Configuration

### Environment Variables

- **Required**:
  - `LITELLM_API_KEY`: Your LiteLLM API key
  - `TAVILY_API_KEY`: Your Tavily API key for web search
  - `RESEARCH_SERVICE_AUTH_TOKEN`: Secure token for API authentication

- **Optional**:
  - `LITELLM_PROXY_URL`: LiteLLM proxy URL (default: https://openai-proxy-0l7e.onrender.com)
  - `FAST_LLM_MODEL`: Model for quick tasks (default: o4-mini)
  - `SMART_LLM_MODEL`: Model for complex tasks (default: o4)
  - `EMBEDDING_MODEL`: Model for embeddings (default: text-embedding-3-small)
  - `FRONTEND_URL`: Allowed CORS origin

### LiteLLM Integration

This service uses LiteLLM proxy for all AI operations, which provides:
- Centralized API key management
- Support for 100+ LLM providers
- Usage tracking and cost monitoring
- Model switching without code changes
- Rate limiting and load balancing

The service automatically routes all OpenAI API calls through your LiteLLM proxy, so you can:
- Use any model available in your LiteLLM configuration
- Track usage across all your services
- Switch models without redeploying
- Manage costs centrally

## API Endpoints

### Health Check
```
GET /health
```

### Research Endpoint
```
POST /research
Authorization: Bearer {RESEARCH_SERVICE_AUTH_TOKEN}
Content-Type: application/json

{
  "topic": "dental implant procedures",
  "report_type": "research_report",
  "sources_count": 10,
  "focus_medical": true,
  "include_citations": true
}
```

### Professional Research
```
POST /research/professional
Authorization: Bearer {RESEARCH_SERVICE_AUTH_TOKEN}
Content-Type: application/json

{
  "topic": "periodontal disease treatment efficacy",
  "report_type": "detailed_report",
  "sources_count": 15
}
```

## Integration with Next.js

Update your Next.js environment variables:

```env
RESEARCH_SERVICE_URL=https://your-service.onrender.com
RESEARCH_SERVICE_AUTH_TOKEN=your-secure-token
```

The Next.js app will automatically use these to connect to the research service.

## Monitoring

- Check service health: `https://your-service.onrender.com/health`
- View logs in Render Dashboard
- Monitor API usage in OpenAI/Tavily dashboards

## Security

- All endpoints require Bearer token authentication
- CORS is configured for your frontend URL
- Environment variables are stored securely in Render
- Service runs in isolated Docker container

## Troubleshooting

### Service not responding
1. Check Render dashboard for deploy status
2. View logs for error messages
3. Verify environment variables are set
4. Test health endpoint

### Authentication errors
1. Verify RESEARCH_SERVICE_AUTH_TOKEN matches in both services
2. Check Authorization header format: `Bearer {token}`

### No results returned
1. Check LiteLLM API key validity
2. Verify your LiteLLM proxy is running and accessible
3. Check Tavily API key for web search
4. Verify model availability in your LiteLLM configuration
5. Check service logs for specific errors

## Support

For issues, check:
1. Render service logs
2. OpenAI API usage dashboard
3. Tavily API dashboard
4. Main repository issues