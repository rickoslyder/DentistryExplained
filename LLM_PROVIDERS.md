# LLM Provider Reference Guide for Dentistry Explained

*Last Updated: July 4, 2025*

This guide provides comprehensive information about the latest LLM providers and models that can be used with the Dentistry Explained AI dental assistant. These models are configured through LiteLLM for the chat functionality.

## Table of Contents
- [Provider Overview](#provider-overview)
- [OpenAI Models](#openai-models)
- [Anthropic Claude Models](#anthropic-claude-models)
- [Google Gemini Models](#google-gemini-models)
- [Meta Llama Models](#meta-llama-models)
- [Other Providers](#other-providers)
- [Model Selection Guide](#model-selection-guide)
- [Pricing Considerations](#pricing-considerations)

## Provider Overview

| Provider  | Best Models             | Max Context  | Strengths                     | API Endpoint                      |
| --------- | ----------------------- | ------------ | ----------------------------- | --------------------------------- |
| OpenAI    | o4-mini, o3, GPT-4o     | 128k tokens  | Reasoning, coding, multimodal | api.openai.com                    |
| Anthropic | Claude 4 Opus/Sonnet    | 200k tokens  | Writing, coding, safety       | api.anthropic.com                 |
| Google    | Gemini 2.5 Pro/Flash    | 1M-2M tokens | Massive context, video        | generativelanguage.googleapis.com |
| Meta      | Llama 4                 | 10M tokens   | Open source, huge context     | Various                           |
| Groq      | Mixtral, Llama variants | 32k tokens   | Ultra-fast inference          | api.groq.com                      |

## OpenAI Models

### o4-mini ⭐ (Recommended Default)
- **Model ID**: `o4-mini`
- **Context**: 128k tokens (estimated)
- **Pricing**: $0.60/1M input, $2.40/1M output
- **Strengths**: 
  - Best cost-performance ratio
  - Excellent at math, coding, and visual tasks
  - 99.5% on AIME 2025 benchmarks
  - Supports tool use and function calling
- **Use Cases**: General optimization, code analysis, automation suggestions
- **Variants**: `o4-mini-high` (higher reasoning effort)

### o3
- **Model ID**: `o3`
- **Context**: 128k tokens
- **Pricing**: Higher tier
- **Strengths**: Advanced reasoning, complex problem-solving
- **Use Cases**: Complex configuration analysis, advanced optimizations

### GPT-4o
- **Model ID**: `gpt-4o`
- **Context**: 128k tokens
- **Strengths**: Multimodal (text + images), natural conversation
- **Use Cases**: Visual configuration analysis, documentation with images

## Anthropic Claude Models

### Claude 4 Opus
- **Model ID**: `claude-opus-4`
- **Context**: 200k tokens
- **Strengths**: 
  - Superior writing and editing
  - Excellent code understanding
  - Strong safety guardrails
- **Use Cases**: Configuration documentation, complex YAML refactoring

### Claude 4 Sonnet
- **Model ID**: `claude-sonnet-4`
- **Context**: 200k tokens
- **Strengths**: Balanced performance and cost
- **Use Cases**: General optimization tasks

## Google Gemini Models

### Gemini 2.5 Pro ⭐
- **Model ID**: `gemini-2.5-pro`
- **Context**: 1M tokens
- **Pricing**: Competitive
- **Strengths**: 
  - Massive context window
  - Top benchmark performance
  - Multimodal capabilities
- **Use Cases**: Analyzing entire HA configurations at once

### Gemini 2.5 Flash
- **Model ID**: `gemini-2.5-flash`
- **Context**: 1M tokens
- **Speed**: 479 tokens/second
- **Strengths**: Fast inference, good for real-time
- **Use Cases**: Quick suggestions, real-time analysis

### Gemini 2.5 Flash Lite
- **Model ID**: `gemini-2.5-flash-lite`
- **Speed**: 718 tokens/second (fastest)
- **Use Cases**: Rapid iteration, development testing

## Meta Llama Models

### Llama 4
- **Model ID**: `llama-4`
- **Context**: Up to 10M tokens (largest available)
- **Strengths**: 
  - Open source
  - Massive context capability
  - Can be self-hosted
- **Use Cases**: Analyzing massive configurations, entire HA setups

### Llama 3.3
- **Model ID**: `llama-3.3-70b`
- **Context**: 128k tokens
- **Strengths**: Open source, good performance
- **Use Cases**: Self-hosted deployments

## Other Providers

### Groq
- **Models**: Mixtral-8x7b, Llama variants
- **API**: api.groq.com/openai/v1
- **Strengths**: Ultra-fast inference (10x+ faster)
- **Context**: 32k tokens
- **Use Cases**: Real-time suggestions, rapid iterations

### Ollama (Local)
- **Models**: Various open-source models
- **API**: localhost:11434
- **Strengths**: Privacy, no API costs, offline capable
- **Use Cases**: Privacy-sensitive configurations

### DeepSeek
- **Model**: DeepSeek-R1
- **Strengths**: Excellent reasoning, competitive pricing
- **Use Cases**: Complex logic analysis

## Model Selection Guide

### For Dentistry Explained AI Assistant:

1. **General Patient Queries** → `o4-mini`
   - Best balance of cost, performance, and medical accuracy
   - Handles most dental questions effectively
   - Excellent for patient-friendly explanations

2. **Long Conversations** → `Gemini 2.5 Pro`
   - 1M token context for extended chat sessions
   - Maintains context across complex dental discussions
   - Good for treatment planning conversations

3. **Privacy-Sensitive** → `Ollama` with Llama models
   - Run locally for GDPR compliance
   - Patient data never leaves your infrastructure
   - Good for practices with strict data policies

4. **Budget-Conscious** → `o4-mini` or `Groq`
   - o4-mini: $0.60/1M tokens input - best value
   - Groq: Fast responses for real-time chat

5. **Professional/Clinical Use** → `Claude 4 Opus`
   - Best for complex medical terminology
   - Superior at understanding clinical context
   - Ideal for professional-level queries

## Pricing Considerations

### Most Economical (per million tokens):
1. **Gemma 3**: $0.03
2. **Llama 3.2**: $0.03
3. **o4-mini**: $0.60 input / $2.40 output
4. **Groq Mixtral**: ~$0.27

### Best Value:
- **o4-mini**: Exceptional performance per dollar
- **Gemini 2.5 Flash**: Fast and affordable
- **Claude 4 Sonnet**: Good balance for complex tasks

### Premium Options:
- **o3**: Advanced reasoning
- **Claude 4 Opus**: Best-in-class capabilities
- **Gemini 2.5 Pro**: Massive context

## Configuration Examples for Dentistry Explained

### LiteLLM Configuration (litellm_config.yaml)
```yaml
model_list:
  # Recommended for patient queries
  - model_name: dental-assistant
    litellm_params:
      model: o4-mini
      api_key: ${OPENAI_API_KEY}
      temperature: 0.7
      system_message: "You are a helpful dental health assistant..."
      
  # For professional users
  - model_name: clinical-assistant
    litellm_params:
      model: claude-opus-4
      api_key: ${ANTHROPIC_API_KEY}
      temperature: 0.5
      
  # Budget option
  - model_name: quick-assistant
    litellm_params:
      model: gpt-3.5-turbo
      api_key: ${OPENAI_API_KEY}
      
general_settings:
  master_key: ${LITELLM_MASTER_KEY}
  database_url: ${DATABASE_URL}
  budget_duration: 30d
  max_budget: 500  # Higher budget for healthcare
```

### Environment Variables (.env.local)
```env
# LiteLLM Configuration
LITELLM_PROXY_URL=https://llm.rbnk.uk
LITELLM_API_KEY=your_master_key
LITELLM_MODEL=o4-mini

# Model-specific keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
```

## Notes for Dental AI Implementation

1. **Medical Accuracy**: Use temperature 0.5-0.7 for medical queries to balance accuracy with helpfulness
2. **Context Management**: Include patient's conversation history for continuity of care discussions
3. **Emergency Detection**: Implement keyword detection for dental emergencies before LLM processing
4. **GDPR Compliance**: Consider local models for EU users or implement data retention policies
5. **Response Caching**: Cache common dental questions to reduce costs and improve response time
6. **Professional Mode**: Use different models/prompts for verified dental professionals vs patients

## Future Models to Watch

- **GPT-5**: Expected late 2025
- **Claude 5**: Anticipated Q4 2025
- **Gemini 3.0**: Rumored 10M+ context
- **Llama 5**: Open source alternative

## Dentistry Explained Specific Considerations

### System Prompts
The platform uses specialized system prompts that include:
- UK/NHS specific information and pricing
- Current dental best practices
- Emergency symptom recognition
- Age-appropriate responses
- Professional vs patient language adaptation

### Cost Optimization
For a dental platform expecting 10,000+ queries/day:
- Use `o4-mini` as primary model (~$20-50/day)
- Implement caching for common questions
- Use cheaper models for simple queries
- Reserve premium models for complex cases

### Integration with Platform
The AI assistant integrates with:
- Current page context (article being read)
- User type (patient/professional)
- Chat history (180-day retention)
- Emergency detection system
- Export functionality (PDF/text)

---

*This guide is specific to Dentistry Explained and should be updated when new models are released or dental-specific requirements change.*