import { Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  // Custom components for Markdown rendering
  const markdownComponents: Components = {
    // Style paragraphs
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    // Style lists
    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="ml-2">{children}</li>,
    // Style headers
    h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
    h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
    h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
    // Style links
    a: ({ href, children }) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={cn(
          "underline",
          isUser ? "text-primary-100" : "text-blue-600 hover:text-blue-800"
        )}
      >
        {children}
      </a>
    ),
    // Style code
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '')
      return match ? (
        <pre className="bg-gray-800 text-gray-100 p-2 rounded text-xs overflow-x-auto mb-2">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code className="bg-gray-200 text-gray-800 px-1 rounded text-xs" {...props}>
          {children}
        </code>
      )
    },
    // Style blockquotes
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-gray-300 pl-3 italic my-2">
        {children}
      </blockquote>
    ),
    // Style horizontal rules
    hr: () => <hr className="my-2 border-gray-300" />,
    // Style strong text
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    // Style emphasis
    em: ({ children }) => <em className="italic">{children}</em>,
  }

  return (
    <div className={cn("flex space-x-3", isUser && "flex-row-reverse space-x-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-primary text-white" : "bg-gray-100 text-gray-600",
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message */}
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2",
          isUser ? "bg-primary text-white" : "bg-gray-100 text-gray-900",
        )}
      >
        <div className="text-sm">
          {isUser ? (
            // User messages are plain text
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            // Assistant messages are rendered as Markdown
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {typeof message.content === 'string' 
                ? message.content 
                : JSON.stringify(message.content, null, 2)}
            </ReactMarkdown>
          )}
        </div>
        <p className={cn("text-xs mt-1 opacity-70", isUser ? "text-primary-100" : "text-gray-500")}>
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  )
}
