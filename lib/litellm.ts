import { ChatMessage } from "@/types/database"

interface LiteLLMResponse {
  choices: Array<{
    message: {
      content: string
      role: string
    }
  }>
}

interface DentalContext {
  title?: string
  category?: string
  content?: string
}

const LITELLM_PROXY_URL = process.env.LITELLM_PROXY_URL
const LITELLM_API_KEY = process.env.LITELLM_API_KEY

// System prompt for dental AI assistant
const SYSTEM_PROMPT = `You are a knowledgeable dental health AI assistant. Your role is to:
1. Provide accurate, evidence-based dental health information
2. Explain dental conditions, treatments, and prevention in simple terms
3. Encourage users to consult with dental professionals for specific medical advice
4. Be friendly, empathetic, and professional in your responses
5. Focus on UK/NHS dental care guidelines when applicable

Important guidelines:
- Never diagnose conditions or prescribe treatments
- Always recommend consulting a dentist for specific concerns
- Provide general educational information only
- Be clear about the limitations of AI assistance
- Promote good oral hygiene practices`

export async function generateAIResponse(
  message: string,
  chatHistory: ChatMessage[] = [],
  pageContext?: DentalContext
): Promise<string> {
  // If LiteLLM is not configured, use fallback responses
  if (!LITELLM_PROXY_URL || !LITELLM_API_KEY) {
    return generateFallbackResponse(message, pageContext)
  }

  try {
    // Build conversation history
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
    ]

    // Add page context if available
    if (pageContext?.title) {
      messages.push({
        role: "system",
        content: `The user is currently reading an article titled "${pageContext.title}" in the "${pageContext.category}" category. Consider this context when answering their questions.`
      })
    }

    // Add chat history
    chatHistory.forEach(msg => {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })
    })

    // Add current message
    messages.push({ role: "user", content: message })

    // Call LiteLLM proxy
    const response = await fetch(`${LITELLM_PROXY_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LITELLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // or your preferred model
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      throw new Error(`LiteLLM API error: ${response.status}`)
    }

    const data: LiteLLMResponse = await response.json()
    return data.choices[0]?.message?.content || generateFallbackResponse(message, pageContext)
  } catch (error) {
    console.error('LiteLLM API error:', error)
    return generateFallbackResponse(message, pageContext)
  }
}

function generateFallbackResponse(message: string, pageContext?: DentalContext): string {
  // Intelligent fallback responses based on common dental queries
  const lowerMessage = message.toLowerCase()

  // Tooth decay related
  if (lowerMessage.includes('cavity') || lowerMessage.includes('tooth decay') || lowerMessage.includes('cavities')) {
    return "Tooth decay occurs when bacteria in your mouth produce acids that attack tooth enamel. Regular brushing with fluoride toothpaste, flossing, and limiting sugary foods can help prevent cavities. If you suspect you have a cavity, it's important to see a dentist promptly for proper diagnosis and treatment."
  }

  // Gum disease related
  if (lowerMessage.includes('gum') || lowerMessage.includes('gingivitis') || lowerMessage.includes('periodontal')) {
    return "Gum disease starts with gingivitis (inflamed gums) and can progress to periodontitis if untreated. Signs include red, swollen, or bleeding gums. Good oral hygiene and regular dental cleanings are essential for prevention. If you're experiencing gum problems, please consult a dentist for proper evaluation."
  }

  // Pain related
  if (lowerMessage.includes('pain') || lowerMessage.includes('hurt') || lowerMessage.includes('ache')) {
    return "Dental pain can have various causes including cavities, infections, or sensitivity. While over-the-counter pain relievers may provide temporary relief, it's crucial to see a dentist to identify and treat the underlying cause. Persistent dental pain should never be ignored."
  }

  // Brushing and hygiene
  if (lowerMessage.includes('brush') || lowerMessage.includes('floss') || lowerMessage.includes('hygiene')) {
    return "Good oral hygiene involves brushing twice daily with fluoride toothpaste for at least 2 minutes, flossing daily, and using mouthwash if recommended by your dentist. Replace your toothbrush every 3-4 months. Regular dental check-ups every 6 months help maintain optimal oral health."
  }

  // Context-aware response
  if (pageContext?.title) {
    return `I understand you have a question about "${pageContext.title}". While I can provide general information about ${pageContext.category?.toLowerCase() || 'dental health'}, for specific concerns or personalized advice, it's best to consult with a dental professional who can examine your individual situation.`
  }

  // Generic response
  return "Thank you for your dental health question. While I can provide general educational information about oral health, I recommend consulting with a dental professional for personalized advice specific to your situation. Is there a particular aspect of dental health you'd like to learn more about?"
}