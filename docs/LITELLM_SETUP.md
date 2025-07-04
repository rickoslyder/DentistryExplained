# LiteLLM Setup Guide

This guide explains how to set up LiteLLM for the AI chat assistant functionality in Dentistry Explained.

## What is LiteLLM?

LiteLLM is a proxy server that provides a unified interface to multiple LLM providers (OpenAI, Anthropic, Google, etc.). It handles:
- API key management
- Request routing
- Rate limiting
- Cost tracking
- Fallback models

## Setup Options

### Option 1: Self-Hosted LiteLLM Proxy (Recommended)

1. **Install LiteLLM**:
```bash
pip install litellm[proxy]
```

2. **Create a config file** (`litellm_config.yaml`):
```yaml
model_list:
  # OpenAI Models (July 2025 - Latest)
  - model_name: o4-mini
    litellm_params:
      model: o4-mini
      api_key: ${OPENAI_API_KEY}
      
  - model_name: o3
    litellm_params:
      model: o3
      api_key: ${OPENAI_API_KEY}
      
  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: ${OPENAI_API_KEY}
      
  # Anthropic Models (July 2025 - Latest)
  - model_name: claude-opus-4
    litellm_params:
      model: claude-opus-4
      api_key: ${ANTHROPIC_API_KEY}
      
  - model_name: claude-sonnet-4
    litellm_params:
      model: claude-sonnet-4
      api_key: ${ANTHROPIC_API_KEY}
      
  # Google Models (July 2025 - Latest)
  - model_name: gemini-2.5-pro
    litellm_params:
      model: models/gemini-2.5-pro
      api_key: ${GOOGLE_API_KEY}
      
  # Legacy models (for compatibility)
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: ${OPENAI_API_KEY}
      
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
      api_key: ${OPENAI_API_KEY}

general_settings:
  master_key: ${LITELLM_MASTER_KEY}
  database_url: ${DATABASE_URL}  # Optional: for usage tracking
  budget_duration: 30d  # Monthly budget
  max_budget: 100  # $100 monthly limit
```

3. **Start the proxy**:
```bash
litellm --config litellm_config.yaml --port 8000
```

4. **Update your `.env.local`**:
```env
LITELLM_PROXY_URL=http://localhost:8000
LITELLM_API_KEY=your_master_key
LITELLM_MODEL=o4-mini  # Recommended: best cost-performance ratio
```

### Option 2: Cloud-Hosted LiteLLM

Deploy LiteLLM on a cloud service:

**Render.com** (Free tier available):
1. Fork the [LiteLLM repository](https://github.com/BerriAI/litellm)
2. Create a new Web Service on Render
3. Connect your forked repository
4. Set environment variables
5. Deploy

**Railway.app**:
```bash
railway login
railway new
railway link
railway up
```

**Docker**:
```dockerfile
FROM ghcr.io/berriai/litellm:main-latest
COPY litellm_config.yaml /app/config.yaml
CMD ["--config", "/app/config.yaml", "--port", "8000"]
```

### Option 3: Direct OpenAI API (Quick Start)

For quick testing, you can modify the code to use OpenAI directly:

1. Update `.env.local`:
```env
OPENAI_API_KEY=sk-...
```

2. Temporarily modify `lib/litellm.ts`:
```typescript
// Replace the LiteLLM call with direct OpenAI
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.7,
    max_tokens: 1000,
    stream,
  }),
})
```

## Configuration

### Environment Variables

Required variables in `.env.local`:
```env
LITELLM_PROXY_URL=https://your-proxy-url.com
LITELLM_API_KEY=your_api_key
LITELLM_MODEL=gpt-4  # Optional: defaults to gpt-4
```

### Available Models (July 2025)

The system supports these latest models:

**Recommended:**
- `o4-mini` (OpenAI) - Best cost-performance ratio, $0.60/1M input tokens
- `gemini-2.5-pro` (Google) - 1M token context for large conversations
- `claude-opus-4` (Anthropic) - Best for complex understanding

**Other Available Models:**
- `o3` (OpenAI) - Advanced reasoning
- `gpt-4o` (OpenAI) - Multimodal capabilities
- `claude-sonnet-4` (Anthropic) - Balanced performance
- `gemini-2.5-flash` (Google) - Fast responses
- `llama-4` (Meta) - Open source, 10M context
- `mixtral-8x7b` (Groq) - Ultra-fast inference

**Legacy Models (still supported):**
- `gpt-4`, `gpt-3.5-turbo` (OpenAI)
- `claude-3-opus`, `claude-3-sonnet` (Anthropic)

Models are configured in `lib/config/litellm.ts`.

## Testing

1. **Check LiteLLM connection**:
```bash
curl -X POST http://localhost:8000/chat/completions \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

2. **Test in the app**:
- Sign in to the application
- Open the chat widget
- Type "Hello" and check for a response

## Troubleshooting

### No response from chat
1. Check if LiteLLM proxy is running
2. Verify environment variables are set
3. Check browser console for errors
4. Look at Next.js server logs

### Authentication errors
- Ensure `LITELLM_API_KEY` matches the master key in your LiteLLM config
- Check API keys for your LLM providers are valid

### Slow responses
- Consider using streaming (enabled by default)
- Try a faster model like `gpt-3.5-turbo`
- Check your LiteLLM proxy server resources

## Cost Management

LiteLLM provides built-in cost tracking:

1. **Set spending limits**:
```yaml
general_settings:
  max_budget: 100  # $100 monthly limit
  budget_duration: 30d
```

2. **Track usage**:
```bash
curl http://localhost:8000/spend
```

3. **Set model-specific limits**:
```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: ${OPENAI_API_KEY}
      max_budget: 50  # $50 for this model
```

## Security Best Practices

1. **Never commit API keys** - Use environment variables
2. **Use master key** - Don't expose individual API keys
3. **Enable rate limiting** in LiteLLM config
4. **Monitor usage** regularly
5. **Set up alerts** for unusual activity

## Further Resources

- [LiteLLM Documentation](https://docs.litellm.ai/)
- [OpenAI API Reference](https://platform.openai.com/docs/)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [Deployment Guides](https://docs.litellm.ai/docs/proxy/deploy)