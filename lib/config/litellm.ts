// LiteLLM Configuration
export const liteLLMConfig = {
  // API Configuration
  proxyUrl: process.env.LITELLM_PROXY_URL || '',
  apiKey: process.env.LITELLM_API_KEY || '',
  
  // Model Settings
  defaultModel: process.env.LITELLM_MODEL || 'gemini/gemini-2.5-flash-lite-preview-06-17',
  temperature: 0.7,
  maxTokens: 1000,
  streamingEnabled: true,
  
  // Retry Configuration
  maxRetries: 3,
  retryDelay: 1000, // ms
  
  // Timeout Settings
  requestTimeout: 30000, // 30 seconds
  
  // Available Models (for future model selection UI)
  availableModels: [
    // OpenAI Models (July 2025)
    { id: 'o4-mini', name: 'O4 Mini (Recommended)', provider: 'openai' },
    { id: 'o3', name: 'O3', provider: 'openai' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
    { id: 'gpt-4', name: 'GPT-4 (Legacy)', provider: 'openai' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Legacy)', provider: 'openai' },
    
    // Anthropic Models (July 2025)
    { id: 'claude-opus-4', name: 'Claude 4 Opus', provider: 'anthropic' },
    { id: 'claude-sonnet-4', name: 'Claude 4 Sonnet', provider: 'anthropic' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus (Legacy)', provider: 'anthropic' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet (Legacy)', provider: 'anthropic' },
    
    // Google Models (July 2025)
    { id: 'gemini/gemini-2.5-flash-lite-preview-06-17', name: 'Gemini 2.5 Flash Lite (Recommended)', provider: 'google' },
    { id: 'gemini/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google' },
    { id: 'gemini/gemini-2.5-pro', name: 'Gemini 2.5 Pro (1M context)', provider: 'google' },
    { id: 'gemini/gemini-2.0-flash', name: 'Gemini 2.0 Flash (Legacy)', provider: 'google' },
    
    // Meta/Llama Models (July 2025)
    { id: 'llama-4', name: 'Llama 4 (10M context)', provider: 'meta' },
    { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'meta' },
    
    // Other Providers
    { id: 'mixtral-8x7b', name: 'Mixtral 8x7B (Groq)', provider: 'groq' },
  ],
}

// Validate configuration
export function isLiteLLMConfigured(): boolean {
  // On client-side, we can't access server env vars
  // The actual check happens server-side in the API route
  if (typeof window !== 'undefined') {
    // For client-side, we'll rely on the server to tell us if it's configured
    // This is just for UI display purposes
    return true // Assume configured, let server handle actual validation
  }
  return !!(liteLLMConfig.proxyUrl && liteLLMConfig.apiKey)
}

// Get model configuration
export function getModelConfig(modelId?: string) {
  const model = modelId || liteLLMConfig.defaultModel
  return {
    model,
    temperature: liteLLMConfig.temperature,
    max_tokens: liteLLMConfig.maxTokens,
    stream: liteLLMConfig.streamingEnabled,
  }
}